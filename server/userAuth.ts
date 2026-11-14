import bcrypt from "bcrypt";
import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { emailService } from "./emailService";
import { 
  validatePCIPassword, 
  PCI_CONSTANTS, 
  isAccountLocked, 
  getLockoutEndTime 
} from "./pciCompliance";

// Extend the session type to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAuthenticated?: boolean;
    resetRequired?: boolean;
  }
}

export function setupUserAuth(app: Express) {
  // User Registration
  app.post("/api/user/register", async (req: Request, res: Response) => {
    try {
      // PCI DSS Password Validation - BEFORE other validations
      const passwordValidation = validatePCIPassword(req.body.password || '');
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: passwordValidation.errors.join('. '),
          errors: passwordValidation.errors
        });
      }

      // Map password to password_hash for validation
      const validatedData = registerSchema.parse({
        full_name: req.body.full_name,
        username: req.body.username,
        email: req.body.email,
        password_hash: req.body.password,
        phone: req.body.phone,
        ship_id: req.body.ship_id,
        address: req.body.address
      });
      
      console.log("Validated registration data:", validatedData);

      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);

      if (existingUserByUsername) {
        return res.status(400).json({ 
          success: false, 
          message: "Bu kullanıcı adı zaten kullanılıyor" 
        });
      }

      if (existingUserByEmail) {
        return res.status(400).json({ 
          success: false, 
          message: "Bu e-posta adresi zaten kullanılıyor" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      // Create user
      const user = await storage.createUser({
        full_name: validatedData.full_name,
        username: validatedData.username,
        email: validatedData.email,
        password_hash: hashedPassword,
        phone: validatedData.phone,
        ship_id: validatedData.ship_id,
        address: validatedData.address,
      });

      // Send welcome email
      try {
        const baseUrlSetting = await storage.getSetting('base_url');
        const baseUrl = baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
        await emailService.sendEmail(
          user.email,
          'Hoş Geldiniz - AdeGloba Starlink System',
          'welcome',
          {
            userName: user.full_name || user.username,
            loginUrl: baseUrl,
            dashboardUrl: baseUrl + '/dashboard',
            adminUrl: baseUrl + '/admin'
          }
        );
        console.log(`📧 Welcome email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('📧 Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      // Send admin notification about new user
      try {
        const baseUrlSetting = await storage.getSetting('base_url');
        const baseUrl = baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
        const adminEmailSetting = await storage.getSetting('admin_email');
        const adminEmail = adminEmailSetting?.value || 'support@adegloba.space';
        const ship = await storage.getShips().then(ships => ships.find(s => s.id === user.ship_id));
        
        await emailService.sendEmail(
          adminEmail,
          'Yeni Kullanıcı Kaydı - AdeGloba Starlink System',
          'admin_new_user',
          {
            userName: user.full_name || user.username,
            username: user.username,
            userEmail: user.email,
            userPhone: user.phone || 'Belirtilmemiş',
            shipName: ship?.name || 'Bilinmeyen Gemi',
            userAddress: user.address || 'Belirtilmemiş',
            adminUrl: baseUrl + '/admin'
          }
        );
        console.log(`📧 Admin notification sent for new user: ${user.email}`);
      } catch (emailError) {
        console.error('📧 Failed to send admin notification:', emailError);
        // Don't fail registration if email fails
      }

      // Automatically log in the user after successful registration
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      delete req.session.announcementDismissedVersion;

      res.status(201).json({ 
        success: true, 
        message: "Kayıt başarılı! Panele yönlendiriliyorsunuz." 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.issues) {
        return res.status(400).json({ 
          success: false, 
          message: error.issues[0].message 
        });
      }

      res.status(500).json({ 
        success: false, 
        message: "Kayıt işlemi sırasında bir hata oluştu" 
      });
    }
  });

  // User Login (separate from admin login) - supports both username and email
  // PCI DSS Compliant: Account lockout, failed attempts tracking, password reset check
  app.post("/api/user/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      
      // If not found by username, try email (check if input looks like an email)
      if (!user && username.includes('@')) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Geçersiz kullanıcı adı/e-posta veya şifre" 
        });
      }

      // PCI DSS: Check if account is deactivated (90-day inactivity)
      if (!user.is_active) {
        return res.status(403).json({ 
          success: false, 
          message: "Hesabınız uzun süredir kullanılmadığı için devre dışı bırakıldı. Lütfen destek ile iletişime geçin.",
          code: "ACCOUNT_DEACTIVATED"
        });
      }

      // PCI DSS: Check if account is locked
      if (user.locked_until) {
        if (isAccountLocked(user.locked_until)) {
          const remainingMinutes = Math.ceil(
            (new Date(user.locked_until!).getTime() - Date.now()) / (1000 * 60)
          );
          return res.status(403).json({ 
            success: false, 
            message: `Hesabınız çok fazla başarısız giriş denemesi nedeniyle kilitlendi. ${remainingMinutes} dakika sonra tekrar deneyin.`,
            code: "ACCOUNT_LOCKED",
            remainingMinutes
          });
        } else {
          // PCI DSS: Lockout period has expired, clear the lockout
          await storage.unlockUserAccount(user.id);
        }
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        // PCI DSS: Increment failed login attempts
        const failedAttempts = await storage.incrementFailedLoginAttempts(user.id);
        
        if (failedAttempts >= PCI_CONSTANTS.MAX_FAILED_ATTEMPTS) {
          // Lock the account for 30 minutes
          const lockoutEnd = getLockoutEndTime();
          await storage.lockUserAccount(user.id, lockoutEnd);
          
          return res.status(403).json({ 
            success: false, 
            message: `Çok fazla başarısız giriş denemesi. Hesabınız ${PCI_CONSTANTS.LOCKOUT_DURATION_MINUTES} dakika kilitlendi.`,
            code: "ACCOUNT_LOCKED"
          });
        }

        const remainingAttempts = PCI_CONSTANTS.MAX_FAILED_ATTEMPTS - failedAttempts;
        return res.status(401).json({ 
          success: false, 
          message: `Geçersiz kullanıcı adı/e-posta veya şifre. Kalan deneme: ${remainingAttempts}`,
          remainingAttempts
        });
      }

      // PCI DSS: Reset failed attempts on successful login
      await storage.resetFailedLoginAttempts(user.id);
      
      // PCI DSS: Update last login timestamp
      await storage.updateLastLogin(user.id);

      // Set session  
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      delete req.session.announcementDismissedVersion;

      // PCI DSS: Check if password reset is required
      const requiresPasswordReset = user.reset_required || !user.first_login_completed;
      if (requiresPasswordReset) {
        req.session.resetRequired = true;
      }

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        requiresPasswordReset,
        message: requiresPasswordReset 
          ? "Güvenlik standartlarını karşılamak için şifrenizi güncellemeniz gerekmektedir." 
          : undefined
      });
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.issues) {
        return res.status(400).json({ 
          success: false, 
          message: error.issues[0].message 
        });
      }

      res.status(500).json({ 
        success: false, 
        message: "Giriş işlemi sırasında bir hata oluştu" 
      });
    }
  });

  // User Logout
  app.post("/api/user/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Çıkış işlemi sırasında bir hata oluştu" 
        });
      }
      res.json({ success: true, message: "Başarıyla çıkış yapıldı" });
    });
  });

  // PCI DSS: Mandatory Password Update Endpoint
  app.post("/api/user/update-password", async (req: Request, res: Response) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate new password with PCI DSS rules
      const passwordValidation = validatePCIPassword(newPassword || '');
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          success: false, 
          message: passwordValidation.errors.join('. '),
          errors: passwordValidation.errors
        });
      }

      // Get current user
      const currentUser = await storage.getUserById(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
      }

      // Verify current password
      const validCurrentPassword = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!validCurrentPassword) {
        return res.status(400).json({ success: false, message: "Mevcut şifre hatalı" });
      }

      // Check if new password is same as old password
      const isSamePassword = await bcrypt.compare(newPassword, currentUser.password_hash);
      if (isSamePassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Yeni şifre mevcut şifre ile aynı olamaz" 
        });
      }

      // Hash and save new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(req.session.userId, { password_hash: hashedNewPassword });

      // Mark password reset as complete
      await storage.setPasswordResetRequired(req.session.userId, false);
      await storage.setFirstLoginCompleted(req.session.userId);

      // Clear session reset flag
      req.session.resetRequired = false;

      // Send password change notification email
      try {
        await emailService.sendEmail(
          currentUser.email,
          'Şifreniz Güncellendi - AdeGloba Starlink System',
          'password_changed',
          {
            userName: currentUser.full_name || currentUser.username,
            changeDate: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
            ipAddress: req.ip || 'Bilinmiyor'
          }
        );
        console.log(`📧 Password change notification sent to: ${currentUser.email}`);
      } catch (emailError) {
        console.error('📧 Failed to send password change email:', emailError);
      }

      res.json({ 
        success: true, 
        message: "Şifreniz başarıyla güncellendi. Artık tüm özelliklere erişebilirsiniz." 
      });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ success: false, message: "Şifre güncellenirken bir hata oluştu" });
    }
  });

  // PCI DSS: Check if password reset is required
  app.get("/api/user/check-reset-required", async (req: Request, res: Response) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
      }

      const resetRequired = user.reset_required || !user.first_login_completed;
      res.json({ 
        success: true, 
        resetRequired,
        message: resetRequired 
          ? "Güvenlik standartlarını karşılamak için şifrenizi güncellemeniz gerekmektedir." 
          : undefined
      });
    } catch (error) {
      console.error("Error checking reset required:", error);
      res.status(500).json({ success: false, message: "Kontrol sırasında bir hata oluştu" });
    }
  });

  // Get Current User with Ship Information
  app.get("/api/user/me", async (req: Request, res: Response) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserWithShip(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update User Profile
  app.put("/api/user/profile", async (req: Request, res: Response) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { full_name, email, phone, ship_id, address, currentPassword, newPassword } = req.body;
      
      // Get current user
      const currentUser = await storage.getUserById(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // If password change is requested
      if (newPassword && currentPassword) {
        const validCurrentPassword = await bcrypt.compare(currentPassword, currentUser.password_hash);
        if (!validCurrentPassword) {
          return res.status(400).json({ message: "Mevcut şifre hatalı" });
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        
        // Update user with new password
        await storage.updateUser(req.session.userId, {
          full_name,
          email,
          phone,
          ship_id,
          address,
          password_hash: hashedNewPassword
        });
      } else {
        // Update user without password change
        await storage.updateUser(req.session.userId, {
          full_name,
          email,
          phone,
          ship_id,
          address
        });
      }

      res.json({ message: "Profil başarıyla güncellendi" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's ship plans
  app.get('/api/user/ship-plans', async (req: any, res) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user || !user.ship_id) {
        return res.status(400).json({ message: 'User has no assigned ship' });
      }

      const shipPlans = await storage.getShipPlans(user.ship_id);
      res.json(shipPlans);
    } catch (error) {
      console.error('Error fetching ship plans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user's orders
  app.get('/api/user/orders', async (req: any, res) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const orders = await storage.getUserOrders(req.session.userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user's active packages  
  app.get('/api/user/active-packages', async (req: any, res) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const activePackages = await storage.getUserActivePackages(req.session.userId);
      res.json(activePackages);
    } catch (error) {
      console.error('Error fetching active packages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Forgot Password - Send reset email
  app.post("/api/user/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "E-posta adresi gereklidir" 
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ 
          success: true, 
          message: "Eğer e-posta adresiniz doğru ise şifre sıfırlama e-postası mailine iletilmiştir." 
        });
      }

      // Reset password and get new one
      const resetResult = await storage.resetUserPassword(user.id);
      if (!resetResult) {
        return res.status(500).json({ 
          success: false, 
          message: "Şifre sıfırlama işlemi başarısız" 
        });
      }

      // Send password reset email
      try {
        const baseUrlSetting = await storage.getSetting('base_url');
        const baseUrl = baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
        
        await emailService.sendEmail(
          user.email,
          'Şifre Sıfırlama - AdeGloba Starlink System',
          'password_reset',
          {
            userName: user.full_name || user.username,
            newPassword: resetResult.newPassword,
            loginUrl: baseUrl + '/giris',
            supportEmail: 'support@adegloba.com'
          }
        );
        
        console.log(`📧 Password reset email sent to: ${user.email}`);
        
        res.json({ 
          success: true, 
          message: "Yeni şifreniz e-posta adresinize gönderildi." 
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        res.status(500).json({ 
          success: false, 
          message: "E-posta gönderimi başarısız" 
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Şifre sıfırlama işlemi sırasında bir hata oluştu" 
      });
    }
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId || !req.session.isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
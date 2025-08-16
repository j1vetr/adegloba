import bcrypt from "bcrypt";
import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";

// Extend the session type to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAuthenticated?: boolean;
  }
}

export function setupUserAuth(app: Express) {
  // User Registration
  app.post("/api/user/register", async (req: Request, res: Response) => {
    try {
      // Map password to password_hash for validation
      const validatedData = registerSchema.parse({
        full_name: req.body.full_name,
        username: req.body.username,
        email: req.body.email,
        password_hash: req.body.password,
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
        ship_id: validatedData.ship_id,
        address: validatedData.address,
      });

      // Automatically log in the user after successful registration
      req.session.userId = user.id;
      req.session.isAuthenticated = true;

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

  // User Login (separate from admin login)
  app.post("/api/user/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Geçersiz kullanıcı adı veya şifre" 
        });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ 
          success: false, 
          message: "Geçersiz kullanıcı adı veya şifre" 
        });
      }

      // Set session  
      req.session.userId = user.id;
      req.session.isAuthenticated = true;

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
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

      const shipPlans = await storage.getPlansForShip(user.ship_id);
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
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId || !req.session.isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}
import bcrypt from "bcrypt";
import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      isAuthenticated?: boolean;
    }
  }
}

export function setupUserAuth(app: Express) {
  // User Registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse({
        ...req.body,
        password_hash: req.body.password // Map password to password_hash for validation
      });

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
        username: validatedData.username,
        email: validatedData.email,
        password_hash: hashedPassword,
      });

      res.status(201).json({ 
        success: true, 
        message: "Kayıt başarılı! Giriş yapabilirsiniz." 
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

  // Get Current User
  app.get("/api/user/me", async (req: Request, res: Response) => {
    if (!req.session.userId || !req.session.isAuthenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
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
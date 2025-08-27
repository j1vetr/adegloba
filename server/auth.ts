import bcrypt from 'bcrypt';
import { Express } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { loginSchema } from '@shared/schema';

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

export function isAdmin(req: any, res: any, next: any) {
  if (req.session?.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
}

// Setup authentication routes
export function setupAuth(app: Express) {
  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Find admin user by username
      const user = await storage.getAdminUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Create session
      req.session.adminUser = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Giriş işlemi başarısız' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Çıkış işlemi başarısız' });
      }
      res.json({ success: true });
    });
  });

  // Get current admin user
  app.get('/api/auth/me', (req: any, res) => {
    if (req.session?.adminUser) {
      res.json(req.session.adminUser);
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });
}

// Seed default admin user
export async function seedDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getAdminUserByUsername('Toov');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const passwordHash = await hashPassword('StarlinkAde1453@@');
    await storage.createAdminUser({
      username: 'Toov',
      password_hash: passwordHash,
      role: 'admin'
    });

    console.log('Default admin user created: username=Toov, password=StarlinkAde1453@@');
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}
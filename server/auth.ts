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
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Verify password
      const isValidPassword = await comparePasswords(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre' });
      }

      // Create session
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      const { passwordHash, ...userWithoutPassword } = user;
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

  // Get current user
  app.get('/api/auth/me', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });
}

// Seed default admin user
export async function seedDefaultAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('emir');
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const passwordHash = await hashPassword('test');
    await storage.createUser({
      username: 'emir',
      passwordHash,
      role: 'admin'
    });

    console.log('Default admin user created: username=emir, password=test');
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
}
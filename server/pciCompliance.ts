import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export interface PCIPasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePCIPassword(password: string): PCIPasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push("Şifre en az 12 karakter olmalıdır");
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Şifre en az bir harf içermelidir");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Şifre en az bir rakam içermelidir");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export const PCI_CONSTANTS = {
  MAX_FAILED_ATTEMPTS: 10,
  LOCKOUT_DURATION_MINUTES: 30,
  SESSION_TIMEOUT_MINUTES: 15,
  INACTIVE_DAYS_LIMIT: 90,
};

export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
}

export function getLockoutEndTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + PCI_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000);
}

export function isSessionExpired(lastActivity: Date | null): boolean {
  if (!lastActivity) return true;
  const now = new Date();
  const diff = now.getTime() - new Date(lastActivity).getTime();
  const diffMinutes = diff / (1000 * 60);
  return diffMinutes > PCI_CONSTANTS.SESSION_TIMEOUT_MINUTES;
}

export function isAccountInactive(lastLogin: Date | null, createdAt: Date | null): boolean {
  const referenceDate = lastLogin || createdAt;
  if (!referenceDate) return false;
  
  const now = new Date();
  const diff = now.getTime() - new Date(referenceDate).getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);
  return diffDays > PCI_CONSTANTS.INACTIVE_DAYS_LIMIT;
}

export function setupActivityMiddleware(app: Express) {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userId && req.session?.isAuthenticated) {
      try {
        const user = await storage.getUserById(req.session.userId);
        
        if (user) {
          if (isSessionExpired(user.last_activity_at)) {
            req.session.destroy((err) => {
              if (err) console.error("Session destroy error:", err);
            });
            return res.status(401).json({ 
              success: false, 
              message: "Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.",
              code: "SESSION_EXPIRED"
            });
          }
          
          await storage.updateUserActivity(req.session.userId);
        }
      } catch (error) {
        console.error("Activity middleware error:", error);
      }
    }
    next();
  });
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { OrderService } from "./services/orderService";
import { CouponService } from "./services/couponService";
import { ExpiryService } from "./services/expiryService";
import { insertShipSchema, insertPlanSchema, insertCouponSchema } from "@shared/schema";
import { z } from "zod";

const orderService = new OrderService(storage);
const couponService = new CouponService(storage);
const expiryService = new ExpiryService(storage);

// Helper function to generate slug from ship name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin Authentication Middleware
  const isAdminAuthenticated = (req: any, res: any, next: any) => {
    if (req.session && req.session.adminUser) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth middleware
  await setupAuth(app);

  // Logout endpoint for user panel
  app.post('/api/logout', async (req, res) => {
    try {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
          }
          res.clearCookie('connect.sid');
          res.status(200).json({ message: 'Logged out successfully' });
        });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Public routes
  app.get('/api/ships', async (req, res) => {
    try {
      const ships = await storage.getActiveShips();
      res.json(ships);
    } catch (error) {
      console.error("Error fetching ships:", error);
      res.status(500).json({ message: "Failed to fetch ships" });
    }
  });

  app.get('/api/ships/active', async (req, res) => {
    try {
      const ships = await storage.getActiveShips();
      res.json(ships);
    } catch (error) {
      console.error("Error fetching active ships:", error);
      res.status(500).json({ message: "Failed to fetch active ships" });
    }
  });

  app.get('/api/ships/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const ship = await storage.getShipBySlug(slug);
      if (!ship) {
        return res.status(404).json({ message: "Ship not found" });
      }
      res.json(ship);
    } catch (error) {
      console.error("Error fetching ship:", error);
      res.status(500).json({ message: "Failed to fetch ship" });
    }
  });

  app.get('/api/ships/:shipId/plans', async (req, res) => {
    try {
      const { shipId } = req.params;
      const plans = await storage.getPlansForShip(shipId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  // Protected user routes
  app.get('/api/user/me', async (req: any, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const user = await storage.getUserWithShip(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  app.put('/api/user/profile', async (req: any, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const { address, currentPassword, newPassword, full_name } = req.body;

        // If password change is requested, verify current password
        if (newPassword && currentPassword) {
          const user = await storage.getUserById(userId);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          const bcrypt = require('bcrypt');
          const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
          if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
          }

          // Hash new password
          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          await storage.updateUser(userId, { 
            address, 
            full_name,
            password_hash: hashedNewPassword 
          });
        } else {
          // Update only profile fields
          await storage.updateUser(userId, { address, full_name });
        }

        res.json({ message: 'Profile updated successfully' });
      } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  app.get('/api/user/orders', async (req: any, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const orders = await orderService.getOrdersWithDetails(userId);
        res.json(orders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { shipId, planId, couponCode } = req.body;

      const order = await orderService.createOrder(userId, shipId, planId, couponCode);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.post('/api/orders/:orderId/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const { paypalOrderId } = req.body;

      const order = await orderService.completeOrder(orderId, paypalOrderId);
      res.json(order);
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(400).json({ message: error.message || "Failed to complete order" });
    }
  });

  app.post('/api/coupons/validate', isAuthenticated, async (req: any, res) => {
    try {
      const { code, shipId } = req.body;
      const coupon = await couponService.validateCoupon(code, shipId);
      res.json(coupon);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(400).json({ message: error.message || "Invalid coupon" });
    }
  });

  // Admin routes - temporarily simplified for development
  const adminMiddleware = async (req: any, res: any, next: any) => {
    // For now, just check if user is authenticated - in production you'd check admin role
    if (!req.user) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Duplicate admin routes removed - using session-based admin auth below

  // Admin - Ship-Plan assignments
  app.post('/api/admin/ships/:shipId/plans/:planId', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { shipId, planId } = req.params;
      const { isActive = true, sortOrder = 0 } = req.body;
      const shipPlan = await storage.assignPlanToShip(shipId, planId, isActive, sortOrder);
      res.json(shipPlan);
    } catch (error) {
      console.error("Error assigning plan to ship:", error);
      res.status(400).json({ message: error.message || "Failed to assign plan to ship" });
    }
  });

  app.delete('/api/admin/ships/:shipId/plans/:planId', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { shipId, planId } = req.params;
      await storage.removeShipPlan(shipId, planId);
      res.json({ message: "Plan removed from ship successfully" });
    } catch (error) {
      console.error("Error removing plan from ship:", error);
      res.status(500).json({ message: "Failed to remove plan from ship" });
    }
  });

  // Admin - Orders
  app.get('/api/admin/orders', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const orders = await orderService.getAllOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put('/api/admin/orders/:id/status', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrder(id, { status });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ message: error.message || "Failed to update order status" });
    }
  });

  // Admin - Coupons
  app.get('/api/admin/coupons', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  app.post('/api/admin/coupons', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(400).json({ message: error.message || "Failed to create coupon" });
    }
  });

  app.put('/api/admin/coupons/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const couponData = insertCouponSchema.partial().parse(req.body);
      const coupon = await storage.updateCoupon(id, couponData);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(400).json({ message: error.message || "Failed to update coupon" });
    }
  });

  app.delete('/api/admin/coupons/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCoupon(id);
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Admin - Statistics
  app.get('/api/admin/stats', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin authentication routes (using session-based auth)
  app.get('/api/admin/me', isAdminAuthenticated, async (req: any, res) => {
    try {
      const adminUser = req.session.adminUser;
      res.json(adminUser);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch admin user" });
    }
  });

  app.get('/api/admin/recent-orders', isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await orderService.getRecentOrders(10);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  app.get('/api/admin/recent-users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getRecentUsers(10);
      res.json(users);
    } catch (error) {
      console.error("Error fetching recent users:", error);
      res.status(500).json({ message: "Failed to fetch recent users" });
    }
  });

  // Admin - Settings Routes (session-based)
  app.get('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      if (category) {
        const settings = await storage.getSettingsByCategory(category as string);
        res.json(settings);
      } else {
        const settings = await storage.getAllSettings();
        res.json(settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { key, value, category } = req.body;
      const setting = await storage.setSetting(key, value, category);
      res.json(setting);
    } catch (error) {
      console.error("Error setting value:", error);
      res.status(400).json({ message: error.message || "Failed to set value" });
    }
  });

  // Initialize default settings on startup
  storage.initializeDefaultSettings().catch(console.error);



  // Cron job endpoint for expiry processing
  app.post('/api/cron/process-expired-orders', async (req, res) => {
    try {
      const processed = await expiryService.processExpiredOrders();
      res.json({ message: `Processed ${processed} expired orders` });
    } catch (error) {
      console.error("Error processing expired orders:", error);
      res.status(500).json({ message: "Failed to process expired orders" });
    }
  });

  // Admin Authentication Routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple hardcoded authentication
      if (username === 'emir' && password === 'test') {
        req.session.adminUser = { username: 'emir' };
        res.json({ success: true, user: { username: 'emir' } });
      } else {
        res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Giriş işlemi başarısız' });
    }
  });

  app.post('/api/admin/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Çıkış işlemi başarısız' });
      }
      res.json({ success: true });
    });
  });

  // Admin Users Management routes
  app.get('/api/admin/users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithShips();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user
  app.put('/api/admin/users/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, full_name, ship_id } = req.body;

      if (!username || !email) {
        return res.status(400).json({ message: "Username and email are required" });
      }

      // Check if username is taken by another user
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ message: "Username already taken by another user" });
      }

      // Check if email is taken by another user
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser && existingEmailUser.id !== id) {
        return res.status(400).json({ message: "Email already taken by another user" });
      }

      const updatedUser = await storage.updateUser(id, {
        username,
        email,
        full_name: req.body.full_name,
        ship_id: ship_id || null
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Public routes for ships (registration form needs this)
  app.get('/api/ships/active', async (req, res) => {
    try {
      const ships = await storage.getAllShips();
      res.json(ships.filter(ship => ship.isActive));
    } catch (error) {
      console.error('Error fetching active ships:', error);
      res.status(500).json({ error: 'Failed to fetch active ships' });
    }
  });

  // Admin CRUD Routes for Ships
  app.get('/api/admin/ships', isAdminAuthenticated, async (req, res) => {
    try {
      const ships = await storage.getAllShips();
      res.json(ships);
    } catch (error) {
      console.error('Error fetching ships:', error);
      res.status(500).json({ message: 'Failed to fetch ships' });
    }
  });

  app.post('/api/admin/ships', isAdminAuthenticated, async (req, res) => {
    try {
      const shipData = insertShipSchema.parse(req.body);
      // Auto-generate slug from name
      const shipWithSlug = {
        ...shipData,
        slug: generateSlug(shipData.name)
      };
      const ship = await storage.createShip(shipWithSlug);
      res.json(ship);
    } catch (error) {
      console.error('Error creating ship:', error);
      res.status(500).json({ message: 'Failed to create ship' });
    }
  });

  app.put('/api/admin/ships/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const shipData = insertShipSchema.parse(req.body);
      // Auto-generate slug from name if name is provided
      const shipWithSlug = shipData.name ? {
        ...shipData,
        slug: generateSlug(shipData.name)
      } : shipData;
      const ship = await storage.updateShip(id, shipWithSlug);
      res.json(ship);
    } catch (error) {
      console.error('Error updating ship:', error);
      res.status(500).json({ message: 'Failed to update ship' });
    }
  });

  app.delete('/api/admin/ships/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShip(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting ship:', error);
      res.status(500).json({ message: 'Failed to delete ship' });
    }
  });

  // Admin CRUD Routes for Plans
  app.get('/api/admin/plans', isAdminAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: 'Failed to fetch plans' });
    }
  });

  app.post('/api/admin/plans', isAdminAuthenticated, async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ message: 'Failed to create plan' });
    }
  });

  app.put('/api/admin/plans/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.updatePlan(id, planData);
      res.json(plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ message: 'Failed to update plan' });
    }
  });

  app.delete('/api/admin/plans/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlan(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ message: 'Failed to delete plan' });
    }
  });

  // Ship-based packages API routes
  app.get('/api/admin/ships/:shipId/plans', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId } = req.params;
      const plans = await storage.getPlansByShip(shipId);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching ship plans:', error);
      res.status(500).json({ message: 'Failed to fetch ship plans' });
    }
  });

  // Admin CRUD Routes for Coupons
  app.get('/api/admin/coupons', isAdminAuthenticated, async (req, res) => {
    try {
      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({ message: 'Failed to fetch coupons' });
    }
  });

  app.post('/api/admin/coupons', isAdminAuthenticated, async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      console.error('Error creating coupon:', error);
      res.status(500).json({ message: 'Failed to create coupon' });
    }
  });

  app.put('/api/admin/coupons/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const couponData = insertCouponSchema.parse(req.body);
      const coupon = await storage.updateCoupon(id, couponData);
      res.json(coupon);
    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ message: 'Failed to update coupon' });
    }
  });

  app.delete('/api/admin/coupons/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCoupon(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ message: 'Failed to delete coupon' });
    }
  });

  // Admin Orders
  app.get('/api/admin/orders', isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.put('/api/admin/orders/:id/status', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateOrderStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Admin Users
  app.get('/api/admin/users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Admin Settings
  app.get('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { key, value } = req.body;
      const setting = await storage.upsertSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error('Error saving setting:', error);
      res.status(500).json({ message: 'Failed to save setting' });
    }
  });

  // User profile update endpoint
  app.put('/api/user/profile', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updateData: any = {
        address: req.body.address,
        updated_at: new Date()
      };

      // Handle password update if provided
      if (req.body.newPassword && req.body.currentPassword) {
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(req.body.currentPassword, user.password_hash);
        if (!isValid) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        updateData.password_hash = hashedPassword;
      }

      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // User Ticket System Routes
  app.get('/api/tickets', (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      const tickets = await storage.getTicketsByUserId(userId);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/tickets/:ticketId', (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { ticketId } = req.params;

      const ticket = await storage.getTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const messages = await storage.getTicketMessages(ticketId);
      res.json({ ticket, messages });
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      res.status(500).json({ message: 'Failed to fetch ticket details' });
    }
  });

  app.post('/api/tickets', (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }, async (req: any, res) => {
    try {
      const userId = req.session.userId;

      // Get user's ship_id for the ticket
      const user = await storage.getUserById(userId);
      
      const ticketData = {
        subject: req.body.subject,
        message: req.body.message,
        priority: req.body.priority || 'Orta',
        status: 'Açık',
        userId,
        shipId: user?.ship_id || null,
      };

      const ticket = await storage.createTicket(ticketData);
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  app.post('/api/tickets/:ticketId/messages', (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
  }, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { ticketId } = req.params;

      // Verify ticket belongs to user
      const ticket = await storage.getTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      const messageData = {
        ticketId,
        senderId: userId,
        senderType: 'user' as const,
        message: req.body.message
      };

      const message = await storage.createTicketMessage(messageData);
      
      // Update ticket status to show user replied
      await storage.updateTicketStatus(ticketId, 'Beklemede');
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating user ticket message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.get('/api/admin/tickets', isAdminAuthenticated, async (req, res) => {
    try {
      const tickets = await storage.getAllTicketsWithUserInfo();
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching admin tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.patch('/api/admin/tickets/:ticketId/status', isAdminAuthenticated, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const adminId = req.session.adminUser.id;

      const ticket = await storage.updateTicketStatus(ticketId, status, adminId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      res.status(500).json({ message: 'Failed to update ticket status' });
    }
  });

  app.patch('/api/admin/tickets/:ticketId/priority', isAdminAuthenticated, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { priority } = req.body;
      
      if (!['Düşük', 'Orta', 'Yüksek'].includes(priority)) {
        return res.status(400).json({ message: 'Invalid priority' });
      }

      const ticket = await storage.updateTicketPriority(ticketId, priority);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      res.status(500).json({ message: 'Failed to update ticket priority' });
    }
  });

  app.get('/api/admin/tickets/:ticketId/messages', isAdminAuthenticated, async (req, res) => {
    try {
      const { ticketId } = req.params;
      
      // Get ticket details with user info
      const ticketDetails = await storage.getTicketWithUserInfo(ticketId);
      if (!ticketDetails) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Get messages
      const messages = await storage.getTicketMessages(ticketId);
      
      res.json({ ticket: ticketDetails, messages });
    } catch (error) {
      console.error('Error fetching admin ticket details:', error);
      res.status(500).json({ message: 'Failed to fetch ticket details' });
    }
  });

  app.post('/api/admin/tickets/:ticketId/messages', isAdminAuthenticated, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const adminId = req.session.adminUser.id;
      const adminUsername = req.session.adminUser.username;

      const messageData = {
        ...req.body,
        ticketId,
        senderId: adminId,
        senderType: 'admin',
        senderName: adminUsername,
      };

      const message = await storage.createTicketMessage(messageData);
      
      // Update ticket status to show admin replied
      await storage.updateTicketStatus(ticketId, 'Açık');
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating admin ticket message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Ship-based Package Management API Routes
  app.get('/api/admin/ship-plans/:shipId', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId } = req.params;
      const plans = await storage.getShipPlans(shipId);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching ship plans:', error);
      res.status(500).json({ message: 'Failed to fetch ship plans' });
    }
  });

  // Credential Pool Management API Routes
  app.get('/api/admin/credential-pools/:shipId', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId } = req.params;
      const credentials = await storage.getCredentialPoolsByShip(shipId);
      res.json(credentials);
    } catch (error) {
      console.error('Error fetching credential pools:', error);
      res.status(500).json({ message: 'Failed to fetch credential pools' });
    }
  });

  app.get('/api/admin/credential-stats/:shipId', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId } = req.params;
      const credentials = await storage.getCredentialPoolsByShip(shipId);
      const available = credentials.filter(c => !c.isAssigned).length;
      const assigned = credentials.filter(c => c.isAssigned).length;
      const total = credentials.length;
      
      res.json({ available, assigned, total });
    } catch (error) {
      console.error('Error fetching credential stats:', error);
      res.status(500).json({ message: 'Failed to fetch credential stats' });
    }
  });

  app.post('/api/admin/credential-pools', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId, username, password } = req.body;
      
      if (!shipId || !username || !password) {
        return res.status(400).json({ message: 'Ship ID, username, and password are required' });
      }

      const credential = await storage.createCredentialPool({
        shipId,
        username,
        password,
        isAssigned: false
      });
      
      res.status(201).json(credential);
    } catch (error) {
      console.error('Error creating credential:', error);
      res.status(500).json({ message: 'Failed to create credential' });
    }
  });

  app.post('/api/admin/credential-pools/bulk-import', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId, credentialText } = req.body;
      
      if (!shipId || !credentialText) {
        return res.status(400).json({ message: 'Ship ID and credential text are required' });
      }

      // Parse credential text (username,password per line)
      const lines = credentialText.trim().split('\n');
      const credentials = [];
      const errors = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const parts = line.split(',');
        if (parts.length !== 2) {
          errors.push(`Line ${i + 1}: Invalid format. Expected "username,password"`);
          continue;
        }
        
        const username = parts[0].trim();
        const password = parts[1].trim();
        
        if (!username || !password) {
          errors.push(`Line ${i + 1}: Username and password cannot be empty`);
          continue;
        }
        
        credentials.push({
          shipId,
          username,
          password,
          isAssigned: false
        });
      }

      if (credentials.length === 0) {
        return res.status(400).json({ message: 'No valid credentials found', errors });
      }

      const results = await storage.createCredentialPoolBatch(credentials);
      res.status(201).json({ 
        success: results.length, 
        errors,
        credentials: results 
      });
    } catch (error) {
      console.error('Error bulk importing credentials:', error);
      res.status(500).json({ message: 'Failed to bulk import credentials' });
    }
  });

  app.delete('/api/admin/credential-pools/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCredential(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting credential:', error);
      res.status(500).json({ message: 'Failed to delete credential' });
    }
  });

  app.post('/api/admin/credential-pools/:id/unassign', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.unassignCredential(id);
      res.status(200).json({ message: 'Credential unassigned successfully' });
    } catch (error) {
      console.error('Error unassigning credential:', error);
      res.status(500).json({ message: 'Failed to unassign credential' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

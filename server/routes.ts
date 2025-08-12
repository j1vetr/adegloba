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
  app.get('/api/user/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await orderService.getOrdersWithDetails(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
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

  // Admin routes
  const adminMiddleware = async (req: any, res: any, next: any) => {
    if (!req.user || req.user.claims?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Admin - Ships
  app.get('/api/admin/ships', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const ships = await storage.getShips();
      res.json(ships);
    } catch (error) {
      console.error("Error fetching ships:", error);
      res.status(500).json({ message: "Failed to fetch ships" });
    }
  });

  app.post('/api/admin/ships', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const shipData = insertShipSchema.parse(req.body);
      const ship = await storage.createShip(shipData);
      res.json(ship);
    } catch (error) {
      console.error("Error creating ship:", error);
      res.status(400).json({ message: error.message || "Failed to create ship" });
    }
  });

  app.put('/api/admin/ships/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const shipData = insertShipSchema.partial().parse(req.body);
      const ship = await storage.updateShip(id, shipData);
      if (!ship) {
        return res.status(404).json({ message: "Ship not found" });
      }
      res.json(ship);
    } catch (error) {
      console.error("Error updating ship:", error);
      res.status(400).json({ message: error.message || "Failed to update ship" });
    }
  });

  app.delete('/api/admin/ships/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShip(id);
      res.json({ message: "Ship deleted successfully" });
    } catch (error) {
      console.error("Error deleting ship:", error);
      res.status(500).json({ message: "Failed to delete ship" });
    }
  });

  // Admin - Plans
  app.get('/api/admin/plans', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const plans = await storage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post('/api/admin/plans', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const planData = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(400).json({ message: error.message || "Failed to create plan" });
    }
  });

  app.put('/api/admin/plans/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const planData = insertPlanSchema.partial().parse(req.body);
      const plan = await storage.updatePlan(id, planData);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(400).json({ message: error.message || "Failed to update plan" });
    }
  });

  app.delete('/api/admin/plans/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlan(id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

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

  app.get('/api/admin/me', isAdminAuthenticated, (req: any, res) => {
    res.json(req.session.adminUser);
  });

  // Admin Stats
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const ships = await storage.getAllShips();
      const plans = await storage.getAllPlans();
      const orders = await storage.getAllOrders();
      const users = await storage.getAllUsers();
      const coupons = await storage.getAllCoupons();
      
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalUsd.toString()), 0);
      const paidOrders = orders.filter(order => order.status === 'paid');
      const monthlyRevenue = paidOrders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          const currentMonth = new Date();
          return orderDate.getMonth() === currentMonth.getMonth() && 
                 orderDate.getFullYear() === currentMonth.getFullYear();
        })
        .reduce((sum, order) => sum + parseFloat(order.totalUsd.toString()), 0);
      
      const stats = {
        totalShips: ships.length,
        totalUsers: users.length,
        totalPlans: plans.length,
        activePlans: plans.filter(plan => plan.isActive).length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        activeCoupons: coupons.filter(coupon => coupon.isActive).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Admin Recent Orders
  app.get('/api/admin/recent-orders', isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getRecentOrders(10);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ message: 'Failed to fetch recent orders' });
    }
  });

  // Admin Recent Users  
  app.get('/api/admin/recent-users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getRecentUsers(10);
      res.json(users);
    } catch (error) {
      console.error('Error fetching recent users:', error);
      res.status(500).json({ message: 'Failed to fetch recent users' });
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
      const ship = await storage.createShip(shipData);
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
      const ship = await storage.updateShip(id, shipData);
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
      const { key, value, description } = req.body;
      await storage.setSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving setting:', error);
      res.status(500).json({ message: 'Failed to save setting' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

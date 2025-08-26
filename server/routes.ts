import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
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

  // Create PayPal order
  app.post('/api/paypal/create-order', async (req, res) => {
    try {
      const { amount, currency } = req.body;
      
      if (!amount || !currency) {
        return res.status(400).json({ message: 'Amount and currency are required' });
      }

      // Get PayPal settings from database for validation
      const settings = await storage.getSettingsByCategory('payment');
      const paypalClientId = settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value;
      const paypalSecret = settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value;
      
      if (!paypalClientId || !paypalSecret || paypalClientId.trim() === '' || paypalSecret.trim() === '') {
        return res.status(400).json({ 
          error: "PayPal not configured", 
          message: "PayPal credentials are missing. Please configure PayPal settings in the admin panel." 
        });
      }

      // Temporarily set environment variables from database for PayPal SDK
      const originalClientId = process.env.PAYPAL_CLIENT_ID;
      const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      process.env.PAYPAL_CLIENT_ID = paypalClientId;
      process.env.PAYPAL_CLIENT_SECRET = paypalSecret;

      try {
        // Call PayPal function directly with proper request/response
        const order = await createPaypalOrder(req, res);
        return; // Function handles response
      } finally {
        // Restore original environment variables
        if (originalClientId) process.env.PAYPAL_CLIENT_ID = originalClientId;
        if (originalClientSecret) process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
      }
    } catch (error) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({ message: "Failed to create PayPal order" });
    }
  });

  // Capture PayPal order
  app.post('/api/paypal/capture-order', async (req, res) => {
    try {
      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }

      // Get PayPal settings from database
      const settings = await storage.getSettingsByCategory('payment');
      const paypalClientId = settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value;
      const paypalSecret = settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value;
      
      if (!paypalClientId || !paypalSecret || paypalClientId.trim() === '' || paypalSecret.trim() === '') {
        return res.status(400).json({ 
          error: "PayPal not configured", 
          message: "PayPal credentials are missing. Please configure PayPal settings in the admin panel." 
        });
      }

      // Temporarily set environment variables from database for PayPal SDK
      const originalClientId = process.env.PAYPAL_CLIENT_ID;
      const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      process.env.PAYPAL_CLIENT_ID = paypalClientId;
      process.env.PAYPAL_CLIENT_SECRET = paypalSecret;

      try {
        // Set orderID in params for PayPal function  
        req.params = { ...req.params, orderID: orderId };
        await capturePaypalOrder(req, res);
        return; // Function handles response
      } finally {
        // Restore original environment variables
        if (originalClientId) process.env.PAYPAL_CLIENT_ID = originalClientId;
        if (originalClientSecret) process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ message: "Failed to capture PayPal payment" });
    }
  });

  // Get payment settings (must be before other settings routes)
  app.get('/api/settings/payment', async (req, res) => {
    console.log('Payment settings route hit');
    try {
      const settingsData = await storage.getSettingsByCategory('payment');
      console.log('Database settings data:', settingsData);
      
      const paymentSettings = {
        paypal_client_id: settingsData.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value || 
                         settingsData.find(s => s.key === 'paypal_client_id')?.value || '',
        paypal_environment: settingsData.find(s => s.key === 'PAYPAL_ENV')?.value || 
                           settingsData.find(s => s.key === 'paypal_environment')?.value || 'sandbox',
        paypal_secret: settingsData.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value || 
                      settingsData.find(s => s.key === 'paypal_secret')?.value || '',
      };
      
      console.log('Returning payment settings:', paymentSettings);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json(paymentSettings);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ message: "Failed to fetch payment settings" });
    }
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
      
      // Add stock information to each plan
      const plansWithStock = await Promise.all(plans.map(async (plan) => {
        const availableStock = await storage.getAvailableStock(plan.id);
        return {
          ...plan,
          availableStock,
          inStock: availableStock > 0
        };
      }));
      
      res.json(plansWithStock);
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

  // Get user's active packages with credentials
  app.get('/api/user/active-packages', async (req: any, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const activePackages = await storage.getUserActivePackages(userId);
        res.json(activePackages);
      } catch (error) {
        console.error("Error fetching user active packages:", error);
        res.status(500).json({ message: "Failed to fetch active packages" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  // Get user's ship plans with stock information
  app.get('/api/user/ship-plans', async (req: any, res) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const user = await storage.getUserWithShip(userId);
        
        if (!user || !user.ship_id) {
          return res.status(400).json({ message: "User has no assigned ship" });
        }
        
        const plans = await storage.getPlansForShip(user.ship_id);
        
        // Always mark plans as available (stock checking removed)
        const plansWithStock = plans.map((plan) => ({
          ...plan,
          availableStock: 999, // Dummy high number to indicate always available
          inStock: true
        }));
        
        res.json(plansWithStock);
      } catch (error) {
        console.error("Error fetching user ship plans:", error);
        res.status(500).json({ message: "Failed to fetch ship plans" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  // Get user's expired packages
  app.get('/api/user/expired-packages', async (req: any, res) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const offset = (page - 1) * pageSize;
        
        const expiredPackages = await storage.getUserExpiredPackages(userId, offset, pageSize);
        const totalCount = await storage.getUserExpiredPackagesCount(userId);
        const totalPages = Math.ceil(totalCount / pageSize);
        
        res.json({
          packages: expiredPackages,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            pageSize
          }
        });
      } catch (error) {
        console.error("Error fetching user expired packages:", error);
        res.status(500).json({ message: "Failed to fetch expired packages" });
      }
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  });

  app.post('/api/orders', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const userId = req.session.userId;
      const { shipId, planId, couponCode } = req.body;

      const order = await orderService.createOrder(userId, shipId, planId, couponCode);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  // Get single order with details
  app.get('/api/orders/:orderId', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { orderId } = req.params;
      const userId = req.session.userId;
      
      // Get order with details
      const order = await orderService.getOrderWithDetails(orderId);
      
      // Verify the order belongs to the user
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(404).json({ message: error.message || "Order not found" });
    }
  });

  app.post('/api/orders/:orderId/complete', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { orderId } = req.params;
      const { paypalOrderId } = req.body;

      // Use atomic payment processing for consistency
      const result = await orderService.processPaymentCompletion(orderId, paypalOrderId);
      
      if (result.success) {
        res.json({ 
          order: result.order,
          assignedCredentials: result.assignedCredentials,
          success: true,
          message: 'Order completed and credentials assigned'
        });
      } else {
        res.status(400).json({ message: 'Failed to complete order' });
      }
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(400).json({ message: error.message || "Failed to complete order" });
    }
  });

  app.post('/api/coupons/validate', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { code, shipId, subtotal } = req.body;
      const userId = req.session.userId;
      
      // Use the new method that validates and calculates discount
      const result = await couponService.validateAndCalculateDiscount(
        code, 
        parseFloat(subtotal) || 0, 
        shipId, 
        userId
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(400).json({ 
        valid: false,
        message: error.message || "Invalid coupon",
        discount_amount: 0,
        new_total: parseFloat(req.body.subtotal) || 0
      });
    }
  });

  // Cart API endpoints
  app.get('/api/cart', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const cartItems = await storage.getCartItems(userId);
      const cartTotal = await storage.getCartTotalFormatted(userId);
      
      res.json({
        items: cartItems,
        ...cartTotal
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  // Get cart total for coupon validation
  app.get('/api/cart/total', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const userId = req.session.userId;
      const cartTotal = await storage.getCartTotalFormatted(userId);
      res.json(cartTotal);
    } catch (error) {
      console.error("Error fetching cart total:", error);
      res.status(500).json({ message: "Failed to fetch cart total" });
    }
  });

  app.post('/api/cart', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { planId, quantity = 1 } = req.body;

      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      // Stock checking removed - packages always available for purchase

      const cartItem = await storage.addToCart(userId, planId, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:planId', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { planId } = req.params;
      const { quantity } = req.body;

      if (quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }

      // Stock checking removed - packages always available for purchase

      const cartItem = await storage.updateCartItem(userId, planId, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:planId', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { planId } = req.params;

      await storage.removeFromCart(userId, planId);
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete('/api/cart', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      await storage.clearCart(userId);
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Create order from cart
  app.post('/api/cart/checkout', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { couponCode } = req.body;

      // Get user to get ship ID
      const user = await storage.getUserById(userId);
      if (!user || !user.ship_id) {
        return res.status(400).json({ message: 'User ship not found' });
      }

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Validate stock availability for all items before creating order
      for (const cartItem of cartItems) {
        const availableStock = await storage.getAvailableStock(cartItem.planId);
        if (cartItem.quantity > availableStock) {
          const plan = await storage.getPlanById(cartItem.planId);
          return res.status(400).json({ 
            message: `"${plan?.name || 'Paket'}" için stokta yeterli ürün yok. Mevcut: ${availableStock}, İstenen: ${cartItem.quantity}`,
            planId: cartItem.planId,
            availableStock,
            requestedQuantity: cartItem.quantity
          });
        }
      }

      // Calculate cart total
      const cartTotal = await storage.getCartTotal(userId);
      let subtotal = cartTotal.subtotal;
      let discount = 0;
      let total = subtotal;
      let validatedCoupon = null;

      // Apply coupon if provided
      if (couponCode) {
        try {
          const couponResult = await couponService.validateAndCalculateDiscount(
            couponCode, 
            subtotal, 
            user.ship_id, 
            userId
          );
          validatedCoupon = couponResult.coupon;
          discount = couponResult.discount_amount;
          total = couponResult.new_total;
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
      }

      // For now, create order with first item (can be extended later)
      const firstItem = cartItems[0];
      if (!firstItem.plan) {
        return res.status(400).json({ message: 'Plan not found' });
      }

      // Create order with discount applied
      const orderData = {
        userId,
        shipId: user.ship_id,
        status: 'pending',
        currency: 'USD',
        subtotalUsd: subtotal.toFixed(2),
        discountUsd: discount.toFixed(2),
        totalUsd: total.toFixed(2),
        couponId: validatedCoupon?.id || null,
      };

      const order = await storage.createOrder(orderData);

      // Create order item
      await storage.createOrderItem({
        orderId: order.id,
        shipId: user.ship_id,
        planId: firstItem.plan.id,
        qty: firstItem.quantity,
        unitPriceUsd: firstItem.plan.priceUsd,
        lineTotalUsd: (parseFloat(firstItem.plan.priceUsd) * firstItem.quantity).toFixed(2),
      });

      // Record coupon usage if coupon was applied
      if (validatedCoupon && discount > 0) {
        await couponService.recordCouponUsage(validatedCoupon.id, userId, order.id, discount);
      }

      res.json(order);
    } catch (error) {
      console.error("Error creating order from cart:", error);
      res.status(500).json({ message: "Failed to create order from cart" });
    }
  });

  // Complete payment for cart-based order
  app.post('/api/cart/complete-payment', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { paypalOrderId, couponCode } = req.body;

      // Get user to get ship ID
      const user = await storage.getUserById(userId);
      if (!user || !user.ship_id) {
        return res.status(400).json({ message: 'User ship not found' });
      }

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Calculate cart total
      const cartTotal = await storage.getCartTotal(userId);
      let subtotal = cartTotal.subtotal;
      let discount = 0;
      let total = subtotal;
      let validatedCoupon = null;

      // Apply coupon if provided
      if (couponCode) {
        try {
          const couponResult = await couponService.validateAndCalculateDiscount(
            couponCode, 
            subtotal, 
            user.ship_id, 
            userId
          );
          validatedCoupon = couponResult.coupon;
          discount = couponResult.discount_amount;
          total = couponResult.new_total;
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
      }

      // Create order with 'pending' status initially 
      const orderData = {
        userId,
        shipId: user.ship_id,
        status: 'pending',
        currency: 'USD',
        subtotalUsd: subtotal.toFixed(2),
        discountUsd: discount.toFixed(2),
        totalUsd: total.toFixed(2),
        couponId: validatedCoupon?.id || null,
        paypalOrderId: paypalOrderId || null,
      };

      const order = await storage.createOrder(orderData);

      // Create order items for all cart items
      for (const cartItem of cartItems) {
        // Get plan details for pricing
        const plan = await storage.getPlanById(cartItem.planId);
        if (plan) {
          await storage.createOrderItem({
            orderId: order.id,
            shipId: user.ship_id,
            planId: cartItem.planId,
            qty: cartItem.quantity,
            unitPriceUsd: plan.priceUsd,
            lineTotalUsd: (parseFloat(plan.priceUsd) * cartItem.quantity).toFixed(2),
          });
        }
      }

      // Record coupon usage if coupon was applied
      if (validatedCoupon && discount > 0) {
        await couponService.recordCouponUsage(validatedCoupon.id, userId, order.id, discount);
      }

      // Use atomic payment processing for consistency
      const result = await orderService.processPaymentCompletion(order.id, paypalOrderId || 'manual-payment');
      
      if (!result.success) {
        throw new Error('Failed to process payment and assign credentials');
      }

      // Clear cart after successful order creation and credential assignment
      await storage.clearCart(userId);

      res.json({ 
        id: order.id, 
        orderId: order.id,
        success: true,
        message: 'Order completed and credentials assigned',
        totalUsd: total.toFixed(2)
      });
    } catch (error) {
      console.error("Error completing payment from cart:", error);
      res.status(500).json({ message: "Failed to complete payment" });
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
  app.get('/api/admin/orders', isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await orderService.getAllOrdersWithDetails();
      // Transform the data structure to match frontend expectations
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        // Map 'items' to 'orderItems' and include ship data at root level
        orderItems: order.items || [],
        ship: order.items?.[0]?.ship || null
      }));
      res.json(transformedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/admin/orders', isAdminAuthenticated, async (req, res) => {
    try {
      const { userId, shipId, planId, status, subtotalUsd, discountUsd, totalUsd, couponId } = req.body;
      
      // Validate required fields
      if (!userId || !shipId || !planId) {
        return res.status(400).json({ message: "User, ship, and plan are required" });
      }

      // Create order
      const orderData = {
        userId,
        shipId,
        status: status || 'pending',
        currency: 'USD',
        subtotalUsd,
        discountUsd: discountUsd || '0.00',
        totalUsd,
        couponId: couponId || null,
      };

      const order = await storage.createOrder(orderData);

      // Create order item
      const orderItemData = {
        orderId: order.id,
        shipId,
        planId,
        quantity: 1,
        priceUsd: subtotalUsd,
      };

      await storage.createOrderItem(orderItemData);

      // Get the complete order with details
      const completeOrder = await orderService.getOrderWithDetails(order.id);
      res.json(completeOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: error.message || "Failed to create order" });
    }
  });

  app.put('/api/admin/orders/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, subtotalUsd, discountUsd, totalUsd } = req.body;
      
      const updateData = {
        status,
        subtotalUsd,
        discountUsd,
        totalUsd,
      };

      const order = await storage.updateOrder(id, updateData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const completeOrder = await orderService.getOrderWithDetails(order.id);
      res.json(completeOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(400).json({ message: error.message || "Failed to update order" });
    }
  });

  app.delete('/api/admin/orders/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // First delete order items
      await storage.deleteOrderItemsByOrderId(id);
      
      // Then delete the order
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
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

  // Admin - Coupons (Enhanced version with filtering and pagination is implemented later)

  // Admin - Statistics
  app.get('/api/admin/stats', isAdminAuthenticated, async (req, res) => {
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
      
      // Determine category based on key for PayPal settings
      let settingCategory = category || 'general';
      if (key.startsWith('PAYPAL_') || key.includes('paypal')) {
        settingCategory = 'payment';
      }
      
      const setting = await storage.upsertSetting(key, value, settingCategory);
      console.log(`Setting updated: ${key} = ${value} (category: ${settingCategory})`);
      res.json(setting);
    } catch (error) {
      console.error("Error setting value:", error);
      res.status(400).json({ message: error.message || "Failed to set value" });
    }
  });

  // Initialize default settings on startup
  storage.initializeDefaultSettings().catch(console.error);









  app.get("/api/admin/credentials", isAdminAuthenticated, async (req, res) => {
    try {
      const credentials = await storage.getAllCredentials();
      const plans = await storage.getAllPlans();
      const ships = await storage.getAllShips();
      
      const credentialsWithDetails = credentials.map(credential => {
        const plan = plans.find(p => p.id === credential.planId);
        const ship = ships.find(s => s.id === plan?.shipId);
        return {
          ...credential,
          plan,
          ship
        };
      });
      
      res.json(credentialsWithDetails);
    } catch (error: any) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/credentials", isAdminAuthenticated, async (req, res) => {
    try {
      const credential = await storage.createCredentialForPlan(req.body);
      res.json(credential);
    } catch (error: any) {
      console.error("Error creating credential:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/credentials/import", isAdminAuthenticated, async (req, res) => {
    try {
      const { planId, credentials } = req.body;
      let created = 0;
      
      for (const cred of credentials) {
        try {
          await storage.createCredentialForPlan({
            planId,
            username: cred.username,
            password: cred.password
          });
          created++;
        } catch (error) {
          console.warn(`Failed to create credential ${cred.username}:`, error);
        }
      }
      
      res.json({ created, total: credentials.length });
    } catch (error: any) {
      console.error("Error importing credentials:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/credentials/bulk", isAdminAuthenticated, async (req, res) => {
    try {
      const { ids } = req.body;
      for (const id of ids) {
        await storage.deleteCredential(id);
      }
      res.json({ message: `${ids.length} credentials deleted successfully` });
    } catch (error: any) {
      console.error("Error deleting credentials:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/credentials/:id", isAdminAuthenticated, async (req, res) => {
    try {
      await storage.deleteCredential(req.params.id);
      res.json({ message: "Credential deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced Users Management API Routes
  app.get("/api/admin/users-with-stats", isAdminAuthenticated, async (req, res) => {
    try {
      const usersWithStats = await storage.getUsersWithOrderStats();
      res.json(usersWithStats);
    } catch (error: any) {
      console.error("Error fetching users with stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/orders", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const orderHistory = await storage.getUserOrderHistory(id);
      res.json(orderHistory);
    } catch (error: any) {
      console.error("Error fetching user order history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Manual package assignment to user
  app.post("/api/admin/users/:id/assign-package", isAdminAuthenticated, async (req, res) => {
    try {
      const { id: userId } = req.params;
      const { planId, note } = req.body;

      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      // Get user and plan details
      const [user, plan] = await Promise.all([
        storage.getUser(userId),
        storage.getPlan(planId)
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Create manual order
      const result = await storage.createManualPackageAssignment({
        userId,
        planId,
        note,
        adminId: req.session.adminUser.id
      });

      // Create system log
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'manual_package_assignment',
        adminId: req.session.adminUser.id,
        entityType: 'user',
        entityId: userId,
        details: {
          planId,
          planName: plan.name,
          note,
          username: user.username
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });

      res.json({ 
        message: "Package assigned successfully",
        assignment: result
      });

    } catch (error: any) {
      console.error("Error assigning manual package:", error);
      res.status(500).json({ message: error.message || "Failed to assign package" });
    }
  });

  app.delete("/api/admin/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user info before deletion for logging
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const success = await storage.deleteUser(id);
      
      // Create system log for user deletion
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'delete_user',
        adminId: req.session.adminUser.id,
        entityType: 'user',
        entityId: id,
        details: {
          deletedUser: {
            username: user.username,
            email: user.email,
            full_name: user.full_name
          }
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message });
    }
  });

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
        req.session.adminUser = { id: 'admin-emir', username: 'emir' };
        
        // Create system log for admin login
        await storage.createSystemLog({
          category: 'admin_action',
          action: 'admin_login',
          adminId: 'admin-emir',
          entityType: 'admin',
          entityId: 'admin-emir',
          details: { loginSuccess: true },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
        
        res.json({ success: true, user: { username: 'emir' } });
      } else {
        // Log failed login attempt
        await storage.createSystemLog({
          category: 'admin_action',
          action: 'admin_login_failed',
          entityType: 'admin',
          details: { 
            attemptedUsername: username,
            loginSuccess: false 
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
        
        res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Giriş işlemi başarısız' });
    }
  });

  app.post('/api/admin/logout', async (req: any, res) => {
    try {
      // Create system log for admin logout
      if (req.session.adminUser) {
        await storage.createSystemLog({
          category: 'admin_action',
          action: 'admin_logout',
          adminId: req.session.adminUser.id,
          entityType: 'admin',
          entityId: req.session.adminUser.id,
          details: { logoutSuccess: true },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
      }
      
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Çıkış işlemi başarısız' });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Çıkış işlemi başarısız' });
    }
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
      
      // Get user info before deletion for logging
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create system log for user deletion
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'delete_user',
        adminId: req.session.adminUser.id || 'admin-emir',
        entityType: 'user',
        entityId: id,
        details: {
          deletedUser: {
            username: user.username,
            email: user.email,
            full_name: user.full_name
          }
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });

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
      
      // Create system log for ship creation
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'create_ship',
        adminId: req.session.adminUser.id,
        entityType: 'ship',
        entityId: ship.id,
        details: {
          shipName: ship.name,
          shipSlug: ship.slug,
          isActive: ship.isActive
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
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
      
      // Get ship info before deletion for logging
      const ships = await storage.getAllShips();
      const ship = ships.find(s => s.id === id);
      
      await storage.deleteShip(id);
      
      // Create system log for ship deletion
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'delete_ship',
        adminId: req.session.adminUser.id,
        entityType: 'ship',
        entityId: id,
        details: {
          deletedShip: ship ? {
            name: ship.name,
            slug: ship.slug,
            isActive: ship.isActive
          } : { id }
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting ship:', error);
      res.status(500).json({ message: 'Failed to delete ship' });
    }
  });

  // Admin CRUD Routes for Plans
  app.get('/api/admin/plans', isAdminAuthenticated, async (req, res) => {
    try {
      const plans = await storage.getPlans();
      const ships = await storage.getShips();
      
      const plansWithDetails = await Promise.all(plans.map(async (plan) => {
        const ship = ships.find(s => s.id === plan.shipId);
        
        try {
          const planCredentials = await storage.getCredentialsForPlan(plan.id);
          
          return {
            ...plan,
            ship,
            credentialStats: {
              total: planCredentials.length,
              available: planCredentials.filter(c => !c.isAssigned).length,
              assigned: planCredentials.filter(c => c.isAssigned).length,
            }
          };
        } catch (error) {
          console.log('Error fetching credentials for plan', plan.id, ':', error);
          return {
            ...plan,
            ship,
            credentialStats: {
              total: 0,
              available: 0,
              assigned: 0,
            }
          };
        }
      }));

      res.json(plansWithDetails);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ message: 'Failed to fetch plans' });
    }
  });

  app.post('/api/admin/plans', isAdminAuthenticated, async (req, res) => {
    try {
      console.log('Received plan data:', req.body);
      const planData = insertPlanSchema.parse(req.body);
      console.log('Parsed plan data:', planData);
      const plan = await storage.createPlan(planData);
      
      // Create system log for plan creation
      await storage.createSystemLog({
        category: 'package_creation',
        action: 'create_package',
        adminId: req.session.adminUser.id,
        entityType: 'plan',
        entityId: plan.id,
        details: {
          planName: plan.name,
          dataAmount: plan.dataAmount,
          priceUSD: plan.priceUSD,
          shipId: plan.shipId
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json(plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      res.status(500).json({ 
        message: 'Failed to create plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Get all plans (for admin manual assignment)
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Ship-based packages API routes
  app.get('/api/admin/ships/:shipId/plans', isAdminAuthenticated, async (req, res) => {
    try {
      const { shipId } = req.params;
      const plans = await storage.getPlansForShip(shipId);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching ship plans:', error);
      res.status(500).json({ message: 'Failed to fetch ship plans' });
    }
  });

  // Admin - Users for order assignment - Removed duplicate route

  // Enhanced Admin CRUD Routes for Coupons with filtering and pagination
  app.get('/api/admin/coupons', isAdminAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const scope = req.query.scope as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      // Build where conditions
      const whereConditions = [];
      const params: any[] = [];

      if (search) {
        whereConditions.push('UPPER(code) LIKE UPPER($' + (params.length + 1) + ')');
        params.push(`%${search}%`);
      }

      if (status === 'active') {
        whereConditions.push('is_active = $' + (params.length + 1));
        params.push(true);
      } else if (status === 'inactive') {
        whereConditions.push('is_active = $' + (params.length + 1));
        params.push(false);
      } else if (status === 'expired') {
        whereConditions.push('ends_at < $' + (params.length + 1));
        params.push(new Date());
      }

      if (type) {
        whereConditions.push('(discount_type = $' + (params.length + 1) + ' OR type = $' + (params.length + 2) + ')');
        params.push(type);
        params.push(type);
      }

      if (scope) {
        whereConditions.push('scope = $' + (params.length + 1));
        params.push(scope);
      }

      if (dateFrom) {
        whereConditions.push('created_at >= $' + (params.length + 1));
        params.push(new Date(dateFrom));
      }

      if (dateTo) {
        whereConditions.push('created_at <= $' + (params.length + 1));
        params.push(new Date(dateTo + 'T23:59:59'));
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      const offset = (page - 1) * pageSize;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM coupons ${whereClause}`;
      const countResult = await db.execute({ sql: countQuery, args: params });
      const total = Number(countResult.rows[0]?.total) || 0;

      // Get paginated results
      const dataQuery = `
        SELECT * FROM coupons 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      const dataResult = await db.execute({ 
        sql: dataQuery, 
        args: [...params, pageSize, offset] 
      });

      const coupons = dataResult.rows.map((row: any) => storage.transformDbCouponToFrontend(row));

      res.json({
        coupons,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      // Fallback to simple query if advanced query fails
      try {
        const coupons = await storage.getAllCoupons();
        res.json({ coupons, total: coupons.length, page: 1, pageSize: coupons.length, totalPages: 1 });
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to fetch coupons' });
      }
    }
  });

  app.post('/api/admin/coupons', isAdminAuthenticated, async (req, res) => {
    try {
      const couponData = insertCouponSchema.parse(req.body);
      
      // Check for duplicate coupon codes
      const existingCoupon = await storage.getCouponByCode(couponData.code);
      if (existingCoupon) {
        return res.status(400).json({ message: 'Bu kupon kodu zaten kullanılıyor. Lütfen farklı bir kod seçin.' });
      }
      
      const coupon = await storage.createCoupon(couponData);
      res.json(coupon);
    } catch (error) {
      console.error('Error creating coupon:', error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ message: 'Bu kupon kodu zaten kullanılıyor. Lütfen farklı bir kod seçin.' });
      } else {
        res.status(500).json({ message: error.message || 'Failed to create coupon' });
      }
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

  // Admin Users - Removed duplicate route

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
        full_name: req.body.full_name,
        email: req.body.email,
        ship_id: req.body.ship_id,
        address: req.body.address,
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

  // System logs routes
  app.get('/api/admin/logs', isAdminAuthenticated, async (req, res) => {
    try {
      const { page, pageSize, category, action, search } = req.query;
      
      const logs = await storage.getSystemLogs({
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 50,
        category: category as string,
        action: action as string,
        search: search as string,
      });
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      res.status(500).json({ message: 'Failed to fetch system logs' });
    }
  });

  app.post('/api/admin/logs', isAdminAuthenticated, async (req, res) => {
    try {
      const logData = {
        ...req.body,
        adminId: req.session.adminUser.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      };
      
      const log = await storage.createSystemLog(logData);
      res.json(log);
    } catch (error) {
      console.error('Error creating system log:', error);
      res.status(500).json({ message: 'Failed to create system log' });
    }
  });

  // Manual log cleanup endpoint for admin
  app.post('/api/admin/logs/cleanup', isAdminAuthenticated, async (req, res) => {
    try {
      const { logCleanupService } = await import('./services/logCleanupService');
      const deletedCount = await logCleanupService.forceCleanup();
      
      // Log the cleanup action
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'manual_log_cleanup',
        adminId: req.session.adminUser.id,
        entityType: 'system',
        entityId: 'log_cleanup',
        details: {
          deletedCount,
          action: 'Manual log cleanup executed'
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json({ 
        success: true, 
        message: `Deleted ${deletedCount} old log entries`,
        deletedCount 
      });
    } catch (error: any) {
      console.error('Manual log cleanup error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during log cleanup: ' + error.message 
      });
    }
  });

  // Admin endpoint to find incomplete paid orders
  app.get('/api/admin/orders/incomplete-paid', isAdminAuthenticated, async (req, res) => {
    try {
      const incompleteOrders = await orderService.findIncompletePaidOrders();
      res.json({
        success: true,
        count: incompleteOrders.length,
        orders: incompleteOrders
      });
    } catch (error) {
      console.error("Error finding incomplete paid orders:", error);
      res.status(500).json({ success: false, message: "Failed to find incomplete orders" });
    }
  });

  // Admin endpoint to fix specific incomplete paid order
  app.post('/api/admin/orders/:orderId/fix-incomplete', isAdminAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      const result = await orderService.fixIncompletePaidOrder(orderId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error(`Error fixing incomplete order ${req.params.orderId}:`, error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to fix order: ${error.message}` 
      });
    }
  });

  // Admin endpoint to fix all incomplete paid orders
  app.post('/api/admin/orders/fix-all-incomplete', isAdminAuthenticated, async (req, res) => {
    try {
      const result = await orderService.fixAllIncompletePaidOrders();
      res.json({
        success: true,
        message: `Processed ${result.processed} orders, fixed ${result.fixed}`,
        ...result
      });
    } catch (error) {
      console.error("Error fixing all incomplete orders:", error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to fix orders: ${error.message}` 
      });
    }
  });

  // Public endpoint to trigger fix for a specific order (for immediate fixes)
  app.post('/api/orders/:orderId/fix-completion', async (req, res) => {
    try {
      const { orderId } = req.params;
      const result = await orderService.fixIncompletePaidOrder(orderId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error(`Error fixing order completion ${req.params.orderId}:`, error);
      res.status(500).json({ 
        success: false, 
        message: `Failed to fix order completion: ${error.message}` 
      });
    }
  });

  // PayPal webhook endpoint for payment verification
  app.post("/api/paypal/webhook", async (req, res) => {
    console.log('PayPal webhook received:', req.body);
    
    try {
      const event = req.body;
      
      // Verify webhook signature (in production, you'd validate the webhook signature)
      // For now, we'll process the event if it's a payment completion
      
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const payment = event.resource;
        const orderId = payment.supplementary_data?.related_ids?.order_id || payment.custom_id;
        
        console.log(`🔄 Processing payment completion for order: ${orderId}`);
        
        try {
          // Use atomic payment processing method for consistency
          const result = await orderService.processPaymentCompletion(
            orderId, 
            payment.id, 
            payment
          );
          
          if (result.success) {
            console.log(`✅ Payment processed successfully for order ${orderId}: ${result.assignedCredentials.length} credentials assigned`);
            
            // Send success response to PayPal
            res.status(200).json({ 
              status: 'success',
              orderId,
              credentialsAssigned: result.assignedCredentials.length
            });
          } else {
            console.error(`❌ Payment processing failed for order ${orderId}`);
            res.status(500).json({ error: 'Payment processing failed' });
          }
        } catch (processingError) {
          console.error(`💥 Payment processing error for order ${orderId}:`, processingError);
          
          // Still send success to PayPal to avoid retries, but log the error
          res.status(200).json({ 
            status: 'error', 
            message: processingError.message,
            orderId 
          });
        }
        
      } else {
        // Handle other webhook events
        console.log(`ℹ️ Unhandled webhook event: ${event.event_type}`);
        res.status(200).json({ status: 'ignored' });
      }
      
    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Startup job to fix incomplete paid orders
  async function startupIncompleteOrdersCheck() {
    try {
      console.log('🔍 Checking for incomplete paid orders on startup...');
      const result = await orderService.fixAllIncompletePaidOrders();
      
      if (result.processed > 0) {
        console.log(`🔧 Startup check: Fixed ${result.fixed}/${result.processed} incomplete orders`);
        if (result.errors.length > 0) {
          console.log('❌ Errors during startup fix:', result.errors);
        }
      } else {
        console.log('✅ No incomplete paid orders found on startup');
      }
    } catch (error) {
      console.error('❌ Startup incomplete orders check failed:', error);
    }
  }

  // Enhanced cleanup that also checks for incomplete orders
  async function enhancedOrderCleanup() {
    try {
      console.log('🧹 Running enhanced order cleanup...');
      
      // Check for incomplete paid orders
      const incompleteOrders = await orderService.findIncompletePaidOrders();
      if (incompleteOrders.length > 0) {
        console.log(`🔧 Found ${incompleteOrders.length} incomplete paid orders during cleanup`);
        const result = await orderService.fixAllIncompletePaidOrders();
        console.log(`🔧 Cleanup fixed ${result.fixed}/${result.processed} incomplete orders`);
      }
    } catch (error) {
      console.error('❌ Enhanced cleanup incomplete orders check failed:', error);
    }
  }

  // Run startup check after a short delay
  setTimeout(startupIncompleteOrdersCheck, 5000);
  
  // Set up interval to run enhanced cleanup every 30 minutes
  setInterval(enhancedOrderCleanup, 30 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}

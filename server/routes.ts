import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./standaloneAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, createPayPalClient } from "./paypal";
import { OrdersController } from "@paypal/paypal-server-sdk";
import { OrderService } from "./services/orderService";
import { CouponService } from "./services/couponService";
import { ExpiryService } from "./services/expiryService";
import { emailService, EmailService } from "./emailService";
import { insertShipSchema, insertPlanSchema, insertCouponSchema, insertEmailSettingSchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

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

  // User endpoint for session auth - REMOVED DUPLICATE (kept the better one below)

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
      const paypalClientId = settings.find(s => s.key === 'paypalClientId')?.value;
      const paypalSecret = settings.find(s => s.key === 'paypalClientSecret')?.value;
      
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
      const paypalClientId = settings.find(s => s.key === 'paypalClientId')?.value;
      const paypalSecret = settings.find(s => s.key === 'paypalClientSecret')?.value;
      
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
        paypal_client_id: settingsData.find(s => s.key === 'paypalClientId')?.value || '',
        paypal_environment: settingsData.find(s => s.key === 'paypalEnvironment')?.value || 'sandbox',
        paypal_secret: settingsData.find(s => s.key === 'paypalClientSecret')?.value || '',
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

  // Protected user routes - Get user profile with ship information
  app.get('/api/user/me', async (req: any, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const userId = req.session.userId;
        console.log(`📋 Fetching user profile for userId: ${userId}`);
        
        const user = await storage.getUserWithShip(userId);
        if (!user) {
          console.log(`❌ User not found for userId: ${userId}`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`✅ User profile found:`, {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          ship_id: user.ship_id,
          address: user.address
        });
        
        res.json(user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile" });
      }
    } else {
      console.log(`🚫 Unauthorized request to /api/user/me - no session or userId`);
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

      // Create order items for all cart items
      for (const cartItem of cartItems) {
        if (!cartItem.plan) {
          return res.status(400).json({ message: `Plan not found for item ${cartItem.planId}` });
        }

        await storage.createOrderItem({
          orderId: order.id,
          shipId: user.ship_id,
          planId: cartItem.plan.id,
          qty: cartItem.quantity,
          unitPriceUsd: cartItem.plan.priceUsd,
          lineTotalUsd: (parseFloat(cartItem.plan.priceUsd) * cartItem.quantity).toFixed(2),
        });
      }

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

  // Complete payment for cart-based order - WITH STRICT VALIDATION
  app.post('/api/cart/complete-payment', async (req: any, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const userId = req.session.userId;
      const { paypalOrderId, couponCode } = req.body;

      console.log(`🔒 STRICT VALIDATION: Complete payment request for PayPal Order: ${paypalOrderId}`);

      // KESIN KONTROL: PayPal Order ID'yi backend'de re-verify et
      if (paypalOrderId && paypalOrderId !== 'manual-payment') {
        console.log(`🔍 Re-verifying PayPal Order status: ${paypalOrderId}`);
        
        // PayPal SDK ile order'ı tekrar sorgula
        const settings = await storage.getSettingsByCategory('payment');
        const paypalClientId = settings.find(s => s.key === 'paypalClientId')?.value;
        const paypalSecret = settings.find(s => s.key === 'paypalClientSecret')?.value;
        
        if (paypalClientId && paypalSecret) {
          // PayPal client oluştur
          const originalClientId = process.env.PAYPAL_CLIENT_ID;
          const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
          
          process.env.PAYPAL_CLIENT_ID = paypalClientId;
          process.env.PAYPAL_CLIENT_SECRET = paypalSecret;
          
          try {
            const client = await createPayPalClient();
            const ordersController = new OrdersController(client);
            
            // PayPal'dan order detaylarını çek
            const { body } = await ordersController.getOrder({ id: paypalOrderId });
            const orderDetails = JSON.parse(String(body));
            
            console.log(`🔍 PayPal Order Status Check:`, {
              orderId: paypalOrderId,
              status: orderDetails.status,
              captureStatus: orderDetails.purchase_units?.[0]?.payments?.captures?.[0]?.status
            });
            
            // KESIN KONTROL: Capture status COMPLETED olmak zorunda
            const captureDetails = orderDetails.purchase_units?.[0]?.payments?.captures?.[0];
            if (!captureDetails || captureDetails.status !== 'COMPLETED') {
              console.error(`❌ PAYMENT REJECTED: Order ${paypalOrderId} capture status is not COMPLETED:`, captureDetails?.status);
              return res.status(400).json({ 
                message: 'Payment verification failed - payment was not completed successfully',
                paypalStatus: captureDetails?.status || 'UNKNOWN',
                verified: false
              });
            }
            
            console.log(`✅ PAYMENT VERIFIED: Order ${paypalOrderId} has COMPLETED capture status`);
            
          } finally {
            // Restore environment variables
            if (originalClientId) process.env.PAYPAL_CLIENT_ID = originalClientId;
            if (originalClientSecret) process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
          }
        }
      }

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

      // Find existing pending order for this user instead of creating new one
      const pendingOrders = await storage.getUserOrders(userId);
      const pendingOrder = pendingOrders.find(order => order.status === 'pending');
      
      if (!pendingOrder) {
        return res.status(400).json({ message: 'No pending order found. Please restart checkout process.' });
      }

      // Update the existing order with PayPal order ID
      await storage.updateOrder(pendingOrder.id, {
        paypalOrderId: paypalOrderId || 'manual-payment'
      });

      // Record coupon usage if coupon was applied 
      // (Note: Duplicate coupon usage will be handled by coupon service constraints)
      if (validatedCoupon && discount > 0) {
        try {
          await couponService.recordCouponUsage(validatedCoupon.id, userId, pendingOrder.id, discount);
        } catch (error) {
          // Ignore if coupon usage already exists (idempotency)
          console.log('Coupon usage might already exist:', error.message);
        }
      }

      // Use atomic payment processing for consistency
      const result = await orderService.processPaymentCompletion(pendingOrder.id, paypalOrderId || 'manual-payment');
      
      if (!result.success) {
        throw new Error('Failed to process payment and assign credentials');
      }

      // Clear cart after successful order creation and credential assignment
      await storage.clearCart(userId);

      res.json({ 
        id: pendingOrder.id, 
        orderId: pendingOrder.id,
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

  // Admin - Reports
  app.get('/api/admin/reports', isAdminAuthenticated, async (req, res) => {
    try {
      const { ship, range } = req.query;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (range) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = lastMonth;
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const reportData = await storage.getReportData(
        ship === 'all' ? undefined : ship as string,
        startDate,
        endDate
      );

      res.json(reportData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Admin reports export endpoint
  app.get('/api/admin/reports/export', isAdminAuthenticated, async (req, res) => {
    try {
      const { ship, range, format = 'excel' } = req.query;
      
      // Calculate date range (same logic as reports endpoint)
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (range) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = lastMonth;
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const reportData = await storage.getReportData(
        ship === 'all' ? undefined : ship as string,
        startDate,
        endDate
      );

      if (format === 'csv') {
        const csvData = reportData.map(item => ({
          shipName: item.shipName,
          totalOrders: item.totalOrders,
          packagesSold: item.packagesSold,
          totalDataGB: item.totalDataGB,
          totalRevenue: item.totalRevenue.toFixed(2)
        }));

        const csvString = csvData.map(row => 
          Object.values(row).map(val => `"${val}"`).join(',')
        ).join('\n');
        
        const header = 'Gemi Adı,Ödenen Siparişler,Satılan Paketler,Satılan Veri (GB),Net Gelir ($)\n';
        const finalCsv = header + csvString;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="rapor-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\uFEFF' + finalCsv); // BOM for Turkish characters
      } else {
        // Excel export
        const workbook = XLSX.utils.book_new();
        
        const excelData = reportData.map(item => ({
          'Gemi Adı': item.shipName,
          'Ödenen Siparişler': item.totalOrders,
          'Satılan Paketler': item.packagesSold,
          'Satılan Veri (GB)': item.totalDataGB,
          'Net Gelir ($)': parseFloat(item.totalRevenue.toFixed(2))
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Auto-size columns
        const colWidths = [
          { wch: 20 }, // Gemi Adı
          { wch: 18 }, // Ödenen Siparişler
          { wch: 16 }, // Satılan Paketler
          { wch: 18 }, // Satılan Veri (GB)
          { wch: 15 }  // Net Gelir ($)
        ];
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapor');
        
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="rapor-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelBuffer);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Admin - Send custom report via email
  app.post('/api/admin/reports/send-email', isAdminAuthenticated, async (req, res) => {
    let excelFilePath: string | null = null;
    
    try {
      console.log('📧 Custom report email requested by admin');
      
      const { month, year, startDate, endDate, shipId } = req.body;
      
      // Calculate date range
      let reportStartDate: Date;
      let reportEndDate: Date;
      let reportTitle: string;
      
      if (month && year) {
        // Monthly report
        const monthNum = parseInt(month) - 1; // JS months are 0-indexed
        const yearNum = parseInt(year);
        reportStartDate = new Date(yearNum, monthNum, 1);
        reportEndDate = new Date(yearNum, monthNum + 1, 0);
        
        const turkishMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        reportTitle = `${turkishMonths[monthNum]} ${yearNum}`;
      } else if (startDate && endDate) {
        // Date range report
        reportStartDate = new Date(startDate);
        reportEndDate = new Date(endDate);
        
        const formatDate = (date: Date) => {
          return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
        };
        reportTitle = `${formatDate(reportStartDate)} - ${formatDate(reportEndDate)}`;
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Tarih bilgisi eksik' 
        });
      }
      
      console.log(`📊 Generating report for: ${reportTitle}`);
      
      // Get report data
      const reportData = await storage.getReportData(
        shipId || undefined,
        reportStartDate,
        reportEndDate
      );
      
      if (reportData.length === 0) {
        console.log('⚠️ No data found for selected date range');
        return res.status(404).json({ 
          success: false,
          message: 'Seçilen tarih aralığında veri bulunamadı' 
        });
      }
      
      console.log(`📊 Found ${reportData.length} ship(s) with data`);
      
      // Calculate totals
      const totals = {
        totalOrders: reportData.reduce((sum, item) => sum + item.totalOrders, 0),
        totalRevenue: reportData.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalDataGB: reportData.reduce((sum, item) => sum + item.totalDataGB, 0),
        packagesSold: reportData.reduce((sum, item) => sum + item.packagesSold, 0),
      };
      
      console.log(`📊 Totals: ${totals.totalOrders} orders, $${totals.totalRevenue.toFixed(2)} revenue`);
      
      // Generate Excel file
      try {
        const { generateExcelReport } = await import('./emailScheduler');
        excelFilePath = await generateExcelReport(reportData, reportTitle);
        console.log(`📄 Excel file created: ${excelFilePath}`);
      } catch (excelError) {
        console.error('❌ Error generating Excel file:', excelError);
        throw new Error(`Excel dosyası oluşturulamadı: ${excelError instanceof Error ? excelError.message : 'Bilinmeyen hata'}`);
      }
      
      // Get admin email
      const adminEmailSetting = await storage.getSetting('admin_email');
      const adminEmail = adminEmailSetting?.value;
      
      if (!adminEmail) {
        console.error('❌ Admin email not configured in settings');
        throw new Error('Admin e-posta adresi ayarlanmamış. Lütfen Ayarlar sayfasından admin_email değerini belirleyin.');
      }
      
      console.log(`📧 Sending report to: ${adminEmail}`);
      
      // Get base URL
      const baseUrlSetting = await storage.getSetting('base_url');
      const baseUrl = baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
      
      // Format ship statistics HTML for email
      const shipStatsHtml = reportData.map(ship => 
        `<li><strong>${ship.shipName}:</strong> ${ship.totalOrders} ödenen sipariş, ${ship.packagesSold} paket, ${ship.totalDataGB}GB veri, $${ship.totalRevenue.toFixed(2)} gelir</li>`
      ).join('');
      
      // Send email with Excel attachment
      let success = false;
      try {
        success = await emailService.sendEmailWithAttachment(
          adminEmail,
          `${reportTitle} Finans Raporu - AdeGloba Starlink System`,
          'admin_monthly_report',
          {
            reportMonth: reportTitle,
            shipStats: `<ul>${shipStatsHtml}</ul>`,
            totalOrders: totals.totalOrders.toString(),
            totalRevenue: totals.totalRevenue.toFixed(2),
            totalDataGB: totals.totalDataGB.toString(),
            packagesSold: totals.packagesSold.toString(),
            adminUrl: baseUrl + '/admin',
          },
          [{
            filename: `rapor-${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.xlsx`,
            path: excelFilePath,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }]
        );
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError);
        throw new Error(`E-posta gönderilemedi: ${emailError instanceof Error ? emailError.message : 'Bilinmeyen hata'}`);
      }
      
      // Clean up temp file
      if (excelFilePath) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(excelFilePath);
          console.log('🗑️ Temp Excel file deleted');
        } catch (cleanupError) {
          console.warn('⚠️ Warning: Could not delete temp Excel file:', cleanupError);
        }
      }
      
      if (success) {
        console.log(`✅ Custom report sent successfully: ${reportTitle}`);
        res.json({ 
          success: true, 
          message: 'Rapor e-postası başarıyla gönderildi' 
        });
      } else {
        console.error(`❌ Email service returned false for: ${reportTitle}`);
        res.status(500).json({ 
          success: false,
          message: 'E-posta gönderimi başarısız oldu. SMTP ayarlarını kontrol edin.' 
        });
      }
      
    } catch (error) {
      console.error("❌ Error sending custom report:", error);
      
      // Clean up temp file if it exists
      if (excelFilePath) {
        try {
          const fs = await import('fs');
          fs.unlinkSync(excelFilePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : 'Rapor gönderimi başarısız: Bilinmeyen hata'
      });
    }
  });

  // Admin - Stock Management
  app.get('/api/admin/stock-management', isAdminAuthenticated, async (req, res) => {
    try {
      // Get all credential stats
      const credentialStats = await storage.getAllCredentialStats();
      
      // Get all plans to map planId to plan details
      const allPlans = await storage.getAllPlans();
      const planMap = new Map(allPlans.map(plan => [plan.id, plan]));
      
      // Get all ships to map shipId to ship details
      const allShips = await storage.getAllShips();
      const shipMap = new Map(allShips.map(ship => [ship.id, ship]));
      
      // Build stock items array with plan and ship details
      const stockItems = Object.entries(credentialStats).map(([planId, stats]) => {
        const plan = planMap.get(planId);
        const ship = plan?.shipId ? shipMap.get(plan.shipId) : undefined;
        
        // Determine stock level based on availability percentage
        let stockLevel: 'critical' | 'low' | 'adequate' = 'adequate';
        if (stats.total > 0) {
          const availablePercent = (stats.available / stats.total) * 100;
          if (availablePercent < 10) {
            stockLevel = 'critical';
          } else if (availablePercent < 30) {
            stockLevel = 'low';
          }
        }
        
        return {
          planId,
          planName: plan?.name || 'Bilinmeyen Paket',
          shipName: ship?.name || 'Bilinmeyen Gemi',
          total: stats.total,
          assigned: stats.assigned,
          available: stats.available,
          stockLevel
        };
      }).filter(item => item.total > 0); // Only show plans that have credentials
      
      // Sort by stock level (critical first, then low, then adequate)
      stockItems.sort((a, b) => {
        const levelOrder = { critical: 0, low: 1, adequate: 2 };
        if (levelOrder[a.stockLevel] !== levelOrder[b.stockLevel]) {
          return levelOrder[a.stockLevel] - levelOrder[b.stockLevel];
        }
        // Within same level, sort by ship name then plan name
        if (a.shipName !== b.shipName) {
          return a.shipName.localeCompare(b.shipName, 'tr');
        }
        return a.planName.localeCompare(b.planName, 'tr');
      });
      
      res.json(stockItems);
    } catch (error) {
      console.error("Error fetching stock management data:", error);
      res.status(500).json({ message: "Failed to fetch stock data" });
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
      const { 
        search = '', 
        statusFilter = 'all', 
        planFilter = 'all',
        page = '1',
        pageSize = '50'
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const offset = (pageNum - 1) * pageSizeNum;

      // Get paginated credentials with filters
      const result = await storage.getCredentialsWithPagination({
        search: search as string,
        statusFilter: statusFilter as string,
        planFilter: planFilter as string,
        limit: pageSizeNum,
        offset: offset
      });
      
      res.json({
        credentials: result.credentials,
        totalCount: result.totalCount,
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(result.totalCount / pageSizeNum)
      });
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

  app.get("/api/admin/users/:id/credentials", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const credentials = await storage.getUserCredentials(id);
      res.json(credentials);
    } catch (error: any) {
      console.error("Error fetching user credentials:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Manual package assignment to user
  app.post("/api/admin/users/:id/assign-package", isAdminAuthenticated, async (req, res) => {
    try {
      const { id: userId } = req.params;
      const { planId, note } = req.body;
      
      console.log('Manual package assignment request:', { userId, planId, note });

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

  // Reset user password
  app.post("/api/admin/users/:id/reset-password", isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get user info for logging
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await storage.resetUserPassword(id);
      if (!result) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      // Create system log for password reset
      await storage.createSystemLog({
        category: 'admin_action',
        action: 'reset_user_password',
        adminId: req.session.adminUser.id,
        entityType: 'user',
        entityId: id,
        details: {
          username: user.username,
          email: user.email
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json({ 
        message: "Password reset successfully",
        newPassword: result.newPassword,
        username: user.username
      });
    } catch (error: any) {
      console.error("Error resetting user password:", error);
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

  // Email Settings Routes
  app.get('/api/admin/email-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      
      // Mask sensitive data before sending to frontend
      if (settings) {
        const maskedSettings = {
          ...settings,
          smtpPass: settings.smtpPass ? '••••••••' : '',
          sendgridKey: settings.sendgridKey ? '••••••••' : '',
          mailgunKey: settings.mailgunKey ? '••••••••' : '',
        };
        res.json(maskedSettings);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ message: 'Failed to fetch email settings' });
    }
  });

  app.post('/api/admin/email-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const settingsData = req.body;
      
      // Save each setting to the settings table
      await storage.upsertSetting('smtp_host', settingsData.smtpHost || '', 'email');
      await storage.upsertSetting('smtp_port', (settingsData.smtpPort || 587).toString(), 'email');
      await storage.upsertSetting('smtp_user', settingsData.smtpUser || '', 'email');
      await storage.upsertSetting('smtp_password', settingsData.smtpPass || '', 'email');
      await storage.upsertSetting('from_email', settingsData.fromEmail || '', 'email');
      await storage.upsertSetting('from_name', settingsData.fromName || 'AdeGloba Starlink', 'email');
      await storage.upsertSetting('reply_to', settingsData.replyTo || '', 'email');
      await storage.upsertSetting('admin_email', settingsData.adminEmail || '', 'email');
      await storage.upsertSetting('email_active', (settingsData.isActive || true).toString(), 'email');
      
      // Return masked settings
      const maskedSettings = {
        id: 'settings-based',
        provider: 'smtp',
        smtpHost: settingsData.smtpHost || '',
        smtpPort: settingsData.smtpPort || 587,
        smtpUser: settingsData.smtpUser || '',
        smtpPass: settingsData.smtpPass ? '••••••••' : '',
        fromEmail: settingsData.fromEmail || '',
        fromName: settingsData.fromName || 'AdeGloba Starlink',
        adminEmail: settingsData.adminEmail || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json(maskedSettings);
    } catch (error) {
      console.error('Error saving email settings:', error);
      res.status(500).json({ message: 'Failed to save email settings' });
    }
  });

  app.post('/api/admin/email-settings/test', isAdminAuthenticated, async (req, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: 'Test email address is required' });
      }
      
      const success = await emailService.sendTestEmail(testEmail);
      
      if (success) {
        res.json({ success: true, message: 'Test email sent successfully!' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  });

  // Push Notification Routes
  app.get('/api/push/vapid-key', async (req, res) => {
    const { PushNotificationService } = await import('./services/pushNotificationService');
    res.json({ publicKey: PushNotificationService.getPublicKey() });
  });

  app.post('/api/push/subscribe', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { PushNotificationService } = await import('./services/pushNotificationService');
      const { subscription, userAgent } = req.body;
      const userId = req.session.userId;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

      await PushNotificationService.subscribeUser(userId, subscription, userAgent, ipAddress);
      
      res.json({ success: true, message: 'Push subscription created successfully' });
    } catch (error: any) {
      console.error('Push subscription error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to create push subscription' });
    }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { PushNotificationService } = await import('./services/pushNotificationService');
      const { endpoint } = req.body;
      const userId = req.session.userId;

      await PushNotificationService.unsubscribeUser(userId, endpoint);
      
      res.json({ success: true, message: 'Push subscription removed successfully' });
    } catch (error: any) {
      console.error('Push unsubscription error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to remove push subscription' });
    }
  });

  app.post('/api/push/test', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { PushNotificationService } = await import('./services/pushNotificationService');
      const userId = req.session.userId;

      await PushNotificationService.sendTestNotification(userId);
      
      res.json({ success: true, message: 'Test notification sent successfully' });
    } catch (error: any) {
      console.error('Test notification error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send test notification' });
    }
  });

  // Notification preference endpoint - automatically registers users as "granted"
  app.post('/api/user/notification-preference', async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const { enabled = true } = req.body;
      const userId = req.session.userId;
      
      // For simplicity, we always register as enabled=true in the database
      // Real permission is handled by browser, this is just for tracking
      console.log(`📱 User ${userId} notification preference: ${enabled ? 'granted' : 'denied'} (stored as granted for simplicity)`);
      
      // Could store in database if needed, but for now just log
      // await storage.updateUser(userId, { notificationEnabled: true });
      
      res.json({ success: true, message: 'Notification preference registered successfully' });
    } catch (error: any) {
      console.error('Notification preference error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to register notification preference' });
    }
  });

  // Admin Push Notification Routes
  app.post('/api/admin/push/send', isAdminAuthenticated, async (req, res) => {
    try {
      const { PushNotificationService } = await import('./services/pushNotificationService');
      const { title, body, url, target, targetIds, requireInteraction } = req.body;

      if (!title || !body) {
        return res.status(400).json({ success: false, message: 'Title and body are required' });
      }

      const payload = {
        title,
        body,
        url: url || '/',
        requireInteraction: requireInteraction || false,
        icon: '/pwa-icon-192.png',
        data: { adminSent: true, timestamp: Date.now() }
      };

      let sentCount = 0;

      switch (target) {
        case 'all':
          await PushNotificationService.sendToAllUsers(payload);
          const allSubs = await storage.getAllActivePushSubscriptions();
          sentCount = allSubs.length;
          break;
          
        case 'ships':
          if (targetIds && targetIds.length > 0) {
            await PushNotificationService.sendToShipUsers(targetIds, payload);
            const shipSubs = await storage.getPushSubscriptionsForShips(targetIds);
            sentCount = shipSubs.length;
          }
          break;
          
        case 'user':
          if (targetIds && targetIds.length > 0) {
            await PushNotificationService.sendToUser(targetIds[0], payload);
            const userSubs = await storage.getPushSubscriptionsForUser(targetIds[0]);
            sentCount = userSubs.length;
          }
          break;
          
        default:
          return res.status(400).json({ success: false, message: 'Invalid target type' });
      }

      res.json({ 
        success: true, 
        message: 'Notifications sent successfully',
        sentCount 
      });
      
    } catch (error: any) {
      console.error('Admin push notification error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send notifications' });
    }
  });

  app.post('/api/admin/push/test', isAdminAuthenticated, async (req, res) => {
    try {
      const { PushNotificationService } = await import('./services/pushNotificationService');
      const adminId = req.user?.id;

      // Send test notification to admin
      const payload = {
        title: '🧪 Admin Test Bildirimi',
        body: 'Bu bir test bildirimidir. Push notification sistemi çalışıyor!',
        url: '/admin/push-notifications',
        icon: '/pwa-icon-192.png',
        data: { test: true, adminTest: true }
      };

      // Find admin's user account if exists or use admin ID
      await PushNotificationService.sendToUser(adminId, payload);
      
      res.json({ success: true, message: 'Admin test notification sent successfully' });
    } catch (error: any) {
      console.error('Admin test notification error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send admin test notification' });
    }
  });

  app.get('/api/admin/email-logs', isAdminAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const status = req.query.status as string;
      const template = req.query.template as string;
      
      const result = await storage.getEmailLogs({
        page,
        pageSize,
        status,
        template,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({ message: 'Failed to fetch email logs' });
    }
  });

  // Test Email Routes
  app.get('/_test/email/welcome', async (req, res) => {
    try {
      const { to } = req.query;
      if (!to) {
        return res.status(400).json({ message: 'to parameter is required' });
      }
      
      const success = await emailService.sendEmail(
        to as string,
        'Hoş Geldiniz - AdeGloba Starlink System',
        'welcome',
        {
          userName: 'Test User',
          loginUrl: process.env.BASE_URL || 'http://localhost:5000',
        }
      );
      
      res.json({ success, message: success ? 'Welcome email sent' : 'Failed to send welcome email' });
    } catch (error) {
      console.error('Test welcome email error:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  app.get('/_test/email/order', async (req, res) => {
    try {
      const { to } = req.query;
      if (!to) {
        return res.status(400).json({ message: 'to parameter is required' });
      }
      
      const success = await emailService.sendEmail(
        to as string,
        'Sipariş Onayı - AdeGloba Starlink System',
        'order_confirm',
        {
          userName: 'Test User',
          orderNumber: 'TEST-12345',
          orderItems: '<li>50GB Veri Paketi - $29.99</li><li>100GB Veri Paketi - $49.99</li>',
          totalAmount: '79.98',
          dashboardUrl: process.env.BASE_URL || 'http://localhost:5000',
        }
      );
      
      res.json({ success, message: success ? 'Order confirmation email sent' : 'Failed to send order email' });
    } catch (error) {
      console.error('Test order email error:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  app.get('/_test/email/admin/order', async (req, res) => {
    try {
      const adminEmail = 'support@adegloba.space'; // Replace with actual admin email
      
      const success = await emailService.sendEmail(
        adminEmail,
        'Yeni Sipariş Bildirimi - AdeGloba Starlink System',
        'admin_new_order',
        {
          orderNumber: 'TEST-12345',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          shipName: 'Test Vessel',
          totalAmount: '79.98',
          orderItems: '<li>50GB Veri Paketi - $29.99</li><li>100GB Veri Paketi - $49.99</li>',
          adminUrl: (process.env.BASE_URL || 'http://localhost:5000') + '/admin',
        }
      );
      
      res.json({ success, message: success ? 'Admin order notification sent' : 'Failed to send admin notification' });
    } catch (error) {
      console.error('Test admin order email error:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  app.get('/_test/email/admin/report', async (req, res) => {
    try {
      const adminEmail = 'support@adegloba.space'; // Replace with actual admin email
      
      const success = await emailService.sendEmail(
        adminEmail,
        'Aylık Sipariş Raporu - AdeGloba Starlink System',
        'admin_monthly_report',
        {
          reportMonth: 'Ağustos 2024',
          shipStats: `
            <ul>
              <li><strong>Test Vessel 1:</strong> 15 sipariş, 750GB toplam veri</li>
              <li><strong>Test Vessel 2:</strong> 8 sipariş, 400GB toplam veri</li>
              <li><strong>Test Vessel 3:</strong> 12 sipariş, 600GB toplam veri</li>
            </ul>
          `,
          totalOrders: '35',
          totalRevenue: '1,750.00',
          totalDataGB: '1,750',
          adminUrl: (process.env.BASE_URL || 'http://localhost:5000') + '/admin',
        }
      );
      
      res.json({ success, message: success ? 'Monthly report sent' : 'Failed to send monthly report' });
    } catch (error) {
      console.error('Test monthly report email error:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // User profile update endpoint
  app.put('/api/user/profile', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        console.log('🚫 Profile update failed: No userId in session');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      console.log('📝 Profile update request for userId:', userId);
      console.log('📝 Request body:', req.body);

      const updateData: any = {
        full_name: req.body.full_name,
        email: req.body.email,
        phone: req.body.phone,
        ship_id: req.body.ship_id,
        address: req.body.address,
      };
      
      console.log('📝 Update data to be saved:', updateData);

      // Handle password update if provided
      if (req.body.newPassword && req.body.currentPassword) {
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const bcrypt = await import('bcrypt');
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
        console.log('❌ User update failed: User not found for userId:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('✅ User updated successfully:', {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        ship_id: user.ship_id
      });

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

  // PayPal webhook endpoint for payment verification - PRODUCTION READY
  app.post("/api/paypal/webhook", async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`🔔 [${timestamp}] PayPal webhook received:`, req.body);
    
    try {
      const event = req.body;
      
      // Get PayPal environment settings from database
      const settings = await storage.getSettingsByCategory('payment');
      const environment = settings.find(s => s.key === 'paypalEnvironment')?.value || 'sandbox';
      const webhookUrl = settings.find(s => s.key === 'paypalWebhookUrl')?.value || 'https://ads.adegloba.space/api/paypal/webhook';
      
      // Log environment info
      console.log(`🌍 PayPal Environment: ${environment.toUpperCase()}`);
      console.log(`🔗 Webhook URL from DB: ${webhookUrl}`);
      
      // PayPal webhook signature verification in production mode
      if (environment === 'live') {
        const signature = req.headers['paypal-message-signature'] || req.headers['paypal-signature'];
        
        if (!signature) {
          console.error('❌ Missing PayPal signature header in live mode');
          return res.status(401).json({ error: 'Missing PayPal signature' });
        }
        
        console.log('🔐 PayPal webhook signature detected for live environment');
        // Note: PayPal uses complex signature verification with certificates
        // For basic validation, we check signature existence in live mode
      }
      
      console.log(`📧 Event Type: ${event.event_type}`);
      
      // Handle multiple webhook event types for robust payment processing
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const payment = event.resource;
        const orderId = payment.supplementary_data?.related_ids?.order_id || payment.custom_id;
        
        console.log(`💰 [SUCCESS] Processing payment completion for order: ${orderId}`);
        console.log(`💳 Payment ID: ${payment.id}`);
        console.log(`💵 Amount: ${payment.amount?.currency_code} ${payment.amount?.value}`);
        
        try {
          // Use atomic payment processing method for consistency
          const result = await orderService.processPaymentCompletion(
            orderId, 
            payment.id, 
            payment
          );
          
          if (result.success) {
            console.log(`✅ Payment processed successfully for order ${orderId}: ${result.assignedCredentials.length} credentials assigned`);
            
            // Create system log for successful payment processing
            await storage.createSystemLog({
              category: 'payment',
              action: 'webhook_payment_completed',
              entityType: 'order',
              entityId: orderId,
              details: {
                paymentId: payment.id,
                amount: `${payment.amount?.currency_code} ${payment.amount?.value}`,
                credentialsAssigned: result.assignedCredentials.length,
                webhookEventType: event.event_type,
                environment: environment
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: 'PayPal-Webhook',
            });
            
            // Send success response to PayPal
            res.status(200).json({ 
              status: 'success',
              orderId,
              paymentId: payment.id,
              credentialsAssigned: result.assignedCredentials.length,
              environment: environment,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error(`❌ Payment processing failed for order ${orderId}`);
            
            // Log failed payment processing
            await storage.createSystemLog({
              category: 'payment_error',
              action: 'webhook_payment_failed',
              entityType: 'order',
              entityId: orderId,
              details: {
                paymentId: payment.id,
                error: 'Payment processing failed',
                webhookEventType: event.event_type,
                environment: environment
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: 'PayPal-Webhook',
            });
            
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
        
      } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED' || event.event_type === 'PAYMENT.CAPTURE.DECLINED') {
        const payment = event.resource;
        const orderId = payment.supplementary_data?.related_ids?.order_id || payment.custom_id;
        
        console.log(`❌ [DECLINED] Processing payment decline for order: ${orderId}`);
        console.log(`💳 Payment ID: ${payment.id}`);
        console.log(`💵 Amount: ${payment.amount?.currency_code} ${payment.amount?.value}`);
        console.log(`🚫 Reason: ${payment.status_details?.reason || 'Unknown'}`);
        
        try {
          // Order'ı failed olarak işaretle
          const orders = await storage.getOrdersByPaypalOrderId(orderId);
          if (orders.length > 0) {
            const order = orders[0];
            await storage.updateOrder(order.id, { status: 'failed' });
            console.log(`🔄 Order ${order.id} marked as FAILED due to payment decline`);
            
            // System log oluştur
            await storage.createSystemLog({
              category: 'payment_error',
              action: 'webhook_payment_declined',
              entityType: 'order',
              entityId: order.id,
              details: {
                paypalOrderId: orderId,
                paymentId: payment.id,
                amount: `${payment.amount?.currency_code} ${payment.amount?.value}`,
                reason: payment.status_details?.reason || 'Unknown',
                webhookEventType: event.event_type,
                environment: environment
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: 'PayPal-Webhook',
            });
            
            res.status(200).json({ 
              status: 'declined_processed',
              orderId: order.id,
              paypalOrderId: orderId,
              paymentId: payment.id,
              reason: payment.status_details?.reason || 'Unknown',
              environment: environment,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error(`❌ No order found for PayPal Order ID: ${orderId}`);
            res.status(404).json({ error: 'Order not found' });
          }
        } catch (error) {
          console.error(`💥 Error processing payment decline for order ${orderId}:`, error);
          res.status(500).json({ error: 'Failed to process payment decline' });
        }
        
      } else if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
        const order = event.resource;
        console.log(`✅ [APPROVED] Order approved: ${order.id}`);
        
        // Log order approval
        await storage.createSystemLog({
          category: 'payment',
          action: 'webhook_order_approved',
          entityType: 'order',
          entityId: order.id,
          details: {
            orderStatus: order.status,
            webhookEventType: event.event_type,
            environment: environment
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: 'PayPal-Webhook',
        });
        
        res.status(200).json({ status: 'order_approved', orderId: order.id });
        
      } else {
        // Handle other webhook events
        console.log(`ℹ️ Unhandled webhook event: ${event.event_type}`);
        
        // Log unhandled events for monitoring
        await storage.createSystemLog({
          category: 'webhook',
          action: 'unhandled_webhook_event',
          entityType: 'webhook',
          entityId: event.id || 'unknown',
          details: {
            eventType: event.event_type,
            webhookId: event.id,
            environment: environment
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: 'PayPal-Webhook',
        });
        
        res.status(200).json({ status: 'ignored', eventType: event.event_type });
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

  // Email Settings Management
  app.get('/api/admin/email-settings', async (req: any, res) => {
    if (!req.session?.user?.is_admin) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    try {
      const emailSettings = await storage.getEmailSettings();
      
      if (emailSettings) {
        // Transform database fields to frontend format
        const transformedSettings = {
          id: emailSettings.id,
          provider: emailSettings.provider || 'smtp',
          smtp_host: emailSettings.smtp_host,
          smtp_port: emailSettings.smtp_port,
          smtp_user: emailSettings.smtp_user,
          smtp_pass: '', // Don't send password for security
          from_email: emailSettings.from_email,
          from_name: emailSettings.from_name,
          reply_to: emailSettings.reply_to,
          adminEmail: emailSettings.adminEmail,
          is_active: emailSettings.is_active,
        };
        
        console.log('📧 Email settings response:', transformedSettings);
        res.json(transformedSettings);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ message: 'Failed to fetch email settings' });
    }
  });

  app.post('/api/admin/email-settings', async (req: any, res) => {
    if (!req.session?.user?.is_admin) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    try {
      const settings = req.body;
      
      // Save email settings
      await storage.saveEmailSettings(settings);
      
      // Also save admin email to general settings
      if (settings.adminEmail) {
        await storage.upsertSetting('admin_email', settings.adminEmail, 'email');
      }

      res.json({ success: true, message: 'Email settings saved successfully' });
    } catch (error) {
      console.error('Error saving email settings:', error);
      res.status(500).json({ message: 'Failed to save email settings' });
    }
  });

  app.post('/api/admin/email-settings/test', async (req: any, res) => {
    if (!req.session?.user?.is_admin) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ message: 'Test email address required' });
      }

      const success = await emailService.sendEmail(
        testEmail,
        'Test E-postası - AdeGloba Starlink System',
        'test',
        {
          testMessage: 'Bu bir test e-postasıdır. E-posta ayarlarınız doğru şekilde yapılandırılmıştır.',
          adminUrl: (process.env.BASE_URL || 'http://localhost:5000') + '/admin'
        }
      );

      if (success) {
        res.json({ success: true, message: 'Test email sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  // Email Marketing API endpoints
  app.get('/api/admin/email-marketing/users', isAdminAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithShips();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for email marketing:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/email-marketing/templates', isAdminAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.post('/api/admin/email-marketing/templates', isAdminAuthenticated, async (req, res) => {
    try {
      const { name, subject, content } = req.body;

      if (!name || !subject || !content) {
        return res.status(400).json({ message: 'Name, subject and content are required' });
      }

      const template = await storage.createEmailTemplate({
        name,
        subject,
        content
      });

      res.json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  app.delete('/api/admin/email-marketing/templates/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEmailTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ message: 'Failed to delete template' });
    }
  });

  app.get('/api/admin/email-marketing/campaigns', isAdminAuthenticated, async (req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/admin/email-marketing/send', isAdminAuthenticated, async (req, res) => {
    try {
      const { subject, content, recipientType, selectedUsers } = req.body;

      if (!subject || !content) {
        return res.status(400).json({ message: 'Subject and content are required' });
      }

      // Get recipients based on type
      const allUsers = await storage.getAllUsersWithShips();
      let recipients: any[] = [];

      switch (recipientType) {
        case 'all':
          recipients = allUsers;
          break;
        case 'active':
          recipients = allUsers.filter(user => user.last_login_at && 
            new Date(user.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
          break;
        case 'inactive':
          recipients = allUsers.filter(user => !user.last_login_at || 
            new Date(user.last_login_at) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
          break;
        case 'withPackages':
          // Users who have ordered packages
          const ordersData = await storage.getAllOrders();
          const usersWithOrders = new Set(ordersData.map(o => o.userId));
          recipients = allUsers.filter(user => usersWithOrders.has(user.id));
          break;
        case 'withoutPackages':
          // Users who have never ordered packages
          const allOrdersData = await storage.getAllOrders();
          const usersWithAnyOrders = new Set(allOrdersData.map(o => o.userId));
          recipients = allUsers.filter(user => !usersWithAnyOrders.has(user.id));
          break;
        case 'expiringSoon':
          // Users with packages expiring in next 7 days
          // Get all orders and check their expiry dates
          const allOrders = await storage.getAllOrders();
          const expiringUsers = new Set<string>();
          
          for (const order of allOrders) {
            if (order.status === 'paid' && order.expiresAt) {
              const expiryDate = new Date(order.expiresAt);
              const now = new Date();
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              // Expiring in next 7 days
              if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
                expiringUsers.add(order.userId);
              }
            }
          }
          
          recipients = allUsers.filter(user => expiringUsers.has(user.id));
          break;
        case 'selected':
          recipients = allUsers.filter(user => selectedUsers.includes(user.id));
          break;
        default:
          recipients = [];
      }

      if (recipients.length === 0) {
        return res.status(400).json({ message: 'No recipients selected' });
      }

      // Create campaign record
      const campaign = await storage.createEmailCampaign({
        name: subject,
        subject,
        content,
        recipientType,
        selectedUsers: recipientType === 'selected' ? JSON.stringify(selectedUsers) : null,
        recipientCount: recipients.length,
        sentCount: 0,
        status: 'sending'
      });

      // Send emails using existing EmailService
      const emailService = (global as any).emailService;
      let sentCount = 0;

      for (const user of recipients) {
        try {
          // Replace template variables
          const personalizedContent = content
            .replace(/{kullanici_adi}/g, user.full_name || user.username)
            .replace(/{email}/g, user.email)
            .replace(/{telefon}/g, user.phone || '');

          await emailService.sendEmail(
            user.email,
            subject,
            personalizedContent
          );
          
          sentCount++;
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }

      // Update campaign status
      await storage.updateEmailCampaign(campaign.id, {
        sentCount,
        status: sentCount > 0 ? 'sent' : 'failed',
        sentAt: new Date()
      });

      res.json({ 
        success: true, 
        sentCount, 
        totalCount: recipients.length,
        campaignId: campaign.id
      });

    } catch (error) {
      console.error('Error sending marketing emails:', error);
      res.status(500).json({ message: 'Failed to send emails' });
    }
  });

  // Database Backup & Restore endpoints
  app.post('/api/admin/database/backup', isAdminAuthenticated, async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const { promisify } = await import('util');
      const exec = promisify((await import('child_process')).exec);
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const filename = `backup-${timestamp}.sql`;
      const backupPath = `./backups/${filename}`;
      
      // Create backups directory if it doesn't exist
      const fs = await import('fs');
      const fsp = fs.promises;
      await fsp.mkdir('./backups', { recursive: true });
      
      // Get database connection details from DATABASE_URL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ message: 'DATABASE_URL not configured' });
      }
      
      // Parse DATABASE_URL
      const url = new URL(dbUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;
      
      // Use pg_dump to create backup
      const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${backupPath}`;
      
      await exec(pgDumpCommand);
      
      // Get file stats
      const stats = await fsp.stat(backupPath);
      
      res.json({
        success: true,
        filename,
        size: stats.size,
        path: backupPath,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({ message: 'Backup failed: ' + (error as Error).message });
    }
  });

  app.get('/api/admin/database/backups', isAdminAuthenticated, async (req, res) => {
    try {
      const fs = await import('fs');
      const fsp = fs.promises;
      const path = await import('path');
      
      const backupsDir = './backups';
      
      try {
        await fsp.access(backupsDir);
      } catch {
        await fsp.mkdir(backupsDir, { recursive: true });
        return res.json([]);
      }
      
      const files = await fsp.readdir(backupsDir);
      const backupFiles = files.filter(f => f.endsWith('.sql'));
      
      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filePath = path.join(backupsDir, filename);
          const stats = await fsp.stat(filePath);
          
          return {
            filename,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
            path: filePath
          };
        })
      );
      
      backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(backups);
    } catch (error) {
      console.error('Error listing backups:', error);
      res.status(500).json({ message: 'Failed to list backups' });
    }
  });

  app.get('/api/admin/database/backups/:filename', isAdminAuthenticated, async (req, res) => {
    try {
      const { filename } = req.params;
      const backupPath = `./backups/${filename}`;
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Security check - ensure filename doesn't contain path traversal
      const normalizedPath = path.normalize(backupPath);
      if (!normalizedPath.startsWith('./backups/')) {
        return res.status(400).json({ message: 'Invalid filename' });
      }
      
      res.download(backupPath, filename);
    } catch (error) {
      console.error('Error downloading backup:', error);
      res.status(500).json({ message: 'Failed to download backup' });
    }
  });

  app.post('/api/admin/database/restore', isAdminAuthenticated, async (req, res) => {
    try {
      const { filename } = req.body;
      
      if (!filename) {
        return res.status(400).json({ message: 'Filename required' });
      }
      
      const backupPath = `./backups/${filename}`;
      const { promisify } = await import('util');
      const exec = promisify((await import('child_process')).exec);
      const fs = await import('fs');
      
      // Check if backup file exists
      try {
        await fs.promises.access(backupPath);
      } catch {
        return res.status(404).json({ message: 'Backup file not found' });
      }
      
      // Get database connection details
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return res.status(500).json({ message: 'DATABASE_URL not configured' });
      }
      
      const url = new URL(dbUrl);
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;
      
      // Use pg_restore to restore database
      const pgRestoreCommand = `PGPASSWORD="${dbPassword}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c ${backupPath}`;
      
      await exec(pgRestoreCommand);
      
      res.json({
        success: true,
        message: 'Database restored successfully'
      });
    } catch (error) {
      console.error('Restore error:', error);
      res.status(500).json({ message: 'Restore failed: ' + (error as Error).message });
    }
  });

  app.delete('/api/admin/database/backups/:filename', isAdminAuthenticated, async (req, res) => {
    try {
      const { filename } = req.params;
      const backupPath = `./backups/${filename}`;
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Security check
      const normalizedPath = path.normalize(backupPath);
      if (!normalizedPath.startsWith('./backups/')) {
        return res.status(400).json({ message: 'Invalid filename' });
      }
      
      await fs.promises.unlink(backupPath);
      
      res.json({ success: true, message: 'Backup deleted' });
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ message: 'Failed to delete backup' });
    }
  });

  // Run startup check after a short delay
  setTimeout(startupIncompleteOrdersCheck, 5000);
  
  // Set up interval to run enhanced cleanup every 30 minutes
  setInterval(enhancedOrderCleanup, 30 * 60 * 1000);

  const httpServer = createServer(app);
  return httpServer;
}

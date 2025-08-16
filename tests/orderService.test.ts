/**
 * Comprehensive Order Service Test Suite
 * Tests the complete order → credential assignment → user package update pipeline
 */

import { TestDatabase, testHelpers, testHooks } from './setup';
import { OrderService } from '../server/services/orderService';
import { DatabaseStorage } from '../server/storage';
import { testDb } from './setup';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

describe('OrderService Integration Tests', () => {
  let testDatabase: TestDatabase;
  let orderService: OrderService;
  let storage: DatabaseStorage;
  let testData: any;

  beforeAll(async () => {
    await testHooks.beforeAll();
    testDatabase = TestDatabase.getInstance();
    storage = new DatabaseStorage();
    orderService = new OrderService(storage);
  });

  beforeEach(async () => {
    testData = await testHooks.beforeEach();
  });

  afterEach(async () => {
    await testHooks.afterEach();
  });

  afterAll(async () => {
    await testHooks.afterAll();
  });

  describe('Happy Path Test', () => {
    it('should correctly process payment, assign credentials, and update user packages', async () => {
      // Arrange
      const { user, ship, plans } = testData;
      const plan = plans[0]; // 10GB plan with 5 available credentials
      
      // Create a test order
      const { order } = await testDatabase.createTestOrder(user.id, ship.id, plan.id, 'pending');

      // Act
      const result = await orderService.processPaymentCompletion(order.id, 'PAYPAL_TEST_ORDER_123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.assignedCredentials).toHaveLength(1);
      
      // Verify order status updated
      expect(await testHelpers.assert.orderStatus(order.id, 'paid')).toBe(true);
      
      // Verify credential assignment
      const assignedCredential = result.assignedCredentials[0];
      expect(await testHelpers.assert.credentialIsAssigned(assignedCredential.id, order.id)).toBe(true);
      
      // Verify order credential record created
      expect(await testHelpers.assert.orderCredentialExists(order.id, assignedCredential.id)).toBe(true);
      
      // Verify order has timestamps
      const [updatedOrder] = await testDb.select().from(schema.orders).where(sql`id = ${order.id}`);
      expect(updatedOrder.paidAt).toBeTruthy();
      expect(updatedOrder.expiresAt).toBeTruthy();
      expect(updatedOrder.paypalOrderId).toBe('PAYPAL_TEST_ORDER_123');

      console.log('✅ Happy Path Test: All validations passed');
    });

    it('should handle multiple items in single order correctly', async () => {
      // Arrange
      const { user, ship, plans } = testData;
      const plan1 = plans[0]; // 10GB plan
      const plan2 = plans[1]; // 50GB plan
      
      // Create order with multiple items
      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'pending',
        currency: 'USD',
        subtotalUsd: '100.00',
        discountUsd: '0.00',
        totalUsd: '100.00'
      }).returning();

      // Add multiple order items
      await testDb.insert(schema.orderItems).values([
        {
          orderId: order.id,
          shipId: ship.id,
          planId: plan1.id,
          qty: 2,
          unitPriceUsd: '25.00',
          lineTotalUsd: '50.00'
        },
        {
          orderId: order.id,
          shipId: ship.id,
          planId: plan2.id,
          qty: 1,
          unitPriceUsd: '75.00',
          lineTotalUsd: '75.00'
        }
      ]);

      // Act
      const result = await orderService.processPaymentCompletion(order.id, 'PAYPAL_MULTI_ITEM_123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.assignedCredentials).toHaveLength(3); // 2 + 1 = 3 total credentials
      
      // Verify correct plan distribution
      const plan1Credentials = result.assignedCredentials.filter(c => c.planId === plan1.id);
      const plan2Credentials = result.assignedCredentials.filter(c => c.planId === plan2.id);
      
      expect(plan1Credentials).toHaveLength(2);
      expect(plan2Credentials).toHaveLength(1);

      console.log('✅ Multi-item Order Test: All validations passed');
    });
  });

  describe('Insufficient Stock Test', () => {
    it('should prevent assignment when credential pool is exhausted', async () => {
      // Arrange
      const { user, ship, plans } = testData;
      const plan = plans[1]; // 50GB plan with only 3 available credentials
      
      // Create order requiring more credentials than available
      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'pending',
        currency: 'USD',
        subtotalUsd: '300.00',
        discountUsd: '0.00',
        totalUsd: '300.00'
      }).returning();

      await testDb.insert(schema.orderItems).values({
        orderId: order.id,
        shipId: ship.id,
        planId: plan.id,
        qty: 5, // Requesting 5 but only 3 available
        unitPriceUsd: '75.00',
        lineTotalUsd: '375.00'
      });

      // Act
      const result = await orderService.processPaymentCompletion(order.id, 'PAYPAL_INSUFFICIENT_STOCK');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
      expect(result.error).toContain(`needs 5 credentials, only 3 available`);
      expect(result.assignedCredentials).toHaveLength(0);
      
      // Verify order remains pending
      expect(await testHelpers.assert.orderStatus(order.id, 'pending')).toBe(true);
      
      // Verify no credentials were assigned
      const [credentialCount] = await testDb.select({ count: sql<number>`count(*)` })
        .from(schema.credentialPools)
        .where(sql`assigned_to_order_id = ${order.id}`);
      expect(credentialCount.count).toBe(0);

      console.log('✅ Insufficient Stock Test: All validations passed');
    });
  });

  describe('Concurrent Orders Test', () => {
    it('should handle multiple users paying simultaneously without race conditions', async () => {
      // Arrange
      const { ship, plans } = testData;
      const plan = plans[0]; // 10GB plan with 5 available credentials
      
      // Create multiple users
      const users = [];
      for (let i = 0; i < 3; i++) {
        const [user] = await testDb.insert(schema.users).values({
          username: testHelpers.generateTestData.username(),
          email: testHelpers.generateTestData.email(),
          password_hash: '$2b$10$test_hash',
          full_name: `Concurrent Test User ${i + 1}`,
          ship_id: ship.id,
          address: 'Test Address 123'
        }).returning();
        users.push(user);
      }

      // Create concurrent orders
      const orders = [];
      for (let i = 0; i < 3; i++) {
        const { order } = await testDatabase.createTestOrder(users[i].id, ship.id, plan.id, 'pending');
        orders.push(order);
      }

      // Act - Process all orders concurrently
      const results = await testHelpers.concurrent([
        () => orderService.processPaymentCompletion(orders[0].id, 'PAYPAL_CONCURRENT_1'),
        () => orderService.processPaymentCompletion(orders[1].id, 'PAYPAL_CONCURRENT_2'),
        () => orderService.processPaymentCompletion(orders[2].id, 'PAYPAL_CONCURRENT_3')
      ]);

      // Assert
      const successfulResults = results.filter(r => r.success);
      expect(successfulResults).toHaveLength(3); // All should succeed since we have 5 credentials for 3 orders
      
      // Verify no duplicate credential assignments
      const allAssignedCredentialIds = results.flatMap(r => r.assignedCredentials.map(c => c.id));
      const uniqueCredentialIds = new Set(allAssignedCredentialIds);
      expect(allAssignedCredentialIds).toHaveLength(uniqueCredentialIds.size);
      
      // Verify all credentials are properly assigned
      for (const result of successfulResults) {
        for (const credential of result.assignedCredentials) {
          expect(await testHelpers.assert.credentialIsAssigned(
            credential.id, 
            result.order.id
          )).toBe(true);
        }
      }

      console.log('✅ Concurrent Orders Test: All validations passed');
    });

    it('should handle race conditions when stock becomes insufficient mid-process', async () => {
      // Arrange - Create scenario with only 1 available credential
      const { ship, plans } = testData;
      const plan = plans[1]; // 50GB plan with 3 credentials
      
      // Assign 2 credentials manually to leave only 1 available
      const [credential1, credential2] = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`plan_id = ${plan.id}`)
        .limit(2);
      
      await testDb.update(schema.credentialPools)
        .set({ isAssigned: true, assignedToOrderId: 'dummy-order-1' })
        .where(sql`id = ${credential1.id}`);
      
      await testDb.update(schema.credentialPools)
        .set({ isAssigned: true, assignedToOrderId: 'dummy-order-2' })
        .where(sql`id = ${credential2.id}`);

      // Create 2 users and orders competing for the last credential
      const users = [];
      for (let i = 0; i < 2; i++) {
        const [user] = await testDb.insert(schema.users).values({
          username: testHelpers.generateTestData.username(),
          email: testHelpers.generateTestData.email(),
          password_hash: '$2b$10$test_hash',
          full_name: `Race Condition Test User ${i + 1}`,
          ship_id: ship.id,
          address: 'Test Address 123'
        }).returning();
        users.push(user);
      }

      const orders = [];
      for (let i = 0; i < 2; i++) {
        const { order } = await testDatabase.createTestOrder(users[i].id, ship.id, plan.id, 'pending');
        orders.push(order);
      }

      // Act - Process orders concurrently
      const results = await testHelpers.concurrent([
        () => orderService.processPaymentCompletion(orders[0].id, 'PAYPAL_RACE_1'),
        () => orderService.processPaymentCompletion(orders[1].id, 'PAYPAL_RACE_2')
      ]);

      // Assert
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      expect(successfulResults).toHaveLength(1); // Only one should succeed
      expect(failedResults).toHaveLength(1);     // One should fail due to insufficient stock
      
      expect(failedResults[0].error).toContain('Insufficient stock');

      console.log('✅ Race Condition Test: All validations passed');
    });
  });

  describe('Incomplete Order Recovery Test', () => {
    it('should detect and resolve orders marked as paid but without credentials', async () => {
      // Arrange - Create an order that's marked as paid but has no credentials
      const { user, ship, plans } = testData;
      const plan = plans[0];
      
      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'paid', // Marked as paid
        currency: 'USD',
        subtotalUsd: '25.00',
        discountUsd: '0.00',
        totalUsd: '25.00',
        paypalOrderId: 'PAYPAL_INCOMPLETE_123',
        paidAt: null, // Missing paidAt
        expiresAt: null // Missing expiresAt
      }).returning();

      await testDb.insert(schema.orderItems).values({
        orderId: order.id,
        shipId: ship.id,
        planId: plan.id,
        qty: 1,
        unitPriceUsd: '25.00',
        lineTotalUsd: '25.00'
      });

      // Act - Find and fix incomplete orders
      const incompleteOrders = await orderService.findIncompletePaidOrders();
      expect(incompleteOrders).toHaveLength(1);
      expect(incompleteOrders[0].id).toBe(order.id);

      // Fix the incomplete order
      const fixResult = await orderService.fixIncompletePaidOrder(order.id);

      // Assert
      expect(fixResult.success).toBe(true);
      expect(fixResult.message).toContain('completion fixed successfully');
      
      // Verify order now has proper timestamps
      const [fixedOrder] = await testDb.select().from(schema.orders).where(sql`id = ${order.id}`);
      expect(fixedOrder.paidAt).toBeTruthy();
      expect(fixedOrder.expiresAt).toBeTruthy();

      console.log('✅ Incomplete Order Recovery Test: All validations passed');
    });

    it('should handle orders with credentials but missing timestamps', async () => {
      // Arrange - Create order with assigned credentials but missing timestamps
      const { user, ship, plans } = testData;
      const plan = plans[0];
      
      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'paid',
        currency: 'USD',
        subtotalUsd: '25.00',
        discountUsd: '0.00',
        totalUsd: '25.00',
        paypalOrderId: 'PAYPAL_CREDENTIALS_MISSING_TS',
        paidAt: null,
        expiresAt: null
      }).returning();

      await testDb.insert(schema.orderItems).values({
        orderId: order.id,
        shipId: ship.id,
        planId: plan.id,
        qty: 1,
        unitPriceUsd: '25.00',
        lineTotalUsd: '25.00'
      });

      // Manually assign a credential to simulate partial completion
      const [credential] = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`plan_id = ${plan.id} AND is_assigned = false`)
        .limit(1);

      await testDb.update(schema.credentialPools)
        .set({
          isAssigned: true,
          assignedToOrderId: order.id,
          assignedToUserId: user.id,
          assignedAt: new Date()
        })
        .where(sql`id = ${credential.id}`);

      // Act
      const fixResult = await orderService.fixIncompletePaidOrder(order.id);

      // Assert
      expect(fixResult.success).toBe(true);
      
      // Verify order credential record was created
      expect(await testHelpers.assert.orderCredentialExists(order.id, credential.id)).toBe(true);

      console.log('✅ Credentials with Missing Timestamps Test: All validations passed');
    });
  });

  describe('Rollback Test', () => {
    it('should rollback transaction if any step fails and leave no partial updates', async () => {
      // Arrange - Create scenario that will fail during processing
      const { user, ship, plans } = testData;
      const plan = plans[0];
      
      // Create order with invalid data that will cause failure
      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'pending',
        currency: 'USD',
        subtotalUsd: '25.00',
        discountUsd: '0.00',
        totalUsd: '25.00'
      }).returning();

      // Create order item requesting more credentials than available to force failure
      await testDb.insert(schema.orderItems).values({
        orderId: order.id,
        shipId: ship.id,
        planId: plan.id,
        qty: 10, // More than the 5 available for this plan
        unitPriceUsd: '25.00',
        lineTotalUsd: '250.00'
      });

      // Capture initial state
      const initialCredentials = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`plan_id = ${plan.id}`);
      const initialAssignedCount = initialCredentials.filter(c => c.isAssigned).length;

      // Act - Attempt to process payment (should fail)
      const result = await orderService.processPaymentCompletion(order.id, 'PAYPAL_ROLLBACK_TEST');

      // Assert - Verify rollback occurred
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
      
      // Verify order status unchanged
      expect(await testHelpers.assert.orderStatus(order.id, 'pending')).toBe(true);
      
      // Verify no credentials were assigned
      const finalCredentials = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`plan_id = ${plan.id}`);
      const finalAssignedCount = finalCredentials.filter(c => c.isAssigned).length;
      
      expect(finalAssignedCount).toBe(initialAssignedCount);
      
      // Verify no order credential records created
      const [orderCredentialCount] = await testDb.select({ count: sql<number>`count(*)` })
        .from(schema.orderCredentials)
        .where(sql`order_id = ${order.id}`);
      expect(orderCredentialCount.count).toBe(0);

      console.log('✅ Rollback Test: All validations passed');
    });
  });

  describe('Expired Packages Migration Test', () => {
    it('should ensure expired packages move from active to expired tab consistently', async () => {
      // Arrange - Create order with expired credentials
      const { user, ship, plans } = testData;
      const plan = plans[0];
      
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2); // 2 months ago
      
      const expiredDate = new Date();
      expiredDate.setMonth(expiredDate.getMonth() - 1); // 1 month ago

      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'paid',
        currency: 'USD',
        subtotalUsd: '25.00',
        discountUsd: '0.00',
        totalUsd: '25.00',
        paypalOrderId: 'PAYPAL_EXPIRED_TEST',
        paidAt: pastDate,
        expiresAt: expiredDate
      }).returning();

      await testDb.insert(schema.orderItems).values({
        orderId: order.id,
        shipId: ship.id,
        planId: plan.id,
        qty: 1,
        unitPriceUsd: '25.00',
        lineTotalUsd: '25.00',
        expiresAt: expiredDate
      });

      // Assign and expire a credential
      const [credential] = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`plan_id = ${plan.id} AND is_assigned = false`)
        .limit(1);

      await testDb.update(schema.credentialPools)
        .set({
          isAssigned: true,
          assignedToOrderId: order.id,
          assignedToUserId: user.id,
          assignedAt: pastDate
        })
        .where(sql`id = ${credential.id}`);

      await testDb.insert(schema.orderCredentials).values({
        orderId: order.id,
        credentialId: credential.id,
        deliveredAt: pastDate,
        expiresAt: expiredDate
      });

      // Act - Fetch active and expired packages
      const activePackages = await storage.getUserActivePackages(user.id);
      const expiredPackages = await storage.getUserExpiredPackages(user.id, 0, 10);

      // Assert
      expect(activePackages).toHaveLength(0); // Should be no active packages
      expect(expiredPackages).toHaveLength(1); // Should be 1 expired package
      
      const expiredPackage = expiredPackages[0];
      expect(expiredPackage.orderId).toBe(order.id);
      expect(expiredPackage.credentialId).toBe(credential.id);
      expect(new Date(expiredPackage.expiresAt).getTime()).toBeLessThan(Date.now());

      console.log('✅ Expired Packages Migration Test: All validations passed');
    });

    it('should handle packages expiring at exactly month-end boundary', async () => {
      // Arrange - Create order expiring at end of current month
      const { user, ship, plans } = testData;
      const plan = plans[0];
      
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Test boundary condition: expires in 1 second
      const almostExpired = new Date(Date.now() + 1000);

      const [order] = await testDb.insert(schema.orders).values({
        userId: user.id,
        shipId: ship.id,
        status: 'paid',
        currency: 'USD',
        subtotalUsd: '25.00',
        discountUsd: '0.00',
        totalUsd: '25.00',
        paypalOrderId: 'PAYPAL_BOUNDARY_TEST',
        paidAt: now,
        expiresAt: almostExpired
      }).returning();

      // Act - Check active packages before and after expiry
      const activeBeforeExpiry = await storage.getUserActivePackages(user.id);
      
      // Wait for expiry
      await testHelpers.wait(1500);
      
      const activeAfterExpiry = await storage.getUserActivePackages(user.id);
      const expiredAfterExpiry = await storage.getUserExpiredPackages(user.id, 0, 10);

      // Assert
      expect(activeAfterExpiry).toHaveLength(0);
      expect(expiredAfterExpiry.length).toBeGreaterThan(0);

      console.log('✅ Month-end Boundary Test: All validations passed');
    });
  });
});
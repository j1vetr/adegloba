/**
 * Test Infrastructure Setup
 * Provides isolated test database environment with transactional rollback
 */

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

// Test database connection
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for testing');
}

export const testPool = new Pool({ connectionString: TEST_DATABASE_URL });
export const testDb = drizzle({ client: testPool, schema });

/**
 * Test utility class for managing test database state
 */
export class TestDatabase {
  private static instance: TestDatabase;
  private transactions: any[] = [];

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  /**
   * Start a new test transaction that can be rolled back
   */
  async beginTransaction() {
    const transaction = await testDb.transaction(async (tx) => {
      this.transactions.push(tx);
      return tx;
    });
    return transaction;
  }

  /**
   * Rollback all test transactions
   */
  async rollbackTransactions() {
    for (const tx of this.transactions) {
      try {
        await tx.rollback();
      } catch (error) {
        console.warn('Failed to rollback transaction:', error);
      }
    }
    this.transactions = [];
  }

  /**
   * Clean all test data (use with caution)
   */
  async cleanTestData() {
    await testDb.execute(sql`TRUNCATE TABLE 
      order_credentials, 
      order_items, 
      orders, 
      credential_pools, 
      plans, 
      ships, 
      users, 
      admin_users, 
      coupons, 
      cart_items, 
      coupon_usage,
      settings,
      system_logs,
      tickets,
      ticket_messages,
      ticket_attachments
      RESTART IDENTITY CASCADE`);
  }

  /**
   * Seed basic test data
   */
  async seedTestData() {
    // Create test admin user
    const [adminUser] = await testDb.insert(schema.admin_users).values({
      username: 'test_admin',
      password_hash: '$2b$10$test_hash',
      role: 'admin'
    }).returning();

    // Create test ship
    const [ship] = await testDb.insert(schema.ships).values({
      name: 'Test Ship',
      slug: 'test-ship',
      kitNumber: 'KIT001',
      isActive: true
    }).returning();

    // Create test plans
    const [plan1] = await testDb.insert(schema.plans).values({
      shipId: ship.id,
      name: 'Test Plan 10GB',
      description: 'Test plan with 10GB data',
      dataLimitGb: 10,
      priceUsd: '25.00',
      isActive: true,
      sortOrder: 1
    }).returning();

    const [plan2] = await testDb.insert(schema.plans).values({
      shipId: ship.id,
      name: 'Test Plan 50GB',
      description: 'Test plan with 50GB data',
      dataLimitGb: 50,
      priceUsd: '75.00',
      isActive: true,
      sortOrder: 2
    }).returning();

    // Create test user
    const [user] = await testDb.insert(schema.users).values({
      username: 'test_user',
      email: 'test@example.com',
      password_hash: '$2b$10$test_hash',
      full_name: 'Test User',
      ship_id: ship.id,
      address: 'Test Address 123'
    }).returning();

    // Create credential pools for testing
    const credentials = [];
    for (let i = 1; i <= 5; i++) {
      const [credential] = await testDb.insert(schema.credentialPools).values({
        planId: plan1.id,
        username: `test_user_${i}`,
        password: `test_pass_${i}`,
        isAssigned: false
      }).returning();
      credentials.push(credential);
    }

    for (let i = 1; i <= 3; i++) {
      const [credential] = await testDb.insert(schema.credentialPools).values({
        planId: plan2.id,
        username: `test_user_premium_${i}`,
        password: `test_pass_premium_${i}`,
        isAssigned: false
      }).returning();
      credentials.push(credential);
    }

    return {
      adminUser,
      ship,
      plans: [plan1, plan2],
      user,
      credentials
    };
  }

  /**
   * Create test order for testing purposes
   */
  async createTestOrder(userId: string, shipId: string, planId: string, status: string = 'pending') {
    const [order] = await testDb.insert(schema.orders).values({
      userId,
      shipId,
      status,
      currency: 'USD',
      subtotalUsd: '25.00',
      discountUsd: '0.00',
      totalUsd: '25.00'
    }).returning();

    const [orderItem] = await testDb.insert(schema.orderItems).values({
      orderId: order.id,
      shipId,
      planId,
      qty: 1,
      unitPriceUsd: '25.00',
      lineTotalUsd: '25.00'
    }).returning();

    return { order, orderItem };
  }

  /**
   * Close test database connections
   */
  async close() {
    await testPool.end();
  }
}

/**
 * Test helper functions
 */
export const testHelpers = {
  /**
   * Wait for a specified amount of time (for testing timing-sensitive operations)
   */
  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Execute multiple async operations concurrently
   */
  async concurrent<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(operations.map(op => op()));
  },

  /**
   * Generate random test data
   */
  generateTestData: {
    email: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
    username: () => `test_user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    shipName: () => `Test Ship ${Date.now()}`,
    planName: () => `Test Plan ${Date.now()}`
  },

  /**
   * Assert helper for test expectations
   */
  assert: {
    async orderExists(orderId: string): Promise<boolean> {
      const [order] = await testDb.select().from(schema.orders).where(sql`id = ${orderId}`);
      return !!order;
    },

    async credentialIsAssigned(credentialId: string, orderId: string): Promise<boolean> {
      const [credential] = await testDb.select()
        .from(schema.credentialPools)
        .where(sql`id = ${credentialId} AND assigned_to_order_id = ${orderId} AND is_assigned = true`);
      return !!credential;
    },

    async orderCredentialExists(orderId: string, credentialId: string): Promise<boolean> {
      const [orderCredential] = await testDb.select()
        .from(schema.orderCredentials)
        .where(sql`order_id = ${orderId} AND credential_id = ${credentialId}`);
      return !!orderCredential;
    },

    async orderStatus(orderId: string, expectedStatus: string): Promise<boolean> {
      const [order] = await testDb.select().from(schema.orders).where(sql`id = ${orderId}`);
      return order?.status === expectedStatus;
    }
  }
};

/**
 * Setup and teardown hooks for tests
 */
export const testHooks = {
  async beforeAll() {
    console.log('🧪 Setting up test database...');
    const testDb = TestDatabase.getInstance();
    await testDb.cleanTestData();
    console.log('✅ Test database ready');
  },

  async beforeEach() {
    const testDb = TestDatabase.getInstance();
    await testDb.cleanTestData();
    return await testDb.seedTestData();
  },

  async afterEach() {
    const testDb = TestDatabase.getInstance();
    await testDb.rollbackTransactions();
  },

  async afterAll() {
    const testDb = TestDatabase.getInstance();
    await testDb.close();
    console.log('🧪 Test database closed');
  }
};
import { DatabaseStorage } from '../storage';
import { db } from '../db';
import { orders } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

export class OrderCancelService {
  private storage: DatabaseStorage;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Cancels pending orders that are older than 20 minutes
   */
  async cancelExpiredPendingOrders(): Promise<number> {
    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      
      // Find pending orders older than 20 minutes
      const expiredOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.status, 'pending'),
            lt(orders.createdAt, twentyMinutesAgo)
          )
        );

      if (expiredOrders.length === 0) {
        console.log('🔄 Order auto-cancel: No expired pending orders found');
        return 0;
      }

      // Update expired orders to cancelled status
      const result = await db
        .update(orders)
        .set({ 
          status: 'cancelled'
        })
        .where(
          and(
            eq(orders.status, 'pending'),
            lt(orders.createdAt, twentyMinutesAgo)
          )
        );

      const cancelledCount = result.rowCount || 0;
      
      if (cancelledCount > 0) {
        console.log(`❌ Order auto-cancel: Cancelled ${cancelledCount} expired pending orders`);
        
        // Log the cancellation for each order
        for (const order of expiredOrders) {
          await this.storage.createSystemLog({
            category: 'order_processing',
            action: 'auto_cancel_expired',
            entityType: 'order',
            entityId: order.id,
            details: {
              orderId: order.id,
              userId: order.userId,
              createdAt: order.createdAt,
              reason: 'Payment not received within 20 minutes',
              autoCancel: true
            },
            ipAddress: 'system',
            userAgent: 'OrderCancelService'
          });
        }
      }

      return cancelledCount;
    } catch (error) {
      console.error('❌ Error in order auto-cancel service:', error);
      return 0;
    }
  }

  /**
   * Starts the auto-cancel job to run every 5 minutes
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️  Order auto-cancel service is already running');
      return;
    }

    console.log('🚀 Starting order auto-cancel service - checking every 5 minutes');
    
    // Run immediately on startup
    this.cancelExpiredPendingOrders();

    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.cancelExpiredPendingOrders();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stops the auto-cancel job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Order auto-cancel service stopped');
    }
  }

  /**
   * Gets statistics about cancelled orders
   */
  async getCancelledOrdersStats(): Promise<{
    totalCancelled: number;
    autoCancelledToday: number;
    autoCancelledThisWeek: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      // Total cancelled orders
      const totalCancelled = await db
        .select()
        .from(orders)
        .where(eq(orders.status, 'cancelled'));

      // Auto-cancelled today (would need to check system logs for auto-cancel actions)
      const autoCancelledToday = totalCancelled.filter(order => 
        order.createdAt && order.createdAt >= today
      ).length;

      // Auto-cancelled this week
      const autoCancelledThisWeek = totalCancelled.filter(order => 
        order.createdAt && order.createdAt >= weekAgo
      ).length;

      return {
        totalCancelled: totalCancelled.length,
        autoCancelledToday,
        autoCancelledThisWeek
      };
    } catch (error) {
      console.error('Error getting cancelled orders stats:', error);
      return {
        totalCancelled: 0,
        autoCancelledToday: 0,
        autoCancelledThisWeek: 0
      };
    }
  }
}
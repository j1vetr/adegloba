import type { IStorage } from "../storage";

export class ExpiryService {
  constructor(private storage: IStorage) {}

  calculateEndOfMonthExpiry(): Date {
    const now = new Date();
    // Set timezone to Europe/Istanbul
    const istanbulTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
    
    // Get last day of current month
    const lastDayOfMonth = new Date(istanbulTime.getFullYear(), istanbulTime.getMonth() + 1, 0);
    
    // Set to end of day (23:59:59)
    lastDayOfMonth.setHours(23, 59, 59, 999);
    
    return lastDayOfMonth;
  }

  calculateRemainingDays(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  async processExpiredOrders(): Promise<number> {
    const orders = await this.storage.getOrders();
    const now = new Date();
    let processedCount = 0;

    for (const order of orders) {
      if (order.status === 'paid' && order.expiresAt && new Date(order.expiresAt) < now) {
        await this.storage.updateOrder(order.id, { status: 'expired' });
        processedCount++;
      }
    }

    return processedCount;
  }
}

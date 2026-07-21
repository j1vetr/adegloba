import { storage } from '../storage';

export class LogCleanupService {
  private static instance: LogCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // Run every 6 hours
  private readonly LOG_RETENTION_DAYS = 7;
  private readonly PAYMENT_EVENTS_RETENTION_DAYS = 90;

  private constructor() {}

  public static getInstance(): LogCleanupService {
    if (!LogCleanupService.instance) {
      LogCleanupService.instance = new LogCleanupService();
    }
    return LogCleanupService.instance;
  }

  public startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      return; // Already running
    }

    console.log(`🗑️  Starting log cleanup scheduler - will delete logs older than ${this.LOG_RETENTION_DAYS} days, payment events older than ${this.PAYMENT_EVENTS_RETENTION_DAYS} days`);
    
    // Run cleanup immediately on startup
    this.performCleanup();

    // Schedule recurring cleanup every 6 hours
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  public stopCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🗑️  Log cleanup scheduler stopped');
    }
  }

  public async performCleanup(): Promise<void> {
    try {
      const logCutoffDate = new Date();
      logCutoffDate.setDate(logCutoffDate.getDate() - this.LOG_RETENTION_DAYS);
      
      console.log(`🗑️  Running log cleanup - deleting logs older than ${logCutoffDate.toISOString()}`);
      
      const deletedLogs = await storage.deleteOldLogs(logCutoffDate);
      
      if (deletedLogs > 0) {
        console.log(`🗑️  Log cleanup completed - deleted ${deletedLogs} old log entries`);
      } else {
        console.log('🗑️  Log cleanup completed - no old logs to delete');
      }
    } catch (error) {
      console.error('❌ Error during log cleanup:', error);
    }

    try {
      const eventCutoffDate = new Date();
      eventCutoffDate.setDate(eventCutoffDate.getDate() - this.PAYMENT_EVENTS_RETENTION_DAYS);
      
      console.log(`🗑️  Running payment events cleanup - deleting events older than ${eventCutoffDate.toISOString()}`);
      
      const deletedEvents = await storage.deleteOldPaymentEvents(eventCutoffDate);
      
      if (deletedEvents > 0) {
        console.log(`🗑️  Payment events cleanup completed - deleted ${deletedEvents} old payment event entries`);
      } else {
        console.log('🗑️  Payment events cleanup completed - no old payment events to delete');
      }
    } catch (error) {
      console.error('❌ Error during payment events cleanup:', error);
    }
  }

  public async forceCleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);
    
    return await storage.deleteOldLogs(cutoffDate);
  }

  public async forcePaymentEventsCleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.PAYMENT_EVENTS_RETENTION_DAYS);
    
    return await storage.deleteOldPaymentEvents(cutoffDate);
  }
}

export const logCleanupService = LogCleanupService.getInstance();

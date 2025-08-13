import { storage } from '../storage';

export class LogCleanupService {
  private static instance: LogCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // Run every 6 hours
  private readonly LOG_RETENTION_DAYS = 7;

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

    console.log(`🗑️  Starting log cleanup scheduler - will delete logs older than ${this.LOG_RETENTION_DAYS} days`);
    
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
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);
      
      console.log(`🗑️  Running log cleanup - deleting logs older than ${cutoffDate.toISOString()}`);
      
      const deletedCount = await storage.deleteOldLogs(cutoffDate);
      
      if (deletedCount > 0) {
        console.log(`🗑️  Log cleanup completed - deleted ${deletedCount} old log entries`);
      } else {
        console.log('🗑️  Log cleanup completed - no old logs to delete');
      }
    } catch (error) {
      console.error('❌ Error during log cleanup:', error);
    }
  }

  public async forceCleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.LOG_RETENTION_DAYS);
    
    return await storage.deleteOldLogs(cutoffDate);
  }
}

export const logCleanupService = LogCleanupService.getInstance();
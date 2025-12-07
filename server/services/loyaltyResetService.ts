import cron from 'node-cron';
import { LoyaltyService } from './loyaltyService';
import { log } from '../vite';

export class LoyaltyResetService {
  private cronJob: cron.ScheduledTask | null = null;

  start(): void {
    // Run on the 1st of every month at 00:00:01 Istanbul time
    // Cron format: second minute hour dayOfMonth month dayOfWeek
    this.cronJob = cron.schedule('1 0 0 1 * *', async () => {
      log('Starting monthly loyalty reset...');
      try {
        const count = await LoyaltyService.resetAllUsersMonthlyLoyalty();
        log(`Monthly loyalty reset completed: ${count} users reset`);
      } catch (error) {
        console.error('Error during monthly loyalty reset:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Istanbul'
    });

    log('Loyalty reset service started - will reset on 1st of each month');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      log('Loyalty reset service stopped');
    }
  }

  // Manual reset for admin use
  async manualReset(): Promise<number> {
    log('Manual loyalty reset triggered');
    return await LoyaltyService.resetAllUsersMonthlyLoyalty();
  }
}

export const loyaltyResetService = new LoyaltyResetService();

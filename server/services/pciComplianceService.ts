import cron from 'node-cron';
import { storage } from '../storage';
import { PCI_CONSTANTS } from '../pciCompliance';

class PCIComplianceService {
  private cronJob: cron.ScheduledTask | null = null;

  async deactivateInactiveAccounts(): Promise<number> {
    try {
      const deactivatedCount = await storage.deactivateInactiveUsers(PCI_CONSTANTS.INACTIVE_DAYS_LIMIT);
      
      if (deactivatedCount > 0) {
        console.log(`🔒 PCI DSS: Deactivated ${deactivatedCount} inactive accounts (${PCI_CONSTANTS.INACTIVE_DAYS_LIMIT}+ days without login)`);
        
        await storage.createSystemLog({
          category: 'system',
          action: 'pci_dss_inactive_accounts_deactivated',
          adminId: null,
          entityType: 'system',
          entityId: 'pci_dss_cron',
          details: {
            deactivatedCount,
            inactivityThresholdDays: PCI_CONSTANTS.INACTIVE_DAYS_LIMIT
          },
          ipAddress: 'system',
          userAgent: 'PCI Compliance Service',
        });
      }
      
      return deactivatedCount;
    } catch (error) {
      console.error('🔒 PCI DSS: Error deactivating inactive accounts:', error);
      return 0;
    }
  }

  startScheduler(): void {
    console.log('🔒 PCI DSS Compliance Service starting...');
    
    this.deactivateInactiveAccounts().then(count => {
      console.log(`🔒 PCI DSS: Initial inactive account check completed. Deactivated: ${count}`);
    });
    
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('🔒 PCI DSS: Running daily inactive account check...');
      await this.deactivateInactiveAccounts();
    }, {
      scheduled: true,
      timezone: 'Europe/Istanbul'
    });

    console.log('🔒 PCI DSS Compliance Service started - Daily check at 02:00 Istanbul time');
  }

  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🔒 PCI DSS Compliance Service stopped');
    }
  }
}

export const pciComplianceService = new PCIComplianceService();

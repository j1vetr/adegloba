import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';

// Monthly report scheduler
export function startEmailScheduler() {
  console.log('📧 Starting email scheduler...');
  
  // Run monthly report on 1st of every month at 09:10
  // Cron format: minute hour day month dayOfWeek
  // '10 9 1 * *' = 09:10 on the 1st day of every month
  cron.schedule('10 9 1 * *', async () => {
    console.log('📊 Running monthly report generation...');
    await generateAndSendMonthlyReport();
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });

  // Test schedule - run every day at 09:11 for testing (remove in production)
  // cron.schedule('11 9 * * *', async () => {
  //   console.log('🧪 Running test monthly report...');
  //   await generateAndSendMonthlyReport();
  // }, {
  //   scheduled: true,
  //   timezone: "Europe/Istanbul"
  // });

  console.log('✅ Email scheduler started - Monthly reports will be sent on 1st of each month at 09:10');
}

async function generateAndSendMonthlyReport() {
  try {
    console.log('📊 Generating monthly report...');
    
    // Get admin email from settings (you might want to add this to email settings)
    const adminEmail = 'admin@adegloba.com'; // TODO: Make this configurable
    
    // Get previous month's data
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get ships for the report
    const ships = await storage.getAllShips();
    
    // Generate ship statistics
    const shipStats = await generateShipStatistics(ships, previousMonth, currentMonth);
    
    // Calculate totals
    const totals = calculateTotals(shipStats);
    
    // Format month name in Turkish
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const reportMonth = `${monthNames[previousMonth.getMonth()]} ${previousMonth.getFullYear()}`;
    
    // Format ship statistics HTML
    const shipStatsHtml = shipStats.map(ship => 
      `<li><strong>${ship.shipName}:</strong> ${ship.orderCount} sipariş, ${ship.totalDataGB}GB toplam veri, $${ship.totalRevenue} gelir</li>`
    ).join('');
    
    // Send monthly report email
    const success = await emailService.sendEmail(
      adminEmail,
      `${reportMonth} Aylık Sipariş Raporu - AdeGloba Starlink System`,
      'admin_monthly_report',
      {
        reportMonth,
        shipStats: `<ul>${shipStatsHtml}</ul>`,
        totalOrders: totals.totalOrders.toString(),
        totalRevenue: totals.totalRevenue.toFixed(2),
        totalDataGB: totals.totalDataGB.toString(),
        adminUrl: (process.env.BASE_URL || 'http://localhost:5000') + '/admin',
      }
    );
    
    if (success) {
      console.log(`✅ Monthly report sent successfully for ${reportMonth}`);
    } else {
      console.error(`❌ Failed to send monthly report for ${reportMonth}`);
    }
    
  } catch (error) {
    console.error('💥 Error generating monthly report:', error);
  }
}

async function generateShipStatistics(ships: any[], startDate: Date, endDate: Date) {
  const shipStats = [];
  
  for (const ship of ships) {
    try {
      // Get orders for this ship in the date range
      const orders = await storage.getOrdersByShipAndDateRange(ship.id, startDate, endDate);
      
      let orderCount = 0;
      let totalRevenue = 0;
      let totalDataGB = 0;
      
      for (const order of orders) {
        if (order.status === 'paid' || order.status === 'completed') {
          orderCount++;
          totalRevenue += parseFloat(order.totalAmount || '0');
          
          // Get order items to calculate total data
          const orderItems = await storage.getOrderItems(order.id);
          for (const item of orderItems) {
            const plan = await storage.getPlanById(item.planId);
            if (plan) {
              totalDataGB += plan.dataLimitGb * item.quantity;
            }
          }
        }
      }
      
      shipStats.push({
        shipName: ship.name,
        orderCount,
        totalRevenue,
        totalDataGB,
      });
    } catch (error) {
      console.error(`Error processing ship ${ship.name}:`, error);
      shipStats.push({
        shipName: ship.name,
        orderCount: 0,
        totalRevenue: 0,
        totalDataGB: 0,
      });
    }
  }
  
  return shipStats;
}

function calculateTotals(shipStats: any[]) {
  return shipStats.reduce(
    (totals, ship) => ({
      totalOrders: totals.totalOrders + ship.orderCount,
      totalRevenue: totals.totalRevenue + ship.totalRevenue,
      totalDataGB: totals.totalDataGB + ship.totalDataGB,
    }),
    { totalOrders: 0, totalRevenue: 0, totalDataGB: 0 }
  );
}

// Manual trigger function for testing
export async function triggerMonthlyReport() {
  console.log('🧪 Manually triggering monthly report...');
  await generateAndSendMonthlyReport();
}
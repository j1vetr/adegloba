import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Monthly report scheduler
export function startEmailScheduler() {
  console.log('📧 Starting email scheduler...');
  
  // Run monthly report on last day of every month at 23:30
  // Cron format: minute hour day month dayOfWeek
  // '30 23 L * *' would be ideal, but node-cron doesn't support 'L' (last day)
  // So we'll check every day at 23:30 if it's the last day of the month
  cron.schedule('30 23 * * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if tomorrow is the first day of next month (meaning today is last day)
    if (tomorrow.getDate() === 1) {
      console.log('📊 Running monthly report generation on last day of month...');
      await generateAndSendMonthlyReport();
    }
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

  console.log('✅ Email scheduler started - Monthly reports will be sent on last day of each month at 23:30');
}

async function getBaseUrl(): Promise<string> {
  const baseUrlSetting = await storage.getSetting('base_url');
  return baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
}

async function generateAndSendMonthlyReport() {
  try {
    console.log('📊 Generating monthly report...');
    
    // Get admin email from settings
    const adminEmailSetting = await storage.getSetting('admin_email');
    const adminEmail = adminEmailSetting?.value || 'support@adegloba.space';
    
    // Get current month's data (since we're running on last day of month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Use Reports page logic to get report data
    const reportData = await storage.getReportData(undefined, startOfMonth, endOfMonth);
    
    // Calculate totals
    const totals = {
      totalOrders: reportData.reduce((sum, item) => sum + item.totalOrders, 0),
      totalRevenue: reportData.reduce((sum, item) => sum + item.totalRevenue, 0),
      totalDataGB: reportData.reduce((sum, item) => sum + item.totalDataGB, 0),
      packagesSold: reportData.reduce((sum, item) => sum + item.packagesSold, 0),
    };
    
    // Format month name in Turkish
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const reportMonth = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    
    // Generate Excel file
    const excelFilePath = await generateExcelReport(reportData, reportMonth);
    
    // Format ship statistics HTML for email
    const shipStatsHtml = reportData.map(ship => 
      `<li><strong>${ship.shipName}:</strong> ${ship.totalOrders} ödenen sipariş, ${ship.packagesSold} paket, ${ship.totalDataGB}GB veri, $${ship.totalRevenue.toFixed(2)} gelir</li>`
    ).join('');
    
    // Send monthly report email with Excel attachment
    const success = await emailService.sendEmailWithAttachment(
      adminEmail,
      `${reportMonth} Aylık Finans Raporu - AdeGloba Starlink System`,
      'admin_monthly_report',
      {
        reportMonth,
        shipStats: `<ul>${shipStatsHtml}</ul>`,
        totalOrders: totals.totalOrders.toString(),
        totalRevenue: totals.totalRevenue.toFixed(2),
        totalDataGB: totals.totalDataGB.toString(),
        packagesSold: totals.packagesSold.toString(),
        adminUrl: (await getBaseUrl()) + '/admin',
      },
      [{
        filename: `aylık-rapor-${reportMonth.toLowerCase().replace(' ', '-')}.xlsx`,
        path: excelFilePath,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }]
    );
    
    // Clean up temp file
    try {
      fs.unlinkSync(excelFilePath);
    } catch (cleanupError) {
      console.warn('Warning: Could not delete temp Excel file:', cleanupError);
    }
    
    if (success) {
      console.log(`✅ Monthly report sent successfully for ${reportMonth} with Excel attachment`);
    } else {
      console.error(`❌ Failed to send monthly report for ${reportMonth}`);
    }
    
  } catch (error) {
    console.error('💥 Error generating monthly report:', error);
  }
}

// Generate Excel report file using Reports page logic
export async function generateExcelReport(reportData: any[], reportMonth: string): Promise<string> {
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

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aylık Rapor');
  
  // Save to temp file
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
    console.log('📁 Created temp directory with permissions 0o755');
  }
  
  const fileName = `aylık-rapor-${reportMonth.toLowerCase().replace(' ', '-')}-${Date.now()}.xlsx`;
  const filePath = path.join(tempDir, fileName);
  
  XLSX.writeFile(workbook, filePath);
  console.log(`📄 Excel file created at: ${filePath}`);
  
  return filePath;
}

// Manual trigger function for testing
export async function triggerMonthlyReport() {
  console.log('🧪 Manually triggering monthly report...');
  await generateAndSendMonthlyReport();
}
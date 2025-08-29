import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
    
    // Generate PDF file
    const pdfFilePath = await generatePDFReport(reportData, reportMonth);
    
    // Format ship statistics HTML for email
    const shipStatsHtml = reportData.map(ship => 
      `<li><strong>${ship.shipName}:</strong> ${ship.totalOrders} ödenen sipariş, ${ship.packagesSold} paket, ${ship.totalDataGB}GB veri, $${ship.totalRevenue.toFixed(2)} gelir</li>`
    ).join('');
    
    // Send monthly report email with PDF attachment
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
        filename: `aylık-rapor-${reportMonth.toLowerCase().replace(' ', '-')}.pdf`,
        path: pdfFilePath,
        contentType: 'application/pdf'
      }]
    );
    
    // Clean up temp file
    try {
      fs.unlinkSync(pdfFilePath);
    } catch (cleanupError) {
      console.warn('Warning: Could not delete temp PDF file:', cleanupError);
    }
    
    if (success) {
      console.log(`✅ Monthly report sent successfully for ${reportMonth} with PDF attachment`);
    } else {
      console.error(`❌ Failed to send monthly report for ${reportMonth}`);
    }
    
  } catch (error) {
    console.error('💥 Error generating monthly report:', error);
  }
}

// Generate PDF report file using Reports page logic
async function generatePDFReport(reportData: any[], reportMonth: string): Promise<string> {
  const doc = new jsPDF();
  
  // Set Turkish fonts and encoding
  doc.setFont('helvetica');
  doc.setFontSize(10);
  doc.setLanguage('tr-TR');
  
  // Add title with better spacing
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AdeGloba Starlink System', 105, 25, { align: 'center' });
  
  // Add subtitle
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportMonth} Aylık Finans Raporu`, 105, 35, { align: 'center' });
  
  // Add generation date
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapor Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 105, 45, { align: 'center' });
  
  // Add separator line
  doc.setLineWidth(0.5);
  doc.line(20, 53, 190, 53);
  
  // Prepare table data
  const tableData = reportData.map(item => [
    item.shipName,
    item.totalOrders.toString(),
    item.packagesSold.toString(),
    item.totalDataGB.toString(),
    '$' + item.totalRevenue.toFixed(2)
  ]);
  
  // Add table with better styling
  (doc as any).autoTable({
    startY: 60,
    head: [['Gemi Adı', 'Ödenen\nSiparişler', 'Satılan\nPaketler', 'Satılan Veri\n(GB)', 'Net Gelir\n(USD)']],
    body: tableData,
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      valign: 'middle',
      halign: 'center',
      textColor: [51, 51, 51],
      lineColor: [200, 200, 200],
      lineWidth: 0.5
    },
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 40 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 25 }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Calculate totals
  const totals = reportData.reduce((acc, item) => ({
    totalOrders: acc.totalOrders + item.totalOrders,
    totalPackages: acc.totalPackages + item.packagesSold,
    totalData: acc.totalData + item.totalDataGB,
    totalRevenue: acc.totalRevenue + item.totalRevenue
  }), { totalOrders: 0, totalPackages: 0, totalData: 0, totalRevenue: 0 });
  
  // Add summary section with better design
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Summary box background
  doc.setFillColor(240, 248, 255);
  doc.rect(20, finalY, 170, 40, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, finalY, 170, 40, 'S');
  
  // Summary title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${reportMonth.toUpperCase()} AYI ÖZETİ`, 105, finalY + 12, { align: 'center' });
  
  // Summary content in two columns
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  
  // Left column
  doc.text(`Toplam Ödenen Sipariş: ${totals.totalOrders}`, 25, finalY + 22);
  doc.text(`Toplam Satılan Paket: ${totals.totalPackages}`, 25, finalY + 29);
  
  // Right column
  doc.text(`Toplam Satılan Veri: ${totals.totalData} GB`, 110, finalY + 22);
  doc.text(`Toplam Net Gelir: $${totals.totalRevenue.toFixed(2)}`, 110, finalY + 29);
  
  // Footer
  const footerY = finalY + 50;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Rapor Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 105, footerY, { align: 'center' });
  doc.text('AdeGloba Starlink System - Otomatik Aylık Rapor', 105, footerY + 6, { align: 'center' });
  
  // Save to temp file
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const fileName = `aylık-rapor-${reportMonth.toLowerCase().replace(' ', '-')}-${Date.now()}.pdf`;
  const filePath = path.join(tempDir, fileName);
  
  // Save PDF to file
  const pdfData = doc.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfData));
  
  return filePath;
}

// Manual trigger function for testing
export async function triggerMonthlyReport() {
  console.log('🧪 Manually triggering monthly report...');
  await generateAndSendMonthlyReport();
}
import cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './emailService';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function startBackupScheduler() {
  console.log('💾 Starting automatic backup scheduler...');

  // Run every 4 days at 01:00 Istanbul time
  cron.schedule('0 1 */4 * *', async () => {
    console.log('💾 Running scheduled database backup (every 4 days)...');
    await runDatabaseBackupAndEmail();
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });

  console.log('✅ Backup scheduler started - Backups every 4 days at 01:00 Istanbul time');
}

export async function runDatabaseBackupAndEmail(): Promise<{ success: boolean; message: string }> {
  let backupPath: string | null = null;

  try {
    // Get database connection details from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL ortam değişkeni tanımlı değil');
    }

    const url = new URL(dbUrl);
    const dbHost = url.hostname;
    const dbPort = url.port || '5432';
    const dbName = url.pathname.slice(1);
    const dbUser = url.username;
    const dbPassword = url.password;

    // Build filename with Istanbul timestamp
    const now = new Date();
    const istanbulStr = now.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    // "19.03.2026 01:00" -> "2026-03-19_01-00"
    const fileTimestamp = now.toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `yedek-${fileTimestamp}.sql`;

    // Human-readable date for email
    const backupDate = now.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    backupPath = path.join(tempDir, filename);

    // Run pg_dump (plain SQL format — human-readable, easy to restore)
    const pgDumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password -f "${backupPath}"`;
    console.log(`💾 Running pg_dump for database: ${dbName}@${dbHost}`);
    await execAsync(pgDumpCommand);

    // Check file was created and get size
    if (!fs.existsSync(backupPath)) {
      throw new Error('pg_dump tamamlandı ancak dosya oluşturulamadı');
    }
    const stats = fs.statSync(backupPath);
    const fileSize = stats.size > 1024 * 1024
      ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(stats.size / 1024).toFixed(2)} KB`;

    console.log(`✅ Backup created: ${filename} (${fileSize})`);

    // Get admin email from settings
    const adminEmailSetting = await storage.getSetting('admin_email');
    const adminEmail = adminEmailSetting?.value || 'support@adegloba.space';

    // Send via email with attachment
    const success = await emailService.sendEmailWithAttachment(
      adminEmail,
      `💾 Otomatik DB Yedeği — ${backupDate} (İstanbul)`,
      'system_backup',
      {
        backupDate,
        filename,
        fileSize,
        dbName: `${dbName}@${dbHost}`,
      },
      [{
        filename,
        path: backupPath,
        contentType: 'application/octet-stream',
      }]
    );

    if (success) {
      console.log(`✅ Backup email sent to ${adminEmail} — ${filename} (${fileSize})`);
      return { success: true, message: `Yedek oluşturuldu ve ${adminEmail} adresine gönderildi. Boyut: ${fileSize}` };
    } else {
      console.error(`❌ Backup created but email sending failed — ${filename}`);
      return { success: false, message: 'Yedek oluşturuldu ancak e-posta gönderilemedi. E-posta ayarlarını kontrol edin.' };
    }

  } catch (error) {
    const errMsg = (error as Error).message || 'Bilinmeyen hata';
    console.error('💥 Backup scheduler error:', errMsg);
    return { success: false, message: `Yedekleme hatası: ${errMsg}` };
  } finally {
    // Always clean up temp file
    if (backupPath && fs.existsSync(backupPath)) {
      try {
        fs.unlinkSync(backupPath);
        console.log(`🗑️ Temp backup file cleaned up: ${path.basename(backupPath)}`);
      } catch (cleanupErr) {
        console.warn('⚠️ Could not delete temp backup file:', cleanupErr);
      }
    }
  }
}

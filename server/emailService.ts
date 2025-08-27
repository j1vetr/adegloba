import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto-js';
import { storage } from './storage';
import type { EmailSetting, InsertEmailLog } from '@shared/schema';

// Encryption key for sensitive data (use env var in production)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'AdeGloba-2024-Email-Key';

// Utility functions for encryption/decryption
function encrypt(text: string): string {
  if (!text) return '';
  return crypto.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const bytes = crypto.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(crypto.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// Email template context type
interface EmailContext {
  [key: string]: any;
}

// Main email service class
export class EmailService {
  private emailSettings: EmailSetting | null = null;
  private lastSettingsLoad = 0;
  private readonly cacheTime = 60000; // 1 minute cache

  private async getEmailSettings(): Promise<EmailSetting | null> {
    const now = Date.now();
    if (!this.emailSettings || (now - this.lastSettingsLoad) > this.cacheTime) {
      this.emailSettings = await storage.getEmailSettings();
      this.lastSettingsLoad = now;
    }
    return this.emailSettings;
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: EmailContext = {},
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    const settings = await this.getEmailSettings();
    
    if (!settings || !settings.isActive) {
      console.log('Email sending disabled - no active settings found');
      return false;
    }

    // Create email log entry
    const logData: InsertEmailLog = {
      toEmail: to,
      ccEmail: cc || null,
      bccEmail: bcc || null,
      subject,
      template,
      provider: settings.provider,
      status: 'pending',
    };

    try {
      const emailLog = await storage.createEmailLog(logData);
      
      // Generate HTML content
      const htmlContent = await this.generateEmailHTML(template, context);
      
      let success = false;
      
      switch (settings.provider) {
        case 'smtp':
          success = await this.sendViaSMTP(settings, to, subject, htmlContent, cc, bcc);
          break;
        case 'sendgrid':
          success = await this.sendViaSendGrid(settings, to, subject, htmlContent, cc, bcc);
          break;
        case 'mailgun':
          success = await this.sendViaMailgun(settings, to, subject, htmlContent, cc, bcc);
          break;
        default:
          throw new Error(`Unsupported email provider: ${settings.provider}`);
      }

      // Update email log with result
      await storage.createEmailLog({
        ...logData,
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : null,
        errorMessage: success ? null : 'Failed to send email',
      });

      return success;
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Log the error
      await storage.createEmailLog({
        ...logData,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return false;
    }
  }

  private async sendViaSMTP(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransporter({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: (settings.smtpPort || 587) === 465,
        auth: {
          user: settings.smtpUser,
          pass: decrypt(settings.smtpPass || ''),
        },
      });

      const mailOptions = {
        from: `${settings.fromName || 'AdeGloba'} <${settings.fromEmail}>`,
        to,
        cc,
        bcc,
        subject,
        html,
        replyTo: settings.replyTo || settings.fromEmail,
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('SMTP sending error:', error);
      return false;
    }
  }

  private async sendViaSendGrid(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      sgMail.setApiKey(decrypt(settings.sendgridKey || ''));

      const msg = {
        to,
        cc,
        bcc,
        from: {
          email: settings.fromEmail || '',
          name: settings.fromName || 'AdeGloba',
        },
        subject,
        html,
        replyTo: settings.replyTo || settings.fromEmail,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid sending error:', error);
      return false;
    }
  }

  private async sendViaMailgun(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      // Mailgun implementation would go here
      // For now, we'll just log and return false
      console.log('Mailgun implementation not yet available');
      return false;
    } catch (error) {
      console.error('Mailgun sending error:', error);
      return false;
    }
  }

  private async generateEmailHTML(template: string, context: EmailContext): Promise<string> {
    // Simple template system - replace {{variable}} with context values
    let html = this.getTemplateHTML(template);
    
    // Replace template variables
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(context[key] || ''));
    });

    return html;
  }

  private getTemplateHTML(template: string): string {
    const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject}}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #111827; color: #fff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1f2937; }
            .header { background-color: #0f172a; padding: 20px; text-align: center; }
            .logo { color: #facc15; font-size: 24px; font-weight: bold; }
            .content { padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #facc15; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { background-color: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
            .footer a { color: #facc15; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">AdeGloba Starlink System</div>
            </div>
            <div class="content">
                {{content}}
            </div>
            <div class="footer">
                <p><strong>Dijita / Starlink Servis</strong></p>
                <p>
                    Destek: <a href="mailto:support@domain.com">support@domain.com</a> | 
                    Tel: <a href="tel:+905xxxxxxxxx">+90 5xx xxx xx xx</a>
                </p>
                <p>&copy; 2024 AdeGloba. Tüm hakları saklıdır.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    switch (template) {
      case 'welcome':
        return baseTemplate.replace('{{content}}', `
          <h2>Hoş Geldiniz!</h2>
          <p>Merhaba {{userName}},</p>
          <p>AdeGloba Starlink sistemine başarıyla kayıt oldunuz. Artık yüksek hızlı internet paketlerimizden faydalanabilirsiniz.</p>
          <p>Hesabınıza giriş yapmak için aşağıdaki butona tıklayın:</p>
          <p><a href="{{loginUrl}}" class="button">Giriş Yap</a></p>
          <p>İyi günler dileriz!</p>
        `);

      case 'order_confirm':
        return baseTemplate.replace('{{content}}', `
          <h2>Sipariş Onayı</h2>
          <p>Merhaba {{userName}},</p>
          <p>Sipariş numarası <strong>{{orderNumber}}</strong> başarıyla tamamlandı.</p>
          <h3>Sipariş Detayları:</h3>
          <ul>{{orderItems}}</ul>
          <p><strong>Toplam Tutar:</strong> ${{totalAmount}}</p>
          <p>Giriş bilgileriniz kısa süre içinde e-posta adresinize gönderilecektir.</p>
          <p><a href="{{dashboardUrl}}" class="button">Hesabıma Git</a></p>
        `);

      case 'admin_new_order':
        return baseTemplate.replace('{{content}}', `
          <h2>Yeni Sipariş Bildirimi</h2>
          <p>Yeni bir sipariş alındı:</p>
          <h3>Sipariş Bilgileri:</h3>
          <ul>
            <li><strong>Sipariş No:</strong> {{orderNumber}}</li>
            <li><strong>Müşteri:</strong> {{customerName}} ({{customerEmail}})</li>
            <li><strong>Gemi:</strong> {{shipName}}</li>
            <li><strong>Toplam:</strong> ${{totalAmount}}</li>
          </ul>
          <h3>Sipariş İçeriği:</h3>
          <ul>{{orderItems}}</ul>
          <p><a href="{{adminUrl}}" class="button">Admin Paneline Git</a></p>
        `);

      case 'admin_monthly_report':
        return baseTemplate.replace('{{content}}', `
          <h2>Aylık Sipariş Raporu</h2>
          <p>{{reportMonth}} ayı sipariş özeti:</p>
          <h3>Gemi Bazında Sipariş Detayları:</h3>
          {{shipStats}}
          <h3>Genel Özet:</h3>
          <ul>
            <li><strong>Toplam Sipariş:</strong> {{totalOrders}}</li>
            <li><strong>Toplam Gelir:</strong> ${{totalRevenue}}</li>
            <li><strong>Toplam Veri:</strong> {{totalDataGB}} GB</li>
          </ul>
          <p><a href="{{adminUrl}}" class="button">Detaylı Rapor</a></p>
        `);

      default:
        return baseTemplate.replace('{{content}}', '<p>Email content not found.</p>');
    }
  }

  // Utility method to encrypt sensitive data before storing
  static encryptSensitiveData(data: string): string {
    return encrypt(data);
  }

  // Test email method
  async sendTestEmail(to: string): Promise<boolean> {
    return await this.sendEmail(
      to,
      'AdeGloba Test Mail',
      'welcome',
      {
        userName: 'Test User',
        loginUrl: process.env.BASE_URL || 'http://localhost:5000',
      }
    );
  }
}

export const emailService = new EmailService();
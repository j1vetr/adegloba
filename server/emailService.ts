import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto-js';
import { storage } from './storage';
import type { EmailSetting, InsertEmailLog } from '@shared/schema';

// Encryption key will be loaded from database settings

// Utility functions for encryption/decryption
async function getEncryptionKey(): Promise<string> {
  const setting = await storage.getSetting('EMAIL_ENCRYPTION_KEY');
  return setting?.value || 'AdeGloba-2024-Email-Key-Default';
}

async function encrypt(text: string): Promise<string> {
  if (!text) return '';
  const key = await getEncryptionKey();
  return crypto.AES.encrypt(text, key).toString();
}

async function decrypt(encryptedText: string): Promise<string> {
  if (!encryptedText) return '';
  try {
    const key = await getEncryptionKey();
    const bytes = crypto.AES.decrypt(encryptedText, key);
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

  private async getBaseUrl(): Promise<string> {
    const baseUrlSetting = await storage.getSetting('base_url');
    return baseUrlSetting?.value || 'https://adegloba.toov.com.tr';
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
      const smtpPort = settings.smtpPort || 587;
      const isSecure = smtpPort === 465;
      
      console.log(`🔧 Attempting SMTP connection to ${settings.smtpHost}:${smtpPort} (secure: ${isSecure})`);
      
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: smtpPort,
        secure: isSecure, // true for 465 (SSL), false for other ports (STARTTLS)
        requireTLS: !isSecure, // Force STARTTLS for non-SSL ports
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass || '',
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
          servername: settings.smtpHost // Set servername for SNI
        },
        connectionTimeout: 30000, // 30 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 30000,
        debug: false, // Disable verbose debug
        logger: false
      });

      // Test connection before sending
      console.log('🔧 Testing SMTP connection...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');

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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; padding: 20px; 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                color: #ffffff; 
                line-height: 1.6; 
            }
            .email-container { 
                max-width: 650px; 
                margin: 0 auto; 
                background: linear-gradient(145deg, #1e293b, #0f172a);
                border: 1px solid #334155;
                border-radius: 16px; 
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset;
            }
            .header { 
                background: linear-gradient(135deg, #facc15, #f59e0b);
                padding: 30px 20px; 
                text-align: center; 
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s infinite;
            }
            @keyframes shimmer {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .logo { 
                color: #0f172a; 
                font-size: 28px; 
                font-weight: 900; 
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                letter-spacing: 1px;
                position: relative;
                z-index: 1;
            }
            .subtitle {
                color: #1e293b;
                font-size: 14px;
                font-weight: 600;
                margin-top: 5px;
                position: relative;
                z-index: 1;
            }
            .content { 
                padding: 40px 30px; 
                background: rgba(30, 41, 59, 0.5);
                backdrop-filter: blur(10px);
            }
            .content h1, .content h2 { 
                color: #facc15; 
                margin-bottom: 20px; 
                font-weight: 700;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            .content h1 { font-size: 24px; }
            .content h2 { font-size: 22px; }
            .content p { 
                color: #e2e8f0; 
                margin-bottom: 16px; 
                font-size: 16px; 
            }
            .highlight { 
                background: linear-gradient(90deg, #facc15, #f59e0b);
                color: #0f172a;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
            }
            .button { 
                display: inline-block; 
                padding: 16px 32px; 
                background: linear-gradient(135deg, #facc15, #f59e0b);
                color: #0f172a; 
                text-decoration: none; 
                border-radius: 12px; 
                font-weight: 700; 
                font-size: 16px;
                margin: 20px 0;
                transition: all 0.3s ease;
                box-shadow: 0 8px 16px rgba(250, 204, 21, 0.3);
                text-align: center;
                letter-spacing: 0.5px;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(250, 204, 21, 0.4);
            }
            .order-details {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid #334155;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            .order-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #334155;
                color: #e2e8f0;
            }
            .order-item:last-child {
                border-bottom: none;
            }
            .price {
                color: #facc15;
                font-weight: 700;
                font-size: 18px;
            }
            .footer { 
                background: linear-gradient(135deg, #0f172a, #1e293b);
                padding: 30px 20px; 
                text-align: center; 
                border-top: 1px solid #334155;
            }
            .footer-brand {
                color: #facc15;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 15px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            .footer-links {
                color: #94a3b8;
                font-size: 14px;
                margin-bottom: 10px;
            }
            .footer-links a { 
                color: #facc15; 
                text-decoration: none;
                font-weight: 600;
                margin: 0 5px;
            }
            .footer-links a:hover {
                text-shadow: 0 0 8px #facc15;
            }
            .footer-copyright {
                color: #64748b;
                font-size: 12px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #334155;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 16px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            @media (max-width: 600px) {
                .email-container { margin: 10px; border-radius: 12px; }
                .content { padding: 30px 20px; }
                .header { padding: 25px 15px; }
                .logo { font-size: 24px; }
                .button { padding: 14px 24px; width: 100%; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">AdeGloba Starlink System</div>
                <div class="subtitle">Maritime Satellite Internet Solutions</div>
            </div>
            <div class="content">
                {{content}}
            </div>
            <div class="footer">
                <div class="footer-brand">Ade Globa</div>
                <div class="footer-links">
                    Destek: <a href="mailto:starlink@adegloba.space">starlink@adegloba.space</a> | 
                    Tel & WhatsApp: <a href="tel:+447440225375">+44 744 022 5375</a>
                </div>
                <div class="footer-copyright">
                    © 2025 Ade Globa. Tüm hakları saklıdır. | Güvenilir Denizcilik İnternet Çözümleri
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    switch (template) {
      case 'welcome':
        return baseTemplate.replace('{{content}}', `
          <h2>🌟 Hoş Geldiniz!</h2>
          <p>Merhaba <span class="highlight">{{userName}}</span>,</p>
          <p>AdeGloba Starlink sistemine başarıyla kayıt oldunuz! Artık denizlerde kesintisiz, yüksek hızlı internet bağlantısının keyfini çıkarabilirsiniz.</p>
          <div class="order-details">
            <div class="status-badge">✅ Hesap Aktif</div>
            <p style="margin-top: 15px; color: #94a3b8;">Maritime internet çözümlerimiz ile her zaman bağlı kalın</p>
          </div>
          <p>Hesabınıza giriş yapmak ve paketlerinizi yönetmek için:</p>
          <div style="text-align: center;">
            <a href="{{loginUrl}}" class="button">🚀 Kontrol Paneline Giriş Yap</a>
          </div>
          <p>İyi denizler dileriz! ⚓</p>
        `);

      case 'order_confirm':
        return baseTemplate.replace('{{content}}', `
          <h2>🎉 Sipariş Onaylandı</h2>
          <p>Merhaba <span class="highlight">{{userName}}</span>,</p>
          <p>Sipariş numarası <span class="highlight">{{orderNumber}}</span> başarıyla tamamlandı ve ödemeniz alındı!</p>
          
          <div class="order-details">
            <h3 style="color: #facc15; margin-bottom: 15px;">📦 Sipariş Detayları</h3>
            <div style="color: #e2e8f0;">{{orderItems}}</div>
            <div class="order-item" style="border-top: 2px solid #facc15; margin-top: 15px; padding-top: 15px;">
              <strong style="color: #facc15;">Toplam Tutar:</strong>
              <span class="price">${{totalAmount}}</span>
            </div>
          </div>
          
          <div class="status-badge">🚀 Paketler Aktifleştiriliyor</div>
          <p style="margin-top: 20px;">Internet paketleriniz 15-30 dakika içerisinde aktif hale gelecek. Gemici Wi-Fi ağınızdan bağlanabilirsiniz.</p>
          
          <div style="text-align: center;">
            <a href="{{dashboardUrl}}" class="button">📊 Kontrol Panelim</a>
          </div>
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
  static async encryptSensitiveData(data: string): Promise<string> {
    return await encrypt(data);
  }

  // Test email method
  async sendTestEmail(to: string): Promise<boolean> {
    const baseUrl = await this.getBaseUrl();
    return await this.sendEmail(
      to,
      'AdeGloba Test Mail',
      'welcome',
      {
        userName: 'Test User',
        loginUrl: baseUrl,
        dashboardUrl: baseUrl + '/dashboard',
        adminUrl: baseUrl + '/admin'
      }
    );
  }
}

export const emailService = new EmailService();
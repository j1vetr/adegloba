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

  // Send email with attachments
  async sendEmailWithAttachment(
    to: string,
    subject: string,
    template: string,
    context: EmailContext = {},
    attachments: Array<{filename: string, path: string, contentType: string}> = [],
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
          success = await this.sendViaSMTPWithAttachment(settings, to, subject, htmlContent, attachments, cc, bcc);
          break;
        case 'sendgrid':
          success = await this.sendViaSendGridWithAttachment(settings, to, subject, htmlContent, attachments, cc, bcc);
          break;
        case 'mailgun':
          success = await this.sendViaMailgunWithAttachment(settings, to, subject, htmlContent, attachments, cc, bcc);
          break;
        default:
          throw new Error(`Unsupported email provider: ${settings.provider}`);
      }

      // Update email log with result
      await storage.createEmailLog({
        ...logData,
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : null,
        errorMessage: success ? null : 'Failed to send email with attachment',
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
      
      // Handle both ES module and CommonJS imports
      const createTransporter = nodemailer.createTransporter || (nodemailer as any).default?.createTransporter;
      
      if (!createTransporter) {
        throw new Error('nodemailer.createTransporter is not available');
      }
      
      const transporter = createTransporter({
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

  private async sendViaSMTPWithAttachment(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    attachments: Array<{filename: string, path: string, contentType: string}>,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      const smtpPort = settings.smtpPort || 587;
      const isSecure = smtpPort === 465;
      
      console.log(`🔧 Attempting SMTP connection to ${settings.smtpHost}:${smtpPort} (secure: ${isSecure})`);
      
      // Handle both ES module and CommonJS imports
      const createTransporter = nodemailer.createTransporter || (nodemailer as any).default?.createTransporter;
      
      if (!createTransporter) {
        throw new Error('nodemailer.createTransporter is not available');
      }
      
      const transporter = createTransporter({
        host: settings.smtpHost,
        port: smtpPort,
        secure: isSecure,
        requireTLS: !isSecure,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass || '',
        },
        tls: {
          rejectUnauthorized: false,
          servername: settings.smtpHost
        },
        connectionTimeout: 30000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        debug: false,
        logger: false
      });

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
        attachments: attachments.map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
        }))
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('SMTP sending error with attachment:', error);
      return false;
    }
  }

  private async sendViaSendGridWithAttachment(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    attachments: Array<{filename: string, path: string, contentType: string}>,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      // SendGrid with attachment implementation would go here
      console.log('SendGrid with attachment not yet implemented - falling back to regular send');
      return await this.sendViaSendGrid(settings, to, subject, html, cc, bcc);
    } catch (error) {
      console.error('SendGrid sending error with attachment:', error);
      return false;
    }
  }

  private async sendViaMailgunWithAttachment(
    settings: EmailSetting,
    to: string,
    subject: string,
    html: string,
    attachments: Array<{filename: string, path: string, contentType: string}>,
    cc?: string,
    bcc?: string
  ): Promise<boolean> {
    try {
      // Mailgun with attachment implementation would go here
      console.log('Mailgun with attachment not yet implemented');
      return false;
    } catch (error) {
      console.error('Mailgun sending error with attachment:', error);
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
            body, table, td, p, a { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                -webkit-text-size-adjust: 100%; 
                -ms-text-size-adjust: 100%; 
            }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            body { 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc; 
                color: #1e293b;
                line-height: 1.6;
            }
            .email-container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 0; 
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border: 1px solid #e2e8f0;
            }
            .header { 
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                padding: 40px 30px; 
                text-align: center; 
                border-bottom: none;
            }
            .logo { 
                color: #ffffff; 
                font-size: 28px; 
                font-weight: 800; 
                letter-spacing: 2px;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            .subtitle {
                color: #94a3b8;
                font-size: 16px;
                font-weight: 500;
                margin: 0;
                letter-spacing: 0.5px;
            }
            .content { 
                padding: 40px 30px; 
                background-color: #ffffff;
            }
            .content h1 { 
                color: #1e293b; 
                margin-bottom: 24px; 
                font-weight: 700;
                line-height: 1.3;
                font-size: 28px;
            }
            .content h2 { 
                color: #1e293b; 
                margin-bottom: 20px; 
                font-weight: 600;
                font-size: 24px;
            }
            .content h3 { 
                color: #334155; 
                margin-bottom: 16px; 
                font-weight: 600;
                font-size: 20px;
            }
            .content p { 
                color: #475569; 
                margin-bottom: 16px; 
                font-size: 16px;
                line-height: 1.6;
            }
            .highlight { 
                background-color: #f1f5f9;
                color: #0ea5e9;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
                border: 1px solid #e0f2fe;
            }
            .button { 
                display: inline-block; 
                padding: 14px 28px; 
                background-color: #0ea5e9;
                color: #ffffff !important; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: 600; 
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                border: 2px solid #0ea5e9;
                box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
            }
            .order-details {
                background-color: #f8fafc;
                border-radius: 8px;
                padding: 24px;
                margin: 24px 0;
                border: 1px solid #e2e8f0;
                border-left: 4px solid #0ea5e9;
            }
            .order-item {
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
                color: #475569;
                font-size: 15px;
            }
            .order-item strong {
                color: #334155;
                font-weight: 600;
            }
            .order-item:last-child {
                border-bottom: none;
                font-weight: 700;
                color: #1e293b;
                font-size: 18px;
                padding-top: 16px;
                margin-top: 8px;
                border-top: 2px solid #0ea5e9;
            }
            .price {
                color: #059669;
                font-weight: 700;
                font-size: 18px;
            }
            .footer {
                background-color: #1e293b;
                padding: 30px 20px;
                text-align: center;
                color: #94a3b8;
            }
            .footer-brand {
                color: #ffffff;
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
            }
            .footer-links {
                color: #94a3b8;
                font-size: 14px;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            .footer-links a {
                color: #0ea5e9;
                text-decoration: none;
                font-weight: 500;
            }
            .footer-copyright {
                color: #64748b;
                font-size: 12px;
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid #374151;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                background-color: #dcfce7;
                color: #059669;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                border: 1px solid #bbf7d0;
            }
            .maritime-accent {
                color: #0ea5e9;
                font-weight: 600;
            }
            .wave-divider {
                height: 4px;
                background: linear-gradient(90deg, #0ea5e9 0%, #38bdf8 50%, #0ea5e9 100%);
                margin: 0;
            }
            @media only screen and (max-width: 600px) {
                .email-container { 
                    margin: 0; 
                    border-radius: 0; 
                    border-left: none;
                    border-right: none;
                }
                .content { padding: 30px 20px; }
                .header { padding: 30px 20px; }
                .logo { font-size: 24px; }
                .button { 
                    padding: 14px 20px; 
                    width: 100%; 
                    font-size: 15px;
                    display: block;
                }
                .order-details { padding: 20px; }
                .content h1 { font-size: 24px; }
                .content h2 { font-size: 20px; }
            }
        </style>
    </head>
    <body>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
            <tr>
                <td>
                    <div class="email-container">
                        <div class="wave-divider"></div>
                        <div class="header">
                            <div class="logo">⚓ AdeGloba Starlink</div>
                            <div class="subtitle">Profesyonel Denizcilik İnternet Çözümleri</div>
                        </div>
                        <div class="content">
                            {{content}}
                        </div>
                        <div class="footer">
                            <div class="footer-brand">🌊 Ade Globa</div>
                            <div class="footer-links">
                                📧 Destek: <a href="mailto:starlink@adegloba.space">starlink@adegloba.space</a><br>
                                📞 Tel & WhatsApp: <a href="tel:+447440225375">+44 744 022 5375</a><br>
                                🌐 Web: <a href="https://adegloba.space">www.adegloba.space</a>
                            </div>
                            <div class="footer-copyright">
                                © 2025 Ade Globa Ltd. Tüm hakları saklıdır.<br>
                                Güvenilir ve Profesyonel Denizcilik İnternet Hizmetleri
                            </div>
                        </div>
                        <div class="wave-divider"></div>
                    </div>
                </td>
            </tr>
        </table>
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
              <span class="price">$\{{totalAmount}}</span>
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
          <h2>🚢 Yeni Sipariş Bildirimi</h2>
          <p>Sisteme yeni bir sipariş alındı ve ödeme tamamlandı:</p>
          
          <div class="order-details">
            <h3 class="maritime-accent">📦 Sipariş Bilgileri</h3>
            <div class="order-item"><strong>Sipariş No:</strong> <span class="highlight">{{orderNumber}}</span></div>
            <div class="order-item"><strong>Müşteri:</strong> <span class="highlight">{{customerName}}</span></div>
            <div class="order-item"><strong>E-posta:</strong> <span class="highlight">{{customerEmail}}</span></div>
            <div class="order-item"><strong>Gemi:</strong> <span class="highlight">{{shipName}}</span></div>
            <div class="order-item"><strong>Toplam Tutar:</strong> <span class="price">$\{{totalAmount}}</span></div>
          </div>
          
          <div class="order-details">
            <h3 class="maritime-accent">📋 Sipariş İçeriği</h3>
            <ul style="margin: 0; padding: 0; list-style: none;">{{orderItems}}</ul>
          </div>
          
          <div class="status-badge">✅ Ödeme Tamamlandı</div>
          <p style="margin-top: 20px;">Paketler otomatik olarak aktifleştiriliyor ve müşteriye bildirim gönderildi.</p>
          
          <div style="text-align: center;">
            <a href="{{adminUrl}}" class="button">🔧 Admin Paneline Git</a>
          </div>
        `);

      case 'admin_new_user':
        return baseTemplate.replace('{{content}}', `
          <h2>👥 Yeni Kullanıcı Kaydı</h2>
          <p>Sisteme yeni bir kullanıcı kayıt oldu ve hoşgeldin e-postası gönderildi:</p>
          
          <div class="order-details">
            <h3 class="maritime-accent">👤 Kullanıcı Bilgileri</h3>
            <div class="order-item"><strong>Ad Soyad:</strong> <span class="highlight">{{userName}}</span></div>
            <div class="order-item"><strong>Kullanıcı Adı:</strong> <span class="highlight">{{username}}</span></div>
            <div class="order-item"><strong>E-posta:</strong> <span class="highlight">{{userEmail}}</span></div>
            <div class="order-item"><strong>Telefon:</strong> <span class="highlight">{{userPhone}}</span></div>
            <div class="order-item"><strong>Gemi:</strong> <span class="highlight">{{shipName}}</span></div>
            <div class="order-item"><strong>Adres:</strong> <span class="highlight">{{userAddress}}</span></div>
          </div>
          
          <div class="status-badge">✅ Kayıt Başarılı</div>
          <p style="margin-top: 20px;">Kullanıcı sistemde aktif oldu ve kontrol paneline erişim sağladı.</p>
          
          <div style="text-align: center;">
            <a href="{{adminUrl}}" class="button">🔧 Admin Paneline Git</a>
          </div>
        `);

      case 'admin_monthly_report':
        return baseTemplate.replace('{{content}}', `
          <h2>📊 Aylık Sipariş Raporu</h2>
          <p><strong>{{reportMonth}}</strong> ayına ait sipariş ve gelir özet raporu:</p>
          
          <div class="order-details">
            <h3 class="maritime-accent">🚢 Gemi Bazında Detaylar</h3>
            {{shipStats}}
          </div>
          
          <div class="order-details">
            <h3 class="maritime-accent">📈 Genel Özet</h3>
            <div class="order-item"><strong>Toplam Sipariş:</strong> <span class="highlight">{{totalOrders}}</span></div>
            <div class="order-item"><strong>Toplam Gelir:</strong> <span class="price">$\{{totalRevenue}}</span></div>
            <div class="order-item"><strong>Toplam Veri:</strong> <span class="highlight">{{totalDataGB}} GB</span></div>
          </div>
          
          <div class="status-badge">📋 Rapor Hazır</div>
          <p style="margin-top: 20px;">Excel formatında detaylı rapor e-posta ekinde yer almaktadır.</p>
          
          <div style="text-align: center;">
            <a href="{{adminUrl}}" class="button">🔧 Admin Paneline Git</a>
          </div>
        `);

      case 'password_reset':
        return baseTemplate.replace('{{content}}', `
          <h2>🔑 Şifre Sıfırlama</h2>
          <p>Merhaba <span class="highlight">{{userName}}</span>,</p>
          <p>AdeGloba Starlink sisteminiz için şifre sıfırlama talebiniz alınmıştır. Yeni şifreniz aşağıda yer almaktadır:</p>
          
          <div class="order-details">
            <div class="status-badge">🔐 Yeni Şifreniz</div>
            <div class="order-item" style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-family: 'Courier New', monospace; font-size: 24px; color: #facc15; font-weight: bold; letter-spacing: 2px;">{{newPassword}}</span>
            </div>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 600;">⚠️ Güvenlik Uyarısı</p>
            <p style="color: #92400e; margin: 5px 0 0 0; font-size: 14px;">
              Giriş yaptıktan sonra şifrenizi değiştirmeniz önerilir. Profil sayfanızdan yeni bir şifre belirleyebilirsiniz.
            </p>
          </div>
          
          <p>Sisteme giriş yapmak için aşağıdaki butona tıklayabilirsiniz:</p>
          <div style="text-align: center;">
            <a href="{{loginUrl}}" class="button">🚀 Sisteme Giriş Yap</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
            Eğer bu işlemi siz yapmadıysanız, lütfen derhal <a href="mailto:{{supportEmail}}" style="color: #facc15;">{{supportEmail}}</a> adresinden bizimle iletişime geçin.
          </p>
          
          <p>İyi denizler! ⚓</p>
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
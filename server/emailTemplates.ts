import { storage } from './storage';

/**
 * Default email templates for internet package sales
 * These templates are automatically initialized on server startup
 */
export async function initializeDefaultEmailTemplates() {
  try {
    console.log('📧 Initializing default email templates...');
    
    // Check if templates already exist
    const existingTemplates = await storage.getEmailTemplates();
    if (existingTemplates.length > 0) {
      console.log('✅ Email templates already exist, skipping initialization');
      return;
    }

    const defaultTemplates = [
      {
        name: '🌐 İnternetin Bitti Mi? Yenileme Zamanı!',
        subject: 'İnternetin Dolmak Üzere - Hemen Yenile!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⚠️ İnternetin Dolmak Üzere!</h1>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 16px;">Deniz ortasında internetsiz kalmayın</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Merhaba <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                İnternet paketiniz neredeyse bitti! Denizde bağlantısız kalmamak için hemen yeni bir paket satın alın.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 15px; font-weight: 600;">
                  🚨 Uyarı: Paketiniz dolduğunda internet bağlantınız kesilecektir
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                AdeGloba Starlink ile denizde kesintisiz internet deneyimi yaşayın. Hızlı, güvenilir ve her zaman online!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      🚀 Hemen Paket Satın Al
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Sorularınız için: <a href="mailto:support@adegloba.space" style="color: #3b82f6; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '🎯 Paketi Satın Almayı Unutmayın',
        subject: 'Denizde İnternet İhtiyacınız Mı Var?',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🌊 Denizde Bağlantıda Kalın!</h1>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 16px;">Yolculuğunuz için internet paketinizi alın</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Sayın <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Deniz yolculuğunuz için internet paketinizi almayı unutmayın! AdeGloba Starlink ile okyanus ortasında bile hızlı ve güvenilir internet erişimi.
              </p>
              
              <div style="background-color: #dbeafe; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px; font-weight: 600;">✨ Neden AdeGloba?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                  <li>⚡ Yüksek hızlı internet bağlantısı</li>
                  <li>🌍 Küresel kapsama alanı</li>
                  <li>💪 7/24 kesintisiz hizmet</li>
                  <li>💰 Uygun fiyatlar</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      📦 Paketleri İncele
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Herhangi bir sorunuz varsa bizimle iletişime geçin!<br>
                E-posta: <a href="mailto:support@adegloba.space" style="color: #3b82f6; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '🎉 Yeni Kampanya Duyurusu',
        subject: '🎁 Özel Fırsat: Yeni İnternet Paketleri!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 Yeni Kampanya!</h1>
              <p style="margin: 10px 0 0 0; color: #ddd6fe; font-size: 18px; font-weight: 500;">Kaçırılmayacak Fırsatlar</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Merhaba <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Sizler için özel olarak hazırladığımız yeni internet paketlerini duyurmaktan mutluluk duyuyoruz!
              </p>
              
              <div style="background: linear-gradient(135deg, #ede9fe 0%, #f3e8ff 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #c4b5fd;">
                <h3 style="margin: 0 0 20px 0; color: #5b21b6; font-size: 20px; font-weight: 700; text-align: center;">🎁 Kampanya Detayları</h3>
                <div style="text-align: center;">
                  <p style="margin: 0 0 15px 0; color: #6d28d9; font-size: 18px; font-weight: 600;">
                    ✨ Yeni paketlerle daha fazla GB<br>
                    💰 Uygun fiyatlarla tasarruf<br>
                    🚀 Daha hızlı bağlantı
                  </p>
                </div>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Bu fırsatı kaçırmayın! Yeni paketlerimizi incelemek ve hemen satın almak için aşağıdaki butona tıklayın.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.4);">
                      🛒 Kampanyayı İncele
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Sorularınız için: <a href="mailto:support@adegloba.space" style="color: #7c3aed; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '💰 Özel İndirim Fırsatı',
        subject: 'Sadece Size Özel %20 İndirim Kodu!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">💰 ÖZEL İNDİRİM!</h1>
              <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 18px; font-weight: 500;">Sadece sizin için</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Değerli Müşterimiz <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Sadece size özel %20 indirim fırsatı! Bu fırsatı kaçırmayın ve internet paketlerinizi indirimli fiyatlarla satın alın.
              </p>
              
              <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; border: 3px dashed #dc2626;">
                <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: 600;">🎁 İndirim Kodunuz:</p>
                <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 15px 0;">
                  <code style="color: #dc2626; font-size: 32px; font-weight: 700; letter-spacing: 3px; font-family: monospace;">DENIZ20</code>
                </div>
                <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 14px; font-weight: 500;">
                  ⏰ Geçerlilik: 30 gün
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Bu özel indirim kodunu kullanarak tüm internet paketlerinde %20 tasarruf edin. Kod sınırlı süre için geçerlidir!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.4);">
                      🛍️ İndirimi Kullan
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>İpucu:</strong> İndirim kodu satın alma sırasında otomatik olarak uygulanacaktır.
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Yardıma mı ihtiyacınız var? <a href="mailto:support@adegloba.space" style="color: #dc2626; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '⏰ Paket Süreniz Dolmak Üzere',
        subject: '⚠️ Uyarı: Paketiniz 3 Gün İçinde Dolacak!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⏰ Paketiniz Dolmak Üzere!</h1>
              <p style="margin: 10px 0 0 0; color: #fed7aa; font-size: 16px;">Yenileme zamanı yaklaşıyor</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Sayın <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                İnternet paketiniz 3 gün içinde sona erecek. Bağlantınızın kesilmemesi için lütfen yeni bir paket satın alın.
              </p>
              
              <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 2px solid #f97316;">
                <div style="text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #7c2d12; font-size: 16px; font-weight: 600;">Kalan Süre</p>
                  <p style="margin: 0; color: #ea580c; font-size: 48px; font-weight: 700; line-height: 1;">3</p>
                  <p style="margin: 5px 0 0 0; color: #9a3412; font-size: 18px; font-weight: 600;">GÜN</p>
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                  ⚠️ Önemli Uyarı
                </p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  Paketiniz sona erdiğinde internet bağlantınız otomatik olarak kesilecektir. Kesintisiz hizmet için lütfen yeni paketinizi şimdi alın.
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Hemen yeni bir paket satın alarak denizde bağlantıda kalmaya devam edin!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(234, 88, 12, 0.4);">
                      🔄 Hemen Yenile
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Destek: <a href="mailto:support@adegloba.space" style="color: #ea580c; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '👋 Hoş Geldiniz',
        subject: 'AdeGloba Starlink\'e Hoş Geldiniz!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">👋 Hoş Geldiniz!</h1>
              <p style="margin: 10px 0 0 0; color: #cffafe; font-size: 18px; font-weight: 500;">AdeGloba Starlink Ailesine Katıldınız</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Merhaba <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                AdeGloba Starlink System'e hoş geldiniz! Denizlerde kesintisiz internet bağlantısı için doğru yerdesiniz.
              </p>
              
              <div style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
                <h3 style="margin: 0 0 20px 0; color: #164e63; font-size: 20px; font-weight: 700; text-align: center;">🌟 İlk Adımlarınız</h3>
                <div style="color: #155e75; font-size: 15px; line-height: 1.8;">
                  <p style="margin: 0 0 12px 0;">
                    <strong>1.</strong> Geminizi seçin ve kaydedin<br>
                    <strong>2.</strong> İhtiyacınıza uygun paketi belirleyin<br>
                    <strong>3.</strong> Güvenli ödeme ile satın alın<br>
                    <strong>4.</strong> Anında kullanmaya başlayın
                  </p>
                </div>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Herhangi bir sorunuz olursa destek ekibimiz size yardımcı olmak için her zaman hazır!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/packages" style="display: inline-block; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(8, 145, 178, 0.4);">
                      🚀 Paketleri Keşfet
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                  📧 Destek: support@adegloba.space<br>
                  🌐 Web: https://adegloba.toov.com.tr
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      },
      
      {
        name: '❤️ Teşekkürler - Satın Alma',
        subject: 'Siparişiniz İçin Teşekkür Ederiz!',
        content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 60px; line-height: 1; margin-bottom: 10px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Siparişiniz Alındı!</h1>
              <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">Teşekkür ederiz</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Değerli <strong>{kullanici_adi}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                AdeGloba Starlink'i tercih ettiğiniz için çok teşekkür ederiz! Siparişiniz başarıyla alındı ve işleme konuldu.
              </p>
              
              <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 2px solid #10b981;">
                <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 700; text-align: center;">📦 Sipariş Detayları</h3>
                <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                  <table width="100%" cellpadding="8" cellspacing="0">
                    <tr>
                      <td style="color: #64748b; font-size: 14px;">Sipariş No:</td>
                      <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">#12345</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-size: 14px;">Paket:</td>
                      <td style="color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">Premium 100GB</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-size: 14px;">Tutar:</td>
                      <td style="color: #10b981; font-size: 16px; font-weight: 700; text-align: right;">$99.99</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">📋 Sonraki Adımlar:</h4>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  1. Giriş bilgileriniz e-posta ile gönderilecek<br>
                  2. Sisteme giriş yapabilirsiniz<br>
                  3. İnternet erişiminiz otomatik olarak başlayacak
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Herhangi bir sorunuz olursa lütfen bizimle iletişime geçin. İyi denizler dileriz! ⛵
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://adegloba.toov.com.tr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      📊 Siparişimi Görüntüle
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                Yardım: <a href="mailto:support@adegloba.space" style="color: #10b981; text-decoration: none;">support@adegloba.space</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                © 2025 AdeGloba Starlink System. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      }
    ];

    // Insert all default templates
    for (const template of defaultTemplates) {
      await storage.createEmailTemplate(template);
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log(`✅ Successfully initialized ${defaultTemplates.length} email templates`);
  } catch (error) {
    console.error('❌ Error initializing email templates:', error);
  }
}

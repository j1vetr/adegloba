const WPILETI_API_KEY = "db12af64a73ccb0c8589327ee51ba976a6258aee";
const ADMIN_SUPPORT_PHONE = "447440225375";
const WPILETI_ENDPOINT = "https://my.wpileti.com/api/send-message";

function formatPhone(phone: string): string {
  return phone.replace(/[\+\s\-\(\)]/g, '');
}

function buildFooter(): string[] {
  return [
    ``,
    `Herhangi bir sorununuz olması halinde bu sohbet üzerinden yanıt verebilir, sorularınızı iletebilirsiniz.`,
    ``,
    `İyi seyirler! ⚓`,
    `AdeGloba Starlink Destek`,
  ];
}

async function sendWhatsApp(phone: string, messageText: string): Promise<{ success: boolean; message: string }> {
  const formattedPhone = formatPhone(phone);

  if (!formattedPhone || formattedPhone.length < 10) {
    return { success: false, message: 'Geçersiz telefon numarası formatı' };
  }

  try {
    const response = await fetch(WPILETI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify({
        api_key: WPILETI_API_KEY,
        receiver: formattedPhone,
        data: { message: messageText },
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`✅ WhatsApp sent to ${formattedPhone}:`, result);
      return { success: true, message: `WhatsApp mesajı ${formattedPhone} numarasına gönderildi` };
    } else {
      console.error(`❌ WhatsApp API error for ${formattedPhone}:`, result);
      return { success: false, message: `API hatası: ${JSON.stringify(result)}` };
    }
  } catch (error) {
    const errMsg = (error as Error).message || 'Bilinmeyen hata';
    console.error('❌ WhatsApp send error:', errMsg);
    return { success: false, message: `Bağlantı hatası: ${errMsg}` };
  }
}

// ─── Manuel Paket Atama Bildirimi ───────────────────────────────────────────

export interface PackageWhatsAppData {
  fullName: string;
  email: string;
  dataLimitGb: number;
  planName: string;
  adminNote?: string;
}

export async function sendPackageAssignmentWhatsApp(
  phone: string,
  data: PackageWhatsAppData
): Promise<{ success: boolean; message: string }> {
  const lines: string[] = [
    `🛰️ *ADS.ADEGLOBA.SPACE Bilgilendirmesi*`,
    ``,
    `Sayın *${data.fullName}*,`,
    ``,
    `*${data.dataLimitGb} GB* (${data.planName}) paketiniz kullanıcınıza tanımlanmıştır.`,
    `📅 Geçerlilik süresi: Ay sonuna kadar`,
    ``,
    `Kullanıcı bilgilerinizi görmek için sisteme giriş sağlayınız → *${data.email}*`,
  ];

  if (data.adminNote?.trim()) {
    lines.push(``);
    lines.push(`📝 ${data.adminNote.trim()}`);
  }

  lines.push(...buildFooter());

  return sendWhatsApp(phone, lines.join('\n'));
}

// ─── Admin: Yeni Destek Talebi Bildirimi ─────────────────────────────────────

export interface NewTicketAdminNotificationData {
  fullName: string;
  email: string;
  phone?: string | null;
  shipName?: string | null;
  subject: string;
  message: string;
  priority: string;
}

export async function sendNewTicketAdminWhatsApp(
  data: NewTicketAdminNotificationData
): Promise<{ success: boolean; message: string }> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const timeStr = now.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });

  const priorityEmoji: Record<string, string> = {
    'Düşük': '🟢', 'Orta': '🟡', 'Yüksek': '🔴', 'Acil': '🚨',
  };
  const pEmoji = priorityEmoji[data.priority] || '⚡';

  // Mesajı 200 karakterle sınırla (uzunsa kes)
  const previewMsg = data.message.length > 200
    ? data.message.substring(0, 200) + '...'
    : data.message;

  const lines: string[] = [
    `🎫 *Yeni Destek Talebi*`,
    ``,
    `👤 Kişi: *${data.fullName}*`,
  ];

  if (data.shipName) lines.push(`🚢 Gemi: *${data.shipName}*`);
  lines.push(`📧 E-posta: ${data.email}`);
  if (data.phone?.trim()) lines.push(`📱 Telefon: ${data.phone}`);

  lines.push(
    ``,
    `📌 Konu: ${data.subject}`,
    `${pEmoji} Öncelik: *${data.priority}*`,
    ``,
    `💬 Mesaj:`,
    previewMsg,
    ``,
    `🕐 ${dateStr} - ${timeStr}`,
    ``,
    `Admin panelinden görüntülemek için: ads.adegloba.space/admin/tickets`,
  );

  return sendWhatsApp(ADMIN_SUPPORT_PHONE, lines.join('\n'));
}

// ─── Sipariş Onayı Bildirimi ─────────────────────────────────────────────────

export interface OrderConfirmationWhatsAppData {
  fullName: string;
  email: string;
  dataLimitGb: number;
  planName: string;
  totalUsd: string;
}

export async function sendOrderConfirmationWhatsApp(
  phone: string,
  data: OrderConfirmationWhatsAppData
): Promise<{ success: boolean; message: string }> {
  const lines: string[] = [
    `🛰️ *ADS.ADEGLOBA.SPACE Bilgilendirmesi*`,
    ``,
    `Sayın *${data.fullName}*,`,
    ``,
    `Ödemeniz başarıyla alınmış olup *${data.dataLimitGb} GB* (${data.planName}) paketiniz hesabınıza tanımlanmıştır.`,
    ``,
    `💳 Ödeme Tutarı: *$${data.totalUsd}*`,
    `📅 Geçerlilik süresi: Ay sonuna kadar`,
    ``,
    `Kullanıcı bilgilerinizi görmek için sisteme giriş sağlayınız → *${data.email}*`,
  ];

  lines.push(...buildFooter());

  return sendWhatsApp(phone, lines.join('\n'));
}

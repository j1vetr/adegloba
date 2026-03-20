const WPILETI_API_KEY = "db12af64a73ccb0c8589327ee51ba976a6258aee";
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

import { SITE } from '@/lib/utils/site-config';
import { formatDate, formatTRY } from '@/lib/utils/format';
import type { EmailEnvelope } from '@/lib/email/send';

interface BookingConfirmedArgs {
  to: string;
  name: string;
  bookingCode: string;
  dealTitle: string;
  selectedDate?: string | null;
  selectedTime?: string | null;
  quantity: number;
  totalAmount: number | string;
}

export function bookingConfirmedEmail({
  to,
  name,
  bookingCode,
  dealTitle,
  selectedDate,
  selectedTime,
  quantity,
  totalAmount,
}: BookingConfirmedArgs): EmailEnvelope {
  const dateLine = selectedDate
    ? `${formatDate(selectedDate)}${selectedTime ? ` · ${selectedTime.slice(0, 5)}` : ''}`
    : 'Belirtilmedi';
  const total = formatTRY(totalAmount);
  const link = `${SITE.url}/rezervasyonlarim/${bookingCode}`;

  const text = `Merhaba ${name},

Rezervasyonun onaylandı. Detaylar aşağıda:

  Fırsat: ${dealTitle}
  Kod:    ${bookingCode}
  Tarih:  ${dateLine}
  Kişi:   ${quantity}
  Toplam: ${total}

E-biletini bu adresten görüntüleyebilirsin:
${link}

İyi eğlenceler!
gidek ekibi

(Bu mesaj demo akışın bir parçasıdır; gerçek ödeme tahsil edilmemiştir.)
`;

  // Minimal inline-styled HTML — çoğu mail istemcisi external CSS desteklemez.
  const html = `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><title>Rezervasyon onayı</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f4f5;color:#0a0a0a;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 28px 0;">
          <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;">Rezervasyonun onaylandı 🎉</h1>
          <p style="margin:0;color:#52525b;font-size:14px;">Merhaba ${escapeHtml(name)},</p>
        </td></tr>
        <tr><td style="padding:16px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;">
            <tr><td style="padding:6px 0;color:#71717a;width:90px;">Fırsat</td><td style="padding:6px 0;font-weight:500;">${escapeHtml(dealTitle)}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Kod</td><td style="padding:6px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(bookingCode)}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Tarih</td><td style="padding:6px 0;">${escapeHtml(dateLine)}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Kişi</td><td style="padding:6px 0;">${quantity}</td></tr>
            <tr><td style="padding:6px 0;color:#71717a;">Toplam</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(total)}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 28px 24px;">
          <a href="${link}" style="display:inline-block;background:#0a0a0a;color:#fafafa;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">E-bileti görüntüle</a>
        </td></tr>
        <tr><td style="padding:0 28px 24px;color:#71717a;font-size:12px;line-height:1.6;">
          Bu mesaj demo akışın bir parçasıdır; gerçek ödeme tahsil edilmemiştir.<br>
          gidek ekibi
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { to, subject: `Rezervasyon onayı · ${bookingCode}`, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

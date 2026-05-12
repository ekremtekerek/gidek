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

  return { to, subject: `Rezervasyon onayı · ${bookingCode}`, text };
}

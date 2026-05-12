import 'server-only';
import QRCode from 'qrcode';

/**
 * Booking code'unu encode eden QR kod data URL'i üretir. Server-side render
 * sırasında çalışır; client'a <img src=…> olarak gider, ek JS gerekmez.
 */
export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: {
      dark: '#0a0a0a',
      light: '#ffffff',
    },
  });
}

/**
 * Calendar export yardımcıları — booking sonrası "Takvime ekle" akışı.
 *
 * Üç çıktı tipi:
 *  1. Google Calendar deep link — yeni sekme açar, kullanıcı kendi
 *     hesabında "save" der.
 *  2. Apple/Outlook için `.ics` (iCalendar) — base64 data URL.
 *  3. Şirket içi kullanımda paylaşılabilir webcal:// olabilir (V2).
 *
 * Tüm tarihler UTC'ye çevrilir; takvim app'leri kullanıcının lokal saatine
 * dönüştürür. Türkiye Asia/Istanbul (+03:00) olduğu için server-side
 * timezone shift'i yok.
 */

export interface CalendarEventInput {
  title: string;
  /** Açıklama metni — markdown desteklenmez, düz metin */
  description?: string;
  location?: string;
  /** ISO date veya datetime (örn. "2026-05-20" veya "2026-05-20T19:00:00") */
  start: string;
  /** Süre (dakika); end hesaplaması için. Verilmezse 2 saat varsayılır. */
  durationMinutes?: number;
  /** İptal bağlantısı vb için detaya yönlendiren URL */
  url?: string;
}

const DEFAULT_DURATION_MIN = 120;

/**
 * Tarih + saat string'lerini UTC ISO format (`20260520T160000Z`) iCal/Google
 * formatına çevirir. Tarih-only girdide saat 12:00 (öğle) varsayılır.
 */
function toIcsDateTime(value: string, fallbackMinutesOffset = 0): string {
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Date-only — gün ortası varsay (TR'de UTC+3 → 12:00 local = 09:00 UTC)
    date = new Date(`${value}T12:00:00+03:00`);
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    // Lokal datetime, TR timezone varsay
    const withTz = value.includes('+') || value.includes('Z') ? value : `${value}:00+03:00`;
    date = new Date(withTz);
  } else {
    date = new Date(value);
  }

  if (fallbackMinutesOffset !== 0) {
    date = new Date(date.getTime() + fallbackMinutesOffset * 60_000);
  }

  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return iso;
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Google Calendar "TEMPLATE" deep link — kullanıcı hesabıyla yeni sekme.
 * Mobil'de Google Calendar app'i intercept eder.
 */
export function googleCalendarUrl(event: CalendarEventInput): string {
  const start = toIcsDateTime(event.start);
  const end = toIcsDateTime(event.start, event.durationMinutes ?? DEFAULT_DURATION_MIN);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * `.ics` (iCalendar 2.0) içeriği. Apple Calendar, Outlook, herhangi bir
 * standard takvim uygulaması import edebilir. UTF-8 plain text döner.
 */
export function buildIcsContent(event: CalendarEventInput, uidNamespace = 'gidek.net'): string {
  const start = toIcsDateTime(event.start);
  const end = toIcsDateTime(event.start, event.durationMinutes ?? DEFAULT_DURATION_MIN);
  const uid = `${cryptoRandom()}@${uidNamespace}`;
  const stamp = toIcsDateTime(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${uidNamespace}//gidek booking//TR`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    event.url ? `URL:${event.url}` : null,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Browser'da `.ics` indirme: data URL'i Blob'a çevirip <a download> tetikler.
 * Server tarafında çalışmaz — sadece client component'lerden çağrılır.
 */
export function downloadIcs(filename: string, content: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cryptoRandom(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

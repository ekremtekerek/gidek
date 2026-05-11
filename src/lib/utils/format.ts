const TRY_FORMATTER = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
});

export function formatTRY(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return TRY_FORMATTER.format(value);
}

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(date: string | Date): string {
  return DATE_FORMATTER.format(typeof date === 'string' ? new Date(date) : date);
}

/**
 * Format minutes as Turkish-friendly duration: `1 sa 30 dk` / `45 dk`.
 */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} dk`;
  if (rest === 0) return `${hours} sa`;
  return `${hours} sa ${rest} dk`;
}

/**
 * Turkish-aware slug generator. Removes diacritics, replaces spaces with `-`.
 * Output is URL- and DB-safe (matches the CHECK constraint vocabulary patterns).
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

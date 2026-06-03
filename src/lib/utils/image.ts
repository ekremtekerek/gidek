/**
 * Görsel yardımcıları — affiliate kaynağı firsatbufirsat CDN'i görselleri hazır
 * boyut varyantlarıyla sunuyor (.../image/400x400/... ve .../1200x1200/...).
 * Kart gibi küçük yerlerde 1200x1200 indirip Next optimizer ile küçültmek yavaş;
 * bunun yerine CDN'in 400x400 varyantını alıp optimizer'ı atlıyoruz.
 */

const FBF_CDN = 'cdn.firsatbufirsat.com';

/** Görsel firsatbufirsat CDN'inden mi? (Next optimizer'ı atlamak için.) */
export function isFbfImage(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes(FBF_CDN);
}

/**
 * firsatbufirsat CDN URL'inin boyut segmentini (`/400x400/`, `/1200x1200/`)
 * istenen boyuta çevirir. CDN değilse URL'i aynen döndürür.
 */
export function fbfResize(url: string, size: '400x400' | '1200x1200'): string {
  if (!isFbfImage(url)) return url;
  return url.replace(/\/\d+x\d+\//, `/${size}/`);
}

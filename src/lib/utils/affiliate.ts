/**
 * Affiliate akışı yardımcıları. Tek pivot kararı: tüm "Satın Al" CTA'ları
 * önce bizdeki köprü sayfasına (/git/[slug]) gider; orada kullanıcı bilet
 * tipi/seans seçip firsatbufirsat checkout'una (pid'li) yönlenir.
 */

/** Bir deal'ın satın-alma CTA hedefi (affiliate köprü sayfası). */
export function dealCtaHref(slug: string): string {
  return `/git/${slug}`;
}

/** Tıklama → checkout redirect endpoint'i. */
export function affiliateGoHref(dealId: string, subDealId?: string): string {
  const params = new URLSearchParams({ deal: dealId });
  if (subDealId) params.set('opt', subDealId);
  return `/api/affiliate/go?${params.toString()}`;
}

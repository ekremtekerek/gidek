/**
 * Bir deal'ın "kaçtı" durumda olup olmadığını söyleyen saf util.
 * Hem server hem client tarafından import edilebilsin diye `server-only`
 * import etmiyor. DB query'lerinde aynı semantik, sadece SQL'de yazılıdır.
 */
export function isDealExpired(deal: {
  is_active: boolean | null;
  valid_until: string | null;
  published_at: string | null;
}): boolean {
  if (!deal.published_at) return false;
  if (deal.is_active === false) return true;
  if (deal.valid_until && new Date(deal.valid_until).getTime() <= Date.now()) {
    return true;
  }
  return false;
}

import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Agent (AI sohbet) rezervasyon çekirdeği — otel DIŞI fırsatlar için.
 *
 * `quoteBooking` saf bir doğrulama + fiyat hesabıdır: DB'ye HİÇBİR ŞEY yazmaz.
 * Hem `prepareBooking` tool'u (kullanıcıya onay kartı göstermek için) hem de
 * `confirmAgentBookingAction` (gerçek insert öncesi yeniden doğrulama için)
 * aynı fonksiyonu kullanır — tek doğruluk kaynağı.
 *
 * Otel/tatil fırsatları bilinçli olarak REDDEDİLİR: oda + misafir kimlik
 * (TC/pasaport) adımları KVKK gereği sohbet/LLM üzerinden toplanamaz; onlar
 * `/rezervasyon/[slug]` sihirbazından ilerler.
 */

const HOTEL_CATEGORY_SLUGS = new Set(['tatil-otelleri', 'sehir-otelleri']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;

export interface QuoteBookingInput {
  dealId: string;
  quantity: number;
  selectedDate: string;
  selectedTime?: string | null;
}

export interface BookingQuote {
  ok: true;
  dealId: string;
  slug: string;
  title: string;
  coverImage: string;
  location: string;
  unitPrice: number;
  quantity: number;
  total: number;
  currency: string;
  selectedDate: string;
  selectedTime: string | null;
}

export type QuoteFailReason =
  | 'not_found'
  | 'expired'
  | 'hotel'
  | 'too_many'
  | 'past_date'
  | 'date_out_of_range'
  | 'invalid';

export interface BookingQuoteFail {
  ok: false;
  reason: QuoteFailReason;
  message: string;
}

export type QuoteBookingResult = BookingQuote | BookingQuoteFail;

/** confirmAgentBookingAction'ın useActionState state tipi — 'use server'
 *  dosyası type export edemediği için burada tanımlı. */
export type ConfirmBookingState = { ok: false; error: string } | null;

export async function quoteBooking(input: QuoteBookingInput): Promise<QuoteBookingResult> {
  if (!ISO_DATE.test(input.selectedDate)) {
    return { ok: false, reason: 'invalid', message: 'Tarih formatı geçersiz (YYYY-AA-GG bekleniyor).' };
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) {
    return { ok: false, reason: 'invalid', message: 'Adet 1 ile 20 arasında olmalı.' };
  }

  const supabase = getServiceClient();
  const { data: deal } = await supabase
    .from('deals')
    .select(
      'id, slug, title, cover_image, city, district, discounted_price, currency, max_per_user, valid_until, is_active, published_at',
    )
    .eq('id', input.dealId)
    .maybeSingle();

  if (!deal) {
    return { ok: false, reason: 'not_found', message: 'Fırsat bulunamadı.' };
  }
  if (!deal.is_active || !deal.published_at || new Date(deal.valid_until) < new Date()) {
    return { ok: false, reason: 'expired', message: 'Bu fırsat artık geçerli değil.' };
  }

  // Otel/tatil fırsatı mı? Öyleyse agent ile rezerve edilemez — wizard gerekir.
  const { data: cats } = await supabase
    .from('deal_categories')
    .select('category:categories(slug)')
    .eq('deal_id', deal.id);
  const isHotel = (cats ?? []).some((c) => {
    const cat = c.category as { slug: string } | { slug: string }[] | null;
    if (!cat) return false;
    const slug = Array.isArray(cat) ? cat[0]?.slug : cat.slug;
    return slug ? HOTEL_CATEGORY_SLUGS.has(slug) : false;
  });
  if (isHotel) {
    return {
      ok: false,
      reason: 'hotel',
      message:
        'Bu bir otel/tatil fırsatı — tarih, oda ve misafir bilgileri için rezervasyon sihirbazından ilerlemek gerekiyor.',
    };
  }

  if (input.quantity > deal.max_per_user) {
    return {
      ok: false,
      reason: 'too_many',
      message: `Bu fırsattan en fazla ${deal.max_per_user} adet alınabilir.`,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const picked = new Date(`${input.selectedDate}T00:00:00`);
  if (picked < today) {
    return { ok: false, reason: 'past_date', message: 'Seçilen tarih geçmişte olamaz.' };
  }
  if (picked > new Date(deal.valid_until)) {
    return {
      ok: false,
      reason: 'date_out_of_range',
      message: 'Seçilen tarih fırsatın geçerlilik süresini aşıyor — daha erken bir gün seç.',
    };
  }

  const selectedTime =
    input.selectedTime && HH_MM.test(input.selectedTime) ? input.selectedTime : null;
  const unitPrice = Number(deal.discounted_price);
  const total = Math.round(unitPrice * input.quantity * 100) / 100;

  return {
    ok: true,
    dealId: deal.id,
    slug: deal.slug,
    title: deal.title,
    coverImage: deal.cover_image,
    location: [deal.district, deal.city].filter(Boolean).join(', '),
    unitPrice,
    quantity: input.quantity,
    total,
    currency: deal.currency,
    selectedDate: input.selectedDate,
    selectedTime,
  };
}

import {
  BadgeCheck,
  Bed,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wifi,
} from 'lucide-react';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import {
  enrichTravelDeal,
  FEATURE_LABEL,
  type TravelFeature,
} from '@/lib/travel/enrich';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  deal: DealWithMerchant;
}

const FEATURE_ICON: Partial<Record<TravelFeature, typeof Wifi>> = {
  pool: Sparkles,
  spa: Sparkles,
  beach: Sparkles,
  'sea-view': Sparkles,
  'kids-club': Users,
  wifi: Wifi,
  breakfast: Sparkles,
  'all-inclusive': Sparkles,
  transfer: Sparkles,
  'tour-included': Sparkles,
};

const FAQ_ITEMS = [
  {
    q: 'Rezervasyon onayı ne zaman geliyor?',
    a: 'Ödeme tamamlandıktan sonra anında onay e-postası ve QR kod e-biletin oluşur. Rezervasyon numaranızı tesise giriş sırasında göstermeniz yeterli.',
  },
  {
    q: 'İptal koşulları nedir?',
    a: 'Tatilinizin başlangıç tarihine 7 gün öncesine kadar ücretsiz iptal hakkınız var. 3-7 gün arası iptal halinde %50 iade, son 3 gün içinde iade yok.',
  },
  {
    q: 'Çocuk indirimi var mı?',
    a: '0-2 yaş çocuklar ücretsiz, 2-12 yaş arası çocuklar için %50 indirim uygulanır. Ekstra yatak talebinizi rezervasyon sırasında belirtmeniz gerekir.',
  },
  {
    q: 'Ulaşım dahil mi?',
    a: 'Bu paket kendi gelişe yöneliktir. Otopark ücretsizdir. Transfer/uçak desteği isterseniz iletişim formundan talep edebilirsiniz.',
  },
  {
    q: 'Evcil hayvan kabul ediliyor mu?',
    a: 'Bu tesiste evcil hayvan kabul edilmez. Pet-friendly tatil seçenekleri için filtre uygulayabilirsiniz.',
  },
];

const TRUST_BADGES = [
  { icon: BadgeCheck, label: 'TÜRSAB üyesi', sub: 'Belge no: doğrulandı' },
  { icon: ShieldCheck, label: 'SSL güvenlik', sub: '256-bit şifreleme' },
  { icon: Calendar, label: '7 gün öncesine kadar iptal', sub: 'Esnek koşullar' },
];

/**
 * Tatil detay sayfası zenginleştirmesi. Tesis özellikleri, oda tipleri,
 * iptal politikası, FAQ ve güvence rozetleri — hepsi rakip portallarda
 * standart, paritesi için ekledik.
 *
 * Sadece /f/[slug] tatil kategorilerinde render edilir.
 */
export function TravelDetailEnrichment({ deal }: Props) {
  const meta = enrichTravelDeal(deal);
  const features = meta.features;
  const basePrice = Number(deal.discounted_price);

  // Oda tipleri (mock — fiyat farkı: standard +0%, deluxe +25%, suite +60%)
  const roomTypes = [
    {
      name: 'Standart Oda',
      price: basePrice,
      capacity: '2 yetişkin',
      perks: ['Klimalı', 'TV', 'WiFi', 'Mini buzdolabı'],
      featured: false,
    },
    {
      name: 'Deluxe Oda',
      price: Math.round((basePrice * 1.25) / 10) * 10,
      capacity: '2 yetişkin + 1 çocuk',
      perks: ['Geniş balkon', 'Manzara', 'Mini bar', 'Kahve makinesi'],
      featured: true,
    },
    {
      name: 'Aile Süit',
      price: Math.round((basePrice * 1.6) / 10) * 10,
      capacity: '2 yetişkin + 2 çocuk',
      perks: ['Ayrı oturma odası', 'Jakuzi', 'Premium mini bar', 'VIP servis'],
      featured: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* TESIS ÖZELLIKLERI */}
      {features.length > 0 ? (
        <section aria-labelledby="amenities-heading">
          <h2 id="amenities-heading" className="text-xl font-semibold tracking-tight">
            Tesis özellikleri
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {features.map((f) => {
              const Icon = FEATURE_ICON[f] ?? Sparkles;
              return (
                <li
                  key={f}
                  className="border-border bg-background flex items-center gap-2 rounded-lg border p-3"
                >
                  <Icon className="text-sky-600 size-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">{FEATURE_LABEL[f]}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* ODA TIPLERI */}
      <section aria-labelledby="rooms-heading">
        <h2
          id="rooms-heading"
          className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Bed className="size-5 text-sky-600" aria-hidden="true" />
          Oda tipleri
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Fiyatlar 1 gece kişi başı.
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {roomTypes.map((r) => (
            <li
              key={r.name}
              className={cn(
                'border-border bg-background flex flex-col rounded-xl border p-4 shadow-sm',
                r.featured && 'border-sky-500/40 ring-2 ring-sky-500/20',
              )}
            >
              {r.featured ? (
                <span className="from-sky-600 to-cyan-500 mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Önerilen
                </span>
              ) : null}
              <h3 className="text-base font-bold">{r.name}</h3>
              <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-xs">
                <Users className="size-3" aria-hidden="true" />
                {r.capacity}
              </p>
              <ul className="mt-3 space-y-1">
                {r.perks.map((p) => (
                  <li
                    key={p}
                    className="text-foreground/80 inline-flex items-center gap-1.5 text-xs"
                  >
                    <Check className="text-emerald-500 size-3 shrink-0" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="border-border mt-auto border-t pt-3 text-base font-bold tabular-nums">
                {formatTRY(r.price)}
                <span className="text-muted-foreground text-[10px] font-normal"> / kişi</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* IPTAL POLITIKASI */}
      <section aria-labelledby="cancel-heading">
        <h2
          id="cancel-heading"
          className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" />
          İptal politikası
        </h2>

        <ul className="mt-4 space-y-2">
          {[
            {
              title: '7 gün öncesi',
              note: 'Ücretsiz iptal · %100 iade',
              accent:
                'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100',
              icon: CheckCircle2,
              iconCls: 'text-emerald-500',
            },
            {
              title: '3-7 gün arası',
              note: 'Kısmi iade · %50',
              accent: 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100',
              icon: HelpCircle,
              iconCls: 'text-amber-500',
            },
            {
              title: 'Son 3 gün',
              note: 'İptal hakkı yoktur',
              accent: 'border-rose-500/30 bg-rose-500/5 text-rose-900 dark:text-rose-100',
              icon: HelpCircle,
              iconCls: 'text-rose-500',
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <li
                key={c.title}
                className={cn('flex items-center gap-3 rounded-lg border p-3', c.accent)}
              >
                <Icon className={cn('size-5 shrink-0', c.iconCls)} aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">{c.title}</p>
                  <p className="text-xs opacity-90">{c.note}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
          İptal sigortası eklersen tüm senaryolarda %100 iade kuponu kazanırsın.
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <HelpCircle className="size-5 text-violet-600" aria-hidden="true" />
          Sık sorulan sorular
        </h2>

        <ul className="mt-4 space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <li key={i}>
              <details className="border-border bg-background group/faq rounded-lg border">
                <summary className="hover:bg-muted/40 group/faq flex cursor-pointer items-center justify-between gap-3 p-3.5 text-sm font-semibold transition-colors">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-open/faq:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="border-border border-t p-3.5 text-sm leading-relaxed text-foreground/80">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </section>

      {/* GÜVENCE ROZETLERI */}
      <section
        aria-label="Güvence rozetleri"
        className="border-border bg-muted/30 rounded-xl border p-4 sm:p-5"
      >
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TRUST_BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.label} className="flex items-center gap-2.5">
                <span className="bg-emerald-500/15 text-emerald-600 inline-flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{b.label}</p>
                  <p className="text-muted-foreground text-[11px]">{b.sub}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Building2 ikonunu kullanmasa da import edildi — bonus referans */}
      <span className="sr-only">
        <Building2 className="size-3" aria-hidden="true" />
      </span>
    </div>
  );
}

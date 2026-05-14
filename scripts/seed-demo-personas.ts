/**
 * Demo persona seed — hackathon/pitch akıcılığı için 3 zengin profil.
 *
 * Çalıştırma: `npm run seed:personas`
 *
 * Idempotent: aynı email'lere sahip kullanıcılar varsa update eder; verileri
 * temizleyip yeniden basar (favoriler, saved searches, bookings).
 *
 * Hesaplar:
 *   demo-asli@gidek.demo   — çift, romantik akşamlar
 *   demo-mehmet@gidek.demo — aile + çocuklu, aktivite/kahvaltı
 *   demo-zeynep@gidek.demo — solo, kahvaltı + güzellik
 *
 * Şifre tüm hesaplar için: demo123!
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Make sure .env.local is set.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEMO_PASSWORD = 'demo123!';

interface Persona {
  email: string;
  displayName: string;
  phone: string;
  preferences: {
    city: string;
    district: string;
    household_type: 'couple' | 'family_with_kids' | 'single';
    kids_age_groups?: string[];
    budget_min: number;
    budget_max: number;
    interests: string[];
    dietary?: string[];
  };
  /** Tag'leri içeren deal'lerden favori yap — substring match. */
  favoriteTagHints: string[];
  /** Saved searches içerikleri. */
  savedSearches: { name: string; query: string }[];
  /** Booking kategorileri — bu kategorideki ilk deal'den 1 adet rezerve eder. */
  bookingCategoryHints: string[];
  /**
   * Bu persona bir işletme yöneticisi mi? Belirtilirse profiles.merchant_id
   * ilgili slug'a karşılık gelen merchant id'sine atanır → /isletme portal
   * erişimi açılır.
   */
  merchantSlug?: string;
  household_type_override?: 'family_no_kids' | 'friends';
}

const PERSONAS: Persona[] = [
  {
    email: 'demo-asli@gidek.demo',
    displayName: 'Aslı',
    phone: '+90 555 111 22 33',
    preferences: {
      city: 'İstanbul',
      district: 'Kadıköy',
      household_type: 'couple',
      budget_min: 200,
      budget_max: 1500,
      interests: ['Tiyatro', 'Akşam yemeği', 'Kahvaltı', 'Konser', 'Masaj'],
      dietary: ['vejetaryen'],
    },
    favoriteTagHints: ['romantik', 'deniz-manzarali', 'sessiz'],
    savedSearches: [
      { name: 'Hafta sonu romantik akşam', query: 'Cumartesi akşam çiftler için romantik bir yer' },
      { name: 'Pazar brunch', query: 'Pazar brunch için sessiz ve hoş bir mekan' },
    ],
    bookingCategoryHints: ['yemek', 'kahvalti'],
  },
  {
    email: 'demo-mehmet@gidek.demo',
    displayName: 'Mehmet',
    phone: '+90 555 222 33 44',
    preferences: {
      city: 'İstanbul',
      district: 'Beşiktaş',
      household_type: 'family_with_kids',
      kids_age_groups: ['4-6', '7-12'],
      budget_min: 300,
      budget_max: 2500,
      interests: ['Aktivite', 'Kahvaltı', 'Tatil', 'Müze', 'Hayvanat Bahçesi'],
    },
    favoriteTagHints: ['cocuk-dostu', 'dogada', 'acik-hava'],
    savedSearches: [
      { name: 'Çocuklarla haftasonu', query: 'Haftasonu ailecek çocuk dostu bir aktivite' },
      { name: 'Tatil planı', query: '4 kişilik aile tatili için uygun otel önerileri' },
    ],
    bookingCategoryHints: ['aktivite', 'kahvalti'],
  },
  {
    email: 'demo-zeynep@gidek.demo',
    displayName: 'Zeynep',
    phone: '+90 555 333 44 55',
    preferences: {
      city: 'İstanbul',
      district: 'Şişli',
      household_type: 'single',
      budget_min: 100,
      budget_max: 800,
      interests: ['Kahvaltı', 'Güzellik', 'Masaj', 'Stand-up', 'Kafe'],
    },
    favoriteTagHints: ['huzurlu', 'samimi', 'gece-hayati'],
    savedSearches: [
      { name: 'Spa günü', query: 'Stresliyim beni rahatlatacak bir spa veya masaj' },
      { name: 'Yalnız kahvaltı', query: 'Tek başına kahvaltı yapabileceğim huzurlu kafe' },
    ],
    bookingCategoryHints: ['masaj', 'kahvalti'],
  },
  {
    email: 'demo-isletme@gidek.demo',
    displayName: 'Mehtap (Boğaz Kahve Evi)',
    phone: '+90 555 444 55 66',
    preferences: {
      city: 'İstanbul',
      district: 'Beşiktaş',
      household_type: 'single',
      budget_min: 0,
      budget_max: 0,
      interests: ['İşletme', 'Operasyon'],
    },
    favoriteTagHints: [],
    savedSearches: [],
    bookingCategoryHints: [],
    merchantSlug: 'bogaz-kahve-evi',
  },
];

async function ensureUser(persona: Persona): Promise<string> {
  // listUsers ile email kontrolü — admin API direct lookup desteklemiyor.
  const { data: existing } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const match = existing?.users.find((u) => u.email === persona.email);

  if (match) {
    // Şifreyi sabitle, email_confirmed_at'ı zorla.
    await supabase.auth.admin.updateUserById(match.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    return match.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: persona.displayName },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create ${persona.email}: ${error?.message}`);
  }
  return data.user.id;
}

async function setupProfile(userId: string, persona: Persona): Promise<void> {
  // Merchant atanacaksa slug → id lookup yap.
  let merchantId: string | null = null;
  if (persona.merchantSlug) {
    const { data: m } = await supabase
      .from('merchants')
      .select('id')
      .eq('slug', persona.merchantSlug)
      .maybeSingle();
    merchantId = m?.id ?? null;
  }

  await supabase
    .from('profiles')
    .update({
      display_name: persona.displayName,
      phone: persona.phone,
      onboarding_done: true,
      merchant_id: merchantId,
    })
    .eq('id', userId);

  await supabase.from('user_preferences').upsert({
    user_id: userId,
    city: persona.preferences.city,
    district: persona.preferences.district,
    household_type: persona.preferences.household_type,
    kids_age_groups: persona.preferences.kids_age_groups ?? [],
    budget_min: persona.preferences.budget_min,
    budget_max: persona.preferences.budget_max,
    interests: persona.preferences.interests,
    dietary: persona.preferences.dietary ?? [],
  });
}

async function resetUserData(userId: string): Promise<void> {
  await supabase.from('favorites').delete().eq('user_id', userId);
  await supabase.from('saved_searches').delete().eq('user_id', userId);
  await supabase.from('bookings').delete().eq('user_id', userId);
}

async function seedFavorites(userId: string, persona: Persona): Promise<number> {
  // Tag hint'lerinden herhangi birini içeren aktif deal'lardan 6 tanesini favori yap.
  const { data: deals } = await supabase
    .from('deals')
    .select('id, tags')
    .eq('is_active', true)
    .not('published_at', 'is', null)
    .limit(200);

  const matches = (deals ?? []).filter((d) =>
    (d.tags ?? []).some((t) => persona.favoriteTagHints.includes(t)),
  );

  const pick = matches.slice(0, 6);
  if (pick.length === 0) return 0;

  await supabase.from('favorites').insert(
    pick.map((d) => ({ user_id: userId, deal_id: d.id })),
  );
  return pick.length;
}

async function seedSavedSearches(userId: string, persona: Persona): Promise<void> {
  if (persona.savedSearches.length === 0) return;
  await supabase.from('saved_searches').insert(
    persona.savedSearches.map((s) => ({
      user_id: userId,
      name: s.name,
      query: s.query,
    })),
  );
}

async function seedBooking(userId: string, persona: Persona): Promise<number> {
  // İlk kategori için 1 deal'da 1 confirmed booking oluştur — geçmiş hissi versin.
  let created = 0;
  for (const catSlug of persona.bookingCategoryHints) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', catSlug)
      .maybeSingle();
    if (!cat) continue;

    const { data: dealJoin } = await supabase
      .from('deal_categories')
      .select('deal_id')
      .eq('category_id', cat.id)
      .limit(1);

    const dealId = dealJoin?.[0]?.deal_id;
    if (!dealId) continue;

    const { data: deal } = await supabase
      .from('deals')
      .select('discounted_price, currency')
      .eq('id', dealId)
      .maybeSingle();
    if (!deal) continue;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    await supabase.from('bookings').insert({
      user_id: userId,
      deal_id: dealId,
      quantity: 2,
      unit_price: deal.discounted_price,
      total_amount: Number(deal.discounted_price) * 2,
      currency: deal.currency,
      selected_date: futureDate.toISOString().slice(0, 10),
      status: 'confirmed',
    });
    created++;
  }
  return created;
}

async function main(): Promise<void> {
  console.log(`Seeding ${PERSONAS.length} demo personas…\n`);

  for (const persona of PERSONAS) {
    console.log(`▸ ${persona.displayName} (${persona.email})`);
    const userId = await ensureUser(persona);
    await resetUserData(userId);
    await setupProfile(userId, persona);
    const favCount = await seedFavorites(userId, persona);
    await seedSavedSearches(userId, persona);
    const bookingCount = await seedBooking(userId, persona);

    console.log(
      `  ✓ profil + ${favCount} favori + ${persona.savedSearches.length} arama + ${bookingCount} booking`,
    );
  }

  console.log('\n✅ Tamam — demo hesaplar hazır. Şifre: demo123!');
  console.log('   /demo/persona sayfasından tek tıkla giriş yapabilirsin.');
}

main().catch((err) => {
  console.error('Persona seed failed:', err);
  process.exit(1);
});

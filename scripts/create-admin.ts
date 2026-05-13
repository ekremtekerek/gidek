/**
 * Local admin kullanıcısı oluşturur — service-role ile auth.users'a yazar,
 * email auto-confirmed olur. ADMIN_EMAILS env'iyle eşleşmesi gerekiyor;
 * burada ilk listedeki maili kullanırız. Şifre ADMIN_PASSWORD env'inden ya
 * da varsayılan değerden gelir. İdempotent: zaten varsa şifreyi yeniler.
 *
 * Run: `npm run admin:create`
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (ADMIN_EMAILS.length === 0) {
  console.error('ADMIN_EMAILS .env.local boş. ADMIN_EMAILS=mail@ornek.com olarak ayarla.');
  process.exit(1);
}

const email = ADMIN_EMAILS[0];
const password = process.env.ADMIN_PASSWORD ?? 'Gidek!2026';
const displayName = process.env.ADMIN_DISPLAY_NAME ?? 'gidek admin';

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Önce var mı bak
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    // Var — şifreyi yenile + confirmed işaretle
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, display_name: displayName },
    });
    if (error) throw error;
    console.log('✓ Mevcut admin kullanıcısı güncellendi');
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (error) throw error;
    console.log('✓ Yeni admin kullanıcısı oluşturuldu');
  }

  console.log('');
  console.log('Bilgiler:');
  console.log(`  E-posta:  ${email}`);
  console.log(`  Şifre:    ${password}`);
  console.log('');
  console.log('Giriş için: http://localhost:3000/giris');
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});

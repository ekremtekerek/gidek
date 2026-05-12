import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description: 'Sitede kullanılan çerezler ve yönetimleri.',
  alternates: { canonical: '/yasal/cerezler' },
};

export default function CerezlerPage() {
  return (
    <LegalPage title="Çerez Politikası" lastUpdated="2026-05-12">
      <p>
        Bu metin, <strong>{SITE.name}</strong> üzerinde kullanılan çerezleri ve bu çerezleri nasıl
        yönetebileceğini açıklar. Site’yi kullanmaya devam ederek bu politikada açıklanan çerezlerin
        kullanımını kabul etmiş olursun.
      </p>

      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerez, ziyaret ettiğin sitelerin tarayıcına gönderip cihazında küçük bir metin dosyası
        olarak sakladığı veridir. Genellikle oturumu açık tutmak, dil tercihini hatırlamak ve
        güvenlik sağlamak için kullanılır.
      </p>

      <h2>2. Hangi Çerezleri Kullanıyoruz?</h2>
      <ul>
        <li>
          <strong>Zorunlu çerezler:</strong> Supabase Auth oturum çerezi (<code>sb-...</code>).
          Olmadığında giriş yapılamaz ve site temel işlevini yerine getiremez.
        </li>
        <li>
          <strong>Fonksiyonel çerezler:</strong> Tema tercihi (açık/koyu), kapatılan modaller gibi
          UX tercihlerini hatırlamak için yerel saklama (localStorage).
        </li>
        <li>
          <strong>Performans / analitik çerezler:</strong> Şu an aktif değil. İleride Vercel
          Analytics veya benzeri bir araç eklenirse bu sayfa güncellenecektir.
        </li>
        <li>
          <strong>Pazarlama çerezleri:</strong> Kullanmıyoruz.
        </li>
      </ul>

      <h2>3. Üçüncü Taraf Çerezler</h2>
      <p>
        Site şu an için üçüncü taraf reklam veya izleme çerezleri sunmaz. Sadece Supabase ve Vercel
        gibi altyapı sağlayıcılarımızın teknik çerezleri, oturum ve dağıtım amaçlı çalışır.
      </p>

      <h2>4. Çerez Yönetimi</h2>
      <p>
        Çerezleri tarayıcı ayarlarından dilediğin zaman silebilir veya engelleyebilirsin. Ancak
        zorunlu çerezleri kapatırsan oturum açma, favoriler ve rezervasyon gibi temel özellikler
        çalışmayacaktır.
      </p>
      <ul>
        <li>
          <strong>Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve diğer site verileri.
        </li>
        <li>
          <strong>Safari:</strong> Tercihler → Gizlilik → Çerezleri ve site verilerini yönet.
        </li>
        <li>
          <strong>Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve site verileri.
        </li>
        <li>
          <strong>Edge:</strong> Ayarlar → Çerezler ve site izinleri.
        </li>
      </ul>

      <h2>5. Politikadaki Değişiklikler</h2>
      <p>
        Bu politikada zaman içinde değişiklik olabilir. Güncel sürümü her zaman bu sayfadan
        ulaşabilirsin. Önemli değişiklikleri kayıtlı e-posta adresine bildiririz.
      </p>

      <h2>6. İletişim</h2>
      <p>
        Sorularını <a href="mailto:gizlilik@gidek.net">gizlilik@gidek.net</a> adresine
        iletebilirsin.
      </p>
    </LegalPage>
  );
}

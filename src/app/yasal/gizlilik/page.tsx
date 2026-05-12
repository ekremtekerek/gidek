import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Kişisel verilerin işlenmesine ilişkin gizlilik politikası.',
  alternates: { canonical: '/yasal/gizlilik' },
};

export default function GizlilikPage() {
  return (
    <LegalPage title="Gizlilik Politikası" lastUpdated="2026-05-12">
      <p>
        Bu Gizlilik Politikası, <strong>{SITE.name}</strong> ({SITE.domain}) olarak hangi kişisel
        verileri topladığımızı, neden topladığımızı, nasıl koruduğumuzu ve haklarını nasıl
        kullanabileceğini açıklar. Ayrıntılı KVKK hakların için{' '}
        <a href="/yasal/kvkk">KVKK Aydınlatma Metni</a>’ni inceleyebilirsin.
      </p>

      <h2>1. Topladığımız Veriler</h2>
      <ul>
        <li>
          <strong>Hesap bilgileri:</strong> e-posta, varsa görünen isim, şifre (güvenli hash).
        </li>
        <li>
          <strong>Tercihler:</strong> yaşam tarzı, şehir/semt, bütçe, ilgi alanları, beslenme
          tercihleri (onboarding sırasında verdiğin bilgiler).
        </li>
        <li>
          <strong>Etkileşim verileri:</strong> favori eklediğin fırsatlar, AI sorguların, oluşturduğun
          rezervasyonlar.
        </li>
        <li>
          <strong>Teknik veriler:</strong> IP adresinin tek yönlü özet (hash) hali, tarayıcı bilgisi,
          ziyaret zaman damgaları.
        </li>
      </ul>

      <h2>2. Verilerin Kullanım Amaçları</h2>
      <ul>
        <li>Hesabını yönetmek ve seni doğrulamak.</li>
        <li>AI öneri motorunu sana özel sonuçlar üretecek şekilde besleyebilmek.</li>
        <li>Rezervasyonlarını gerçekleştirmek ve geçmişine erişmeni sağlamak.</li>
        <li>Hizmeti güvenli tutmak, kötüye kullanım ve dolandırıcılığı engellemek.</li>
        <li>İletişim taleplerini yanıtlamak.</li>
      </ul>

      <h2>3. Çerezler</h2>
      <p>
        Sadece oturum güvenliği ve temel tercihler için zorunlu çerezler kullanırız. Ayrıntı için{' '}
        <a href="/yasal/cerezler">Çerez Politikası</a>’na göz at.
      </p>

      <h2>4. Üçüncü Taraf Hizmet Sağlayıcılar</h2>
      <p>
        Verilerin teknik altyapı amacıyla aşağıdaki hizmet sağlayıcılarda işlenebilir. Hepsi kendi
        gizlilik politikalarına ve veri işleme sözleşmelerine tabidir.
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — kimlik doğrulama, veritabanı ve dosya saklama (sunucu konumu:
          Avrupa).
        </li>
        <li>
          <strong>Vercel</strong> — uygulama hosting (Edge/Cloud).
        </li>
        <li>
          <strong>Google Gemini API</strong> — AI öneri motoru. AI sorguların kişisel kimliğin
          olmadan modele iletilir; geçmişe doğru kalıcı eğitim verisi olarak kullanılmaz (Google
          Gemini API hüküm ve koşullarına göre).
        </li>
      </ul>

      <h2>5. Veri Saklama Süresi</h2>
      <p>
        Verilerin hesabın aktif olduğu süre boyunca tutulur. Hesabını sildiğinde tüm kişisel verilerin
        anonimleştirilir veya silinir. Yasal yükümlülük nedeniyle (örn. ticari defter) bazı veriler
        kanuni süresi boyunca saklanabilir.
      </p>

      <h2>6. Veri Güvenliği</h2>
      <p>
        Verilerin TLS ile şifrelenerek aktarılır. Veritabanında satır bazlı güvenlik (RLS)
        politikaları uygulanır; bir kullanıcı yalnızca kendi verisini görebilir. Şifreler bcrypt
        tabanlı algoritmayla hashlenir.
      </p>

      <h2>7. KVKK Hakların</h2>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu çerçevesinde kişisel verilerinin işlenip
        işlenmediğini öğrenme, silme/yok etme talep etme, düzeltme talep etme dahil pek çok hakka
        sahipsin. Ayrıntılı liste ve başvuru yolu için{' '}
        <a href="/yasal/kvkk">KVKK Aydınlatma Metni</a>’ne bak.
      </p>

      <h2>8. İletişim</h2>
      <p>
        Gizlilikle ilgili sorularını <a href="mailto:gizlilik@gidek.net">gizlilik@gidek.net</a>{' '}
        adresine iletebilirsin.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı KVKK çerçevesinde aydınlatma metni.',
  alternates: { canonical: '/yasal/kvkk' },
};

export default function KvkkPage() {
  return (
    <LegalPage title="KVKK Aydınlatma Metni" lastUpdated="2026-05-12">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında, veri sorumlusu sıfatıyla{' '}
        <strong>{SITE.name}</strong> tarafından kişisel verilerinin nasıl işlendiğini bu aydınlatma
        metninde bulabilirsin.
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <ul>
        <li>
          <strong>Ticari unvan:</strong> [Şirket ünvanı — üretim öncesi doldurulacak]
        </li>
        <li>
          <strong>MERSİS / Vergi no:</strong> [Doldurulacak]
        </li>
        <li>
          <strong>Adres:</strong> [Doldurulacak]
        </li>
        <li>
          <strong>İletişim:</strong>{' '}
          <a href="mailto:kvkk@gidek.net">kvkk@gidek.net</a>
        </li>
      </ul>

      <h2>2. İşlenen Kişisel Veriler</h2>
      <ul>
        <li>
          <strong>Kimlik bilgileri:</strong> ad-soyad (verirsen), e-posta, kullanıcı adı.
        </li>
        <li>
          <strong>İletişim bilgileri:</strong> e-posta adresi.
        </li>
        <li>
          <strong>Kullanıcı tercihleri:</strong> şehir, semt, yaşam tarzı, bütçe aralığı, ilgi
          alanları, beslenme tercihleri, sevmediklerin.
        </li>
        <li>
          <strong>Hareket bilgileri:</strong> AI sorguların, favori fırsatların, oluşturduğun
          rezervasyonlar, görüntülediğin sayfalar.
        </li>
        <li>
          <strong>İşlem güvenliği bilgileri:</strong> IP adresinin tek-yönlü özet (hash) hali,
          oturum bilgileri, çerez verileri.
        </li>
      </ul>

      <h2>3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</h2>
      <ul>
        <li>
          <strong>Hizmetin sunulması</strong> (KVKK m. 5/2-c — sözleşmenin ifası): hesabını
          oluşturmak, AI önerileri üretmek, rezervasyon işlemini gerçekleştirmek.
        </li>
        <li>
          <strong>Yasal yükümlülüklerin yerine getirilmesi</strong> (KVKK m. 5/2-ç): vergi, ticari
          defter, e-Arşiv fatura yükümlülükleri.
        </li>
        <li>
          <strong>Meşru menfaat</strong> (KVKK m. 5/2-f): kötüye kullanım önlemi, hizmet kalitesi
          ölçümü, ürün geliştirme.
        </li>
        <li>
          <strong>Açık rıza</strong> (KVKK m. 5/1): pazarlama iletişimi (e-posta bülteni) ve buna
          benzer ek faaliyetler — yalnızca onay verdiğin durumlarda.
        </li>
      </ul>

      <h2>4. Kişisel Verilerin Aktarımı</h2>
      <p>
        Verilerin yalnızca hizmetin sunulması için gerekli olduğu ölçüde aşağıdaki tarafların altyapı
        hizmetlerinde işlenir:
      </p>
      <ul>
        <li>Supabase Inc. (veritabanı, kimlik doğrulama, dosya saklama).</li>
        <li>Vercel Inc. (uygulama hosting).</li>
        <li>Google LLC (Gemini API üzerinden AI öneri motoru).</li>
      </ul>
      <p>
        Bu sağlayıcılar yurt dışında bulunabilir. Aktarımlar KVKK m. 9 ve gerekli güvenceler (Standart
        Sözleşme Hükümleri, Komisyon kararları, vb.) çerçevesinde yapılır.
      </p>

      <h2>5. Toplama Yöntemleri ve Hukuki Sebepleri</h2>
      <p>
        Kişisel verilerin web sitesi üzerinden ve sen tarafından doğrudan sağlanan bilgilerle
        otomatik veya yarı-otomatik yöntemlerle toplanır. Hukuki sebepleri yukarıda 3. başlık altında
        açıklanmıştır.
      </p>

      <h2>6. KVKK Madde 11 Kapsamında Haklarınız</h2>
      <ol>
        <li>Kişisel verinin işlenip işlenmediğini öğrenme.</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme.</li>
        <li>İşlenme amacını ve verilerin amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
        <li>Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme.</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
        <li>KVKK m. 7’de öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme.</li>
        <li>5. ve 6. bentler uyarınca yapılan işlemlerin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.</li>
        <li>Otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme.</li>
        <li>Kanuna aykırı işleme sebebiyle zarara uğraman halinde zararın giderilmesini talep etme.</li>
      </ol>

      <h2>7. Başvuru Yolu</h2>
      <p>
        Yukarıdaki haklarını kullanmak için kimliğini doğrulayan belgelerle birlikte yazılı olarak
        veya <a href="mailto:kvkk@gidek.net">kvkk@gidek.net</a> adresinden iletişim kurabilirsin.
        Başvurular en geç 30 gün içinde yanıtlanır.
      </p>
    </LegalPage>
  );
}

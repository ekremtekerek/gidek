import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'gidek hizmetinin kullanım koşulları.',
  alternates: { canonical: '/yasal/kullanim-kosullari' },
};

export default function KullanimKosullariPage() {
  return (
    <LegalPage title="Kullanım Koşulları" lastUpdated="2026-05-12">
      <p>
        Bu kullanım koşulları, <strong>{SITE.name}</strong> ({SITE.domain}) üzerinden sunulan AI
        destekli fırsat keşif ve rezervasyon hizmetinin kullanımına ilişkin kuralları belirler.
        Hizmeti kullanarak bu koşulları kabul etmiş sayılırsın.
      </p>

      <h2>1. Hizmet Tanımı</h2>
      <p>
        {SITE.name}, kullanıcılarına farklı kategorilerde (tiyatro, kahvaltı, masaj, tatil otelleri,
        vb.) işletme ortaklarının sunduğu fırsatları listeler ve yapay zeka destekli öneri
        motoruyla kullanıcının ihtiyacına en uygun seçenekleri ortaya çıkarır. Rezervasyon işlemi
        son haliyle ilgili işletme tarafından gerçekleştirilir; {SITE.name} aracı konumundadır.
      </p>

      <h2>2. Üyelik ve Hesap Sorumluluğu</h2>
      <p>
        Bazı özelliklerden (AI sınırsız sorgu, favoriler, rezervasyon) faydalanmak için ücretsiz
        hesap oluşturman gerekir. Hesabını oluştururken verdiğin bilgilerin doğru ve güncel olmasını
        sağlamakla yükümlüsün. Hesap güvenliğin (şifre dahil) senin sorumluluğundadır.
      </p>

      <h2>3. Kullanıcı Yükümlülükleri</h2>
      <ul>
        <li>Yalnızca yasalara ve genel ahlaka uygun amaçlarla hizmeti kullanırsın.</li>
        <li>Başka bir kullanıcının veya üçüncü kişinin haklarını ihlal etmezsin.</li>
        <li>AI öneri motoruna gönderdiğin sorgular spam, taciz, dolandırıcılık vs. içermez.</li>
        <li>Otomatik araçlarla (bot, crawler) sistemi yormaktan kaçınırsın.</li>
      </ul>

      <h2>4. Yasak Davranışlar</h2>
      <ul>
        <li>Sahte hesap oluşturmak veya başka birinin kimliğine bürünmek.</li>
        <li>Hizmeti tersine mühendislikle çözmeye veya güvenlik açıklarını sömürmeye çalışmak.</li>
        <li>İşletme ortaklarına ait içerikleri izinsiz çoğaltıp dağıtmak.</li>
        <li>Diğer kullanıcılara karşı taciz, tehdit veya saldırgan davranış.</li>
      </ul>

      <h2>5. Rezervasyon ve İptal</h2>
      <p>
        Fırsat satın aldığında ilgili işletmeyle aranızda bir sözleşme oluşur. {SITE.name}, bu
        sözleşmenin tarafı değildir. İptal, iade ve değişiklik koşulları her fırsatın detay
        sayfasındaki kullanım koşullarına ve ilgili işletmenin politikasına tabidir. Bunun yanı
        sıra, 6502 sayılı Tüketicinin Korunması Hakkında Kanun çerçevesindeki mesafeli sözleşme
        hakların saklıdır.
      </p>
      <p>
        Mevcut sürüm <strong>mock rezervasyon</strong> akışı sunar — gerçek ödeme alınmaz ve
        rezervasyonun ilgili işletmeye iletilmez. Üretime alındığında bu bölüm güncellenecektir.
      </p>

      <h2>6. Fikri Mülkiyet</h2>
      <p>
        {SITE.name} logosu, marka adı, arayüz tasarımı, AI promtları ve yazılım kodu {SITE.name}’e
        aittir veya lisanslıdır. Fırsat içerikleri ilgili işletme ortaklarına aittir. Tüm haklar
        saklıdır; izinsiz kopyalama, dağıtım veya türev çalışma oluşturma yapılamaz.
      </p>

      <h2>7. Sorumluluk Sınırı</h2>
      <p>
        {SITE.name}, işletme ortağı tarafından sunulan hizmetin kalitesinden doğrudan sorumlu
        değildir. AI önerileri yardımcı niteliktedir ve kesin tavsiye yerine geçmez. Hizmet “olduğu
        gibi” sunulur; kesintisiz veya hatasız olacağı garanti edilmez.
      </p>

      <h2>8. Koşullarda Değişiklik</h2>
      <p>
        {SITE.name}, bu koşulları zaman zaman güncelleyebilir. Önemli değişiklikleri kayıtlı
        e-posta adresine veya site üzerinden bildirir. Değişiklik sonrası hizmeti kullanmaya devam
        etmen, güncel koşulları kabul ettiğin anlamına gelir.
      </p>

      <h2>9. Geçerli Hukuk ve Uyuşmazlık Çözümü</h2>
      <p>
        Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve
        İcra Daireleri yetkilidir. Tüketici uyuşmazlıkları için ilgili Tüketici Hakem Heyetleri ve
        Tüketici Mahkemeleri yetkilidir.
      </p>

      <h2>10. İletişim</h2>
      <p>
        Sorularını ve geri bildirimini <a href="mailto:destek@gidek.net">destek@gidek.net</a>{' '}
        adresine iletebilirsin.
      </p>
    </LegalPage>
  );
}

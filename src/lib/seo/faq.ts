/**
 * SSS (Sıkça Sorulan Sorular) — tek doğruluk kaynağı. `/sss` sayfası hem görünür
 * akordeonu hem FAQPage JSON-LD'yi buradan üretir (DRY). Cevaplar düz metin
 * (JSON-LD `Answer.text` güvenli olsun, HTML yok). GEO/AIO için: AI cevap
 * motorları (ChatGPT, Perplexity, Google AI Overviews) Q&A yapısını okuyup atıf verir.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqSection {
  title: string;
  items: FaqItem[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Genel',
    items: [
      {
        q: 'gidek nedir?',
        a: 'gidek, Türkiye geneli için AI destekli bir fırsat keşif platformudur. Tiyatro, konser, stand-up, aktivite, masaj, güzellik, kahvaltı, yemek, turlar, otel ve kurs gibi 13 ana kategoride indirimli fırsatları tek yerden keşfetmeni sağlar. Ne yapmak istediğini sıradan bir cümleyle yazarsın, gidek sana en uygun seçenekleri getirir.',
      },
      {
        q: 'gidek’i kullanmak ücretli mi?',
        a: 'Hayır. Fırsatları keşfetmek, AI asistanı kullanmak ve üye olmak tamamen ücretsizdir. Yalnızca beğendiğin fırsatı satın alırken, o fırsatın kendi fiyatını ödersin.',
      },
      {
        q: 'Hangi şehirlerde fırsat var?',
        a: 'Kapsam Türkiye geneli, ağırlık İstanbul’dadır. Şu an öne çıkan şehirler: İstanbul, Ankara, İzmir, Antalya, Bursa, Adana, Eskişehir, Konya, Gaziantep ve Kayseri. Üstteki şehir seçiminden şehrini değiştirebilirsin; seçimin arama, harita ve AI önerilerine yansır.',
      },
      {
        q: 'Hangi kategoriler var?',
        a: '13 ana kategori: tiyatro, konser, stand-up, aktivite, masaj, güzellik, kahvaltı, yemek, turlar, şehir otelleri, tatil otelleri, kurs ve hizmet. Her kategorinin alt kategorileri (ör. hafta sonu tiyatro, serpme kahvaltı, termal otel) ile daha da daraltabilirsin.',
      },
      {
        q: 'Mobil uygulama var mı?',
        a: 'gidek bir PWA’dır (yüklenebilir web uygulaması). Ayrı bir uygulama indirmene gerek yok; tarayıcının menüsünden “Ana ekrana ekle” diyerek telefonuna uygulama gibi ekleyebilirsin.',
      },
    ],
  },
  {
    title: 'AI Asistanı',
    items: [
      {
        q: 'AI asistanı nasıl çalışır?',
        a: 'Doğal dilde ne istediğini yazarsın; gidek, Google Gemini tabanlı asistan ve anlamsal arama (RAG) ile binlerce fırsat arasından sana en uygun 3-5 tanesini seçip sunar. Her öneri, tıklayıp inceleyebileceğin gerçek bir fırsattır.',
      },
      {
        q: 'AI’a ne yazmalıyım?',
        a: 'Günlük konuşma diliyle yaz. Örnekler: “eşimle cumartesi akşamı romantik bir yemek”, “çocuklarla hafta sonu aktivite”, “Kadıköy’de uygun fiyatlı masaj”, “bütçem 1500 TL, arkadaşlarla eğlenceli bir gün”. Bütçe, semt, kim ile gideceğin gibi detayları eklersen öneriler isabetlenir.',
      },
      {
        q: 'Ücretsiz kaç soru sorabilirim?',
        a: 'Üye olmadan günde 2 ücretsiz AI sorgusu yapabilirsin. Ücretsiz üyelikle bu limit günde 30’a çıkar.',
      },
      {
        q: 'AI önerileri güvenilir mi, uydurma olabilir mi?',
        a: 'AI yalnızca gidek’teki gerçek fırsat envanterinden öneri yapar; olmayan bir fırsatı uydurmaz. Her önerinin altındaki “Neden bu öneri?” ile seçimin gerekçesini de görebilirsin.',
      },
      {
        q: 'Fotoğrafla arama nedir?',
        a: 'Bir mekân veya atmosfer fotoğrafı yüklersin; gidek, Gemini Vision ile görseldeki vibe’a benzeyen fırsatları bulur. “Böyle bir yer istiyorum” demenin en hızlı yolu.',
      },
      {
        q: 'Baştan sona bir gün planlatabilir miyim?',
        a: 'Evet. “Ailecek bir gün planla” gibi yazdığında AI; sabah kahvaltı, öğleden sonra aktivite ve akşam yemeği şeklinde uçtan uca bir gün planı kurar. İstediğin adımı “kahvaltıyı değiştir, daha cep dostu olsun” diyerek değiştirebilirsin.',
      },
    ],
  },
  {
    title: 'Fırsatlar, Rezervasyon ve Ödeme',
    items: [
      {
        q: 'Bir fırsatı nasıl satın alırım?',
        a: 'Fırsat sayfasındaki “Satın Al” butonuna basarsın; satın alma ve ödeme, iş ortağımız firsatbufirsat.com üzerinde güvenle tamamlanır. gidek seni en uygun fırsata yönlendirir.',
      },
      {
        q: 'Ödeme güvenli mi, kart bilgilerimi gidek mi alıyor?',
        a: 'Ödeme gidek’te değil, iş ortağımız firsatbufirsat.com’un güvenli ödeme altyapısında alınır. gidek senin kart bilgilerini istemez, görmez ve saklamaz.',
      },
      {
        q: 'İndirimler ve fiyatlar gerçek mi?',
        a: 'Fırsatlarda hem liste (üstü çizili) hem indirimli fiyat gösterilir. Katalog düzenli olarak senkronlanır; yine de geçerli nihai fiyat ve koşullar, satın alma sırasında iş ortağı sayfasında onaylanır.',
      },
      {
        q: 'İptal ve iade nasıl işliyor?',
        a: 'İptal ve iade, satın aldığın fırsatın iş ortağındaki koşullarına tabidir. Her fırsatın detay sayfasındaki “Kullanım koşulları” bölümünde geçerlilik tarihi ve kuralları yer alır; satın almadan önce okumanı öneririz.',
      },
      {
        q: 'Satın aldığım fırsatın onayını nereden görürüm?',
        a: 'Satın alma iş ortağı tarafında tamamlandığında onay ve kupon/bilet bilgilerin sana iletilir. Geçerlilik ve kullanım detayları için fırsatın kendi koşullarını esas al.',
      },
      {
        q: '“Yakında biten” ve “Bu fırsat kaçtı” ne demek?',
        a: '“Yakında biten”, geçerlilik süresi önümüzdeki iki hafta içinde dolacak aktif fırsatlardır. “Bu fırsat kaçtı” ise süresi dolmuş fırsatlardır; arşivde görüntülenir ama satın alınamaz.',
      },
    ],
  },
  {
    title: 'Hesap ve Üyelik',
    items: [
      {
        q: 'Üye olmak zorunda mıyım?',
        a: 'Keşfetmek ve göz atmak için hayır. Sadece günlük 2 ücretsiz AI sorgusunun ardından, favori kaydetmek ve daha yüksek günlük AI limiti için ücretsiz üyelik gerekir.',
      },
      {
        q: 'Üyelik ücretsiz mi?',
        a: 'Evet, üyelik tamamen ücretsizdir. E-posta ile saniyeler içinde üye olabilirsin.',
      },
      {
        q: 'Şehrimi nasıl değiştiririm?',
        a: 'Üstteki (mobilde menü içindeki) şehir çipinden şehrini seçersin. Seçimin anında arama sonuçlarına, haritaya ve AI önerilerine uygulanır.',
      },
      {
        q: 'Beğendiğim fırsatları kaydedebilir miyim?',
        a: 'Evet. Fırsat kartındaki kalp ikonuyla favorilerine eklersin; “Favorilerim” sayfasından hepsine ulaşırsın (üyelik gerekir).',
      },
    ],
  },
  {
    title: 'Güven, Gizlilik ve Veri',
    items: [
      {
        q: 'Verilerim güvende mi?',
        a: 'gidek, KVKK’ya uygun çalışır; kişisel verilerin yalnızca hizmeti sunmak için işlenir. Detaylar için Gizlilik Politikası ve KVKK Aydınlatma Metni sayfalarına bakabilirsin.',
      },
      {
        q: 'Yorumlar gerçek mi?',
        a: 'Fırsat sayfalarındaki puan ve yorumlar; gerçek kullanıcı değerlendirmeleri ile işletmenin doğrulanmış değerlendirmelerinden oluşur. Amaç, satın almadan önce gerçek bir fikir verebilmektir.',
      },
      {
        q: 'gidek fırsatları nereden buluyor?',
        a: 'Fırsatlar, iş ortağımız firsatbufirsat.com yayıncı kataloğundan düzenli olarak senkronlanır. gidek bu fırsatları AI ile keşfedilebilir, karşılaştırılabilir ve haritada görülebilir hale getirir.',
      },
    ],
  },
];

/** Tüm soruları düz liste — FAQPage JSON-LD için. */
export const ALL_FAQ_ITEMS: FaqItem[] = FAQ_SECTIONS.flatMap((s) => s.items);

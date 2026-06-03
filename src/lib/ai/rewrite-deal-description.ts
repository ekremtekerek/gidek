// NOTE: no `import 'server-only'` — bu modül sync-affiliate.ts tarafından tsx
// ile çağrılır (bkz. gemini.ts). Korumayı çağrı yerleri sağlar.
import { getGeminiClient, MODELS } from './gemini';

const SYSTEM = `Sen gidek.net için içerik editörüsün — Türkiye'de fırsat keşif platformu.

GÖREVİN:
Sana verilen ham fırsat açıklamasını, AYNI bilgileri koruyarak tamamen özgün
cümlelerle yeniden yazmak. Amaç: tedarikçiden birebir kopyalanmış metni özgün
hale getirip arama motorlarındaki duplike içerik riskini ortadan kaldırmak.

KURALLAR:
1. Dil: Türkçe. Akıcı, sıcak ama profesyonel; nötr 3. tekil ("sen" hitabı yok).
2. UYDURMA YOK: orijinalde olmayan özellik, hizmet, fiyat veya vaat ekleme.
   Fiyat, süre, adet, mekan gibi somut bilgileri birebir koru.
3. Pazarlama abartısı YASAK: "muhteşem", "harika", "kaçırma", "olmazsa olmaz" yok.
4. Cümle yapısını ve kelimeleri DEĞİŞTİR — orijinalden cümle kopyalama.
5. Uzunluk orijinale yakın olsun (kısalt/şişirme). 1-3 paragraf.
6. Markdown veya başlık yok — yalnızca düz metin döndür.
7. Yalnızca yeniden yazılmış açıklamayı döndür; ön söz/açıklama ekleme.`;

interface RewriteInput {
  title: string;
  description: string;
  category?: string | null;
  city?: string | null;
  district?: string | null;
  highlights?: string[];
}

/**
 * Ham (tedarikçiden birebir) açıklamayı Gemini ile özgün cümlelerle yeniden
 * yazar. Çok kısa açıklamada veya AI boş/yetersiz döndürürse orijinali korur —
 * çağıran taraf "ai rewritten" bayrağını yalnızca metin gerçekten değiştiyse set
 * etmeli. Maliyet ~0.0005 USD/çağrı (Gemini 2.5 Flash).
 */
export async function rewriteDealDescription(input: RewriteInput): Promise<string> {
  const original = input.description?.trim() ?? '';
  // Çok kısa metinde yeniden yazım fayda etmez — olduğu gibi bırak.
  if (original.length < 40) return original;

  const ctx = [
    `Başlık: ${input.title}`,
    input.category ? `Kategori: ${input.category}` : '',
    [input.district, input.city].filter(Boolean).length
      ? `Konum: ${[input.district, input.city].filter(Boolean).join(', ')}`
      : '',
    input.highlights?.length ? `Öne çıkanlar: ${input.highlights.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const client = getGeminiClient();
  const res = await client.models.generateContent({
    model: MODELS.chat,
    contents: `${ctx}\n\nOrijinal açıklama:\n${original}\n\nBu açıklamayı yukarıdaki kurallara göre özgün cümlelerle yeniden yaz.`,
    config: {
      systemInstruction: SYSTEM,
      temperature: 0.6,
      maxOutputTokens: 1200,
      // gemini-2.5-flash'ta "thinking" varsayılan açık ve maxOutputTokens'ı
      // tüketip çıktıyı kırpıyor — basit yeniden yazımda gerek yok, kapat.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = (res.text ?? '').trim();
  // AI boş/çok kısa döndürdüyse orijinali koru.
  return text.length >= 40 ? text : original;
}

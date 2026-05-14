import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { searchDealsByQuery, type MatchedDeal } from '@/lib/ai/search-core';

/**
 * Görsel-tabanlı arama: kullanıcı bir fotoğraf atar, Gemini Vision o
 * fotoğraftan atmosfer/aktivite/yer ipuçları çıkarır → bu Türkçe metin
 * RAG'a sorgu olarak verilir → semantic search ile en yakın 5 deal
 * önerilir.
 *
 * Maliyet: tek görsel ~0.001 USD (Gemini Flash multimodal). Cache yok —
 * her görsel farklı.
 */

const VisionSchema = z.object({
  themes: z
    .array(z.string().min(3).max(40))
    .min(1)
    .max(6)
    .describe('Görseldeki atmosfer/aktivite/yer temaları — kısa Türkçe etiketler ("deniz manzarası", "kahvaltı sofrası", "spa", "açık hava yoga")'),
  category: z
    .enum([
      'tiyatro',
      'konser',
      'stand-up',
      'aktivite',
      'masaj',
      'guzellik',
      'kahvalti',
      'yemek',
      'turlar',
      'sehir-otelleri',
      'tatil-otelleri',
      'kurs',
      'hizmet',
      'belirsiz',
    ])
    .describe('Görselin en uyumlu kategorisi — belirsizse "belirsiz"'),
  searchQuery: z
    .string()
    .min(10)
    .max(180)
    .describe('Tek cümle Türkçe arama sorgusu — bu metin RAG semantic search\'e gider. "Boğaz manzaralı kahvaltı" gibi.'),
  confidence: z
    .enum(['low', 'medium', 'high'])
    .describe('Yüksek = görsel net + arama için yeterli; Düşük = belirsiz / alakasız / yetersiz.'),
});

export type VisionAnalysis = z.infer<typeof VisionSchema>;

const SYSTEM_PROMPT = `Sen gidek.net için bir görsel analiz asistanısın.

Kullanıcı bir fotoğraf yükler; senin işin bu fotoğraftan **bir gidek fırsatı önermek için** kullanılabilecek temaları çıkarmak.

Kurallar:
1. Türkçe çıktı.
2. themes: kısa etiketler — somut özellikler (mekan tipi, atmosfer, aktivite). En fazla 6.
3. category: gidek kategorilerinden biri (tiyatro, konser, stand-up, aktivite, masaj, guzellik, kahvalti, yemek, turlar, sehir-otelleri, tatil-otelleri, kurs, hizmet). Eşleşmiyorsa "belirsiz".
4. searchQuery: bir cümlede "bu fotodaki gibi bir deneyim ararsan ne yazardın?" → "Boğaz manzaralı kahvaltı brunch", "Sessiz spa ve masaj odası" gibi.
5. confidence: görsel netse + kategori belirgin ise "high". İnsan portresi, soyut foto, alakasız manzara ise "low".

Asla hayalle birşey üretme — sadece görselde gözlemleyebildiğin şeyler.`;

interface SearchByImageResult {
  analysis: VisionAnalysis;
  deals: MatchedDeal[];
}

/**
 * Görseli Gemini Vision'a yolla, çıkan searchQuery ile semantic search yap.
 * @param imageBytes Görsel byte'ları (Buffer veya Uint8Array)
 * @param mimeType MIME tipi (image/jpeg, image/png, vs)
 */
export async function searchDealsByImage(
  imageBytes: Buffer | Uint8Array,
  mimeType: string,
): Promise<SearchByImageResult> {
  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Bu fotoğrafı analiz et.' },
          { type: 'image', image: imageBytes, mediaType: mimeType },
        ],
      },
    ],
    schema: VisionSchema,
    temperature: 0.3,
  });

  // Düşük güvenli analizde RAG sorgusu yapmamayı tercih edelim (anlamsız sonuç) —
  // ama yine de boş array yerine analysis'i döndürüp UI ona göre konuşsun.
  let deals: MatchedDeal[] = [];
  if (object.confidence !== 'low') {
    deals = await searchDealsByQuery(object.searchQuery, { maxResults: 5 });
  }

  return { analysis: object, deals };
}

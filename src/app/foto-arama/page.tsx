import type { Metadata } from 'next';
import { Camera, Sparkles } from 'lucide-react';
import { PhotoSearchForm } from '@/components/photo-search/photo-search-form';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'Fotoğrafla ara — gidek AI',
  description:
    'Beğendiğin bir atmosferin fotoğrafını yükle, gidek AI sana benzer fırsatları önersin.',
  alternates: { canonical: '/foto-arama' },
};

export default function PhotoSearchPage() {
  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Multimodal AI · Gemini Vision
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Fotoğrafla ara
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Geçen tatilden, Pinterest&apos;ten, arkadaşın paylaşmış bir
          mekan&hellip; aklındaki atmosferin fotoğrafını yükle — gidek AI
          görseldeki temaları çıkarıp benzer fırsatları önersin.
        </p>
      </header>

      <div className="mx-auto max-w-2xl">
        <PhotoSearchForm />
      </div>

      <aside className="text-muted-foreground mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed">
        <p className="inline-flex items-center gap-1.5">
          <Camera className="size-3" aria-hidden="true" />
          JPEG/PNG/WebP, max 4 MB. Görsellerin saklanmaz — sadece anlık analiz
          için Gemini&apos;ye gönderilir.
        </p>
      </aside>
    </Container>
  );
}

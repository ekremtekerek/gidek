import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Heart, MapPin, Sparkles, Ticket, User as UserIcon } from 'lucide-react';
import { signInAsDemoAction } from '@/app/demo/persona/actions';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'Demo persona — gidek',
  description: 'Hackathon demosu için hazır profillerle giriş.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Persona {
  email: string;
  name: string;
  age: number;
  emoji: string;
  household: string;
  location: string;
  interests: string[];
  flavor: string;
  prompt: string;
  highlights: { Icon: typeof Heart; label: string }[];
}

const PERSONAS: Persona[] = [
  {
    email: 'demo-asli@gidek.demo',
    name: 'Aslı',
    age: 32,
    emoji: '💕',
    household: 'Çift',
    location: 'Kadıköy, İstanbul',
    interests: ['Romantik akşamlar', 'Brunch', 'Tiyatro', 'Vejetaryen'],
    flavor: 'Cumartesi akşamları için her hafta yeni bir mekan arar. Sessizlik ve manzara önceliği.',
    prompt: 'Cumartesi akşam çiftler için romantik bir yer',
    highlights: [
      { Icon: Heart, label: '6 favori' },
      { Icon: Ticket, label: '1 yaklaşan rezervasyon' },
      { Icon: Sparkles, label: '2 kayıtlı arama' },
    ],
  },
  {
    email: 'demo-mehmet@gidek.demo',
    name: 'Mehmet',
    age: 38,
    emoji: '👨‍👩‍👧‍👦',
    household: 'Aile + 2 çocuk',
    location: 'Beşiktaş, İstanbul',
    interests: ['Çocuk dostu aktivite', 'Doğa', 'Kahvaltı', 'Tatil'],
    flavor: 'Çocuklarla haftasonu planı kuruyor. Açık hava aktiviteleri + ailecek kahvaltı favorisi.',
    prompt: 'Haftasonu ailecek çocuk dostu bir aktivite',
    highlights: [
      { Icon: Heart, label: '6 favori' },
      { Icon: Ticket, label: '2 yaklaşan rezervasyon' },
      { Icon: Sparkles, label: '2 kayıtlı arama' },
    ],
  },
  {
    email: 'demo-zeynep@gidek.demo',
    name: 'Zeynep',
    age: 26,
    emoji: '🧘‍♀️',
    household: 'Yalnız',
    location: 'Şişli, İstanbul',
    interests: ['Spa & masaj', 'Kahvaltı', 'Stand-up', 'Kafe'],
    flavor: 'İş sonrası kendine zaman ayırıyor. Stres atma + huzurlu kafe + kişisel bakım odaklı.',
    prompt: 'Stresliyim, beni rahatlatacak bir şey',
    highlights: [
      { Icon: Heart, label: '6 favori' },
      { Icon: Ticket, label: '1 yaklaşan rezervasyon' },
      { Icon: Sparkles, label: '2 kayıtlı arama' },
    ],
  },
  {
    email: 'demo-isletme@gidek.demo',
    name: 'Mehtap (İşletme)',
    age: 41,
    emoji: '🏪',
    household: 'Boğaz Kahve Evi sahibi',
    location: 'Beşiktaş, İstanbul',
    interests: ['Fırsat yönetimi', 'Rezervasyon takibi', 'Operasyon'],
    flavor:
      'gidek üzerinden Boğaz Kahve Evi fırsatlarını yönetiyor. /isletme portal&apos;ına erişimi var.',
    prompt: '/isletme — kendi fırsatları, rezervasyonları, yeni başvuru',
    highlights: [
      { Icon: Ticket, label: 'İşletme paneli erişimi' },
      { Icon: Sparkles, label: 'AI içerik yardımcısı' },
      { Icon: Heart, label: 'Müşteri rezervasyonları' },
    ],
  },
];

const DEMO_PASSWORD = 'demo123!';

export default function PersonaPage() {
  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 flex flex-col items-center gap-3 text-center">
        <Link
          href="/demo"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-start text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Demo
        </Link>
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Demo persona
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Bir persona seç, anında giriş
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Her persona zengin profille hazır — favori, kayıtlı arama, geçmiş rezervasyon.
          Pitch&apos;te &ldquo;boş hesap&rdquo; göstermek yerine AI&apos;ın kişiselleştirme
          gücü doğrudan görünür.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PERSONAS.map((p) => (
          <article
            key={p.email}
            className="border-border bg-background flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
          >
            <header className="flex items-center gap-3">
              <span
                className="bg-muted inline-flex size-14 shrink-0 items-center justify-center rounded-full text-3xl"
                aria-hidden="true"
              >
                {p.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold tracking-tight">
                  {p.name}, {p.age}
                </p>
                <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                  <UserIcon className="size-3" aria-hidden="true" />
                  {p.household}
                </p>
              </div>
            </header>

            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <MapPin className="size-3" aria-hidden="true" />
              {p.location}
            </p>

            <p className="text-foreground/90 text-sm leading-relaxed">{p.flavor}</p>

            <ul className="flex flex-wrap gap-1.5">
              {p.interests.map((i) => (
                <li
                  key={i}
                  className="bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5 text-[11px]"
                >
                  {i}
                </li>
              ))}
            </ul>

            <ul className="border-border flex flex-col gap-1.5 border-t pt-3">
              {p.highlights.map(({ Icon, label }) => (
                <li
                  key={label}
                  className="text-muted-foreground inline-flex items-center gap-2 text-[11px]"
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="border-border bg-muted/40 rounded-lg border p-2.5 text-[11px] italic leading-relaxed">
              <span className="text-muted-foreground">İlk denenecek prompt: </span>
              <span className="text-foreground">&ldquo;{p.prompt}&rdquo;</span>
            </div>

            <form action={signInAsDemoAction} className="mt-auto">
              <input type="hidden" name="email" value={p.email} />
              <input type="hidden" name="password" value={DEMO_PASSWORD} />
              <input type="hidden" name="next" value="/" />
              <button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {p.name} olarak giriş yap
              </button>
            </form>
          </article>
        ))}
      </div>

      <aside className="border-border bg-muted/30 mx-auto mt-10 max-w-3xl rounded-xl border p-5 text-center">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Bu hesaplar <code className="text-foreground bg-muted rounded px-1.5 py-0.5 font-mono">npm run seed:personas</code>{' '}
          komutuyla oluşturulur. Şifre tüm hesaplar için{' '}
          <code className="text-foreground bg-muted rounded px-1.5 py-0.5 font-mono">demo123!</code>.
          Production&apos;a deploy etmeden önce silmeyi unutma.
        </p>
      </aside>
    </Container>
  );
}

import { CalendarCheck, MessageSquare, Sparkles, type LucideIcon } from 'lucide-react';
import { Container } from '@/components/ui/container';

type Step = {
  n: string;
  Icon: LucideIcon;
  title: string;
  desc: string;
  iconBg: string;
  iconFg: string;
  watermark: string;
};

const STEPS: Step[] = [
  {
    n: '01',
    Icon: MessageSquare,
    title: 'Sen yaz',
    desc: 'Hangi gün, kim için, ne istediğini doğal dilde anlat. "Kadıköy’de pazar kahvaltı" bile yeter.',
    iconBg: 'bg-amber-500/15',
    iconFg: 'text-amber-600 dark:text-amber-300',
    watermark: 'text-amber-500/10 dark:text-amber-300/10',
  },
  {
    n: '02',
    Icon: Sparkles,
    title: 'AI eşleştirir',
    desc: 'Bütçen, lokasyonun ve zevkine göre AI saniyeler içinde en uygun fırsatları seçer.',
    iconBg: 'bg-violet-500/15',
    iconFg: 'text-violet-600 dark:text-violet-300',
    watermark: 'text-violet-500/10 dark:text-violet-300/10',
  },
  {
    n: '03',
    Icon: CalendarCheck,
    title: 'Sen seç',
    desc: 'Beğendiğine tek tıkla rezervasyon yap, gerisini gidek hatırlatır — saat, gün, lokasyon dahil.',
    iconBg: 'bg-emerald-500/15',
    iconFg: 'text-emerald-600 dark:text-emerald-300',
    watermark: 'text-emerald-500/10 dark:text-emerald-300/10',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="py-14 sm:py-20">
      <Container>
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Nasıl çalışıyor?
          </p>
          <h2 id="how-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            3 adımda planın hazır.
          </h2>
          <p className="text-muted-foreground mt-3 text-base">
            Tek tek fırsat gezme. Yaz, biz seçelim.
          </p>
        </div>

        <ol className="grid gap-5 lg:grid-cols-3">
          {STEPS.map(({ n, Icon, title, desc, iconBg, iconFg, watermark }, i) => (
            <li
              key={n}
              className="border-border bg-background group relative overflow-hidden rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-7"
            >
              <span
                className={`pointer-events-none absolute -top-2 right-2 text-7xl font-bold leading-none tracking-tighter select-none sm:text-8xl ${watermark}`}
                aria-hidden="true"
              >
                {n}
              </span>

              <span
                className={`mb-5 inline-flex size-12 items-center justify-center rounded-xl ${iconBg} ${iconFg} transition-transform group-hover:scale-110`}
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>

              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Adım {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

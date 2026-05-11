import { CalendarCheck, MessageSquare, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';

const STEPS = [
  {
    n: 1,
    Icon: MessageSquare,
    title: 'Sen yaz',
    desc: 'Hangi gün, kim için, ne istediğini doğal dilde anlat.',
  },
  {
    n: 2,
    Icon: Sparkles,
    title: 'AI eşleştirir',
    desc: 'Bütçen, zevkin ve müsaitliğine göre en uygun fırsatları seçer.',
  },
  {
    n: 3,
    Icon: CalendarCheck,
    title: 'Sen seç',
    desc: 'Beğendiğine tek tıkla rezervasyon yap, gerisini gidek hatırlatır.',
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="py-12 sm:py-16">
      <Container>
        <h2 id="how-heading" className="sr-only">
          Nasıl çalışıyor?
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ n, Icon, title, desc }) => (
            <li
              key={n}
              className="border-border bg-background relative flex flex-col gap-3 rounded-xl border p-5"
            >
              <span className="bg-muted text-muted-foreground absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                {n}
              </span>
              <span className="bg-foreground/5 text-foreground inline-flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold tracking-tight">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';
import { CATEGORY_STYLE } from '@/lib/utils/category-styles';

export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="py-12">
      <Container>
        <div className="mb-6 flex flex-col gap-1">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight">
            Ya da kategorilerden keşfet
          </h2>
          <p className="text-muted-foreground text-sm">
            AI’ı atla, doğrudan ilgilendiğin kategoriye dal.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {MAIN_CATEGORIES.map((c) => {
            const style = CATEGORY_STYLE[c.slug];
            if (!style) return null;
            const { Icon, bg, fg } = style;
            return (
              <li key={c.slug}>
                <Link
                  href={`/k/${c.slug}`}
                  className="border-border bg-background hover:border-foreground/30 group flex h-full flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span
                    className={`${bg} ${fg} inline-flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-110`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium tracking-tight">{c.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

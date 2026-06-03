import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import type { CategoryMenuItem } from '@/lib/db/queries/deals';

interface Props {
  menu: CategoryMenuItem[];
}

/**
 * Header altı kategori şeridi (desktop). Bir kategoriye hover olunca alt
 * kategoriler (firsatbufirsat external_tags'ten türetilmiş) açılır. Saf CSS
 * group-hover — client JS yok. Alt kategori linki `/k/<slug>?alt=<tag>` ile
 * filtreler.
 */
export function CategoryMegaMenu({ menu }: Props) {
  if (menu.length === 0) return null;

  return (
    <nav aria-label="Kategoriler" className="border-border hidden border-t lg:block">
      <Container>
        <ul className="flex items-stretch gap-0.5">
          {menu.map((cat) => (
            <li key={cat.slug} className="group/cat static">
              <Link
                href={`/k/${cat.slug}`}
                className="text-muted-foreground hover:text-foreground group-hover/cat:text-foreground inline-flex h-11 items-center px-3 text-sm font-medium transition-colors"
              >
                {cat.name}
              </Link>

              {cat.subtags.length > 0 ? (
                <div className="invisible absolute inset-x-0 top-full z-50 translate-y-1 opacity-0 transition-all duration-150 group-hover/cat:visible group-hover/cat:translate-y-0 group-hover/cat:opacity-100">
                  <Container className="pb-4">
                    <div className="border-border bg-background/95 rounded-2xl border p-5 shadow-xl backdrop-blur">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-foreground text-sm font-semibold">{cat.name}</p>
                        <Link
                          href={`/k/${cat.slug}`}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-xs font-medium"
                        >
                          Tümünü gör
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                      <ul className="grid max-h-[70vh] grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {cat.subtags.map((tag) => (
                          <li key={tag}>
                            <Link
                              href={`/k/${cat.slug}?alt=${encodeURIComponent(tag)}`}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted/60 block rounded-md px-2 py-1.5 text-sm capitalize transition-colors"
                            >
                              {tag}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Container>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

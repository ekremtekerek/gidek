'use client';

import type { UIMessage } from 'ai';
import { Loader2, Sparkles, User } from 'lucide-react';
import { DealResults } from '@/components/kesfet/deal-results';
import { DayPlanDisplay } from '@/components/kesfet/day-plan-display';
import type { DealShape } from '@/lib/ai/tools';
import { cn } from '@/lib/utils/cn';

interface Props {
  message: UIMessage;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <article
      aria-label={isUser ? 'Sen' : 'gidek'}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-foreground text-background'
            : 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </span>

      {/*
        AI column expands wider than user column so tool outputs (deal grids,
        day plans) can breathe. Text bubbles inside still get their own
        narrower max-width so they don't span the full column edge-to-edge.
      */}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-2',
          isUser ? 'max-w-[85%] items-end' : 'max-w-[92%] flex-1 items-start',
        )}
      >
        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'text': {
              if (!('text' in part) || !part.text) return null;
              return (
                <p
                  key={i}
                  className={cn(
                    'max-w-prose rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    isUser
                      ? 'bg-foreground text-background rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm',
                  )}
                >
                  {part.text}
                </p>
              );
            }

            case 'tool-searchDeals': {
              if (part.state === 'output-available') {
                const output = part.output as { results: DealShape[]; count: number };
                return (
                  <div key={i} className="w-full">
                    <DealResults deals={output.results} />
                  </div>
                );
              }
              return <ToolThinking key={i} label="Fırsatlar aranıyor…" />;
            }

            case 'tool-createDayPlan': {
              if (part.state === 'output-available') {
                const output = part.output as {
                  plan: {
                    steps: Array<{
                      time: string;
                      emoji: string;
                      category: string;
                      rationale: string;
                      deal: DealShape | null;
                    }>;
                    totalPrice: number;
                  };
                };
                return (
                  <div key={i} className="w-full">
                    <DayPlanDisplay plan={output.plan} />
                  </div>
                );
              }
              return <ToolThinking key={i} label="Gün planı kuruluyor…" />;
            }

            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}

function ToolThinking({ label }: { label: string }) {
  return (
    <div className="border-border bg-muted/40 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

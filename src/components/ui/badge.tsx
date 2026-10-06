import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'accent' | 'up' | 'down' | 'info' | 'violet' | 'warn';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-fg-muted border-border-strong',
  accent: 'bg-accent-muted text-accent border-accent/30',
  up: 'bg-up-muted text-up border-up/30',
  down: 'bg-down-muted text-down border-down/30',
  info: 'bg-info-muted text-info border-info/30',
  violet: 'bg-violet/10 text-violet border-violet/30',
  warn: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

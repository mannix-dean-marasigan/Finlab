import { CheckCircle2, XCircle } from 'lucide-react';
import type { CriterionScore } from '@/types/domain';
import { Progress } from './ui/misc';
import { fmtScore } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Criterion-by-criterion score breakdown (rubric or task based). */
export function ScoreBreakdown({ criteria, showWeights }: { criteria: CriterionScore[]; showWeights?: boolean }) {
  if (!criteria?.length) return null;
  return (
    <div className="divide-y divide-border">
      {criteria.map((c) => {
        const max = Number(c.max ?? 100);
        const score = Number(c.score);
        const pct = max > 0 ? (score / max) * 100 : 0;
        return (
          <div key={c.key} className="py-2.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                {pct >= 60 ? <CheckCircle2 className="h-4 w-4 shrink-0 text-up" /> : <XCircle className="h-4 w-4 shrink-0 text-down" />}
                <span className="truncate">{c.label}</span>
                {showWeights && c.weight !== undefined && <span className="text-xs text-fg-subtle">· {c.weight}%</span>}
              </div>
              <span className={cn('font-mono text-xs tabular', pct >= 85 ? 'text-up' : pct >= 60 ? 'text-accent' : 'text-down')}>
                {fmtScore(score)} / {max}
              </span>
            </div>
            <Progress value={pct} className="mt-1.5" tone={pct >= 85 ? 'up' : pct >= 60 ? 'accent' : 'down'} />
            {c.feedback && <p className="mt-1 text-xs text-fg-muted">{c.feedback}</p>}
          </div>
        );
      })}
    </div>
  );
}

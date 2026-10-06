import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calculator, CheckCircle2, ChevronDown, Circle, GitBranch, Puzzle, Search, Sigma } from 'lucide-react';
import type { ActivityKind, LessonActivity } from '@/types/domain';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalculatorActivity } from './CalculatorActivity';
import { BranchingActivity, MatchingActivity, SpotErrorActivity, WorkedExampleActivity } from './GradedActivities';

const META: Record<ActivityKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  calculator: { label: 'Interactive calculator', icon: Calculator },
  spot_error: { label: 'Spot the error', icon: Search },
  matching: { label: 'Drag & drop', icon: Puzzle },
  branching: { label: 'Branching case', icon: GitBranch },
  worked_example: { label: 'Worked example', icon: Sigma },
};

/** Lesson practice list. `best` = best score per attempted activity. */
export function PracticeSection({ activities, best, lessonId }: { activities: LessonActivity[]; best: Record<string, number>; lessonId: string }) {
  const qc = useQueryClient();
  const firstOpen = activities.find((a) => a.kind !== 'calculator' && best[a.id] === undefined)?.id ?? activities[0]?.id;
  const [open, setOpen] = useState<string | null>(firstOpen ?? null);
  const onScored = () => qc.invalidateQueries({ queryKey: ['activityBest', lessonId] });

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const m = META[a.kind];
        const attempted = best[a.id] !== undefined;
        const isOpen = open === a.id;
        return (
          <div key={a.id} className={cn('rounded-lg border', isOpen ? 'border-border-strong' : 'border-border')}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : a.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              aria-expanded={isOpen}
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md border', attempted ? 'border-up/40 bg-up-muted text-up' : 'border-border-strong bg-surface-2 text-accent')}>
                <m.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.7rem] uppercase tracking-wider text-fg-subtle">{m.label}</span>
                <span className="block truncate font-medium">{a.title}</span>
              </span>
              {a.kind === 'calculator' ? (
                <Badge>Explore</Badge>
              ) : attempted ? (
                <Badge tone={best[a.id] >= 80 ? 'up' : 'accent'}>
                  <CheckCircle2 className="h-3 w-3" /> Best {Math.round(best[a.id])}
                </Badge>
              ) : (
                <Badge tone="warn">
                  <Circle className="h-3 w-3" /> Required
                </Badge>
              )}
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-fg-muted transition-transform', isOpen && 'rotate-180')} />
            </button>
            {isOpen && (
              <div className="border-t border-border px-4 py-4">
                {a.instructions && <p className="mb-3 text-sm text-fg-muted">{a.instructions}</p>}
                {a.kind === 'calculator' && <CalculatorActivity activity={a} />}
                {a.kind === 'spot_error' && <SpotErrorActivity activity={a} onScored={onScored} />}
                {a.kind === 'matching' && <MatchingActivity activity={a} onScored={onScored} />}
                {a.kind === 'branching' && <BranchingActivity activity={a} onScored={onScored} />}
                {a.kind === 'worked_example' && <WorkedExampleActivity activity={a} onScored={onScored} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Circle, Lock, ShieldCheck, Sigma, XCircle } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { invalidateProgress, qk, useMyStats, useReference } from '@/app/queries';
import { attemptPromotion, fetchAllPromotionRequirements, fetchPromotionHistory, fetchPromotionStatus } from '@/services/api/compete';
import { fetchSettings } from '@/services/api/reference';
import type { PromotionStatus, RequirementStatus } from '@/types/domain';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal, Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime, fmtScore } from '@/lib/format';
import { cn } from '@/lib/utils';

function fmtReq(v: number, r: RequirementStatus) {
  return r.type === 'min_finlab_score' || r.type === 'skill_min' ? fmtScore(v) : String(Math.floor(v));
}

function RequirementList({ reqs }: { reqs: RequirementStatus[] }) {
  return (
    <ul className="divide-y divide-border">
      {reqs.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-2.5">
          {r.met ? <CheckCircle2 className="h-5 w-5 shrink-0 text-up" /> : <XCircle className="h-5 w-5 shrink-0 text-down/80" />}
          <div className="min-w-0 flex-1">
            <div className="text-sm">{r.label}</div>
            <Progress value={Math.min(100, (Number(r.current) / Math.max(Number(r.required), 1)) * 100)} className="mt-1.5" tone={r.met ? 'up' : 'accent'} />
          </div>
          <span className="w-20 shrink-0 text-right font-mono text-xs tabular text-fg-muted">
            {fmtReq(Number(r.current), r)} / {fmtReq(Number(r.required), r)}
          </span>
          <Badge tone={r.met ? 'up' : 'neutral'} className="w-16 justify-center">
            {r.met ? 'Pass' : 'Not yet'}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export default function CareerPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ref = useReference();
  const stats = useMyStats();
  const status = useQuery({ queryKey: ['promotion', user!.id], queryFn: fetchPromotionStatus });
  const allReqs = useQuery({ queryKey: ['promotionRequirements'], queryFn: fetchAllPromotionRequirements });
  const history = useQuery({ queryKey: ['promotion', 'history', user!.id], queryFn: () => fetchPromotionHistory(user!.id) });
  const settings = useQuery({ queryKey: ['settings'], queryFn: fetchSettings, staleTime: 10 * 60 * 1000 });
  const [result, setResult] = useState<{ result: 'PASS' | 'NOT_YET'; status: PromotionStatus } | null>(null);

  const attempt = useMutation({
    mutationFn: attemptPromotion,
    onSuccess: (r) => {
      setResult(r);
      invalidateProgress(qc);
      qc.invalidateQueries({ queryKey: qk.stats(user!.id) });
    },
  });

  if (status.isPending || ref.isPending || stats.isPending) return <PageSkeleton />;
  if (status.isError) return <ErrorState error={status.error} onRetry={() => status.refetch()} />;
  if (ref.isError) return <ErrorState error={ref.error} onRetry={() => ref.refetch()} />;

  const s = status.data;
  const levels = ref.data.careerLevels;
  const reqs = s.requirements;
  const met = reqs.filter((r) => r.met).length;
  const threshold = Number(settings.data?.find((x) => x.key === 'skill_confidence_threshold')?.value ?? 2);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Career"
        title="The ladder"
        description="Move up from Junior Analyst to Managing Director. Each level has clear requirements, and you can apply as soon as you meet them."
      />

      {/* Ladder */}
      <Card className="mb-6 overflow-x-auto p-4">
        <ol className="flex min-w-[720px] items-stretch gap-2">
          {levels.map((l) => {
            const current = l.id === s.current_level.id;
            const done = l.rank < s.current_level.rank;
            const next = s.next_level?.id === l.id;
            return (
              <li
                key={l.id}
                className={cn(
                  'flex-1 rounded-lg border p-3',
                  current ? 'border-accent bg-accent-muted' : done ? 'border-up/30 bg-up-muted/50' : next ? 'border-border-strong bg-surface-2' : 'border-border bg-surface',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-fg-subtle">L{l.rank}</span>
                  {done ? <CheckCircle2 className="h-4 w-4 text-up" /> : current ? <Briefcase className="h-4 w-4 text-accent" /> : next ? <Circle className="h-4 w-4 text-fg-muted" /> : <Lock className="h-3.5 w-3.5 text-fg-subtle" />}
                </div>
                <div className={cn('mt-2 text-sm font-semibold', current && 'text-accent')}>{l.name}</div>
                <div className="mt-1 line-clamp-3 text-xs text-fg-muted">{l.description}</div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader
              title={s.next_level ? `Promotion case: ${s.current_level.name} → ${s.next_level.name}` : 'Top of the ladder'}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              action={s.next_level && <Badge tone={s.eligible ? 'up' : 'neutral'}>{s.eligible ? 'Eligible' : `${met}/${reqs.length} met`}</Badge>}
            />
            <CardContent>
              {!s.next_level ? (
                <p className="text-sm text-fg-muted">You are a Managing Director. There are no further promotions.</p>
              ) : !reqs.length ? (
                <EmptyState title="No requirements configured" description="An administrator needs to define requirements for this level." />
              ) : (
                <>
                  <RequirementList reqs={reqs} />
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-fg-muted">
                      {s.eligible ? 'All requirements met. Submit your promotion case.' : 'You can apply any time. You will see exactly what is still missing.'}
                    </p>
                    <Button variant="primary" onClick={() => attempt.mutate()} loading={attempt.isPending}>
                      Apply for promotion
                    </Button>
                  </div>
                  {attempt.isError && <p className="mt-2 text-sm text-down">{(attempt.error as Error).message}</p>}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="All promotion requirements" subtitle="Configured by administrators" />
            <CardContent>
              {allReqs.isPending ? (
                <div className="h-24 animate-pulse rounded bg-surface-3" />
              ) : allReqs.isError ? (
                <ErrorState error={allReqs.error} onRetry={() => allReqs.refetch()} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {levels.slice(1).map((l) => (
                    <div key={l.id} className="rounded-md border border-border p-3">
                      <div className="mb-2 text-sm font-semibold">→ {l.name}</div>
                      <ul className="space-y-1 text-sm text-fg-muted">
                        {allReqs.data.filter((r) => r.target_level_id === l.id).map((r) => (
                          <li key={r.id}>• {r.label}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="How your FINLAB Score works" icon={<Sigma className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-3 text-sm text-fg-muted">
              <p>
                Your score is a weighted average of seven skills. Each skill is the weighted mean of evidence from scored work: your <em>best</em> score per challenge,
                rubric-scored pitches and reports, market-event decisions and competition results.
              </p>
              <p>
                A skill only counts in full once it has enough evidence (confidence threshold, default {threshold}). One lucky result can't max out a skill.
              </p>
              <ul className="divide-y divide-border">
                {ref.data.skills.map((sk) => (
                  <li key={sk.id} className="flex justify-between py-1.5">
                    <span>{sk.name}</span>
                    <span className="font-mono text-fg">{sk.weight}%</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between rounded-md border border-accent/30 bg-accent-muted px-3 py-2 text-fg">
                <span>Your FINLAB Score</span>
                <span className="font-mono font-semibold text-accent">{fmtScore(stats.data?.finlab_score)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Promotion history" />
            <CardContent className="px-0 pb-1">
              {history.isPending ? (
                <div className="mx-4 mb-3 h-10 animate-pulse rounded bg-surface-3" />
              ) : history.isError ? (
                <ErrorState error={history.error} onRetry={() => history.refetch()} />
              ) : !history.data.length ? (
                <p className="px-4 pb-3 text-sm text-fg-muted">No promotion attempts yet.</p>
              ) : (
                history.data.map((h) => (
                  <div key={h.id} className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 text-sm">
                    <span>
                      → {levels.find((l) => l.id === h.target_level_id)?.name}
                      <span className="block text-xs text-fg-subtle">{fmtDateTime(h.created_at)}</span>
                    </span>
                    <Badge tone={h.passed ? 'up' : 'down'}>{h.passed ? 'PASS' : 'NOT YET'}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={!!result}
        onClose={() => setResult(null)}
        title={result?.result === 'PASS' ? `Promoted to ${result.status.next_level?.name}` : 'NOT YET'}
        description={
          result?.result === 'PASS'
            ? 'You met every requirement. Your new level is on your Passport.'
            : 'Your case was reviewed against every requirement. Here is what is still missing.'
        }
        footer={<Button variant="primary" onClick={() => setResult(null)}>Close</Button>}
      >
        {result && (
          <div className={cn('rounded-lg border p-4', result.result === 'PASS' ? 'border-up/40 bg-up-muted' : 'border-border')}>
            {result.result === 'PASS' ? (
              <div className="flex items-center gap-3 text-up">
                <CheckCircle2 className="h-8 w-8" />
                <span className="text-lg font-semibold">Congratulations, {result.status.next_level?.name}.</span>
              </div>
            ) : (
              <RequirementList reqs={result.status.requirements.filter((r) => !r.met)} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

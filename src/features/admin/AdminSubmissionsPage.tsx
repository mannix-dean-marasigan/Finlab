import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { adminListSubmissions, adminScoreSubmission, type AdminSubmission } from '@/services/api/admin';
import type { CriterionScore } from '@/types/domain';
import { ScorePill } from '@/components/common';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/form';
import { Modal, Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime } from '@/lib/format';

function ReviewModal({ sub, onClose }: { sub: AdminSubmission; onClose: () => void }) {
  const qc = useQueryClient();
  const latest = sub.scores[0];
  const tasks = sub.challenge?.content.tasks ?? [];
  const initial: CriterionScore[] =
    latest?.criteria_scores?.length
      ? latest.criteria_scores.map((c) =>
          // Weighted rubric criteria (0–100 each) are rescaled so max = weight, keeping the rubric's weighting.
          c.weight !== undefined
            ? { key: c.key, label: c.label, score: Math.round(Number(c.score) * Number(c.weight)) / 100, max: Number(c.weight), feedback: '' }
            : { key: c.key, label: c.label, score: Number(c.score), max: Number(c.max ?? 100), feedback: '' },
        )
      : tasks.map((t) => ({ key: t.id, label: t.label ?? t.id, score: 0, max: t.points ?? 10, feedback: '' }));
  const [criteria, setCriteria] = useState<CriterionScore[]>(initial.length ? initial : [{ key: 'overall', label: 'Overall', score: 0, max: 100, feedback: '' }]);
  const [feedback, setFeedback] = useState('');
  const total = criteria.reduce((s, c) => s + Math.min(Number(c.score) || 0, c.max), 0);
  const maxTotal = criteria.reduce((s, c) => s + c.max, 0);

  const save = useMutation({
    mutationFn: () => adminScoreSubmission(sub.id, criteria.map((c) => ({ ...c, score: Number(c.score) || 0 })), feedback),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(`Scored ${r.score} / 100 — user's skills updated`);
      onClose();
    },
  });

  const pitchId = (sub.responses as Record<string, string>).stock_pitch_id;
  const researchId = (sub.responses as Record<string, string>).research_project_id;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Review: ${sub.challenge?.title}`}
      description={`${sub.profile?.full_name} (@${sub.profile?.handle}) · submitted ${fmtDateTime(sub.submitted_at)}`}
      footer={
        <>
          <span className="mr-auto self-center font-mono text-sm">
            Total {maxTotal ? ((total / maxTotal) * 100).toFixed(1) : '—'} / 100
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save final score
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Submission</div>
          {pitchId || researchId ? (
            <Link to={pitchId ? `/pitches/${pitchId}` : `/research/${researchId}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              Open submitted {pitchId ? 'pitch' : 'report'} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            tasks.map((t, i) => (
              <div key={t.id} className="rounded-md border border-border p-3">
                <div className="text-xs text-fg-subtle">
                  {i + 1}. {t.label ?? t.id} · {t.points ?? 10} pts
                </div>
                <div className="mt-1 text-xs text-fg-muted">{t.prompt}</div>
                <div className="mt-2 whitespace-pre-wrap rounded bg-surface-2 p-2 text-sm">
                  {(sub.responses as Record<string, string>)[t.id] || <span className="italic text-fg-subtle">No answer</span>}
                </div>
              </div>
            ))
          )}
          {latest && (
            <div>
              <div className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                Latest score ({latest.scorer_type}{latest.is_final ? ', final' : ', provisional'})
              </div>
              <ScoreBreakdown criteria={latest.criteria_scores} />
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Your scoring</div>
          {criteria.map((c, i) => (
            <div key={c.key} className="grid grid-cols-[1fr_80px_70px] items-center gap-2">
              <span className="truncate text-sm">{c.label}</span>
              <Input
                type="number"
                step="any"
                min={0}
                max={c.max}
                value={c.score}
                onChange={(e) => setCriteria((cs) => cs.map((x, j) => (j === i ? { ...x, score: Number(e.target.value) } : x)))}
                className="font-mono"
                aria-label={`${c.label} score`}
              />
              <span className="font-mono text-xs text-fg-subtle">/ {c.max}</span>
            </div>
          ))}
          <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback the analyst will see…" />
          <InlineError message={save.error ? (save.error as Error).message : null} />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminSubmissionsPage() {
  const [tab, setTab] = useState<'pending_review' | 'scored' | 'all'>('pending_review');
  const [reviewing, setReviewing] = useState<AdminSubmission | null>(null);
  const list = useQuery({ queryKey: ['admin', 'submissions', tab], queryFn: () => adminListSubmissions(tab) });

  return (
    <Card>
      <Tabs
        className="px-4 pt-2"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'pending_review', label: 'Awaiting review' },
          { value: 'scored', label: 'Scored' },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.isPending ? (
        <PageSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.length ? (
        <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="Nothing here" description={tab === 'pending_review' ? 'No submissions are waiting for review.' : undefined} />
      ) : (
        <ul>
          {list.data.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 border-t border-border/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{s.challenge?.title}</div>
                <div className="text-xs text-fg-muted">
                  {s.profile?.full_name} · @{s.profile?.handle} · {fmtDateTime(s.submitted_at)} {s.competition_id && <Badge tone="violet">competition</Badge>}
                </div>
              </div>
              <Badge tone={s.challenge?.scoring_method === 'manual' ? 'info' : 'neutral'}>{s.challenge?.scoring_method}</Badge>
              {s.status === 'pending_review' ? <Badge tone="warn">pending</Badge> : <ScorePill score={s.final_score} />}
              {s.scores[0] && <span className="text-xs text-fg-subtle">by {s.scores.find((x) => x.is_final)?.scorer_type ?? 'auto (provisional)'}</span>}
              <Button size="sm" variant={s.status === 'pending_review' ? 'primary' : 'outline'} onClick={() => setReviewing(s)}>
                {s.status === 'pending_review' ? 'Score' : 'Re-score'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {reviewing && <ReviewModal sub={reviewing} onClose={() => setReviewing(null)} />}
    </Card>
  );
}

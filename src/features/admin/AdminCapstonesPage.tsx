import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, MonitorPlay } from 'lucide-react';
import { toast } from 'sonner';
import { adminListCapstones, adminScoreCapstone } from '@/services/api/engage';
import type { AdminCapstoneRow } from '@/types/domain';
import { ScorePill } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/form';
import { Modal, Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime } from '@/lib/format';
import { wordCount } from '@/lib/utils';

type Status = 'submitted' | 'scored' | 'returned' | 'all';

function ScoreModal({ c, onClose }: { c: AdminCapstoneRow; onClose: () => void }) {
  const qc = useQueryClient();
  const rubric = c.module?.config.rubric ?? [{ key: 'overall', label: 'Overall', max: 100 }];
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(rubric.map((r) => [r.key, String(c.criteria?.find((x) => x.key === r.key)?.score ?? '')])),
  );
  const [feedback, setFeedback] = useState(c.feedback ?? '');
  const total = rubric.reduce((s, r) => s + Math.min(Number(scores[r.key]) || 0, r.max), 0);
  const max = rubric.reduce((s, r) => s + r.max, 0);
  const pct = max ? (total / max) * 100 : 0;

  const save = useMutation({
    mutationFn: (returnIt: boolean) => {
      if (!returnIt && rubric.some((r) => scores[r.key] === '')) throw new Error('Score every rubric criterion.');
      if (feedback.trim().length < 20) throw new Error('Write at least a sentence of feedback — the learner sees it.');
      return adminScoreCapstone(
        c.id,
        rubric.map((r) => ({ ...r, score: Math.min(Number(scores[r.key]) || 0, r.max) })),
        feedback.trim(),
        returnIt,
      );
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin', 'capstones'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success(r.status === 'returned' ? 'Returned for revision' : `Scored ${r.score} / 100 — certificate issued automatically if passed`);
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Capstone: ${c.module?.config.title ?? ''}`}
      description={`${c.learner?.full_name} (@${c.learner?.handle}) · ${c.module?.program?.title} · submitted ${fmtDateTime(c.submitted_at)}`}
      footer={
        <>
          <span className="mr-auto self-center font-mono text-sm">Total {pct.toFixed(1)} / 100</span>
          <Button variant="ghost" onClick={() => save.mutate(true)} loading={save.isPending && save.variables === true}>
            Return for revision
          </Button>
          <Button variant="primary" onClick={() => save.mutate(false)} loading={save.isPending && save.variables === false}>
            Save score
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Submission</div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={c.video_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
              Watch presentation <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {c.slides_url && (
              <a href={c.slides_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                Slides <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="mb-1 text-[0.7rem] uppercase tracking-wider text-fg-subtle">Executive summary · {wordCount(c.summary)} words</div>
            <p className="whitespace-pre-wrap text-sm">{c.summary}</p>
          </div>
          {c.module?.config.brief && (
            <details className="text-xs text-fg-muted">
              <summary className="cursor-pointer">Brief given to the learner</summary>
              <p className="mt-1">{c.module.config.brief}</p>
            </details>
          )}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Rubric</div>
          {rubric.map((r) => (
            <div key={r.key} className="grid grid-cols-[1fr_80px_60px] items-center gap-2">
              <span className="truncate text-sm">{r.label}</span>
              <Input
                type="number"
                min={0}
                max={r.max}
                step="any"
                value={scores[r.key]}
                onChange={(e) => setScores((s) => ({ ...s, [r.key]: e.target.value }))}
                className="font-mono"
                aria-label={`${r.label} score`}
              />
              <span className="font-mono text-xs text-fg-subtle">/ {r.max}</span>
            </div>
          ))}
          <Textarea rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback the learner will see: what worked, what to fix…" />
          <p className="text-xs text-fg-subtle">Pass mark is 70 unless the module sets another. Scoring adds Communication, Leadership and Investment Judgment evidence.</p>
          <InlineError message={save.error ? (save.error as Error).message : null} />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCapstonesPage() {
  const [tab, setTab] = useState<Status>('submitted');
  const [open, setOpen] = useState<AdminCapstoneRow | null>(null);
  const list = useQuery({ queryKey: ['admin', 'capstones', tab], queryFn: () => adminListCapstones(tab) });

  return (
    <Card>
      <Tabs
        className="px-4 pt-2"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'submitted', label: 'Awaiting review' },
          { value: 'returned', label: 'Returned' },
          { value: 'scored', label: 'Scored' },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.isPending ? (
        <PageSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.length ? (
        <EmptyState icon={<MonitorPlay className="h-5 w-5" />} title="Nothing here" description={tab === 'submitted' ? 'No capstone presentations are waiting for review.' : undefined} />
      ) : (
        <ul>
          {list.data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 border-t border-border/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.module?.program?.title}</div>
                <div className="text-xs text-fg-muted">
                  <Link to={`/p/${c.learner?.handle}`} className="hover:text-accent">
                    {c.learner?.full_name} · @{c.learner?.handle}
                  </Link>{' '}
                  · {fmtDateTime(c.submitted_at)}
                </div>
              </div>
              {c.status === 'submitted' ? <Badge tone="warn">pending</Badge> : c.status === 'returned' ? <Badge tone="info">returned</Badge> : <ScorePill score={c.score} passing={70} />}
              <Button size="sm" variant={c.status === 'submitted' ? 'primary' : 'outline'} onClick={() => setOpen(c)}>
                {c.status === 'submitted' ? 'Score' : 'Open'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {open && <ScoreModal c={open} onClose={() => setOpen(null)} />}
    </Card>
  );
}

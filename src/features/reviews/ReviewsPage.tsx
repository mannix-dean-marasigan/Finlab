import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, MessageSquareText, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { PEER_CRITERIA, getPitchForReview, getReviewQueue, myGivenReviews, submitPeerReview } from '@/services/api/engage';
import type { PeerReviewCriterion } from '@/types/domain';
import { Delta, Markdown, PageHeader, RatingBadge, ScorePill } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Textarea } from '@/components/ui/form';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { upsidePct } from '@/lib/finance/valuation';
import { fmtMoney, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const SECTIONS: { key: 'thesis' | 'variant_perception' | 'company_analysis' | 'financial_analysis' | 'forecast' | 'valuation' | 'catalysts' | 'risks'; label: string; list?: boolean }[] = [
  { key: 'thesis', label: 'Investment thesis' },
  { key: 'variant_perception', label: 'Variant perception' },
  { key: 'company_analysis', label: 'Company analysis' },
  { key: 'financial_analysis', label: 'Financial analysis' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'valuation', label: 'Valuation' },
  { key: 'catalysts', label: 'Catalysts', list: true },
  { key: 'risks', label: 'Risks', list: true },
];

function ScoreButtons({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            'h-8 w-8 rounded-md border font-mono text-sm transition-colors',
            value === n ? 'border-accent bg-accent text-black' : 'border-border-strong bg-surface-2 text-fg-muted hover:text-fg',
          )}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ReviewForm() {
  const { pitchId = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pitch = useQuery({ queryKey: ['review-pitch', pitchId], queryFn: () => getPitchForReview(pitchId) });
  const [scores, setScores] = useState<Partial<Record<PeerReviewCriterion, number>>>({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const submit = useMutation({
    mutationFn: () => {
      const missing = PEER_CRITERIA.filter((c) => !scores[c.key]);
      if (missing.length) throw new Error(`Score every criterion (missing: ${missing.map((m) => m.label.toLowerCase()).join(', ')}).`);
      if (strengths.trim().length < 60 || improvements.trim().length < 60) throw new Error('Write at least 60 characters for both strengths and improvements.');
      return submitPeerReview(pitchId, scores as Record<PeerReviewCriterion, number>, strengths, improvements);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      qc.invalidateQueries({ queryKey: ['my-activity'] });
      qc.invalidateQueries({ queryKey: ['today-plan'] });
      invalidateProgress(qc);
      toast.success('Review submitted · +10 XP. The author will rate how helpful it was.');
      navigate('/reviews');
    },
  });

  if (pitch.isPending) return <PageSkeleton />;
  if (pitch.isError) return <ErrorState error={pitch.error} onRetry={() => pitch.refetch()} />;
  const p = pitch.data;
  if (!p) return <EmptyState title="This pitch is not open for review" description="It may have been closed or already has enough reviews." action={<Link to="/reviews" className="text-accent">Back to the queue</Link>} />;
  if (p.already_reviewed) return <EmptyState icon={<CheckCircle2 className="h-5 w-5 text-up" />} title="You already reviewed this pitch" action={<Link to="/reviews" className="text-accent">Back to the queue</Link>} />;
  const up = p.current_price && p.target_price ? upsidePct(Number(p.target_price), Number(p.current_price)) : null;
  const total = PEER_CRITERIA.reduce((s, c) => s + (scores[c.key] ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <Link to="/reviews" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Review queue
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="font-mono text-2xl font-semibold">{p.ticker}</div>
                <div className="text-sm text-fg-muted">
                  {p.company} · {p.exchange ?? '—'} · <span className="capitalize">{p.format}</span> pitch · author hidden
                </div>
              </div>
              <RatingBadge rating={p.rating as 'BUY' | 'HOLD' | 'SELL' | null} />
              <div className="ml-auto grid grid-cols-3 gap-6 text-right">
                <div>
                  <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Price</div>
                  <div className="font-mono tabular">{fmtMoney(p.current_price, p.currency ?? 'PHP')}</div>
                </div>
                <div>
                  <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Target</div>
                  <div className="font-mono tabular">{fmtMoney(p.target_price, p.currency ?? 'PHP')}</div>
                </div>
                <div>
                  <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Upside</div>
                  <Delta value={up} />
                </div>
              </div>
            </div>
            {p.valuation_method && <div className="mt-3 text-xs text-fg-muted">Valuation basis: {p.valuation_method}</div>}
          </Card>
          {SECTIONS.map((s) =>
            p[s.key]?.trim() ? (
              <Card key={s.key}>
                <CardHeader title={s.label} />
                <CardContent>
                  <Markdown>
                    {s.list
                      ? p[s.key]!.split('\n').filter((l) => l.trim()).map((l) => `- ${l.replace(/^[\s\-*•]+/, '')}`).join('\n')
                      : p[s.key]!}
                  </Markdown>
                </CardContent>
              </Card>
            ) : null,
          )}
          <Card>
            <CardHeader title={`Sources (${p.sources.length})`} />
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {p.sources.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-fg-subtle">{i + 1}.</span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-accent">
                        {s.title} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>{s.title}</span>
                    )}
                    {s.publisher && <span className="text-xs text-fg-subtle">· {s.publisher}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="sticky top-20">
            <CardHeader title="Your review" subtitle="Be specific and constructive. The author rates how helpful you were." icon={<MessageSquareText className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-4">
              <div className="space-y-2.5">
                {PEER_CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm">{c.label}</div>
                      <div className="text-[0.7rem] text-fg-subtle">{c.hint}</div>
                    </div>
                    <ScoreButtons value={scores[c.key] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [c.key]: v }))} />
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-xs text-fg-muted">
                  <span>Overall</span>
                  <span className="font-mono">{Math.round((total / 35) * 100)}/100</span>
                </div>
              </div>
              <Field label="Strengths" hint={`${strengths.trim().length}/60 characters minimum`}>
                <Textarea rows={4} value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="What is convincing? Which numbers or arguments work?" />
              </Field>
              <Field label="What would make it stronger" hint={`${improvements.trim().length}/60 characters minimum`}>
                <Textarea rows={4} value={improvements} onChange={(e) => setImprovements(e.target.value)} placeholder="Gaps in the thesis, valuation or risks, and how to fix them." />
              </Field>
              <InlineError message={submit.error ? (submit.error as Error).message : null} />
              <Button variant="primary" className="w-full justify-center" onClick={() => submit.mutate()} loading={submit.isPending}>
                Submit review
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReviewQueue() {
  const { user } = useAuth();
  const queue = useQuery({ queryKey: ['review-queue'], queryFn: getReviewQueue });
  const mine = useQuery({ queryKey: ['my-reviews', user!.id], queryFn: () => myGivenReviews(user!.id) });
  const rated = (mine.data ?? []).filter((r) => r.helpful_rating !== null);
  const avgHelpful = rated.length ? rated.reduce((s, r) => s + (r.helpful_rating ?? 0), 0) / rated.length : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Research"
        title="Peer review"
        description="Review other analysts' pitches anonymously. Helpful reviews build your communication and leadership skills. You can open your own pitches for review from the pitch page."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Pitches waiting for review" icon={<Users className="h-3.5 w-3.5" />} subtitle="Fewest reviews first" />
          <CardContent className="px-0 pb-1">
            {queue.isPending ? (
              <PageSkeleton />
            ) : queue.isError ? (
              <ErrorState error={queue.error} onRetry={() => queue.refetch()} />
            ) : !queue.data.length ? (
              <EmptyState
                title="The queue is empty"
                description="No pitches need review right now. Submit your own pitch and open it for peer review to get feedback."
                action={<Link to="/pitches"><Button size="sm">Stock Pitch Arena</Button></Link>}
              />
            ) : (
              <ul>
                {queue.data.map((q) => (
                  <li key={q.pitch_id}>
                    <Link to={`/reviews/${q.pitch_id}`} className="flex items-center gap-3 border-t border-border/70 px-4 py-3 hover:bg-surface-2">
                      <span className="w-16 font-mono font-semibold">{q.ticker ?? '—'}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{q.company}</span>
                        <span className="block text-xs text-fg-muted">
                          <span className="capitalize">{q.format}</span> pitch · submitted {timeAgo(q.submitted_at)} · {q.reviews} review{q.reviews === 1 ? '' : 's'}
                        </span>
                      </span>
                      <RatingBadge rating={q.rating as 'BUY' | 'HOLD' | 'SELL' | null} />
                      <ArrowRight className="h-4 w-4 text-fg-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Your reviewer record</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-2xl font-semibold">{mine.data?.length ?? '—'}</div>
                <div className="text-xs text-fg-muted">reviews written</div>
              </div>
              <div>
                <div className="flex items-center gap-1 font-mono text-2xl font-semibold">
                  {avgHelpful !== null ? avgHelpful.toFixed(1) : '—'} <Star className="h-4 w-4 fill-accent text-accent" />
                </div>
                <div className="text-xs text-fg-muted">avg helpfulness</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 text-xs text-fg-muted">
            <div className="mb-2 font-semibold uppercase tracking-wider text-fg-subtle">How it works</div>
            <ul className="list-disc space-y-1.5 pl-4">
              <li>Score 7 criteria from 1–5 and write strengths + improvements.</li>
              <li>Authors never see your name; you never see theirs.</li>
              <li>+10 XP per review. Authors rate helpfulness 1–5, which feeds your Communication and Leadership skills.</li>
              <li>Each pitch gets at most 5 reviews; you can write up to 10 a day.</li>
            </ul>
          </Card>
          {!!mine.data?.length && (
            <Card>
              <CardHeader title="Recent reviews" />
              <CardContent className="space-y-2">
                {mine.data.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">{timeAgo(r.created_at)}</span>
                    <span className="flex items-center gap-2">
                      {r.helpful_rating ? <Badge tone="accent">{r.helpful_rating}★ helpful</Badge> : <span className="text-fg-subtle">not rated</span>}
                      <ScorePill score={r.overall} />
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const { pitchId } = useParams();
  return pitchId ? <ReviewForm /> : <ReviewQueue />;
}

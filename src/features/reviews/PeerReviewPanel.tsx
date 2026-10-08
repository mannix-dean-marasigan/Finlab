import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PEER_CRITERIA, getPitchReviews, ratePeerReview, setPeerReviewOpen } from '@/services/api/engage';
import type { PeerReview, StockPitch } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScorePill } from '@/components/common';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export function StarRating({ value, onChange, disabled, size = 'md' }: { value: number; onChange?: (v: number) => void; disabled?: boolean; size?: 'sm' | 'md' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled || !onChange}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
          className="p-0.5 disabled:cursor-default"
          aria-label={`${n} of 5`}
        >
          <Star className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5', n <= shown ? 'fill-accent text-accent' : 'text-fg-subtle')} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ r, canRate, pitchId }: { r: PeerReview; canRate: boolean; pitchId: string }) {
  const qc = useQueryClient();
  const rate = useMutation({
    mutationFn: (v: number) => ratePeerReview(r.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pitch-reviews', pitchId] });
      toast.success('Thanks. Helpful reviews earn the reviewer credit.');
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{r.mine ? 'Your review' : r.reviewer_label}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-subtle">{timeAgo(r.created_at)}</span>
          <ScorePill score={r.overall} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        {PEER_CRITERIA.map((c) => (
          <div key={c.key} className="flex justify-between gap-2">
            <span className="text-fg-muted">{c.label}</span>
            <span className="font-mono">{r.scores[c.key]}/5</span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-up">Strengths</div>
          <p className="whitespace-pre-line text-fg/90">{r.strengths}</p>
        </div>
        <div>
          <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">To improve</div>
          <p className="whitespace-pre-line text-fg/90">{r.improvements}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-fg-muted">
        {r.helpful_rating ? (
          <>
            Rated helpful: <StarRating value={r.helpful_rating} size="sm" />
          </>
        ) : canRate ? (
          <>
            How helpful was this? <StarRating value={0} onChange={(v) => rate.mutate(v)} disabled={rate.isPending} size="sm" />
          </>
        ) : (
          'Not rated yet by the author'
        )}
      </div>
    </div>
  );
}

/** Owner view on a submitted pitch: opt in to peer review and read/rate reviews. */
export function PeerReviewPanel({ pitch, isOwner }: { pitch: StockPitch; isOwner: boolean }) {
  const qc = useQueryClient();
  const reviews = useQuery({ queryKey: ['pitch-reviews', pitch.id], queryFn: () => getPitchReviews(pitch.id) });
  const toggle = useMutation({
    mutationFn: (open: boolean) => setPeerReviewOpen(pitch.id, open),
    onSuccess: (_, open) => {
      qc.invalidateQueries({ queryKey: ['pitch', pitch.id] });
      toast.success(open ? 'Open for peer review. Other analysts can now review it anonymously.' : 'Closed to new peer reviews.');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const list = reviews.data ?? [];
  if (!isOwner && !list.length) return null;
  const avg = list.length ? list.reduce((s, r) => s + r.overall, 0) / list.length : null;

  return (
    <Card>
      <CardHeader
        title="Peer review"
        icon={<Users className="h-3.5 w-3.5" />}
        subtitle={avg !== null ? `${list.length} review${list.length === 1 ? '' : 's'} · average ${avg.toFixed(0)}/100` : 'Get anonymous feedback from fellow analysts'}
      />
      <CardContent className="space-y-3">
        {isOwner && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 p-3">
            <div className="text-xs text-fg-muted">
              {pitch.peer_review_open
                ? 'Open: shown anonymously in the review queue (up to 5 reviews).'
                : 'Reviewers see your pitch without your name. You rate how helpful each review was.'}
            </div>
            <Button size="sm" variant={pitch.peer_review_open ? 'outline' : 'primary'} onClick={() => toggle.mutate(!pitch.peer_review_open)} loading={toggle.isPending}>
              <MessageSquareText className="h-4 w-4" />
              {pitch.peer_review_open ? 'Close' : 'Request reviews'}
            </Button>
          </div>
        )}
        {list.map((r) => (
          <ReviewCard key={r.id} r={r} canRate={isOwner} pitchId={pitch.id} />
        ))}
      </CardContent>
    </Card>
  );
}

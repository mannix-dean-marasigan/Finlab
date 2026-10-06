import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, CheckCircle2, Layers, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { getFlashcardQueue, getFlashcardStats, flashcardCountsByLesson, reviewFlashcard } from '@/services/api/engage';
import { listLessons } from '@/services/api/misc';
import type { FlashcardItem } from '@/types/domain';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton, Skeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';

const GRADES = [
  { grade: 0 as const, label: 'Again', key: '1', hint: '10 min', cls: 'border-down/40 text-down hover:bg-down/10' },
  { grade: 1 as const, label: 'Hard', key: '2', hint: 'shorter', cls: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10' },
  { grade: 2 as const, label: 'Good', key: '3', hint: 'normal', cls: 'border-up/40 text-up hover:bg-up/10' },
  { grade: 3 as const, label: 'Easy', key: '4', hint: 'longer', cls: 'border-info/40 text-info hover:bg-info/10' },
];

function nextIntervalLabel(card: FlashcardItem, grade: 0 | 1 | 2 | 3): string {
  // Mirrors review_flashcard() so learners see what each button does.
  const d = card.interval_days;
  const days = grade === 0 ? 0 : grade === 1 ? Math.max(1, d * 1.2) : grade === 2 ? (d < 1 ? 1 : d < 3 ? 3 : d * 2.5) : d < 1 ? 4 : d * 3.5;
  if (grade === 0) return '10m';
  const capped = Math.min(days, 180);
  return capped >= 30 ? `${Math.round(capped / 30)}mo` : `${Math.round(capped)}d`;
}

export function Session({ lessonId, onExit }: { lessonId: string | null; onExit: () => void }) {
  const qc = useQueryClient();
  const queue = useQuery({ queryKey: ['flashcards', 'queue', lessonId], queryFn: () => getFlashcardQueue(lessonId, 30), staleTime: Infinity });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [again, setAgain] = useState<FlashcardItem[]>([]);
  const [reviewed, setReviewed] = useState(0);

  const deck = useMemo(() => [...(queue.data ?? []), ...again], [queue.data, again]);
  const card = deck[idx];

  const review = useMutation({
    mutationFn: ({ c, grade }: { c: FlashcardItem; grade: 0 | 1 | 2 | 3 }) => reviewFlashcard(c.card_id, grade),
    onError: (e) => toast.error((e as Error).message),
  });

  const grade = useCallback(
    (g: 0 | 1 | 2 | 3) => {
      if (!card || !flipped || review.isPending) return;
      review.mutate(
        { c: card, grade: g },
        {
          onSuccess: () => {
            setReviewed((n) => n + 1);
            // "Again" cards come back at the end of this session.
            if (g === 0) setAgain((a) => [...a, { ...card, interval_days: 0, is_new: false }]);
            setFlipped(false);
            setIdx((i) => i + 1);
          },
        },
      );
    },
    [card, flipped, review],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped(true);
      }
      const g = GRADES.find((x) => x.key === e.key);
      if (g) grade(g.grade);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [grade]);

  useEffect(() => {
    if (queue.data && idx >= deck.length && reviewed > 0) {
      qc.invalidateQueries({ queryKey: ['flashcards', 'stats'] });
      qc.invalidateQueries({ queryKey: ['today-plan'] });
      qc.invalidateQueries({ queryKey: ['my-activity'] });
    }
  }, [idx, deck.length, reviewed, queue.data, qc]);

  if (queue.isPending) return <Skeleton className="h-80" />;
  if (queue.isError) return <ErrorState error={queue.error} onRetry={() => queue.refetch()} />;
  if (!queue.data.length) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-5 w-5 text-up" />}
        title="Nothing due right now"
        description="You've reviewed every due card and today's new cards. Come back tomorrow — spacing is what makes it stick."
        action={<Button onClick={onExit}>Back to decks</Button>}
      />
    );
  }
  if (!card) {
    return (
      <Card className="p-8 text-center animate-fade-in">
        <Trophy className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-3 text-xl font-semibold">Session complete</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {reviewed} review{reviewed === 1 ? '' : 's'} · +{reviewed} XP. Cards you found easy won't come back for a while.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onExit}>Back to decks</Button>
          <Button
            variant="primary"
            onClick={() => {
              setIdx(0);
              setAgain([]);
              setReviewed(0);
              qc.invalidateQueries({ queryKey: ['flashcards', 'queue', lessonId] });
            }}
          >
            <RotateCcw className="h-4 w-4" /> Check for more
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-xs text-fg-muted">
        <button onClick={onExit} className="inline-flex items-center gap-1 hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> Decks
        </button>
        <span className="font-mono">
          {idx + 1} / {deck.length}
        </span>
      </div>
      <Progress value={(idx / deck.length) * 100} className="mb-4" />
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block w-full text-left [perspective:1200px]"
        aria-label={flipped ? 'Show question' : 'Show answer'}
      >
        <div
          className={cn(
            'relative min-h-[18rem] w-full transition-transform duration-500 [transform-style:preserve-3d]',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          <Card className="absolute inset-0 flex flex-col p-6 [backface-visibility:hidden] sm:p-8">
            <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-wider text-fg-subtle">
              <span className="truncate">{card.lesson_title}</span>
              {card.is_new ? <Badge tone="accent">New</Badge> : <Badge>Review</Badge>}
            </div>
            <div className="flex flex-1 items-center justify-center py-6 text-center text-xl font-medium leading-snug sm:text-2xl">{card.front}</div>
            <div className="text-center text-xs text-fg-subtle">Tap or press Space to reveal</div>
          </Card>
          <Card className="absolute inset-0 flex flex-col border-accent/30 bg-gradient-to-b from-accent/[0.05] to-surface p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8">
            <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">{card.front}</div>
            <div className="flex flex-1 items-center justify-center py-6 text-center text-lg leading-relaxed sm:text-xl">{card.back}</div>
            <div className="text-center text-xs text-fg-subtle">How well did you recall it?</div>
          </Card>
        </div>
      </button>
      <div className={cn('mt-4 grid grid-cols-4 gap-2 transition-opacity', !flipped && 'pointer-events-none opacity-30')}>
        {GRADES.map((g) => (
          <button
            key={g.grade}
            type="button"
            disabled={!flipped || review.isPending}
            onClick={() => grade(g.grade)}
            className={cn('rounded-md border bg-surface px-2 py-2.5 text-sm font-medium transition-colors', g.cls)}
          >
            {g.label}
            <span className="block font-mono text-[0.7rem] font-normal text-fg-subtle">
              {nextIntervalLabel(card, g.grade)} · {g.key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [params, setParams] = useSearchParams();
  const session = params.get('session');
  const lessonParam = params.get('lesson');
  const stats = useQuery({ queryKey: ['flashcards', 'stats'], queryFn: getFlashcardStats });
  const lessons = useQuery({ queryKey: ['lessons'], queryFn: listLessons });
  const counts = useQuery({ queryKey: ['flashcards', 'counts'], queryFn: flashcardCountsByLesson });

  const start = (lesson: string | null) => setParams(lesson ? { session: '1', lesson } : { session: '1' });

  if (session) {
    return (
      <div className="animate-fade-in">
        <Session key={lessonParam ?? 'all'} lessonId={lessonParam} onExit={() => setParams({})} />
      </div>
    );
  }
  if (stats.isPending || lessons.isPending) return <PageSkeleton />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={() => stats.refetch()} />;

  const s = stats.data;
  const decks = (lessons.data ?? []).filter((l) => (counts.data?.[l.id] ?? 0) > 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Learn"
        title="Flashcards"
        description="Spaced repetition for the formulas and concepts from every briefing. Cards you know come back less often; cards you miss come back sooner."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Due now', value: s.due, icon: Brain, tone: s.due > 0 ? 'text-accent' : 'text-fg' },
          { label: 'Reviewed today', value: s.reviewed_today, icon: CheckCircle2, tone: 'text-fg' },
          { label: 'Learned', value: `${s.learned} / ${s.total}`, icon: Layers, tone: 'text-fg' },
          { label: 'Mastered (21d+)', value: s.mastered, icon: Sparkles, tone: 'text-up' },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
              {k.label} <k.icon className="h-3.5 w-3.5" />
            </div>
            <div className={cn('mt-2 font-mono text-2xl font-semibold tabular', k.tone)}>{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 flex flex-col items-start justify-between gap-4 border-accent/30 bg-gradient-to-r from-accent/[0.06] to-surface p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">Daily review</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Due cards from every lesson, plus up to 20 new cards a day. Keyboard: Space to flip, 1–4 to grade.
          </p>
        </div>
        <Button variant="primary" onClick={() => start(null)}>
          <Brain className="h-4 w-4" /> {s.due > 0 ? `Review ${s.due} due` : 'Start session'}
        </Button>
      </Card>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-fg-muted">Decks by lesson</h2>
      {!decks.length ? (
        <EmptyState title="No flashcards published yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((l) => (
            <Card key={l.id} className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-fg-muted">
                <Layers className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/learn/${l.slug}`} className="block truncate text-sm font-medium hover:text-accent">
                  {l.title}
                </Link>
                <div className="text-xs text-fg-subtle">{counts.data?.[l.id]} cards</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => start(l.id)}>
                Study
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

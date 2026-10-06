import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, GraduationCap, ListChecks, Lock, PlayCircle, RotateCcw, Target, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { fetchLessonAttempts, fetchLessonProgress, fetchVideoWatched, getLesson, markVideoWatched, submitLessonCheck } from '@/services/api/misc';
import { listChallenges } from '@/services/api/challenges';
import type { Lesson, LessonCheckResult } from '@/types/domain';
import { DifficultyBadge, Markdown } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { TaskInput } from '@/features/challenges/TaskWorkspace';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { fmtDateTime, fmtScore } from '@/lib/format';
import { cn } from '@/lib/utils';

function KnowledgeCheck({ lesson, completed }: { lesson: Lesson; completed: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LessonCheckResult | null>(null);
  const [wait, setWait] = useState(0);
  const attempts = useQuery({ queryKey: ['lessonAttempts', lesson.id], queryFn: () => fetchLessonAttempts(user!.id, lesson.id) });
  const questions = lesson.check_questions ?? [];

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = useMutation({
    mutationFn: () => submitLessonCheck(lesson.id, answers),
    onSuccess: (r) => {
      setResult(r);
      if (r.retry_after_seconds) setWait(r.retry_after_seconds);
      qc.invalidateQueries({ queryKey: ['lessonAttempts', lesson.id] });
      qc.invalidateQueries({ queryKey: ['lessonProgress'] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      qc.invalidateQueries({ queryKey: ['program'] });
      invalidateProgress(qc);
      if (r.passed) toast.success(r.first_completion ? 'Briefing completed — knowledge check passed' : 'Passed again');
    },
  });

  if (!questions.length) {
    return <p className="text-sm text-fg-muted">This briefing has no knowledge check yet, so completion isn't tracked.</p>;
  }

  const byKey = new Map(result?.questions.map((q) => [q.key, q.correct]));
  const answered = questions.filter((q) => (answers[q.id] ?? '').trim() !== '').length;

  return (
    <div className="space-y-4">
      {completed && !result && (
        <div className="flex items-center gap-2 rounded-md border border-up/30 bg-up-muted px-3 py-2 text-sm text-up">
          <CheckCircle2 className="h-4 w-4" /> You've passed this check. You can retake it to practise.
        </div>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="relative">
          {result && (
            <span className={cn('absolute -left-2 top-4 z-10 rounded-full bg-surface', byKey.get(q.id) ? 'text-up' : 'text-down')}>
              {byKey.get(q.id) ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
          )}
          <TaskInput task={q} index={i} value={answers[q.id] ?? ''} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
        </div>
      ))}

      {result && (
        <div className={cn('rounded-lg border p-4', result.passed ? 'border-up/40 bg-up-muted' : 'border-down/40 bg-down-muted')}>
          <div className="flex items-center justify-between gap-3">
            <div className={cn('font-semibold', result.passed ? 'text-up' : 'text-down')}>
              {result.passed ? 'Passed' : 'Not yet'} — {fmtScore(result.score)}%
            </div>
            <span className="text-xs text-fg-muted">Pass mark {result.pass_pct}%</span>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {result.passed
              ? 'This briefing now counts as completed toward your certifications.'
              : 'Questions marked ✗ are incorrect. Re-read the briefing above — answers are never revealed, so you have to understand it.'}
          </p>
        </div>
      )}
      <InlineError message={submit.error ? (submit.error as Error).message : null} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-fg-subtle">
          {answered}/{questions.length} answered · graded on the server
        </span>
        <Button
          variant="primary"
          onClick={() => {
            setResult(null);
            submit.mutate();
          }}
          loading={submit.isPending}
          disabled={answered < questions.length || wait > 0}
        >
          {result && !result.passed ? <RotateCcw className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          {wait > 0 ? `Retry in ${wait}s` : result && !result.passed ? 'Try again' : 'Check my answers'}
        </Button>
      </div>
      {!!attempts.data?.length && (
        <div className="border-t border-border pt-3 text-xs text-fg-subtle">
          Previous attempts:{' '}
          {attempts.data.slice(0, 5).map((a, i) => (
            <span key={a.created_at} className={cn('mr-2 font-mono', a.passed ? 'text-up' : 'text-fg-muted')} title={fmtDateTime(a.created_at)}>
              {fmtScore(a.score)}%{i < Math.min(4, attempts.data.length - 1) ? ',' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const lesson = useQuery({ queryKey: ['lesson', slug], queryFn: () => getLesson(slug) });
  const progress = useQuery({ queryKey: ['lessonProgress', user!.id], queryFn: () => fetchLessonProgress(user!.id) });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: listChallenges });
  const lessonId = lesson.data?.id;
  const watched = useQuery({
    queryKey: ['videoWatched', lessonId],
    queryFn: () => fetchVideoWatched(user!.id, lessonId!),
    enabled: !!lessonId && (lesson.data?.video_urls?.length ?? 0) > 0,
  });
  const markWatched = useMutation({
    mutationFn: (method: 'ended' | 'manual') => markVideoWatched(lessonId!, method),
    onSuccess: (_, method) => {
      qc.setQueryData(['videoWatched', lessonId], true);
      toast.success(method === 'ended' ? 'Video complete — knowledge check unlocked' : 'Knowledge check unlocked');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (lesson.isPending) return <PageSkeleton />;
  if (lesson.isError) return <ErrorState error={lesson.error} onRetry={() => lesson.refetch()} />;
  if (!lesson.data) return <EmptyState title="Lesson not found" action={<Link to="/learn" className="text-accent">Back to Learn</Link>} />;

  const l = lesson.data;
  const complete = progress.data?.has(l.id) ?? false;
  const hasVideo = (l.video_urls?.length ?? 0) > 0;
  const videoDone = watched.data === true;
  const related = (challenges.data ?? []).filter((c) => l.related_challenge_slugs.includes(c.slug));

  return (
    <div className="animate-fade-in">
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Learn
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
              <DifficultyBadge difficulty={l.difficulty} />
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {l.estimated_minutes} min
              </span>
              {complete && (
                <Badge tone="up">
                  <CheckCircle2 className="h-3 w-3" /> Completed
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{l.title}</h1>
            <p className="mt-1 text-fg-muted">{l.summary}</p>
            <hr className="my-6 border-border" />
            {hasVideo && (
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  <PlayCircle className="h-4 w-4 text-accent" /> Step 1 · Watch the video
                </div>
                <YouTubeEmbed url={l.video_urls[0]} title={l.title} onEnded={() => !videoDone && markWatched.mutate('ended')} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-fg-subtle">Video by an independent YouTube creator. The knowledge check unlocks when it finishes or when you mark it as watched.</p>
                  {videoDone ? (
                    <Badge tone="up">
                      <CheckCircle2 className="h-3 w-3" /> Video watched
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => markWatched.mutate('manual')} loading={markWatched.isPending}>
                      <CheckCircle2 className="h-4 w-4" /> I've watched the video
                    </Button>
                  )}
                </div>
              </div>
            )}
            {hasVideo && (
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Step 2 · Read the briefing</div>
            )}
            <Markdown>{l.body}</Markdown>
          </Card>
          <Card>
            <CardHeader
              title={`${hasVideo ? 'Step 3 · ' : ''}Knowledge check · ${l.check_questions?.length ?? 0} questions`}
              subtitle="Pass to complete this briefing. Answers are checked on the server and never shown."
              icon={<ListChecks className="h-3.5 w-3.5" />}
            />
            <CardContent>
              {hasVideo && !videoDone && !complete ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-fg-subtle">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div className="font-medium">Locked until you watch the video</div>
                  <p className="max-w-sm text-sm text-fg-muted">
                    Finish the video above (or mark it as watched) to unlock the {l.check_questions?.length ?? 0}-question knowledge check.
                  </p>
                  {watched.isError && <InlineError message="Could not check your video progress. Refresh to try again." />}
                </div>
              ) : (
                <KnowledgeCheck lesson={l} completed={complete} />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Apply it" icon={<Target className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-2">
              {!related.length ? (
                <p className="text-sm text-fg-muted">No linked challenge yet.</p>
              ) : (
                related.map((c) => (
                  <Link key={c.id} to={`/challenges/${c.id}`} className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:border-border-strong">
                    <span>{c.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
          <Link to="/certifications">
            <Card className="mt-4 flex items-center gap-3 p-4 hover:border-border-strong">
              <GraduationCap className="h-5 w-5 text-accent" />
              <div className="text-sm">
                <div className="font-medium">Earn a certificate</div>
                <div className="text-xs text-fg-muted">This briefing counts toward certifications and tracks.</div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

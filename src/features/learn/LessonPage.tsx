import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { fetchLessonProgress, getLesson, setLessonComplete } from '@/services/api/misc';
import { listChallenges } from '@/services/api/challenges';
import { DifficultyBadge, Markdown } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';

export default function LessonPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const lesson = useQuery({ queryKey: ['lesson', slug], queryFn: () => getLesson(slug) });
  const progress = useQuery({ queryKey: ['lessonProgress', user!.id], queryFn: () => fetchLessonProgress(user!.id) });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: listChallenges });
  const toggle = useMutation({
    mutationFn: (complete: boolean) => setLessonComplete(user!.id, lesson.data!.id, complete),
    onSuccess: (_, complete) => {
      qc.invalidateQueries({ queryKey: ['lessonProgress'] });
      if (complete) toast.success('Briefing marked complete');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (lesson.isPending) return <PageSkeleton />;
  if (lesson.isError) return <ErrorState error={lesson.error} onRetry={() => lesson.refetch()} />;
  if (!lesson.data) return <EmptyState title="Lesson not found" action={<Link to="/learn" className="text-accent">Back to Learn</Link>} />;

  const l = lesson.data;
  const complete = progress.data?.has(l.id) ?? false;
  const related = (challenges.data ?? []).filter((c) => l.related_challenge_slugs.includes(c.slug));

  return (
    <div className="animate-fade-in">
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Learn
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
            <DifficultyBadge difficulty={l.difficulty} />
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {l.estimated_minutes} min
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{l.title}</h1>
          <p className="mt-1 text-fg-muted">{l.summary}</p>
          <hr className="my-6 border-border" />
          <Markdown>{l.body}</Markdown>
          <div className="mt-8 flex justify-end">
            <Button variant={complete ? 'success' : 'primary'} onClick={() => toggle.mutate(!complete)} loading={toggle.isPending}>
              <CheckCircle2 className="h-4 w-4" /> {complete ? 'Completed' : 'Mark as complete'}
            </Button>
          </div>
        </Card>
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
        </div>
      </div>
    </div>
  );
}

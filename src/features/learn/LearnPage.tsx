import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { useReference } from '@/app/queries';
import { fetchLessonProgress, listLessons } from '@/services/api/misc';
import { PageHeader, DifficultyBadge, DynamicIcon } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';

export default function LearnPage() {
  const { user } = useAuth();
  const ref = useReference();
  const lessons = useQuery({ queryKey: ['lessons'], queryFn: listLessons });
  const progress = useQuery({ queryKey: ['lessonProgress', user!.id], queryFn: () => fetchLessonProgress(user!.id) });

  if (lessons.isPending || progress.isPending) return <PageSkeleton />;
  if (lessons.isError) return <ErrorState error={lessons.error} onRetry={() => lessons.refetch()} />;
  if (progress.isError) return <ErrorState error={progress.error} onRetry={() => progress.refetch()} />;

  const done = lessons.data.filter((l) => progress.data.has(l.id)).length;
  const byCategory = (ref.data?.categories ?? []).map((c) => ({ category: c, lessons: lessons.data.filter((l) => l.category_id === c.id) })).filter((g) => g.lessons.length);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Learn"
        title="Briefings"
        description="Short, practical lessons. Each one links to the challenge where you apply it — reading earns no score; doing the work does."
      />
      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <BookOpen className="h-5 w-5 text-accent" />
        <div className="flex-1">
          <div className="text-sm">
            {done} of {lessons.data.length} briefings completed
          </div>
          <Progress value={lessons.data.length ? (done / lessons.data.length) * 100 : 0} className="mt-2" />
        </div>
      </Card>
      {!lessons.data.length ? (
        <EmptyState title="No lessons published yet" />
      ) : (
        <div className="space-y-8">
          {byCategory.map(({ category, lessons: ls }) => (
            <section key={category.id}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-fg-muted">
                <DynamicIcon name={category.icon} className="h-4 w-4" /> {category.name}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ls.map((l) => {
                  const complete = progress.data.has(l.id);
                  return (
                    <Link key={l.id} to={`/learn/${l.slug}`}>
                      <Card className="h-full p-4 transition-colors hover:border-border-strong">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium">{l.title}</h3>
                          {complete && <CheckCircle2 className="h-4 w-4 shrink-0 text-up" />}
                        </div>
                        <p className="mt-1 text-sm text-fg-muted">{l.summary}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs text-fg-subtle">
                          <DifficultyBadge difficulty={l.difficulty} />
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {l.estimated_minutes} min
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

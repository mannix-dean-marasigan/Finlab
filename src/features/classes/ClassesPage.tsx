import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getMyCohorts, joinCohort, leaveCohort } from '@/services/api/engage';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { ClassDetail } from './ClassDetail';

export default function ClassesPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const classes = useQuery({ queryKey: ['my-cohorts'], queryFn: getMyCohorts });
  const [code, setCode] = useState((params.get('join') ?? '').toUpperCase());
  const [selected, setSelected] = useState<string | null>(null);

  const join = useMutation({
    mutationFn: () => joinCohort(code),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['my-cohorts'] });
      setCode('');
      setSelected(c.id);
      setParams({});
      toast.success(`You joined ${c.name}`);
    },
  });
  const leave = useMutation({
    mutationFn: (id: string) => leaveCohort(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-cohorts'] });
      setSelected(null);
      toast('You left the class');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // A class link (?join=CODE) joins automatically once.
  useEffect(() => {
    if (params.get('join') && classes.isSuccess && !classes.data.some((c) => c.join_code === params.get('join')?.toUpperCase()) && !join.isPending && !join.isSuccess && !join.isError) {
      join.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.isSuccess]);

  if (classes.isPending) return <PageSkeleton />;
  if (classes.isError) return <ErrorState error={classes.error} onRetry={() => classes.refetch()} />;
  const list = classes.data;
  const active = list.find((c) => c.id === (selected ?? list[0]?.id));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Compete"
        title="Classes"
        description="Join your class or org with its code for a private leaderboard. Your class managers, like your professor or org officers, can see your progress."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          {!active ? (
            <EmptyState icon={<Users className="h-5 w-5" />} title="You're not in a class yet" description="Enter a class code on the right. Your instructor or organization will give it to you." />
          ) : (
            <>
              {list.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {list.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      className={cn('rounded-full border px-3 py-1 text-sm', c.id === active.id ? 'border-accent bg-accent-muted text-accent' : 'border-border-strong text-fg-muted hover:text-fg')}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <ClassDetail key={active.id} cohortId={active.id} name={active.name} joinCode={active.join_code} isManager={active.is_manager} members={active.members} />
            </>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Join a class" icon={<UserPlus className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && code.trim() && join.mutate()}
                placeholder="CLASS-CODE"
                className="font-mono tracking-wider"
                aria-label="Class code"
              />
              <InlineError message={join.error ? (join.error as Error).message : null} />
              <Button variant="primary" className="w-full justify-center" disabled={code.trim().length < 4} onClick={() => join.mutate()} loading={join.isPending}>
                Join
              </Button>
              <p className="text-xs text-fg-subtle">Joining lets your class managers see your progress in FINLAB (scores, lessons, certificates and activity). You can leave any time.</p>
            </CardContent>
          </Card>
          {active && active.is_member && (
            <Card className="p-4">
              <div className="text-xs text-fg-muted">
                Your week in <span className="text-fg">{active.name}</span>: <span className="font-mono text-fg">{active.my_xp_week} XP</span>
                {active.my_rank_week ? ` · rank #${active.my_rank_week}` : ''}
              </div>
              <Button size="xs" variant="ghost" className="mt-2 hover:text-down" onClick={() => window.confirm(`Leave ${active.name}?`) && leave.mutate(active.id)}>
                <LogOut className="h-3.5 w-3.5" /> Leave this class
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

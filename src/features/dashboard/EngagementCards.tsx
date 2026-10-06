import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Brain, CalendarCheck, CheckCircle2, Compass, Flame, GraduationCap, ListChecks, MessageSquareText, PlayCircle, XCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { getDailyChallenge, getMyActivity, getTodayPlan, submitDailyAnswer } from '@/services/api/engage';
import type { MyActivity, TodayItem } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const PLAN_ICON: Record<TodayItem['kind'], typeof Zap> = {
  daily: CalendarCheck,
  flashcards: Brain,
  attempt: PlayCircle,
  program: GraduationCap,
  review: MessageSquareText,
  explore: Compass,
};

export function TodayPlanCard() {
  const { user } = useAuth();
  const plan = useQuery({ queryKey: ['today-plan', user!.id], queryFn: getTodayPlan });
  return (
    <Card>
      <CardHeader title="Today's plan" subtitle="Updated as you complete work" icon={<ListChecks className="h-3.5 w-3.5" />} />
      <CardContent className="px-0 pb-1">
        {plan.isPending ? (
          <div className="space-y-2 px-4 pb-3">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        ) : plan.isError ? (
          <ErrorState error={plan.error} onRetry={() => plan.refetch()} />
        ) : (
          <ul>
            {plan.data.map((item, i) => {
              const Icon = PLAN_ICON[item.kind] ?? Zap;
              const isAnchor = item.link.startsWith('/dashboard#');
              const body = (
                <>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', i === 0 ? 'bg-accent-muted text-accent' : 'bg-surface-3 text-fg-muted')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.title}</span>
                    <span className="block truncate text-xs text-fg-muted">{item.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-fg-subtle" />
                </>
              );
              const cls = 'flex w-full items-center gap-3 border-t border-border/70 px-4 py-2.5 text-left hover:bg-surface-2';
              return (
                <li key={`${item.kind}-${i}`}>
                  {isAnchor ? (
                    <button
                      type="button"
                      className={cls}
                      onClick={() => document.getElementById(item.link.split('#')[1])?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    >
                      {body}
                    </button>
                  ) : (
                    <Link to={item.link} className={cls}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function DailyChallengeCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const daily = useQuery({ queryKey: ['daily', user!.id], queryFn: getDailyChallenge });
  const [choice, setChoice] = useState('');
  const submit = useMutation({
    mutationFn: () => submitDailyAnswer(choice),
    onSuccess: (res) => {
      qc.setQueryData(['daily', user!.id], res);
      qc.invalidateQueries({ queryKey: ['today-plan'] });
      qc.invalidateQueries({ queryKey: ['my-activity'] });
      invalidateProgress(qc);
      if (res.correct) toast.success('Correct! +10 XP');
      else toast('Not quite — see the explanation. +3 XP for showing up.');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card id="daily" className="scroll-mt-24 border-accent/30">
      <CardHeader
        title="Daily challenge"
        subtitle={daily.data ? `${fmtDate(daily.data.day, { weekday: 'long', month: 'short', day: 'numeric' })} · same question for everyone` : undefined}
        icon={<CalendarCheck className="h-3.5 w-3.5 text-accent" />}
      />
      <CardContent>
        {daily.isPending ? (
          <Skeleton className="h-32" />
        ) : daily.isError ? (
          <ErrorState error={daily.error} onRetry={() => daily.refetch()} />
        ) : !daily.data ? (
          <p className="text-sm text-fg-muted">No daily challenge today.</p>
        ) : (
          (() => {
            const d = daily.data;
            const q = d.question;
            return (
              <div>
                <p className="text-sm font-medium leading-relaxed">{q.prompt}</p>
                {q.type === 'mcq' ? (
                  <div className="mt-3 space-y-1.5">
                    {q.options?.map((o) => {
                      const picked = d.answered ? d.response === o.id : choice === o.id;
                      const isAnswer = d.answered && String(d.answer) === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={d.answered}
                          onClick={() => setChoice(o.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                            isAnswer
                              ? 'border-up/50 bg-up-muted'
                              : d.answered && picked
                                ? 'border-down/50 bg-down-muted'
                                : picked
                                  ? 'border-accent bg-accent-muted'
                                  : 'border-border hover:border-border-strong',
                          )}
                        >
                          <span className="font-mono text-xs uppercase text-fg-subtle">{o.id}</span>
                          <span className="flex-1">{o.label}</span>
                          {isAnswer && <CheckCircle2 className="h-4 w-4 text-up" />}
                          {d.answered && picked && !isAnswer && <XCircle className="h-4 w-4 text-down" />}
                        </button>
                      );
                    })}
                  </div>
                ) : d.answered ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className={cn('rounded-md border px-3 py-2', d.correct ? 'border-up/40 bg-up-muted' : 'border-down/40 bg-down-muted')}>
                      <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Your answer</div>
                      <div className="font-mono">
                        {d.response} {q.unit}
                      </div>
                    </div>
                    <div className="rounded-md border border-up/40 bg-up-muted px-3 py-2">
                      <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Answer</div>
                      <div className="font-mono">
                        {String(d.answer)} {q.unit}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      inputMode="decimal"
                      value={choice}
                      onChange={(e) => setChoice(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && choice.trim() && submit.mutate()}
                      placeholder="Your answer"
                      className="font-mono"
                      aria-label="Your answer"
                    />
                    {q.unit && <span className="shrink-0 text-sm text-fg-muted">{q.unit}</span>}
                  </div>
                )}
                {d.answered ? (
                  <div className="mt-3 space-y-2">
                    <div className={cn('flex items-center gap-2 text-sm font-medium', d.correct ? 'text-up' : 'text-down')}>
                      {d.correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {d.correct ? 'Correct' : 'Incorrect'}
                    </div>
                    {d.explanation && <p className="rounded-md bg-surface-2 p-3 text-sm text-fg-muted">{d.explanation}</p>}
                    <p className="text-xs text-fg-subtle">
                      {d.correct_today} of {d.solved_today} analyst{d.solved_today === 1 ? '' : 's'} got it right today. New question tomorrow (Manila time).
                    </p>
                  </div>
                ) : (
                  <Button variant="primary" className="mt-3 w-full justify-center" disabled={!choice.trim()} loading={submit.isPending} onClick={() => submit.mutate()}>
                    Lock in answer
                  </Button>
                )}
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}

function heatClass(xp: number) {
  if (xp <= 0) return 'bg-surface-3';
  if (xp < 15) return 'bg-accent/25';
  if (xp < 40) return 'bg-accent/50';
  if (xp < 80) return 'bg-accent/75';
  return 'bg-accent';
}

export function ActivityHeatmap({ a }: { a: MyActivity }) {
  // 35 days ending today: 5 rows of 7 days, oldest first.
  return (
    <div>
      <div className="grid grid-cols-7 gap-1" role="img" aria-label="Activity over the last 35 days">
        {a.days.map((d, i) => (
          <div
            key={d.date}
            title={`${fmtDate(d.date, { month: 'short', day: 'numeric' })}: ${d.xp} XP`}
            className={cn('h-4 rounded-[3px]', heatClass(d.xp), i === a.days.length - 1 && 'ring-1 ring-accent/70')}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[0.65rem] text-fg-subtle">
        <span>5 weeks ago</span>
        <span className="flex items-center gap-1">
          less
          {[0, 10, 30, 60, 100].map((x) => (
            <span key={x} className={cn('h-2.5 w-2.5 rounded-[2px]', heatClass(x))} />
          ))}
          more
        </span>
        <span>today</span>
      </div>
    </div>
  );
}

export function StreakCard() {
  const { user } = useAuth();
  const act = useQuery({ queryKey: ['my-activity', user!.id], queryFn: getMyActivity });
  return (
    <Card>
      <CardHeader title="Streak & XP" icon={<Flame className="h-3.5 w-3.5 text-accent" />} action={<Link to="/leaderboard?board=xp_week" className="text-xs text-accent hover:underline">Weekly board</Link>} />
      <CardContent>
        {act.isPending ? (
          <Skeleton className="h-36" />
        ) : act.isError ? (
          <ErrorState error={act.error} onRetry={() => act.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center gap-1 font-mono text-2xl font-semibold tabular">
                  {act.data.current_streak}
                  <Flame className={cn('h-5 w-5', act.data.active_today ? 'fill-accent text-accent' : 'text-fg-subtle')} />
                </div>
                <div className="text-xs text-fg-muted">day streak</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold tabular">{act.data.xp_week}</div>
                <div className="text-xs text-fg-muted">XP this week</div>
              </div>
              <div>
                <div className="font-mono text-2xl font-semibold tabular">{act.data.longest_streak}</div>
                <div className="text-xs text-fg-muted">best streak</div>
              </div>
            </div>
            <div className="mt-4">
              <ActivityHeatmap a={act.data} />
            </div>
            <p className="mt-3 text-xs text-fg-subtle">
              {act.data.active_today
                ? 'Streak secured for today. '
                : act.data.current_streak > 0
                  ? 'Do any activity today to keep your streak alive. '
                  : 'Any scored activity today starts a streak. '}
              {act.data.xp_total.toLocaleString()} XP all-time.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

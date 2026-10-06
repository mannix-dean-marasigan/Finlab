import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CalendarClock, Lock, Medal, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress, useReference } from '@/app/queries';
import { competitionStatus, fetchStandings, getCompetition, isRegistered, registerForCompetition, withdrawFromCompetition } from '@/services/api/compete';
import { fetchMyChallengeStates } from '@/services/api/challenges';
import { Countdown, DifficultyBadge, Markdown } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime, fmtNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { STATUS_TONE } from './CompetitionsPage';

export default function CompetitionPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const ref = useReference();
  const comp = useQuery({ queryKey: ['competition', id], queryFn: () => getCompetition(id) });
  const registered = useQuery({ queryKey: ['registered', id, user!.id], queryFn: () => isRegistered(id, user!.id) });
  const standings = useQuery({ queryKey: ['standings', id], queryFn: () => fetchStandings(id), refetchInterval: 60_000 });
  const states = useQuery({ queryKey: ['challengeStates', user!.id], queryFn: () => fetchMyChallengeStates(user!.id) });

  const register = useMutation({
    mutationFn: () => registerForCompetition(id),
    onSuccess: () => {
      toast.success('Registered. Good luck.');
      qc.invalidateQueries({ queryKey: ['registered', id] });
      qc.invalidateQueries({ queryKey: ['competition', id] });
      qc.invalidateQueries({ queryKey: ['standings', id] });
      qc.invalidateQueries({ queryKey: ['competitions'] });
      invalidateProgress(qc);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawFromCompetition(id),
    onSuccess: () => {
      toast('Withdrawn');
      qc.invalidateQueries({ queryKey: ['registered', id] });
      qc.invalidateQueries({ queryKey: ['competition', id] });
      qc.invalidateQueries({ queryKey: ['standings', id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (comp.isPending) return <PageSkeleton />;
  if (comp.isError) return <ErrorState error={comp.error} onRetry={() => comp.refetch()} />;
  if (!comp.data) return <EmptyState title="Competition not found" action={<Link to="/competitions" className="text-accent">All competitions</Link>} />;

  const { competition: c, challenges, participantCount } = comp.data;
  const status = competitionStatus(c);
  const isReg = registered.data ?? false;
  const regOpen = Date.now() <= new Date(c.registration_deadline).getTime() && !c.results_finalized_at;
  const full = c.participant_limit !== null && participantCount >= c.participant_limit;
  const me = standings.data?.find((s) => s.is_me);

  return (
    <div className="animate-fade-in">
      <Link to="/competitions" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Competitions
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[status]}>{status}</Badge>
            {c.results_finalized_at && <Badge tone="accent">Results final</Badge>}
            {isReg && <Badge tone="up">Registered</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{c.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> {fmtDateTime(c.starts_at)} – {fmtDateTime(c.ends_at)}
            </span>
            <span>Registration closes {fmtDateTime(c.registration_deadline)}</span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {participantCount}
              {c.participant_limit ? ` / ${c.participant_limit}` : ''}
            </span>
            <span>Scoring: {c.scoring_method} of best scores</span>
          </div>
        </div>
        <Card className="w-full p-4 lg:w-80">
          {status !== 'completed' && <Countdown deadline={status === 'upcoming' ? c.starts_at : c.ends_at} className="mb-3 w-full justify-center" />}
          <div className="mb-3 text-center text-xs text-fg-subtle">{status === 'upcoming' ? 'until start' : status === 'active' ? 'until close' : 'Competition closed'}</div>
          {isReg ? (
            <>
              {me && (
                <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-fg-muted">Your standing</span>
                  <span className="font-mono">
                    #{me.rank} · {fmtNumber(me.score, 1)} pts
                  </span>
                </div>
              )}
              {status === 'upcoming' && (
                <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => withdraw.mutate()} loading={withdraw.isPending}>
                  Withdraw
                </Button>
              )}
            </>
          ) : regOpen && status !== 'completed' ? (
            <Button variant="primary" className="w-full justify-center" onClick={() => register.mutate()} loading={register.isPending} disabled={full}>
              {full ? 'Competition full' : 'Register'}
            </Button>
          ) : (
            <p className="text-center text-sm text-fg-muted">Registration closed.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title={`Challenges (${challenges.length})`} />
            <CardContent className="space-y-2">
              {!challenges.length ? (
                <p className="text-sm text-fg-muted">No challenges attached yet.</p>
              ) : (
                challenges.map((ch, i) => {
                  const canStart = isReg && status === 'active';
                  return (
                    <div key={ch.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded bg-surface-3 font-mono text-xs">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{ch.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                          {ref.data?.categories.find((x) => x.id === ch.category_id)?.name}
                          <DifficultyBadge difficulty={ch.difficulty} />
                          {ch.weight !== 1 && <span>weight ×{ch.weight}</span>}
                          {states.data?.[ch.id]?.in_progress && <Badge tone="accent">in progress</Badge>}
                        </div>
                      </div>
                      {canStart ? (
                        <Link to={`/challenges/${ch.id}?competition=${c.id}`}>
                          <Button size="sm" variant="primary">
                            Compete <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                          <Lock className="h-3.5 w-3.5" /> {!isReg ? 'Register to compete' : status === 'upcoming' ? 'Opens at start' : 'Closed'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
          {c.rules && (
            <Card>
              <CardHeader title="Rules" />
              <CardContent>
                <Markdown>{c.rules}</Markdown>
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader title={c.results_finalized_at ? 'Final results' : 'Live standings'} icon={<Trophy className="h-3.5 w-3.5" />} subtitle="Calculated from scored competition submissions" />
          {standings.isPending ? (
            <div className="mx-4 mb-4 h-24 animate-pulse rounded bg-surface-3" />
          ) : standings.isError ? (
            <ErrorState error={standings.error} onRetry={() => standings.refetch()} />
          ) : !standings.data.length ? (
            <EmptyState title="No participants yet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Analyst</Th>
                  <Th align="right">Done</Th>
                  <Th align="right">Score</Th>
                </tr>
              </thead>
              <tbody>
                {standings.data.map((s) => (
                  <tr key={s.user_id} className={cn(s.is_me && 'bg-accent/[0.06]')}>
                    <Td mono>
                      {s.rank <= 3 && s.score > 0 ? <Medal className={cn('inline h-4 w-4', s.rank === 1 ? 'text-accent' : s.rank === 2 ? 'text-fg-muted' : 'text-amber-700')} /> : s.rank}
                    </Td>
                    <Td>
                      {s.handle && s.display_name !== 'Private participant' ? (
                        <Link to={`/p/${s.handle}`} className="hover:text-accent">
                          {s.display_name}
                        </Link>
                      ) : (
                        s.display_name
                      )}
                      {s.is_me && <span className="ml-1 text-xs text-accent">(you)</span>}
                    </Td>
                    <Td align="right" mono>
                      {s.challenges_completed}/{challenges.length}
                    </Td>
                    <Td align="right" mono className="font-semibold">
                      {fmtNumber(s.score, 1)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

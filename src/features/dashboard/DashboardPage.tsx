import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, ArrowRight, Award, Briefcase, CheckCircle2, Circle, Clock, FileSearch, Globe2, MapPin, Presentation,
  Swords, Target, TrendingUp, Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress, useMyAchievements, useMyPreferences, useMyProfile, useMyRanks, useMySkills, useMyStats, useReference } from '@/app/queries';
import { fetchRecentActivity, refreshMyProgress } from '@/services/api/profile';
import { fetchRecommendedChallenge } from '@/services/api/challenges';
import { competitionStatus, fetchPromotionStatus, listCompetitions, myCompetitionIds } from '@/services/api/compete';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states';
import { DifficultyBadge, DynamicIcon, ScorePill, ScoreRing } from '@/components/common';
import { SkillBars, SkillRadar, mergeSkills } from '@/components/SkillChart';
import { fmtDate, fmtMinutes, fmtScore, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DailyChallengeCard, StreakCard, TodayPlanCard, WeeklyPodCard } from './EngagementCards';
import { BetaChecklistCard } from './BetaChecklistCard';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const COUNTRY_NAMES: Record<string, string> = { PH: 'Philippines' };

/** Friendly rank caption: early on, "#1 of 1" just looks empty, so say how many are ranked so far instead. */
function rankNote(rank: number | null | undefined, total: number | null | undefined, unranked: string) {
  if (!rank) return unranked;
  const n = total ?? 0;
  if (n < 10) return `Early days: ${n} analyst${n === 1 ? '' : 's'} ranked so far`;
  return `Top ${Math.max(1, Math.ceil((rank / n) * 100))}% of ${n} analysts`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const stats = useMyStats();
  const skills = useMySkills();
  const ranks = useMyRanks();
  const ref = useReference();
  const prefs = useMyPreferences();
  const myAch = useMyAchievements();
  const promotion = useQuery({ queryKey: ['promotion', user!.id], queryFn: fetchPromotionStatus });
  const activity = useQuery({ queryKey: ['activity', user!.id], queryFn: () => fetchRecentActivity(user!.id) });
  const recommended = useQuery({
    queryKey: ['recommended', user!.id, prefs.data?.interests],
    queryFn: () => fetchRecommendedChallenge(user!.id, prefs.data?.interests ?? []),
    enabled: prefs.isSuccess,
  });
  const comps = useQuery({
    queryKey: ['dashboard-competitions', user!.id],
    queryFn: async () => {
      const [all, mine] = await Promise.all([listCompetitions(), myCompetitionIds(user!.id)]);
      return all
        .filter((c) => c.is_published && competitionStatus(c) !== 'completed')
        .map((c) => ({ ...c, registered: mine.includes(c.id), status: competitionStatus(c) }));
    },
  });

  // Percentile-based achievements depend on other users; re-evaluate once per visit.
  const refreshed = useRef(false);
  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    refreshMyProgress()
      .then((newOnes) => {
        if (newOnes.length) {
          toast.success(`Achievement unlocked: ${newOnes.join(', ')}`);
          invalidateProgress(qc);
        }
      })
      .catch(() => undefined);
  }, [qc]);

  const level = ref.data?.careerLevels.find((l) => l.id === stats.data?.career_level_id);
  const reqs = promotion.data?.requirements ?? [];
  const met = reqs.filter((r) => r.met).length;
  const skillData = ref.data && skills.data ? mergeSkills(ref.data.skills, skills.data) : [];
  const achievementsById = new Map(ref.data?.achievements.map((a) => [a.id, a]));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div data-tour="dashboard-header" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{fmtDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting()}, {profile.data?.full_name.split(' ')[0] ?? 'Analyst'}.
          </h1>
          <p className="mt-1 text-sm text-fg-muted">Here is where you stand and what to do next.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/challenges">
            <Button variant="primary" size="sm">
              <Target className="h-4 w-4" /> Challenges
            </Button>
          </Link>
          <Link to="/passport">
            <Button size="sm">Finance Passport</Button>
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card data-tour="score" className="flex items-center gap-4 p-4 xl:col-span-1">
          {stats.isPending ? (
            <Skeleton className="h-[104px] w-[104px] rounded-full" />
          ) : stats.isError ? (
            <ErrorState error={stats.error} onRetry={() => stats.refetch()} className="py-4" />
          ) : (
            <ScoreRing value={stats.data.finlab_score} size={104} sub="FINLAB" />
          )}
          <div className="min-w-0">
            <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">FINLAB Score</div>
            <div className="mt-1 text-sm text-fg-muted">
              {stats.data?.scored_activity_count ? `${stats.data.scored_activity_count} scored activities` : 'Complete a challenge to get scored'}
            </div>
            <Link to="/career" className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
              How it's calculated <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
            Career level <Briefcase className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 text-xl font-semibold">{level?.name ?? <Skeleton className="h-6 w-32" />}</div>
          <div className="mt-1 text-xs text-fg-muted">Level {level?.rank ?? '—'} of {ref.data?.careerLevels.length ?? 6}</div>
          <div className="mt-3 flex gap-1">
            {ref.data?.careerLevels.map((l) => (
              <div key={l.id} className={cn('h-1.5 flex-1 rounded-full', level && l.rank <= level.rank ? 'bg-accent' : 'bg-surface-3')} title={l.name} />
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
            Global rank <Globe2 className="h-3.5 w-3.5" />
          </div>
          {ranks.isPending ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <>
              <div className="mt-2 font-mono text-2xl font-semibold tabular">{ranks.data?.global.rank ? `#${ranks.data.global.rank}` : 'Unranked'}</div>
              <div className="mt-1 text-xs text-fg-muted">
                {rankNote(ranks.data?.global.rank, ranks.data?.global.total, 'Score a challenge to get ranked')}
              </div>
            </>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
            {COUNTRY_NAMES[ranks.data?.country_code ?? 'PH'] ?? ranks.data?.country_code ?? 'Philippines'} rank <MapPin className="h-3.5 w-3.5" />
          </div>
          {ranks.isPending ? (
            <Skeleton className="mt-2 h-7 w-20" />
          ) : (
            <>
              <div className="mt-2 font-mono text-2xl font-semibold tabular">{ranks.data?.country.rank ? `#${ranks.data.country.rank}` : 'Unranked'}</div>
              <div className="mt-1 text-xs text-fg-muted">
                {rankNote(ranks.data?.country.rank, ranks.data?.country.total, 'Score a challenge to get ranked')}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Promotion */}
          <Card>
            <CardHeader
              title={promotion.data?.next_level ? `Promotion to ${promotion.data.next_level.name}` : 'Promotion'}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              action={
                <Link to="/career">
                  <Button size="xs" variant="outline">
                    Career <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              }
            />
            <CardContent>
              {promotion.isPending ? (
                <Skeleton className="h-24" />
              ) : promotion.isError ? (
                <ErrorState error={promotion.error} onRetry={() => promotion.refetch()} />
              ) : !promotion.data.next_level ? (
                <p className="text-sm text-fg-muted">You've reached the top of the ladder.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fg-muted">
                      {met} of {reqs.length} requirements met
                    </span>
                    <Badge tone={promotion.data.eligible ? 'up' : 'neutral'}>{promotion.data.eligible ? 'Eligible' : 'Not yet'}</Badge>
                  </div>
                  <Progress value={reqs.length ? (met / reqs.length) * 100 : 0} className="mt-2" tone={promotion.data.eligible ? 'up' : 'accent'} />
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {reqs.map((r) => (
                      <li key={r.id} className="flex items-start gap-2 text-sm">
                        {r.met ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />}
                        <span className={r.met ? 'text-fg-muted line-through decoration-fg-subtle' : ''}>
                          {r.label}
                          {!r.met && (
                            <span className="ml-1 font-mono text-xs text-fg-subtle">
                              ({fmtScore(r.current).replace('.0', '')}/{r.required})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader title="Skill profile" subtitle="Confidence-weighted from your scored work" icon={<Activity className="h-3.5 w-3.5" />} />
            <CardContent>
              {skills.isPending || ref.isPending ? (
                <Skeleton className="h-64" />
              ) : skills.isError ? (
                <ErrorState error={skills.error} onRetry={() => skills.refetch()} />
              ) : (
                <div className="grid items-center gap-6 md:grid-cols-2">
                  <SkillRadar data={skillData} />
                  <SkillBars data={skillData} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader title="Recent activity" icon={<Clock className="h-3.5 w-3.5" />} />
            <CardContent className="px-0 pb-1">
              {activity.isPending ? (
                <div className="space-y-2 px-4 pb-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : activity.isError ? (
                <ErrorState error={activity.error} onRetry={() => activity.refetch()} />
              ) : !activity.data.length ? (
                <EmptyState title="No activity yet" description="Your submissions, pitches, reports and trades will appear here." />
              ) : (
                <ul>
                  {activity.data.map((a) => (
                    <li key={a.id}>
                      <Link to={a.link} className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5 hover:bg-surface-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-fg-muted">
                          {a.kind === 'challenge' ? <Target className="h-4 w-4" /> : a.kind === 'pitch' ? <Presentation className="h-4 w-4" /> : a.kind === 'research' ? <FileSearch className="h-4 w-4" /> : a.kind === 'promotion' ? <Briefcase className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{a.title}</span>
                          <span className="block text-xs text-fg-muted">{a.detail}</span>
                        </span>
                        {a.score !== null && <ScorePill score={a.score} />}
                        <span className="w-16 shrink-0 text-right text-xs text-fg-subtle">{timeAgo(a.at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div data-tour="beta-checklist">
            <BetaChecklistCard />
          </div>
          <div data-tour="today-plan" className="space-y-6">
            <TodayPlanCard />
            <DailyChallengeCard />
          </div>
          <StreakCard />
          <WeeklyPodCard />
          <Card className="border-accent/30 bg-gradient-to-b from-accent/[0.06] to-surface">
            <CardHeader title="Recommended next" icon={<Target className="h-3.5 w-3.5 text-accent" />} />
            <CardContent>
              {recommended.isPending ? (
                <Skeleton className="h-28" />
              ) : recommended.isError ? (
                <ErrorState error={recommended.error} onRetry={() => recommended.refetch()} />
              ) : !recommended.data ? (
                <EmptyState icon={<Trophy className="h-5 w-5" />} title="You've passed every challenge" description="New challenges are published regularly." className="py-6" />
              ) : (
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{ref.data?.categories.find((c) => c.id === recommended.data!.category_id)?.name}</Badge>
                    <DifficultyBadge difficulty={recommended.data.difficulty} />
                  </div>
                  <h3 className="mt-3 font-semibold">{recommended.data.title}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{recommended.data.summary}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
                    <span>~{fmtMinutes(recommended.data.estimated_minutes)}</span>
                    <span>{recommended.data.points} pts</span>
                  </div>
                  <Link to={`/challenges/${recommended.data.id}`}>
                    <Button variant="primary" className="mt-4 w-full justify-center">
                      Open challenge <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Competitions" icon={<Swords className="h-3.5 w-3.5" />} action={<Link to="/competitions" className="text-xs text-accent hover:underline">All</Link>} />
            <CardContent className="space-y-3">
              {comps.isPending ? (
                <Skeleton className="h-16" />
              ) : comps.isError ? (
                <ErrorState error={comps.error} onRetry={() => comps.refetch()} />
              ) : !comps.data.length ? (
                <p className="text-sm text-fg-muted">No active or upcoming competitions right now.</p>
              ) : (
                comps.data.slice(0, 3).map((c) => (
                  <Link key={c.id} to={`/competitions/${c.id}`} className="block rounded-md border border-border p-3 hover:border-border-strong">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.name}</span>
                      <Badge tone={c.status === 'active' ? 'up' : 'info'}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
                      <span>{c.status === 'active' ? `Ends ${fmtDate(c.ends_at)}` : `Starts ${fmtDate(c.starts_at)}`}</span>
                      <span className={c.registered ? 'text-up' : ''}>{c.registered ? 'Registered' : `${c.participant_count} joined`}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Achievements" icon={<Award className="h-3.5 w-3.5" />} action={<Link to="/passport" className="text-xs text-accent hover:underline">Passport</Link>} />
            <CardContent>
              {myAch.isPending || ref.isPending ? (
                <Skeleton className="h-24" />
              ) : myAch.isError ? (
                <ErrorState error={myAch.error} onRetry={() => myAch.refetch()} />
              ) : (
                <>
                  <div className="mb-3 text-xs text-fg-muted">
                    {myAch.data.length} of {ref.data?.achievements.filter((a) => a.is_active).length} unlocked
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4">
                    {ref.data?.achievements
                      .filter((a) => a.is_active)
                      .map((a) => {
                        const earned = myAch.data.some((u) => u.achievement_id === a.id);
                        return (
                          <div
                            key={a.id}
                            title={`${a.name} — ${a.description}${earned ? ' (unlocked)' : ' (locked)'}`}
                            className={cn(
                              'flex aspect-square items-center justify-center rounded-md border',
                              earned ? 'border-accent/40 bg-accent-muted text-accent' : 'border-border bg-surface-2 text-fg-subtle/50',
                            )}
                          >
                            <DynamicIcon name={a.icon} className="h-5 w-5" />
                          </div>
                        );
                      })}
                  </div>
                  {myAch.data[0] && (
                    <p className="mt-3 text-xs text-fg-muted">
                      Latest: <span className="text-fg">{achievementsById.get(myAch.data[0].achievement_id)?.name}</span> · {timeAgo(myAch.data[0].awarded_at)}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

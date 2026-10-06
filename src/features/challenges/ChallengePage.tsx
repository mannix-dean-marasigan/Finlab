import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Clock, FileText, ListChecks, PlayCircle, Send, Swords, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress, useReference } from '@/app/queries';
import { abandonAttempt, getChallenge, getOpenAttempt, listMySubmissions, startChallenge, submitChallenge } from '@/services/api/challenges';
import type { Challenge, ChallengeAttempt } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { Countdown, DifficultyBadge, Markdown, ScorePill } from '@/components/common';
import { fmtDateTime, fmtMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SaveIndicator, TaskInput, isTaskAnswered, useAutosave } from './TaskWorkspace';
import { SubmissionResult } from './SubmissionResult';

function announceAchievements(ids: string[] | undefined, names: Map<string, string>) {
  for (const id of ids ?? []) toast.success(`Achievement unlocked: ${names.get(id) ?? id}`);
}

function Workspace({ challenge, attempt, onSubmitted }: { challenge: Challenge; attempt: ChallengeAttempt; onSubmitted: (submissionId: string) => void }) {
  const qc = useQueryClient();
  const ref = useReference();
  const tasks = challenge.content.tasks ?? [];
  const { responses, update, state, savedAt, flush } = useAutosave(attempt.id, attempt.responses ?? {}, attempt.last_saved_at);
  const [confirm, setConfirm] = useState(false);
  const [discard, setDiscard] = useState(false);
  const answered = tasks.filter((t) => isTaskAnswered(responses[t.id])).length;

  const submit = useMutation({
    mutationFn: async () => {
      await flush();
      return submitChallenge(attempt.id, responses);
    },
    onSuccess: (res) => {
      setConfirm(false);
      invalidateProgress(qc);
      qc.invalidateQueries({ queryKey: ['attempt'] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      if (res.status === 'scored') toast.success(`Scored ${res.score} / 100${res.passed ? ' — passed' : ''}`);
      else toast.info('Submitted for review');
      announceAchievements(res.new_achievements, new Map(ref.data?.achievements.map((a) => [a.id, a.name])));
      if (res.submission_id) onSubmitted(res.submission_id);
    },
  });
  const abandon = useMutation({
    mutationFn: () => abandonAttempt(attempt.id),
    onSuccess: () => {
      setDiscard(false);
      qc.invalidateQueries({ queryKey: ['attempt'] });
      qc.invalidateQueries({ queryKey: ['challengeStates'] });
      toast('Attempt discarded');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/95 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tabular">
            <span className="text-accent">{answered}</span>/{tasks.length} answered
          </span>
          <SaveIndicator state={state} savedAt={savedAt} />
        </div>
        <div className="flex items-center gap-2">
          {attempt.deadline_at && <Countdown deadline={attempt.deadline_at} />}
          <Button size="sm" variant="ghost" onClick={() => setDiscard(true)} aria-label="Discard attempt">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="primary" onClick={() => setConfirm(true)}>
            <Send className="h-4 w-4" /> Submit
          </Button>
        </div>
      </div>
      {tasks.map((t, i) => (
        <TaskInput key={t.id} task={t} index={i} value={responses[t.id] ?? ''} onChange={(v) => update(t.id, v)} />
      ))}
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setConfirm(true)}>
          <Send className="h-4 w-4" /> Submit for scoring
        </Button>
      </div>

      <Modal
        open={confirm}
        onClose={() => !submit.isPending && setConfirm(false)}
        title="Submit this attempt?"
        description="Submissions are final and immutable. Your best score on this challenge counts toward your skills."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={submit.isPending}>
              Keep working
            </Button>
            <Button variant="primary" onClick={() => submit.mutate()} loading={submit.isPending}>
              Submit
            </Button>
          </>
        }
      >
        {answered < tasks.length && (
          <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
            {tasks.length - answered} task(s) are unanswered and will score zero.
          </p>
        )}
        <p className="text-sm text-fg-muted">
          Scoring: <strong className="text-fg">{challenge.scoring_method === 'manual' ? 'by a reviewer' : challenge.scoring_method === 'hybrid' ? 'automated now, reviewer may adjust' : 'automated, instant'}</strong>.
        </p>
        <InlineError message={submit.error ? (submit.error as Error).message : null} />
      </Modal>
      <Modal
        open={discard}
        onClose={() => setDiscard(false)}
        title="Discard this attempt?"
        description="Your draft answers will be closed. You can start a fresh attempt later."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDiscard(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => abandon.mutate()} loading={abandon.isPending}>
              Discard
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function ChallengePage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const competitionId = params.get('competition');
  const selectedSubmission = params.get('submission');
  const { user } = useAuth();
  const ref = useReference();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const challenge = useQuery({ queryKey: ['challenge', id], queryFn: () => getChallenge(id) });
  const cid = challenge.data?.id;
  const attempt = useQuery({
    queryKey: ['attempt', user!.id, cid, competitionId],
    queryFn: () => getOpenAttempt(user!.id, cid!, competitionId),
    enabled: !!cid,
  });
  const submissions = useQuery({
    queryKey: ['submissions', user!.id, cid],
    queryFn: () => listMySubmissions(user!.id, cid!),
    enabled: !!cid,
  });

  const start = useMutation({
    mutationFn: () => startChallenge(cid!, competitionId),
    onSuccess: async () => {
      const a = await getOpenAttempt(user!.id, cid!, competitionId);
      qc.setQueryData(['attempt', user!.id, cid, competitionId], a);
      qc.invalidateQueries({ queryKey: ['challengeStates'] });
      if (a?.stock_pitch_id) navigate(`/pitches/${a.stock_pitch_id}`);
      else if (a?.research_project_id) navigate(`/research/${a.research_project_id}`);
      else setParams(competitionId ? { competition: competitionId } : {});
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (challenge.isPending) return <PageSkeleton />;
  if (challenge.isError) return <ErrorState error={challenge.error} onRetry={() => challenge.refetch()} />;
  if (!challenge.data) return <EmptyState icon={<Target className="h-5 w-5" />} title="Challenge not found" description="It may have been unpublished." action={<Link to="/challenges" className="text-accent">All challenges</Link>} />;

  const c = challenge.data;
  const cat = ref.data?.categories.find((x) => x.id === c.category_id);
  const open = attempt.data;
  const subs = submissions.data ?? [];
  const best = subs.reduce<number | null>((m, s) => (s.final_score !== null ? Math.max(m ?? 0, s.final_score) : m), null);
  const shownSub = subs.find((s) => s.id === selectedSubmission) ?? null;
  const attemptsUsed = subs.length;
  const maxedOut = c.max_attempts !== null && attemptsUsed >= c.max_attempts;
  const skillNames = new Map(ref.data?.skills.map((s) => [s.id, s.name]));
  const workLink = open?.stock_pitch_id ? `/pitches/${open.stock_pitch_id}` : open?.research_project_id ? `/research/${open.research_project_id}` : null;

  return (
    <div className="animate-fade-in">
      <Link to={competitionId ? `/competitions/${competitionId}` : '/challenges'} className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> {competitionId ? 'Competition' : 'Challenges'}
      </Link>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{cat?.name ?? c.category_id}</Badge>
            <DifficultyBadge difficulty={c.difficulty} />
            {competitionId && (
              <Badge tone="violet">
                <Swords className="h-3 w-3" /> Competition attempt
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{c.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.summary}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Time</div>
            <div className="font-mono tabular">{c.time_limit_minutes ? `${c.time_limit_minutes} min limit` : c.duration_days ? `${c.duration_days} days` : `~${fmtMinutes(c.estimated_minutes)}`}</div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Points</div>
            <div className="font-mono tabular">{c.points}</div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Pass mark</div>
            <div className="font-mono tabular">{c.passing_score}</div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Best</div>
            <ScorePill score={best} passing={c.passing_score} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          {shownSub && (
            <div>
              <SubmissionResult submission={shownSub} passingScore={c.passing_score} />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => setParams(competitionId ? { competition: competitionId } : {})}>
                  Back to brief
                </Button>
              </div>
            </div>
          )}

          {open && c.kind === 'tasks' && !shownSub ? (
            <>
              <Card>
                <CardHeader title="Case brief" icon={<FileText className="h-3.5 w-3.5" />} />
                <CardContent>
                  <Markdown>{c.description}</Markdown>
                </CardContent>
              </Card>
              <Workspace
                key={open.id}
                challenge={c}
                attempt={open}
                onSubmitted={(sid) => setParams(competitionId ? { competition: competitionId, submission: sid } : { submission: sid })}
              />
            </>
          ) : (
            !shownSub && (
              <>
                <Card>
                  <CardHeader title="Brief" icon={<FileText className="h-3.5 w-3.5" />} />
                  <CardContent>
                    <Markdown>{c.description}</Markdown>
                    {c.instructions && (
                      <div className="mt-4 rounded-md border border-border bg-surface-2 p-4">
                        <div className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Instructions</div>
                        <Markdown>{c.instructions}</Markdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {c.kind === 'tasks' && (
                  <Card>
                    <CardHeader title={`${c.content.tasks?.length ?? 0} tasks`} icon={<ListChecks className="h-3.5 w-3.5" />} />
                    <CardContent>
                      <ol className="space-y-2">
                        {c.content.tasks?.map((t, i) => (
                          <li key={t.id} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-fg-muted">
                              <span className="mr-2 font-mono text-fg-subtle">{i + 1}.</span>
                              {t.label ?? t.prompt}
                            </span>
                            <span className="shrink-0 font-mono text-xs text-fg-subtle">
                              {t.type === 'mcq' ? 'choice' : t.type === 'numeric' ? 'numeric' : 'written'} · {t.points ?? 10}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </>
            )
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your attempt" icon={<PlayCircle className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-3">
              {attempt.isPending ? (
                <div className="h-10 animate-pulse rounded bg-surface-3" />
              ) : attempt.isError ? (
                <ErrorState error={attempt.error} onRetry={() => attempt.refetch()} className="py-4" />
              ) : open ? (
                <>
                  <p className="text-sm text-fg-muted">Started {fmtDateTime(open.started_at)}.</p>
                  {open.deadline_at && <Countdown deadline={open.deadline_at} />}
                  {workLink ? (
                    <Link to={workLink}>
                      <Button variant="primary" className="w-full justify-center">
                        Continue {c.kind === 'stock_pitch' ? 'pitch' : 'report'} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : shownSub ? (
                    <Button variant="primary" className="w-full justify-center" onClick={() => setParams(competitionId ? { competition: competitionId } : {})}>
                      Resume attempt
                    </Button>
                  ) : (
                    <p className="text-xs text-fg-subtle">Work in the panel on the left. Drafts save automatically.</p>
                  )}
                </>
              ) : maxedOut ? (
                <p className="text-sm text-fg-muted">You've used all {c.max_attempts} attempts.</p>
              ) : (
                <>
                  <p className="text-sm text-fg-muted">
                    {c.time_limit_minutes
                      ? `The ${c.time_limit_minutes}-minute clock starts when you begin.`
                      : c.duration_days
                        ? `You'll have ${c.duration_days} days from starting. Drafts save as you go.`
                        : 'Untimed. Drafts save as you go.'}
                  </p>
                  {c.max_attempts && <p className="text-xs text-fg-subtle">{c.max_attempts - attemptsUsed} of {c.max_attempts} attempts remaining.</p>}
                  {subs.length > 0 && (
                    <p className="text-xs text-fg-subtle">
                      Retakes: 10-minute cooldown after each submission, and each retake counts 10% less toward your skills (minimum 70%). Your first attempt matters most.
                    </p>
                  )}
                  <Button variant="primary" className="w-full justify-center" onClick={() => start.mutate()} loading={start.isPending}>
                    {subs.length ? 'Start new attempt' : 'Start challenge'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="How it's scored" />
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Method</span>
                <Badge tone={c.scoring_method === 'auto' ? 'up' : c.scoring_method === 'manual' ? 'info' : 'accent'}>
                  {c.scoring_method === 'auto' ? 'Automated' : c.scoring_method === 'manual' ? 'Reviewer' : 'Auto + review'}
                </Badge>
              </div>
              {c.scoring_criteria?.length > 0 && (
                <ul className="space-y-1.5">
                  {c.scoring_criteria.map((sc) => (
                    <li key={sc.label} className="flex justify-between gap-2">
                      <span className="text-fg-muted">{sc.label}</span>
                      {sc.weight !== undefined && <span className="font-mono text-xs text-fg-subtle">{sc.weight}%</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <div className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Skill impact</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(c.skill_impact ?? {}).map(([k, v]) => (
                    <Badge key={k} tone="neutral" className="normal-case tracking-normal">
                      {skillNames.get(k) ?? k} ×{v}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Submissions" icon={<Clock className="h-3.5 w-3.5" />} />
            <CardContent className="px-0 pb-1">
              {submissions.isPending ? (
                <div className="mx-4 mb-3 h-10 animate-pulse rounded bg-surface-3" />
              ) : submissions.isError ? (
                <ErrorState error={submissions.error} onRetry={() => submissions.refetch()} className="py-4" />
              ) : !subs.length ? (
                <p className="px-4 pb-3 text-sm text-fg-muted">No submissions yet.</p>
              ) : (
                subs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setParams(competitionId ? { competition: competitionId, submission: s.id } : { submission: s.id })}
                    className={cn('flex w-full items-center justify-between border-t border-border/70 px-4 py-2.5 text-left text-sm hover:bg-surface-2', s.id === selectedSubmission && 'bg-surface-2')}
                  >
                    <span>
                      <span className="block">{fmtDateTime(s.submitted_at)}</span>
                      <span className="text-xs text-fg-subtle">{s.competition_id ? 'Competition' : 'Practice'}</span>
                    </span>
                    {s.status === 'pending_review' ? <Badge tone="info">Review</Badge> : <ScorePill score={s.final_score} passing={c.passing_score} />}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

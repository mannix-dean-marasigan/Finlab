import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Award, BadgeCheck, BookOpen, CheckCircle2, Circle, Clock, FileCheck2, GraduationCap, Lock, MonitorPlay, Target, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { enrollProgram, getProgram } from '@/services/api/misc';
import { getProgramLeaderboard } from '@/services/api/engage';
import { CapstonePanel } from './CapstonePanel';
import { CertificateCelebration } from './Celebration';
import { useIsAdmin, useMyProfile } from '@/app/queries';
import { AdminCertificatePreview } from './AdminCertificatePreview';
import { CertificateDocument } from './VerifyCertificatePage';
import type { ProgramModuleStatus } from '@/types/domain';
import { DifficultyBadge, Markdown, ScorePill } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton, Skeleton } from '@/components/ui/states';
import { fmtDate, fmtMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';

function moduleHref(m: ProgramModuleStatus) {
  return m.kind === 'lesson' ? `/learn/${m.lesson_slug}` : `/challenges/${m.challenge_id}`;
}

const KIND_ICON = { lesson: BookOpen, challenge: Target, exam: FileCheck2, capstone: MonitorPlay } as const;
const KIND_LABEL = { lesson: 'Lesson + check', challenge: 'Challenge', exam: 'Final exam', capstone: 'Capstone' } as const;

/** Compact progress map: one node per module, ending at the certificate. */
export function JourneyMap({ modules, certified }: { modules: ProgramModuleStatus[]; certified: boolean }) {
  const nextIdx = modules.findIndex((m) => !m.complete);
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-center px-1 pb-2 pt-5">
        {modules.map((m, i) => {
          const Icon = KIND_ICON[m.kind];
          const here = i === nextIdx;
          return (
            <li key={m.id} className="flex items-center">
              <a
                href={`#module-${m.position}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`module-${m.position}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                title={`${m.position}. ${m.title}${m.complete ? ' — complete' : here ? ' — up next' : ''}`}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border transition-transform hover:scale-110',
                  m.complete
                    ? 'border-up/60 bg-up text-black'
                    : here
                      ? 'border-accent bg-accent-muted text-accent shadow-[0_0_0_4px_#f5a5241f]'
                      : m.kind === 'exam' || m.kind === 'capstone'
                        ? 'border-violet/40 bg-violet/10 text-violet'
                        : 'border-border-strong bg-surface-2 text-fg-subtle',
                )}
              >
                {m.complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                {here && <span className="absolute -top-5 whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-wider text-accent">You</span>}
              </a>
              <span className={cn('h-0.5 w-5 sm:w-7', m.complete ? 'bg-up/70' : 'bg-border-strong')} />
            </li>
          );
        })}
        <li>
          <span
            title="Certificate"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border',
              certified ? 'border-up/60 bg-up-muted text-up' : 'border-accent/40 bg-surface-2 text-accent/70',
            )}
          >
            <Award className="h-4 w-4" />
          </span>
        </li>
      </ol>
    </div>
  );
}

function CohortBoard({ programId }: { programId: string }) {
  const rows = useQuery({ queryKey: ['program-leaderboard', programId], queryFn: () => getProgramLeaderboard(programId) });
  if (rows.isPending) return <Skeleton className="h-32" />;
  if (rows.isError || !rows.data.length) return <p className="text-sm text-fg-muted">No one has enrolled yet — be the first.</p>;
  const top = rows.data.slice(0, 8);
  const me = rows.data.find((r) => r.is_me);
  const list = me && !top.includes(me) ? [...top, me] : top;
  return (
    <ul className="space-y-1.5">
      {list.map((r) => (
        <li key={r.user_id} className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-sm', r.is_me && 'bg-accent/[0.07]')}>
          <span className="w-6 font-mono text-xs text-fg-subtle">{r.rank}</span>
          <Link to={`/p/${r.handle}`} className="min-w-0 flex-1 truncate hover:text-accent">
            {r.display_name}
            {r.is_me && <span className="ml-1 text-xs text-accent">(you)</span>}
          </Link>
          {r.completed_at ? (
            <BadgeCheck className="h-4 w-4 text-up" aria-label="Certified" />
          ) : (
            <span className="font-mono text-xs text-fg-muted">
              {r.completed}/{r.total}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ModuleRow({ m, isNext, enrolled }: { m: ProgramModuleStatus; isNext: boolean; enrolled: boolean }) {
  const Icon = KIND_ICON[m.kind];
  const examBlocked = (m.kind === 'exam' || m.kind === 'capstone') && (m.locked || !enrolled);
  return (
    <li id={`module-${m.position}`} className="relative flex scroll-mt-24 gap-4 pb-6 last:pb-0">
      <span className="absolute left-[15px] top-8 bottom-0 w-px bg-border last:hidden" aria-hidden />
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
          m.complete ? 'border-up/50 bg-up-muted text-up' : examBlocked ? 'border-border bg-surface-2 text-fg-subtle' : isNext ? 'border-accent bg-accent-muted text-accent' : 'border-border-strong bg-surface-2 text-fg-muted',
        )}
      >
        {m.complete ? <CheckCircle2 className="h-4 w-4" /> : examBlocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
      </span>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center', isNext && !m.complete ? 'border-accent/40 bg-accent/[0.04]' : 'border-border bg-surface')}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-wider text-fg-subtle">
            <span>Module {m.position}</span>
            <Badge tone={m.kind === 'exam' || m.kind === 'capstone' ? 'violet' : m.kind === 'lesson' ? 'info' : 'neutral'}>{KIND_LABEL[m.kind]}</Badge>
            {m.minutes && (
              <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                <Clock className="h-3 w-3" /> {m.kind === 'exam' ? `${m.minutes} min timed` : fmtMinutes(m.minutes)}
              </span>
            )}
          </div>
          <div className="mt-1 font-medium">{m.title}</div>
          <div className="mt-0.5 text-xs text-fg-muted">
            {m.kind === 'lesson'
              ? m.complete
                ? 'Knowledge check passed'
                : 'Read the briefing and pass its knowledge check'
              : m.complete
                ? `Passed (needed ${m.required_score})`
                : examBlocked
                  ? !enrolled
                    ? `Enroll to unlock the ${m.kind === 'capstone' ? 'capstone' : 'final exam'}`
                    : 'Unlocks when every earlier module is complete'
                  : m.kind === 'capstone'
                    ? m.capstone?.status === 'submitted'
                      ? 'Submitted — awaiting reviewer score'
                      : m.capstone?.status === 'returned'
                        ? 'Returned for revision — see feedback'
                        : `Record a presentation · ${m.required_score}+ to pass`
                    : `Score ${m.required_score}+ to pass`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {m.best_score !== null && <ScorePill score={m.best_score} passing={m.required_score ?? 60} />}
          {m.kind === 'capstone' ? (
            <Button
              size="sm"
              variant={isNext && !m.complete && !examBlocked ? 'primary' : 'outline'}
              onClick={() => document.getElementById('capstone')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {examBlocked ? <Lock className="h-3.5 w-3.5" /> : null}
              {m.complete ? 'Review' : examBlocked ? 'Preview brief' : 'Open capstone'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : examBlocked ? (
            <Button size="sm" disabled>
              <Lock className="h-3.5 w-3.5" /> Locked
            </Button>
          ) : (
            <Link to={moduleHref(m)}>
              <Button size="sm" variant={isNext && !m.complete ? 'primary' : 'outline'}>
                {m.complete ? 'Review' : m.kind === 'exam' ? 'Take exam' : m.kind === 'lesson' ? 'Open lesson' : 'Start'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ProgramPage() {
  const { slug = '' } = useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['program', slug], queryFn: () => getProgram(slug) });
  const profile = useMyProfile();
  const isAdmin = useIsAdmin();
  const enroll = useMutation({
    mutationFn: () => enrollProgram(q.data!.program.id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['program', slug] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      if (r.certificates?.length) toast.success('You already completed everything — certificate issued!');
      else toast.success('Enrolled. Work through the modules in order.');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isPending) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <EmptyState title="Program not found" action={<Link to="/certifications" className="text-accent">All certifications</Link>} />;

  const { program: p, modules, enrollment, certificate_code } = q.data;
  const done = modules.filter((m) => m.complete).length;
  const nextIdx = modules.findIndex((m) => !m.complete);
  const enrolled = !!enrollment;

  return (
    <div className="animate-fade-in">
      <CertificateCelebration code={certificate_code} title={p.certificate_title} />
      <Link to="/certifications" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Certifications
      </Link>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={p.kind === 'certification' ? 'accent' : 'info'}>{p.kind === 'certification' ? 'Certification' : 'Learning track'}</Badge>
                <DifficultyBadge difficulty={p.level} />
                <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
                  <Clock className="h-3 w-3" /> ~{Number(p.estimated_hours)} hours
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">{p.title}</h1>
              <p className="mt-1 text-fg-muted">{p.subtitle}</p>
              <div className="mt-5">
                <Markdown>{p.description}</Markdown>
              </div>
            </div>
          </Card>
          {!certificate_code && (
            <Card>
              <CardHeader
                title="The certificate you'll earn"
                subtitle="Issued automatically with your name and a unique verification code the moment you pass every module."
                icon={<BadgeCheck className="h-3.5 w-3.5" />}
              />
              <CardContent>
                <CertificateDocument
                  preview
                  c={{
                    code: 'FLB-XXXX-XXXX',
                    kind: p.kind,
                    recipient_name: profile.data?.full_name || 'Your Name',
                    title: p.certificate_title,
                    subtitle: p.title,
                    details: { modules: modules.length, estimated_hours: Number(p.estimated_hours) },
                    issued_at: new Date().toISOString(),
                    revoked_at: null,
                    revoked_reason: null,
                    handle: null,
                    program: null,
                    competition: null,
                  }}
                />
                <ul className="mt-4 grid gap-2 text-xs text-fg-muted sm:grid-cols-3">
                  <li className="flex gap-2">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-accent" /> Public verification page anyone can check
                  </li>
                  <li className="flex gap-2">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-accent" /> Download as PDF and add to LinkedIn
                  </li>
                  <li className="flex gap-2">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-accent" /> Shown on your Finance Passport
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader title={`Your path · ${done}/${modules.length} complete`} icon={<GraduationCap className="h-3.5 w-3.5" />} />
            <CardContent>
              <div className="mb-5 rounded-lg border border-border bg-surface-2/60 px-3">
                <JourneyMap modules={modules} certified={!!certificate_code} />
              </div>
              <ol>
                {modules.map((m, i) => (
                  <ModuleRow key={m.id} m={m} isNext={i === nextIdx} enrolled={enrolled} />
                ))}
              </ol>
            </CardContent>
          </Card>
          {modules
            .filter((m) => m.kind === 'capstone')
            .map((m) => (
              <CapstonePanel key={m.id} m={m} enrolled={enrolled} slug={slug} />
            ))}
        </div>
        <div>
          <div className="sticky top-20 space-y-4">
            <Card className={cn('p-5', certificate_code ? 'border-up/40' : 'border-accent/30')}>
              <div className="flex items-center gap-3">
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border', certificate_code ? 'border-up/40 bg-up-muted text-up' : 'border-accent/40 bg-accent-muted text-accent')}>
                  {certificate_code ? <BadgeCheck className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
                </span>
                <div>
                  <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Certificate</div>
                  <div className="font-semibold">{p.certificate_title}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-fg-muted">
                  <span>Progress</span>
                  <span className="font-mono">{Math.round((done / Math.max(modules.length, 1)) * 100)}%</span>
                </div>
                <Progress value={(done / Math.max(modules.length, 1)) * 100} tone={certificate_code ? 'up' : 'accent'} />
              </div>
              <div className="mt-4">
                {certificate_code ? (
                  <Link to={`/verify/${certificate_code}`}>
                    <Button variant="success" className="w-full justify-center">
                      <BadgeCheck className="h-4 w-4" /> View certificate
                    </Button>
                  </Link>
                ) : enrolled ? (
                  <p className="text-sm text-fg-muted">
                    Enrolled {fmtDate(enrollment!.enrolled_at)}. Your certificate is issued automatically when every module is passed.
                  </p>
                ) : (
                  <>
                    <Button variant="primary" className="w-full justify-center" onClick={() => enroll.mutate()} loading={enroll.isPending}>
                      Enroll — free
                    </Button>
                    <p className="mt-2 text-xs text-fg-subtle">Modules you've already passed count immediately.</p>
                  </>
                )}
              </div>
              {isAdmin.data && (
                <div className="mt-3 border-t border-border pt-3">
                  <AdminCertificatePreview detail={q.data} recipient={profile.data?.full_name || 'Your Name'} />
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Cohort leaderboard" subtitle="Everyone enrolled in this program" icon={<Users className="h-3.5 w-3.5" />} />
              <CardContent>
                <CohortBoard programId={p.id} />
              </CardContent>
            </Card>
            <Card className="p-4 text-xs text-fg-muted">
              <div className="mb-2 font-semibold uppercase tracking-wider text-fg-subtle">Rules</div>
              <ul className="space-y-1.5">
                <li className="flex gap-2">
                  <Circle className="mt-0.5 h-3 w-3 shrink-0" /> Lessons count only after passing their knowledge check.
                </li>
                <li className="flex gap-2">
                  <Circle className="mt-0.5 h-3 w-3 shrink-0" /> Challenges count when your best score reaches the pass mark.
                </li>
                {p.kind === 'certification' && (
                  <li className="flex gap-2">
                    <Circle className="mt-0.5 h-3 w-3 shrink-0" /> The timed final exam unlocks after every other module: 70% to pass, max 3 attempts.
                  </li>
                )}
                {modules.some((m) => m.kind === 'capstone') && (
                  <li className="flex gap-2">
                    <Circle className="mt-0.5 h-3 w-3 shrink-0" /> The capstone presentation comes last and is scored by a reviewer against the published rubric.
                  </li>
                )}
                <li className="flex gap-2">
                  <Circle className="mt-0.5 h-3 w-3 shrink-0" /> Certificates carry a public verification code.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

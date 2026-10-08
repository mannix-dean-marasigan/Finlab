import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, GraduationCap, PlayCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { getProgram, listPrograms } from '@/services/api/misc';
import type { ProgramModuleStatus, ProgramSummary } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QUICK_START_PATH } from '@/features/tutorial/steps';

const lastProgramKey = (uid: string) => `finlab:last-program:${uid}`;

/** Called by the program page so "Continue" prefers the program you looked at last. */
export function rememberProgram(uid: string, slug: string) {
  try {
    localStorage.setItem(lastProgramKey(uid), slug);
  } catch {
    /* ignore */
  }
}

function moduleLink(programSlug: string, m: ProgramModuleStatus) {
  if (m.kind === 'lesson' && m.lesson_slug) return `/learn/${m.lesson_slug}`;
  if ((m.kind === 'challenge' || m.kind === 'exam') && m.challenge_id) return `/challenges/${m.challenge_id}`;
  return `/certifications/${programSlug}`;
}

const KIND_LABEL: Record<ProgramModuleStatus['kind'], string> = { lesson: 'Lesson', challenge: 'Case', exam: 'Final exam', capstone: 'Capstone' };

/** The one thing to do next: the next unfinished module of the program you're working on, or a first certificate. */
export function ContinueCard() {
  const { user } = useAuth();
  const programs = useQuery({ queryKey: ['programs'], queryFn: listPrograms });

  const active = (programs.data ?? []).filter((p) => p.enrolled && !p.certificate_code && p.completed_modules < p.modules);
  let last: string | null = null;
  try {
    last = user ? localStorage.getItem(lastProgramKey(user.id)) : null;
  } catch {
    last = null;
  }
  const pick: ProgramSummary | undefined =
    active.find((p) => p.slug === last) ?? [...active].sort((a, b) => b.completed_modules / b.modules - a.completed_modules / a.modules)[0];

  const detail = useQuery({ queryKey: ['program', pick?.slug], queryFn: () => getProgram(pick!.slug), enabled: !!pick });
  const next = detail.data?.modules.find((m) => !m.complete && !m.locked) ?? detail.data?.modules.find((m) => !m.complete);

  if (programs.isPending) return null;

  // Not working on anything yet: point at the fastest first certificate.
  if (!pick) {
    const earned = (programs.data ?? []).some((p) => p.certificate_code);
    const suggestion = earned ? (programs.data ?? []).find((p) => !p.enrolled && p.kind === 'certification') : null;
    return (
      <Card className="flex flex-col gap-4 border-accent/30 bg-gradient-to-r from-accent/[0.07] to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent-muted text-accent">
          {earned ? <GraduationCap className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">{earned ? 'Next step' : 'Start here'}</div>
          <div className="mt-0.5 text-base font-semibold">{suggestion ? suggestion.title : 'Earn your first certificate in about 30 minutes'}</div>
          <div className="text-sm text-fg-muted">{suggestion ? suggestion.subtitle : 'Quick Start: one short lesson and a valuation case.'}</div>
        </div>
        <Link to={suggestion ? `/certifications/${suggestion.slug}` : QUICK_START_PATH}>
          <Button variant="primary">
            {suggestion ? 'Take a look' : 'Start the Quick Start'} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>
    );
  }

  const pct = Math.round((pick.completed_modules / pick.modules) * 100);
  return (
    <Card className="flex flex-col gap-4 border-accent/30 bg-gradient-to-r from-accent/[0.07] to-transparent p-5 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent-muted text-accent">
        <PlayCircle className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-accent">Continue where you left off</div>
        <div className="mt-0.5 truncate text-base font-semibold">
          {next ? `${KIND_LABEL[next.kind]}: ${next.title}` : pick.title}
        </div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="truncate text-xs text-fg-muted">
            {pick.title} · {pick.completed_modules} of {pick.modules} done
          </span>
        </div>
      </div>
      <Link to={next ? moduleLink(pick.slug, next) : `/certifications/${pick.slug}`}>
        <Button variant="primary">
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}

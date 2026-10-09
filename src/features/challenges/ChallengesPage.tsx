import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Hourglass, PlayCircle, Search, Target } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { useReference } from '@/app/queries';
import { fetchMyChallengeStates, listChallenges } from '@/services/api/challenges';
import { DifficultyBadge, DynamicIcon, PageHeader, ScorePill } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/form';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Challenge, Difficulty } from '@/types/domain';
import type { MyChallengeState } from '@/services/api/challenges';

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'passed' | 'attempted';

// Quick length filters, like "under 30 minutes", so students can pick something that fits their free time.
const LENGTHS = [
  { value: 'all', label: 'Any length', test: () => true },
  { value: '15', label: 'Under 15 min', test: (m: number) => m <= 15 },
  { value: '30', label: 'Under 30 min', test: (m: number) => m <= 30 },
  { value: 'long', label: '30 min or more', test: (m: number) => m > 30 },
] as const;
type LengthFilter = (typeof LENGTHS)[number]['value'];
const minutesOf = (c: Challenge) => c.time_limit_minutes ?? c.estimated_minutes;

export function challengeStatus(c: Challenge, s: MyChallengeState | undefined) {
  if (!s) return { key: 'not_started' as const, label: 'Not started' };
  if (s.best_score !== null && s.best_score >= c.passing_score) return { key: 'passed' as const, label: 'Passed' };
  if (s.in_progress) return { key: 'in_progress' as const, label: 'In progress' };
  if (s.pending) return { key: 'pending' as const, label: 'Awaiting review' };
  return { key: 'attempted' as const, label: 'Attempted' };
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const ref = useReference();
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: listChallenges });
  const states = useQuery({ queryKey: ['challengeStates', user!.id], queryFn: () => fetchMyChallengeStates(user!.id) });
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get('category') ?? 'all');
  const [difficulty, setDifficulty] = useState<'all' | Difficulty>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [length, setLength] = useState<LengthFilter>('all');

  const filtered = useMemo(() => {
    if (!challenges.data) return [];
    const s = search.trim().toLowerCase();
    return challenges.data.filter((c) => {
      const st = challengeStatus(c, states.data?.[c.id]).key;
      return (
        (category === 'all' || c.category_id === category) &&
        (difficulty === 'all' || c.difficulty === difficulty) &&
        LENGTHS.find((l) => l.value === length)!.test(minutesOf(c)) &&
        (status === 'all' || st === status || (status === 'attempted' && st === 'pending')) &&
        (!s || c.title.toLowerCase().includes(s) || c.summary.toLowerCase().includes(s))
      );
    });
  }, [challenges.data, states.data, category, difficulty, status, search, length]);

  if (challenges.isPending || states.isPending) return <PageSkeleton />;
  if (challenges.isError) return <ErrorState error={challenges.error} onRetry={() => challenges.refetch()} />;
  if (states.isError) return <ErrorState error={states.error} onRetry={() => states.refetch()} />;

  const passed = challenges.data.filter((c) => challengeStatus(c, states.data[c.id]).key === 'passed').length;
  const catName = (id: string) => ref.data?.categories.find((c) => c.id === id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Challenges"
        title="Do the work"
        description="Finance cases based on real situations. Every answer is scored and builds your skill profile."
        actions={
          <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm">
            <span className="font-mono tabular text-accent">{passed}</span>
            <span className="text-fg-muted"> / {challenges.data.length} passed</span>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Length">
        {LENGTHS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLength(l.value)}
            aria-pressed={length === l.value}
            className={cn('rounded-full border px-3 py-1 text-xs', length === l.value ? 'border-accent bg-accent-muted text-fg' : 'border-border text-fg-muted hover:border-border-strong')}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search challenges" className="pl-9" aria-label="Search challenges" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="all">All categories</option>
          {ref.data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')} aria-label="Difficulty">
          <option value="all">All difficulties</option>
          {['beginner', 'intermediate', 'advanced', 'expert'].map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Status">
          <option value="all">Any status</option>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="attempted">Attempted, not passed</option>
          <option value="passed">Passed</option>
        </Select>
      </div>

      {!filtered.length ? (
        <EmptyState icon={<Target className="h-5 w-5" />} title="No challenges match these filters" description="Try clearing a filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const s = states.data[c.id];
            const st = challengeStatus(c, s);
            const cat = catName(c.category_id);
            return (
              <Link key={c.id} to={`/challenges/${c.id}`} className="group">
                <Card className={cn('flex h-full flex-col p-4 transition-colors group-hover:border-border-strong', st.key === 'passed' && 'border-up/25')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                      <DynamicIcon name={cat?.icon} className="h-3.5 w-3.5" /> {cat?.name}
                    </span>
                    <DifficultyBadge difficulty={c.difficulty} />
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug group-hover:text-accent">{c.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-fg-muted">{c.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {c.time_limit_minutes ? `${c.time_limit_minutes} min limit` : c.duration_days ? `${c.duration_days}-day window` : `~${fmtMinutes(c.estimated_minutes)}`}
                    </span>
                    <span>· {c.points} pts</span>
                    {c.kind !== 'tasks' && <Badge tone="info">{c.kind === 'stock_pitch' ? `${c.pitch_format} pitch` : 'report'}</Badge>}
                    {c.scoring_method !== 'auto' && <Badge>{c.scoring_method === 'manual' ? 'Reviewed' : 'Auto + review'}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        st.key === 'passed' ? 'text-up' : st.key === 'in_progress' ? 'text-accent' : st.key === 'pending' ? 'text-info' : 'text-fg-muted',
                      )}
                    >
                      {st.key === 'passed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : st.key === 'in_progress' ? <PlayCircle className="h-3.5 w-3.5" /> : st.key === 'pending' ? <Hourglass className="h-3.5 w-3.5" /> : null}
                      {st.label}
                    </span>
                    {s?.best_score !== undefined && s.best_score !== null && (
                      <span className="text-fg-subtle">
                        Best <ScorePill score={s.best_score} passing={c.passing_score} />
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

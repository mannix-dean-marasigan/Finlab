import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Crown, Flame, Medal, Trophy } from 'lucide-react';
import { useMyProfile, useReference } from '@/app/queries';
import { fetchLeaderboard, fetchUniversities } from '@/services/api/compete';
import { getWeeklyPod, getXpLeaderboard } from '@/services/api/engage';
import type { LeaderboardBoard } from '@/types/domain';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/form';
import { Table, Tabs, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { fmtNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const BOARDS: { value: LeaderboardBoard; label: string; metric: string; desc: string }[] = [
  { value: 'global', label: 'Global', metric: 'FINLAB Score', desc: 'All ranked analysts by FINLAB Score.' },
  { value: 'philippines', label: 'Philippines', metric: 'FINLAB Score', desc: 'Analysts based in the Philippines.' },
  { value: 'university', label: 'University', metric: 'FINLAB Score', desc: 'Compare with analysts from the same school.' },
  { value: 'specialization', label: 'Specialization', metric: 'FINLAB Score', desc: 'Ranked within a primary specialization.' },
  { value: 'stock_pitch', label: 'Stock Pitch', metric: 'Avg of top 3 pitches', desc: 'Average rubric score of your three best submitted pitches.' },
  { value: 'equity_research', label: 'Equity Research', metric: 'Avg of top 3', desc: 'Best research reports and equity research challenges.' },
  { value: 'portfolio', label: 'Portfolio Mgmt', metric: 'Simulated return %', desc: 'Return of the simulated portfolio since start or last reset (sample prices).' },
];

type XpBoard = 'xp_pod' | 'xp_week' | 'xp_30';
const XP_BOARDS: { value: XpBoard; label: string; desc: string }[] = [
  { value: 'xp_pod', label: 'My weekly pod', desc: 'Each week everyone is placed in a random group of about 20 and competes on the XP earned that week. A fresh pod every Monday (Manila time).' },
  { value: 'xp_week', label: 'This week (XP)', desc: 'XP earned since Monday (Manila time) from lessons, practice, challenges, pitches, reviews, flashcards and daily challenges. Resets weekly.' },
  { value: 'xp_30', label: '30 days (XP)', desc: 'XP earned over the last 30 days.' },
];

function XpLeaderboard({ board }: { board: XpBoard }) {
  const rows = useQuery({
    queryKey: ['xp-leaderboard', board],
    queryFn: async () => {
      if (board === 'xp_pod') return (await getWeeklyPod()).rows;
      return getXpLeaderboard(board === 'xp_week' ? null : 30);
    },
  });
  if (rows.isPending) return <LoadingState />;
  if (rows.isError) return <ErrorState error={rows.error} onRetry={() => rows.refetch()} />;
  if (!rows.data.length) return <EmptyState icon={<Flame className="h-5 w-5" />} title={board === 'xp_pod' ? 'No pod this week' : 'No XP earned yet in this period'} description={board === 'xp_pod' ? 'Pods are for learners; admin accounts are not placed in one.' : "Answer today's daily challenge or review some flashcards to get on the board."} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-16">Rank</Th>
          <Th>Analyst</Th>
          <Th align="right">XP</Th>
        </tr>
      </thead>
      <tbody>
        {rows.data.map((r) => (
          <tr key={r.user_id} className={cn('hover:bg-surface-2', r.is_me && 'bg-accent/[0.06]')}>
            <Td mono>
              <span className="inline-flex items-center gap-1.5">
                {r.rank === 1 ? <Crown className="h-4 w-4 text-accent" /> : r.rank <= 3 ? <Medal className="h-4 w-4 text-fg-muted" /> : null}
                {r.rank}
              </span>
            </Td>
            <Td>
              <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">
                {r.display_name}
              </Link>
              {r.is_me && <span className="ml-1.5 text-xs text-accent">(you)</span>}
              <div className="text-xs text-fg-subtle">@{r.handle}</div>
            </Td>
            <Td align="right" mono className="font-semibold">
              {fmtNumber(r.xp, 0)}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const rawBoard = params.get('board') || 'global';
  const xpBoard = XP_BOARDS.find((b) => b.value === rawBoard);
  const board = (xpBoard ? 'global' : rawBoard) as LeaderboardBoard;
  const profile = useMyProfile();
  const ref = useReference();
  const [filter, setFilter] = useState<string>('');
  const def = BOARDS.find((b) => b.value === board) ?? BOARDS[0];
  const needsFilter = board === 'university' || board === 'specialization';
  const effectiveFilter = needsFilter ? filter || (board === 'university' ? profile.data?.university ?? '' : profile.data?.primary_specialization_id ?? '') : null;

  const universities = useQuery({ queryKey: ['universities'], queryFn: fetchUniversities, enabled: board === 'university' });
  const rows = useQuery({
    queryKey: ['leaderboard', board, effectiveFilter],
    queryFn: () => fetchLeaderboard(board, effectiveFilter, 100),
    enabled: !xpBoard && (!needsFilter || !!effectiveFilter),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Compete"
        title="Leaderboards"
        description="Every ranking is calculated in the database from scored work. Nobody — including you — can edit a ranking. Private profiles are hidden from others."
      />
      <Tabs
        className="mb-4"
        value={xpBoard ? xpBoard.value : board}
        onChange={(v) => {
          setFilter('');
          setParams({ board: v });
        }}
        tabs={[...BOARDS.map((b) => ({ value: b.value as string, label: b.label })), ...XP_BOARDS.map((b) => ({ value: b.value as string, label: b.label }))]}
      />
      {xpBoard ? (
        <>
          <p className="mb-4 text-sm text-fg-muted">{xpBoard.desc}</p>
          <Card>
            <XpLeaderboard board={xpBoard.value} />
          </Card>
        </>
      ) : (
      <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-fg-muted">
          <span className="text-fg">{def.metric}.</span> {def.desc}
        </p>
        {board === 'university' && (
          <Select value={effectiveFilter ?? ''} onChange={(e) => setFilter(e.target.value)} className="w-72" aria-label="University">
            <option value="">Select a university…</option>
            {profile.data?.university && !universities.data?.some((u) => u.university.toLowerCase() === profile.data!.university!.toLowerCase()) && (
              <option value={profile.data.university}>{profile.data.university}</option>
            )}
            {universities.data?.map((u) => (
              <option key={u.university} value={u.university}>
                {u.university} ({u.members})
              </option>
            ))}
          </Select>
        )}
        {board === 'specialization' && (
          <Select value={effectiveFilter ?? ''} onChange={(e) => setFilter(e.target.value)} className="w-64" aria-label="Specialization">
            <option value="">Select…</option>
            {ref.data?.specializations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      <Card>
        {needsFilter && !effectiveFilter ? (
          <EmptyState title={board === 'university' ? 'Choose a university' : 'Choose a specialization'} description={board === 'university' ? 'Add your university in Settings to see your school by default.' : undefined} />
        ) : rows.isPending ? (
          <LoadingState />
        ) : rows.isError ? (
          <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
        ) : !rows.data.length ? (
          <EmptyState icon={<Trophy className="h-5 w-5" />} title="No one ranked here yet" description="Rankings appear once analysts have scored work in this category." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-16">Rank</Th>
                <Th>Analyst</Th>
                <Th>Level</Th>
                <Th className="hidden md:table-cell">University</Th>
                <Th className="hidden lg:table-cell">Specialization</Th>
                <Th align="right">{def.metric}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.data.map((r) => (
                <tr key={r.user_id} className={cn('hover:bg-surface-2', r.is_me && 'bg-accent/[0.06]')}>
                  <Td mono>
                    <span className="inline-flex items-center gap-1.5">
                      {r.rank === 1 ? <Crown className="h-4 w-4 text-accent" /> : r.rank <= 3 ? <Medal className="h-4 w-4 text-fg-muted" /> : null}
                      {r.rank}
                    </span>
                  </Td>
                  <Td>
                    <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">
                      {r.display_name}
                    </Link>
                    {r.is_me && <span className="ml-1.5 text-xs text-accent">(you)</span>}
                    <div className="text-xs text-fg-subtle">@{r.handle} · {r.country_code}</div>
                  </Td>
                  <Td className="text-fg-muted">{r.career_level}</Td>
                  <Td className="hidden text-fg-muted md:table-cell">{r.university ?? '—'}</Td>
                  <Td className="hidden text-fg-muted lg:table-cell">{r.specialization ?? '—'}</Td>
                  <Td align="right" mono className={cn('font-semibold', board === 'portfolio' && (r.value >= 0 ? 'text-up' : 'text-down'))}>
                    {board === 'portfolio' ? `${r.value > 0 ? '+' : ''}${fmtNumber(r.value, 2)}%` : fmtNumber(r.value, 1)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      </>
      )}
    </div>
  );
}

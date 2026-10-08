import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, Crown, Medal, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getCohortLeaderboard, getCohortRoster } from '@/services/api/engage';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Segmented, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { fmtNumber, timeAgo } from '@/lib/format';
import { appUrl, cn } from '@/lib/utils';

function Leaderboard({ cohortId }: { cohortId: string }) {
  const [range, setRange] = useState<'week' | 'all'>('week');
  const rows = useQuery({ queryKey: ['cohort-leaderboard', cohortId, range], queryFn: () => getCohortLeaderboard(cohortId, range === 'week' ? null : 0) });
  return (
    <Card>
      <CardHeader
        title="Class leaderboard"
        subtitle="Ranked by XP"
        icon={<Crown className="h-3.5 w-3.5" />}
        action={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'week', label: 'This week' },
              { value: 'all', label: 'All time' },
            ]}
          />
        }
      />
      <CardContent className="px-0 pb-1">
        {rows.isPending ? (
          <LoadingState />
        ) : rows.isError ? (
          <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
        ) : !rows.data.length ? (
          <EmptyState title="No members yet" />
        ) : (
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
                      {r.rank === 1 && r.xp > 0 ? <Crown className="h-4 w-4 text-accent" /> : r.rank <= 3 && r.xp > 0 ? <Medal className="h-4 w-4 text-fg-muted" /> : null}
                      {r.rank}
                    </span>
                  </Td>
                  <Td>
                    <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">
                      {r.display_name}
                    </Link>
                    {r.is_me && <span className="ml-1.5 text-xs text-accent">(you)</span>}
                  </Td>
                  <Td align="right" mono className="font-semibold">
                    {fmtNumber(r.xp, 0)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Roster({ cohortId }: { cohortId: string }) {
  const rows = useQuery({ queryKey: ['cohort-roster', cohortId], queryFn: () => getCohortRoster(cohortId) });
  return (
    <Card>
      <CardHeader title="Class progress" subtitle="Visible to class managers. Members are told their manager can see this." icon={<Users className="h-3.5 w-3.5" />} />
      <CardContent className="px-0 pb-1">
        {rows.isPending ? (
          <LoadingState />
        ) : rows.isError ? (
          <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
        ) : !rows.data.length ? (
          <EmptyState title="No members yet" description="Share the join code so students can join." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th align="right">Score</Th>
                <Th align="right">Lessons</Th>
                <Th align="right">Cases</Th>
                <Th align="right">Certs</Th>
                <Th align="right">XP 7d</Th>
                <Th className="hidden md:table-cell">Last active</Th>
              </tr>
            </thead>
            <tbody>
              {rows.data.map((r) => (
                <tr key={r.user_id} className="hover:bg-surface-2">
                  <Td>
                    <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">
                      {r.full_name}
                    </Link>
                    {(r.streak ?? 0) > 0 && <span className="ml-2 text-xs text-fg-subtle">{r.streak}-day streak</span>}
                  </Td>
                  <Td align="right" mono>{r.finlab_score === null ? '—' : fmtNumber(r.finlab_score, 1)}</Td>
                  <Td align="right" mono>{r.lessons_passed}</Td>
                  <Td align="right" mono>{r.challenges_scored}</Td>
                  <Td align="right" mono>{r.certificates}</Td>
                  <Td align="right" mono>{r.xp_7d}</Td>
                  <Td className="hidden text-xs text-fg-muted md:table-cell">{r.last_active ? timeAgo(r.last_active) : 'not yet'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Leaderboard for everyone in the class; roster for managers and admins. */
export function ClassDetail({ cohortId, name, joinCode, isManager, members }: { cohortId: string; name: string; joinCode: string | null; isManager: boolean; members: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">{name}</h2>
        <Badge>{members} member{members === 1 ? '' : 's'}</Badge>
        {isManager && <Badge tone="violet">Manager</Badge>}
        {isManager && joinCode && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              navigator.clipboard
                .writeText(appUrl(`/classes?join=${joinCode}`))
                .then(() => toast.success('Class join link copied'))
                .catch(() => toast.error('Could not copy'))
            }
          >
            <Copy className="h-3.5 w-3.5" /> Join link ({joinCode})
          </Button>
        )}
      </div>
      <Leaderboard cohortId={cohortId} />
      {isManager && <Roster cohortId={cohortId} />}
    </div>
  );
}

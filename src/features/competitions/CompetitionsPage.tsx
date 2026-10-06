import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Swords, Users } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { competitionStatus, listCompetitions, myCompetitionIds } from '@/services/api/compete';
import type { CompetitionStatus } from '@/types/domain';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';

export const STATUS_TONE = { upcoming: 'info', active: 'up', completed: 'neutral' } as const;

export default function CompetitionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<CompetitionStatus>('active');
  const comps = useQuery({ queryKey: ['competitions'], queryFn: listCompetitions });
  const mine = useQuery({ queryKey: ['myCompetitions', user!.id], queryFn: () => myCompetitionIds(user!.id) });

  if (comps.isPending || mine.isPending) return <PageSkeleton />;
  if (comps.isError) return <ErrorState error={comps.error} onRetry={() => comps.refetch()} />;
  if (mine.isError) return <ErrorState error={mine.error} onRetry={() => mine.refetch()} />;

  const withStatus = comps.data.map((c) => ({ ...c, status: competitionStatus(c), registered: mine.data.includes(c.id) }));
  const list = withStatus.filter((c) => c.status === tab);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Compete"
        title="Competitions"
        description="Timed, ranked events built from FINLAB challenges. Register, then start each challenge from the competition page — only those attempts count toward the standings."
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={(['active', 'upcoming', 'completed'] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: withStatus.filter((c) => c.status === s).length }))}
      />
      {!list.length ? (
        <EmptyState icon={<Swords className="h-5 w-5" />} title={`No ${tab} competitions`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => (
            <Link key={c.id} to={`/competitions/${c.id}`}>
              <Card className="h-full p-5 transition-colors hover:border-border-strong">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <div className="flex shrink-0 gap-1.5">
                    {c.registered && <Badge tone="accent">Registered</Badge>}
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-fg-muted">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> {fmtDate(c.starts_at)} – {fmtDate(c.ends_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {c.participant_count}
                    {c.participant_limit ? ` / ${c.participant_limit}` : ''} registered
                  </span>
                  <span>Scoring: {c.scoring_method}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

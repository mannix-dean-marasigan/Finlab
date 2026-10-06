import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck, Clock, GraduationCap, Layers, Route } from 'lucide-react';
import { useMyProfile } from '@/app/queries';
import { getUserCertificates, listPrograms } from '@/services/api/misc';
import type { ProgramSummary } from '@/types/domain';
import { DifficultyBadge, PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';
import { cn } from '@/lib/utils';

function ProgramCard({ p }: { p: ProgramSummary }) {
  const pct = p.modules ? (p.completed_modules / p.modules) * 100 : 0;
  const done = !!p.certificate_code;
  return (
    <Link to={`/certifications/${p.slug}`} className="group">
      <Card className={cn('flex h-full flex-col p-5 transition-colors group-hover:border-border-strong', done && 'border-up/30', p.kind === 'certification' && !done && 'border-accent/20')}>
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border',
              p.kind === 'certification' ? 'border-accent/40 bg-accent-muted text-accent' : 'border-info/30 bg-info-muted text-info',
            )}
          >
            {p.kind === 'certification' ? <GraduationCap className="h-5 w-5" /> : <Route className="h-5 w-5" />}
          </span>
          <div className="flex gap-1.5">
            {done ? (
              <Badge tone="up">
                <BadgeCheck className="h-3 w-3" /> Certified
              </Badge>
            ) : p.enrolled ? (
              <Badge tone="accent">Enrolled</Badge>
            ) : null}
            <DifficultyBadge difficulty={p.level} />
          </div>
        </div>
        <h3 className="mt-4 text-lg font-semibold group-hover:text-accent">{p.title}</h3>
        <p className="mt-1 flex-1 text-sm text-fg-muted">{p.subtitle}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-fg-subtle">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> ~{p.estimated_hours} h
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {p.modules} modules
          </span>
          {p.kind === 'certification' && <span>Timed final exam</span>}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-fg-muted">
              {p.completed_modules}/{p.modules} complete
            </span>
            <span className="font-mono text-fg-subtle">{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} tone={done ? 'up' : 'accent'} />
        </div>
        <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">
          Earns: <span className="text-fg">{p.certificate_title}</span>
        </div>
      </Card>
    </Link>
  );
}

export default function CertificationsPage() {
  const profile = useMyProfile();
  const [tab, setTab] = useState<'certification' | 'track' | 'mine'>('certification');
  const programs = useQuery({ queryKey: ['programs'], queryFn: listPrograms });
  const mine = useQuery({ queryKey: ['myCertificates', profile.data?.handle], queryFn: () => getUserCertificates(profile.data!.handle), enabled: !!profile.data });

  if (programs.isPending) return <PageSkeleton />;
  if (programs.isError) return <ErrorState error={programs.error} onRetry={() => programs.refetch()} />;
  const list = programs.data.filter((p) => p.kind === tab);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Learn"
        title="Certifications"
        description="Structured programs of lessons, hands-on challenges and a timed final exam. Pass every module and a verifiable certificate is issued automatically — no shortcuts, no 'mark as done'."
      />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'certification', label: 'Certifications', count: programs.data.filter((p) => p.kind === 'certification').length },
          { value: 'track', label: 'Learning tracks', count: programs.data.filter((p) => p.kind === 'track').length },
          { value: 'mine', label: 'My certificates', count: mine.data?.length },
        ]}
      />
      {tab === 'mine' ? (
        mine.isPending ? (
          <PageSkeleton />
        ) : mine.isError ? (
          <ErrorState error={mine.error} onRetry={() => mine.refetch()} />
        ) : !mine.data.length ? (
          <EmptyState icon={<Award className="h-5 w-5" />} title="No certificates yet" description="Complete a learning track or certification, or place in a competition." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.data.map((c) => (
              <Link key={c.code} to={`/verify/${c.code}`}>
                <Card className="flex items-center gap-4 p-4 hover:border-border-strong">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-accent/40 bg-accent-muted text-accent">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="truncate text-xs text-fg-muted">{c.subtitle}</div>
                    <div className="mt-1 font-mono text-[0.7rem] text-fg-subtle">
                      {c.code} · {fmtDate(c.issued_at)}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : !list.length ? (
        <EmptyState title="Nothing published here yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <ProgramCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Lock } from 'lucide-react';
import { getPitch, getResearch } from '@/services/api/work';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { Delta, Markdown, RatingBadge, ScoreRing } from '@/components/common';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { SourcesEditor } from '@/features/shared/SourcesEditor';
import { RESEARCH_SECTIONS } from '@/features/research/sections';
import { upsidePct } from '@/lib/finance/valuation';
import { fmtDate, fmtMoney } from '@/lib/format';
import { PublicShell } from './PublicPassportPage';

const PITCH_FIELDS = [
  ['thesis', 'Investment thesis'],
  ['variant_perception', 'Variant perception'],
  ['company_analysis', 'Company analysis'],
  ['financial_analysis', 'Financial analysis'],
  ['forecast', 'Forecast'],
  ['valuation', 'Valuation'],
  ['catalysts', 'Catalysts'],
  ['risks', 'Risks'],
] as const;

const asList = (t: string) => t.split('\n').filter((l) => l.trim()).map((l) => `- ${l.replace(/^[\s\-*•]+/, '')}`).join('\n');

/** Read-only public view of a published pitch or research report (works signed out). */
export default function PublicWorkPage() {
  const { handle = '', kind = '', id = '' } = useParams();
  const isPitch = kind === 'pitch';
  const pitch = useQuery({ queryKey: ['publicPitch', id], queryFn: () => getPitch(id), enabled: isPitch });
  const report = useQuery({ queryKey: ['publicResearch', id], queryFn: () => getResearch(id), enabled: kind === 'research' });
  const q = isPitch ? pitch : report;

  return (
    <PublicShell>
      <Link to={`/p/${handle}`} className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Finance Passport
      </Link>
      {q.isPending ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} />
      ) : !q.data ? (
        <EmptyState icon={<Lock className="h-5 w-5" />} title="Not available" description="This work is private or doesn't exist." />
      ) : isPitch && pitch.data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 min-w-0">
            <Card className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-2xl font-semibold">{pitch.data.ticker}</span>
                <span className="text-fg-muted">{pitch.data.company}</span>
                <RatingBadge rating={pitch.data.rating} />
                <Badge tone="violet">{pitch.data.format} pitch</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-6 text-sm">
                <span>Price {fmtMoney(pitch.data.current_price, pitch.data.currency)}</span>
                <span>Target {fmtMoney(pitch.data.target_price, pitch.data.currency)}</span>
                <Delta value={pitch.data.current_price && pitch.data.target_price ? upsidePct(pitch.data.target_price, pitch.data.current_price) : null} />
                <span className="text-fg-muted">Submitted {fmtDate(pitch.data.submitted_at)}</span>
              </div>
            </Card>
            {PITCH_FIELDS.map(([k, label]) =>
              pitch.data![k]?.trim() ? (
                <Card key={k}>
                  <CardHeader title={label} />
                  <CardContent>
                    <Markdown>{k === 'catalysts' || k === 'risks' ? asList(pitch.data![k]) : pitch.data![k]}</Markdown>
                  </CardContent>
                </Card>
              ) : null,
            )}
            <Card>
              <CardHeader title="Sources" />
              <CardContent>
                <SourcesEditor parent={{ pitchId: id }} readOnly />
              </CardContent>
            </Card>
          </div>
          <Card className="h-fit">
            <CardHeader title="FINLAB rubric score" />
            <CardContent>
              <div className="mb-4 flex justify-center">
                <ScoreRing value={Number(pitch.data.score ?? 0)} sub="/ 100" />
              </div>
              {pitch.data.criteria_scores && <ScoreBreakdown criteria={pitch.data.criteria_scores} showWeights />}
            </CardContent>
          </Card>
        </div>
      ) : report.data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="min-w-0">
            <div className="border-b border-border p-6">
              <h1 className="text-2xl font-semibold">{report.data.project.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
                <span>
                  {report.data.project.company} {report.data.project.ticker && `(${report.data.project.ticker})`}
                </span>
                <RatingBadge rating={report.data.project.rating} />
                <span className="font-mono">
                  {fmtMoney(report.data.project.current_price, report.data.project.currency)} → {fmtMoney(report.data.project.target_price, report.data.project.currency)}
                </span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {RESEARCH_SECTIONS.map((s, i) => {
                const content = report.data!.sections.find((x) => x.section_key === s.key)?.content ?? '';
                return (
                  <section key={s.key} className="px-6 py-5">
                    <h2 className="mb-2 text-lg font-semibold">
                      <span className="mr-2 font-mono text-sm text-fg-subtle">{i + 1}.</span>
                      {s.title}
                    </h2>
                    <Markdown>{s.list ? asList(content) : content}</Markdown>
                  </section>
                );
              })}
              <section className="px-6 py-5">
                <h2 className="mb-2 text-lg font-semibold">
                  <span className="mr-2 font-mono text-sm text-fg-subtle">11.</span>Sources
                </h2>
                <SourcesEditor parent={{ projectId: id }} readOnly />
              </section>
            </div>
          </Card>
          <Card className="h-fit">
            <CardHeader title="FINLAB rubric score" />
            <CardContent>
              <div className="mb-4 flex justify-center">
                <ScoreRing value={Number(report.data.project.score ?? 0)} sub="/ 100" />
              </div>
              {report.data.project.criteria_scores && <ScoreBreakdown criteria={report.data.project.criteria_scores} showWeights />}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PublicShell>
  );
}

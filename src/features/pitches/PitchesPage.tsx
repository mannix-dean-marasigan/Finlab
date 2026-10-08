import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, Plus, Presentation, Timer, Zap } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { createPitch, listMyPitches } from '@/services/api/work';
import { Countdown, PageHeader, RatingBadge, ScorePill } from '@/components/common';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Select } from '@/components/ui/form';
import { Modal, Tabs, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate, fmtMoney, timeAgo } from '@/lib/format';
import { upsidePct } from '@/lib/finance/valuation';
import { Delta } from '@/components/common';
import { cn } from '@/lib/utils';
import type { PitchFormat } from '@/types/domain';

export default function PitchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pitches = useQuery({ queryKey: ['pitches', user!.id], queryFn: () => listMyPitches(user!.id) });
  const [tab, setTab] = useState<'all' | 'draft' | 'submitted'>('all');
  const [newFormat, setNewFormat] = useState<PitchFormat | null>(null);
  const [days, setDays] = useState(5);

  const create = useMutation({
    mutationFn: (format: PitchFormat) =>
      createPitch({ format, deadline_at: format === 'professional' ? new Date(Date.now() + days * 86400_000).toISOString() : null }),
    onSuccess: (p) => navigate(`/pitches/${p.id}`),
  });

  if (pitches.isPending) return <PageSkeleton />;
  if (pitches.isError) return <ErrorState error={pitches.error} onRetry={() => pitches.refetch()} />;
  const rows = pitches.data.filter((p) => tab === 'all' || p.status === tab);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Stock Pitch Arena"
        title="Pitch ideas. Defend them."
        description="Pitch a stock in 15 to 30 minutes, or take up to a week for a full pitch. Scored on thesis, financials, valuation, risks, catalysts, communication and sources."
        actions={
          <>
            <Button variant="outline" onClick={() => setNewFormat('quick')}>
              <Zap className="h-4 w-4" /> Quick pitch
            </Button>
            <Button variant="primary" onClick={() => setNewFormat('professional')}>
              <Plus className="h-4 w-4" /> Professional pitch
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-accent" /> Quick Pitch
          </div>
          <p className="mt-1 text-sm text-fg-muted">Company, ticker, BUY/HOLD/SELL, current & target price, thesis, catalysts, risks and sources. Built for 15–30 minutes.</p>
          <Link to="/challenges?category=stock_pitch" className="mt-2 inline-block text-xs text-accent hover:underline">
            Timed quick-pitch challenges →
          </Link>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="h-4 w-4 text-accent" /> Professional Pitch
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            2–7 day window with a live countdown and drafts. Adds company analysis, financial analysis, forecast, valuation and variant perception. Presentation + Q&A comes in a later phase.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="My pitches" icon={<Presentation className="h-3.5 w-3.5" />} />
        <Tabs
          className="px-4"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: pitches.data.length },
            { value: 'draft', label: 'Drafts', count: pitches.data.filter((p) => p.status === 'draft').length },
            { value: 'submitted', label: 'Submitted', count: pitches.data.filter((p) => p.status === 'submitted').length },
          ]}
        />
        {!rows.length ? (
          <EmptyState
            icon={<Presentation className="h-5 w-5" />}
            title={tab === 'submitted' ? 'No submitted pitches yet' : 'No pitches yet'}
            description="Start a quick pitch to get your first rubric score."
            action={
              <Button variant="primary" size="sm" onClick={() => setNewFormat('quick')}>
                New quick pitch
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Format</Th>
                <Th>Rating</Th>
                <Th align="right">Price → Target</Th>
                <Th align="right">Upside</Th>
                <Th>Status</Th>
                <Th align="right">Score</Th>
                <Th align="right">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="cursor-pointer hover:bg-surface-2" onClick={() => navigate(`/pitches/${p.id}`)}>
                  <Td>
                    <div className="font-medium">{p.ticker || 'Untitled'}</div>
                    <div className="text-xs text-fg-muted">{p.company || '—'}</div>
                  </Td>
                  <Td>
                    <Badge tone={p.format === 'professional' ? 'violet' : 'neutral'}>{p.format}</Badge>
                    {p.challenge_id && <Badge tone="info" className="ml-1">challenge</Badge>}
                  </Td>
                  <Td>
                    <RatingBadge rating={p.rating} />
                  </Td>
                  <Td align="right" mono>
                    {fmtMoney(p.current_price, p.currency)} → {fmtMoney(p.target_price, p.currency)}
                  </Td>
                  <Td align="right">
                    <Delta value={p.current_price && p.target_price ? upsidePct(p.target_price, p.current_price) : null} />
                  </Td>
                  <Td>
                    {p.status === 'draft' ? (
                      p.deadline_at ? <Countdown deadline={p.deadline_at} className="text-xs" /> : <Badge>Draft</Badge>
                    ) : (
                      <Badge tone="up">Submitted {fmtDate(p.submitted_at)}</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <ScorePill score={p.score} />
                  </Td>
                  <Td align="right" className="text-xs text-fg-subtle">
                    {timeAgo(p.updated_at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!newFormat}
        onClose={() => setNewFormat(null)}
        title={newFormat === 'professional' ? 'New professional pitch' : 'New quick pitch'}
        description={
          newFormat === 'professional'
            ? 'Choose your window. The deadline is locked once created and enforced on submission.'
            : 'Aim to finish in 15–30 minutes. Drafts save automatically.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setNewFormat(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => newFormat && create.mutate(newFormat)} loading={create.isPending}>
              Create pitch
            </Button>
          </>
        }
      >
        {newFormat === 'professional' && (
          <Field label="Pitch window" hint={`Deadline: ${new Date(Date.now() + days * 86400_000).toLocaleString()}`}>
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </Select>
          </Field>
        )}
        {newFormat === 'quick' && (
          <ul className={cn('space-y-1 text-sm text-fg-muted')}>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Suggested time: 15–30 minutes
            </li>
            <li>Need a hard clock? Use a timed Quick Pitch challenge instead.</li>
          </ul>
        )}
        <div className="mt-3">
          <InlineError message={create.error ? (create.error as Error).message : null} />
        </div>
      </Modal>
    </div>
  );
}

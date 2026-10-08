import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { fetchEventResolution, listMarketEvents, listMyDecisions, submitDecision } from '@/services/api/markets';
import type { MarketEvent, MarketEventDecision } from '@/types/domain';
import { Countdown, Markdown, PageHeader, ScorePill } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Select, Textarea } from '@/components/ui/form';
import { Segmented, Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';

const ACTIONS: MarketEventDecision['action'][] = ['buy', 'sell', 'hold', 'rebalance'];

function DecisionForm({ event, existing }: { event: MarketEvent; existing?: MarketEventDecision }) {
  const qc = useQueryClient();
  const [action, setAction] = useState<MarketEventDecision['action']>(existing?.action ?? 'hold');
  const [security, setSecurity] = useState(existing?.security_id ?? event.affected_securities[0] ?? '');
  const [reasoning, setReasoning] = useState(existing?.reasoning ?? '');
  const [confidence, setConfidence] = useState(existing?.confidence ?? 3);
  const save = useMutation({
    mutationFn: () => submitDecision({ eventId: event.id, action, reasoning, securityId: security || null, confidence }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['decisions'] });
      invalidateProgress(qc);
      toast.success(existing ? 'Decision updated' : 'Call saved. It is scored when the event closes.');
    },
  });
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface-2 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Your action">
          <Segmented value={action} onChange={setAction} options={ACTIONS.map((a) => ({ value: a, label: a[0].toUpperCase() + a.slice(1) }))} />
        </Field>
        <Field label="Focus security (optional)">
          <Select value={security} onChange={(e) => setSecurity(e.target.value)}>
            <option value="">Portfolio-wide</option>
            {event.affected_securities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Confidence: ${confidence}/5`}>
          <input type="range" min={1} max={5} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="mt-2 w-full accent-[#f5a524]" />
        </Field>
      </div>
      <Field label="Reasoning" required hint={`${reasoning.trim().length}/40 characters minimum. Name the transmission mechanism, the stocks affected, and what's priced in.`}>
        <Textarea rows={4} value={reasoning} onChange={(e) => setReasoning(e.target.value)} maxLength={4000} />
      </Field>
      <InlineError message={save.error ? (save.error as Error).message : null} />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-fg-subtle">You can revise your decision until the window closes.</span>
        <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending} disabled={reasoning.trim().length < 40}>
          {existing ? 'Update decision' : 'Submit decision'}
        </Button>
      </div>
    </div>
  );
}

function Resolution({ event, decision }: { event: MarketEvent; decision?: MarketEventDecision }) {
  const res = useQuery({ queryKey: ['eventResolution', event.id], queryFn: () => fetchEventResolution(event.id) });
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
      {res.data && (
        <>
          {res.data.summary && <p className="text-sm">{res.data.summary}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-fg-muted">Best responses:</span>
            {res.data.best_actions.map((a) => (
              <Badge key={a} tone="up">{a}</Badge>
            ))}
            {res.data.acceptable_actions.map((a) => (
              <Badge key={a} tone="neutral">{a}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(res.data.price_impacts).map(([k, v]) => (
              <span key={k} className="font-mono">
                {k.split(':')[1]} <span className={Number(v) >= 0 ? 'text-up' : 'text-down'}>{fmtPct(Number(v), 1, true)}</span>
              </span>
            ))}
          </div>
        </>
      )}
      {decision ? (
        <div className="flex items-start justify-between gap-3 border-t border-border pt-3 text-sm">
          <div>
            <div>
              You chose <strong className="uppercase">{decision.action}</strong>
            </div>
            {decision.feedback && <div className="mt-0.5 text-xs text-fg-muted">{decision.feedback}</div>}
          </div>
          <ScorePill score={decision.score} />
        </div>
      ) : (
        <p className="border-t border-border pt-3 text-sm text-fg-muted">You didn't respond to this event.</p>
      )}
    </div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const events = useQuery({ queryKey: ['events'], queryFn: listMarketEvents });
  const decisions = useQuery({ queryKey: ['decisions', user!.id], queryFn: () => listMyDecisions(user!.id) });

  if (events.isPending || decisions.isPending) return <PageSkeleton />;
  if (events.isError) return <ErrorState error={events.error} onRetry={() => events.refetch()} />;
  if (decisions.isError) return <ErrorState error={decisions.error} onRetry={() => decisions.refetch()} />;

  const byEvent = new Map(decisions.data.map((d) => [d.event_id, d]));
  const list = events.data.filter((e) => e.status === tab);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Market Events"
        title="React to the tape"
        description="Read the scenario, make your call (buy, sell, hold or rebalance) and explain why. Calls are scored when the event closes."
        actions={
          <Link to="/portfolio">
            <Button size="sm">Open portfolio</Button>
          </Link>
        }
      />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'open', label: 'Open', count: events.data.filter((e) => e.status === 'open').length },
          { value: 'resolved', label: 'Resolved', count: events.data.filter((e) => e.status === 'resolved').length },
        ]}
      />
      {!list.length ? (
        <EmptyState icon={<Zap className="h-5 w-5" />} title={tab === 'open' ? 'No open events right now' : 'No resolved events yet'} description="New scenarios are published by the FINLAB team." />
      ) : (
        <div className="space-y-4">
          {list.map((e) => {
            const d = byEvent.get(e.id);
            const closed = e.closes_at ? new Date(e.closes_at).getTime() < Date.now() : false;
            return (
              <Card key={e.id} className={cn(e.status === 'open' && !d && 'border-accent/30')}>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="accent">{e.category}</Badge>
                        <Badge>{e.region}</Badge>
                        {d && e.status === 'open' && (
                          <Badge tone="up">
                            <CheckCircle2 className="h-3 w-3" /> Decided
                          </Badge>
                        )}
                      </div>
                      <h2 className="mt-2 text-lg font-semibold">{e.title}</h2>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
                        <Clock className="h-3 w-3" /> {e.status === 'resolved' ? `Resolved ${fmtDateTime(e.resolved_at)}` : `Opened ${fmtDateTime(e.opens_at)}`}
                      </div>
                    </div>
                    {e.status === 'open' && e.closes_at && <Countdown deadline={e.closes_at} />}
                  </div>
                  <Markdown>{e.description}</Markdown>
                  {e.affected_securities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {e.affected_securities.map((s) => (
                        <Link key={s} to={`/markets/${encodeURIComponent(s)}`} className="rounded border border-border px-2 py-0.5 font-mono text-xs hover:border-accent/50">
                          {s}
                        </Link>
                      ))}
                    </div>
                  )}
                  {e.status === 'open' ? (
                    closed ? (
                      <p className="text-sm text-fg-muted">The decision window has closed. Awaiting resolution.</p>
                    ) : (
                      <DecisionForm event={e} existing={d} />
                    )
                  ) : (
                    <Resolution event={e} decision={d} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

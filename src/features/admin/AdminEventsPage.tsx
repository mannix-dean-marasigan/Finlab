import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { adminListEvents, adminResolveEvent, adminSaveEvent, type EventInput, type EventKey } from '@/services/api/admin';
import type { MarketEvent } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime } from '@/lib/format';

type Row = MarketEvent & { key: EventKey | null; decisions: number };
const ACTIONS = ['buy', 'sell', 'hold', 'rebalance'];

function Editor({ ev, onClose }: { ev: Row | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: ev?.title ?? '',
    description: ev?.description ?? '',
    category: ev?.category ?? 'macro',
    region: ev?.region ?? 'PH',
    affected: ev?.affected_securities.join(', ') ?? '',
    impacts: Object.entries(ev?.price_impacts ?? {}).map(([k, v]) => `${k}=${v}`).join('\n'),
    status: ev?.status ?? 'draft',
    closes_at: ev?.closes_at ? new Date(ev.closes_at).toISOString().slice(0, 16) : '',
    best: ev?.key?.best_actions ?? [],
    acceptable: ev?.key?.acceptable_actions ?? [],
    keywords: ev?.key?.keywords.join(', ') ?? '',
  });
  const toggle = (k: 'best' | 'acceptable', a: string) => setF((x) => ({ ...x, [k]: x[k].includes(a) ? x[k].filter((y) => y !== a) : [...x[k], a] }));

  const save = useMutation({
    mutationFn: () => {
      if (f.title.trim().length < 3) throw new Error('Title is required.');
      const impacts: Record<string, number> = {};
      for (const line of f.impacts.split('\n').map((l) => l.trim()).filter(Boolean)) {
        const [k, v] = line.split('=');
        if (!/^[A-Z]+:[A-Z0-9.\-]+$/.test(k?.trim() ?? '') || !Number.isFinite(Number(v))) throw new Error(`Bad impact line "${line}". Use PSE:BDO=2.5`);
        impacts[k.trim()] = Number(v);
      }
      if (!f.best.length) throw new Error('Choose at least one best action (scoring key).');
      const input: EventInput = {
        title: f.title.trim(), description: f.description, category: f.category as MarketEvent['category'], region: f.region,
        affected_securities: f.affected.split(',').map((s) => s.trim()).filter(Boolean), price_impacts: impacts,
        status: f.status as MarketEvent['status'], closes_at: f.closes_at ? new Date(f.closes_at).toISOString() : null,
      };
      return adminSaveEvent(input, { best_actions: f.best, acceptable_actions: f.acceptable, keywords: f.keywords.split(',').map((k) => k.trim()).filter(Boolean) }, ev?.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event saved');
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={ev ? 'Edit market event' : 'New market event'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Headline" required className="sm:col-span-3">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="BSP announces an unexpected rate hike" />
        </Field>
        <Field label="Description (markdown)" className="sm:col-span-3">
          <Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label="Category">
          <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as MarketEvent['category'] })}>
            {['macro', 'sector', 'company', 'geopolitical'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Region">
          <Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
        </Field>
        <Field label="Status" hint="draft = hidden · open = accepting decisions">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as MarketEvent['status'] })} disabled={ev?.status === 'resolved'}>
            <option value="draft">draft</option>
            <option value="open">open</option>
            {ev?.status === 'resolved' && <option value="resolved">resolved</option>}
          </Select>
        </Field>
        <Field label="Affected securities" hint="Comma-separated, e.g. PSE:BDO, PSE:ALI" className="sm:col-span-2">
          <Input value={f.affected} onChange={(e) => setF({ ...f, affected: e.target.value.toUpperCase() })} className="font-mono" />
        </Field>
        <Field label="Decision window closes">
          <Input type="datetime-local" value={f.closes_at} onChange={(e) => setF({ ...f, closes_at: e.target.value })} />
        </Field>
        <Field label="Price impacts on resolution (%)" hint="One per line: PSE:BDO=2.5" className="sm:col-span-3">
          <Textarea rows={3} value={f.impacts} onChange={(e) => setF({ ...f, impacts: e.target.value })} className="font-mono text-xs" />
        </Field>
        <div className="rounded-md border border-violet/30 bg-violet/5 p-3 sm:col-span-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet">Scoring key (admin-only, revealed after resolution)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-fg-muted">Best actions (60 pts)</div>
              <div className="flex gap-1">
                {ACTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggle('best', a)} className={`rounded border px-2 py-1 text-xs ${f.best.includes(a) ? 'border-up/50 bg-up-muted text-up' : 'border-border text-fg-muted'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs text-fg-muted">Acceptable actions (35 pts)</div>
              <div className="flex gap-1">
                {ACTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggle('acceptable', a)} className={`rounded border px-2 py-1 text-xs ${f.acceptable.includes(a) ? 'border-info/50 bg-info-muted text-info' : 'border-border text-fg-muted'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Key factors (comma-separated; synonyms with |)" className="sm:col-span-2" hint="Reasoning earns up to 25 pts for depth and 15 pts for naming key factors.">
              <Input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} className="font-mono text-xs" />
            </Field>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

function ResolveModal({ ev, onClose }: { ev: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const [summary, setSummary] = useState('');
  const resolve = useMutation({
    mutationFn: () => adminResolveEvent(ev.id, summary),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['securities'] });
      qc.invalidateQueries({ queryKey: ['security'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success(`Resolved — ${n} decisions scored and price impacts applied`);
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Resolve: ${ev.title}`}
      description="Scores every decision, awards Investment Judgment and Decision-Making evidence, and applies the price impacts to the sample market data. This cannot be undone."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => resolve.mutate()} loading={resolve.isPending}>
            Resolve event
          </Button>
        </>
      }
    >
      <Field label="What happened (shown to users)">
        <Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Banks rallied on wider NIM expectations while developers sold off…" />
      </Field>
      <div className="mt-3">
        <InlineError message={resolve.error ? (resolve.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminEventsPage() {
  const list = useQuery({ queryKey: ['admin', 'events'], queryFn: adminListEvents });
  const [editing, setEditing] = useState<Row | null | 'new'>(null);
  const [resolving, setResolving] = useState<Row | null>(null);

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">Manually configured Phase 1 events. (AI-generated events are a later phase.)</span>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      </div>
      {!list.data.length ? (
        <EmptyState title="No events" />
      ) : (
        <ul>
          {list.data.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 border-t border-border/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{e.title}</div>
                <div className="text-xs text-fg-muted">
                  {e.category} · {e.region} · {e.decisions} decisions · {e.status === 'resolved' ? `resolved ${fmtDateTime(e.resolved_at)}` : e.closes_at ? `closes ${fmtDateTime(e.closes_at)}` : 'no close time'}
                </div>
              </div>
              <Badge tone={e.status === 'open' ? 'up' : e.status === 'resolved' ? 'neutral' : 'warn'}>{e.status}</Badge>
              {e.status !== 'resolved' && (
                <>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(e)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setResolving(e)}>
                    <CheckCheck className="h-3.5 w-3.5" /> Resolve
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && <Editor ev={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {resolving && <ResolveModal ev={resolving} onClose={() => setResolving(null)} />}
    </Card>
  );
}

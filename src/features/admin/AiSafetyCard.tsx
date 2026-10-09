import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  REPORT_REASONS, adminAiReports, adminAiUsage, adminGetGuard, adminSetGuard, adminSetReportStatus, runGuardTest, type GuardResult,
} from '@/services/api/ai';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/misc';
import { ErrorState, InlineError } from '@/components/ui/states';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

/** Reports from learners, who keeps hitting the trick filter, and the AI trick detector switch. */
export function AiSafetyCard() {
  const [tab, setTab] = useState<'reports' | 'usage' | 'guard'>('reports');
  return (
    <Card>
      <CardHeader title="AI safety" subtitle="Reported answers, who is testing the limits, and the AI trick detector." icon={<ShieldCheck className="h-3.5 w-3.5" />} />
      <CardContent className="space-y-4 text-sm">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'reports', label: 'Reported answers' },
            { value: 'usage', label: 'Usage and tricks' },
            { value: 'guard', label: 'Trick detector' },
          ]}
        />
        {tab === 'reports' && <Reports />}
        {tab === 'usage' && <Usage />}
        {tab === 'guard' && <Guard />}
      </CardContent>
    </Card>
  );
}

function Reports() {
  const qc = useQueryClient();
  const reports = useQuery({ queryKey: ['admin', 'ai-reports'], queryFn: adminAiReports });
  const mark = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'open' | 'reviewed' }) => adminSetReportStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'ai-reports'] }),
  });
  if (reports.isError) return <ErrorState error={reports.error} onRetry={() => reports.refetch()} />;
  if (!reports.data) return <p className="text-fg-muted">Loading…</p>;
  if (!reports.data.length) return <p className="text-fg-muted">No reports yet. Learners can tap "Report" under any helper answer.</p>;
  const open = reports.data.filter((r) => r.status === 'open').length;
  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">
        {open} open · {reports.data.length - open} reviewed. Only reported answers are stored, with the question before them.
      </p>
      {reports.data.map((r) => (
        <div key={r.id} className={cn('rounded-md border p-3', r.status === 'open' ? 'border-accent/40' : 'border-border opacity-70')}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>
              <b>{reasonLabel(r.reason)}</b> · {r.name || r.handle} · {timeAgo(r.created_at)}
              {r.model && <span className="text-fg-subtle"> · {r.model.replace(':', ' ')}</span>}
            </span>
            <Button size="sm" variant="outline" onClick={() => mark.mutate({ id: r.id, status: r.status === 'open' ? 'reviewed' : 'open' })}>
              {r.status === 'open' ? 'Mark reviewed' : 'Reopen'}
            </Button>
          </div>
          {r.note && <p className="mt-2 text-xs italic text-fg-muted">"{r.note}"</p>}
          {r.question && (
            <p className="mt-2 text-xs">
              <span className="text-fg-subtle">Question: </span>
              {r.question}
            </p>
          )}
          <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-surface-2 p-2 text-xs text-fg-muted">{r.reply}</p>
        </div>
      ))}
    </div>
  );
}

function Usage() {
  const usage = useQuery({ queryKey: ['admin', 'ai-usage'], queryFn: adminAiUsage });
  if (usage.isError) return <ErrorState error={usage.error} onRetry={() => usage.refetch()} />;
  if (!usage.data) return <p className="text-fg-muted">Loading…</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">
        <b className="text-fg">{usage.data.today}</b> messages today. Last 7 days per person below. "Tricks blocked" counts messages the filters stopped; no message
        text is kept.
      </p>
      {!usage.data.users.length ? (
        <p className="text-fg-muted">Nobody has used the helper in the last 7 days.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-fg-subtle">
              <th className="pb-1 font-medium">Person</th>
              <th className="pb-1 text-right font-medium">Messages</th>
              <th className="pb-1 text-right font-medium">Tricks blocked</th>
            </tr>
          </thead>
          <tbody>
            {usage.data.users.map((u) => (
              <tr key={u.handle} className="border-t border-border">
                <td className="py-1.5">{u.name || u.handle}</td>
                <td className="py-1.5 text-right font-mono">{u.messages}</td>
                <td className={cn('py-1.5 text-right font-mono', u.guarded >= 5 ? 'font-semibold text-down' : u.guarded ? 'text-accent' : 'text-fg-subtle')}>{u.guarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Guard() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ['admin', 'ai-guard'], queryFn: adminGetGuard });
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(0.9);
  const [results, setResults] = useState<GuardResult[] | null>(null);
  useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.enabled);
    setThreshold(settings.data.threshold);
  }, [settings.data]);
  const save = useMutation({
    mutationFn: () => adminSetGuard({ enabled, threshold }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ai-guard'] });
      toast.success(enabled ? 'Trick detector is on' : 'Trick detector is off');
    },
  });
  const test = useMutation({ mutationFn: runGuardTest, onSuccess: setResults });

  const scored = results?.filter((r) => r.score !== null) ?? [];
  const caught = scored.filter((r) => r.trick && (r.score ?? 0) >= threshold).length;
  const falseBlocks = scored.filter((r) => !r.trick && (r.score ?? 0) >= threshold).length;
  const tricks = results?.filter((r) => r.trick).length ?? 0;
  const normal = results ? results.length - tricks : 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-muted">
        A second check that uses Groq's Prompt Guard, an AI model trained to spot attempts to change the helper's rules. It catches new wordings that the word
        filter misses. It is free (about 14,000 checks a day) but needs the GROQ_API_KEY secret. Run the test first, then switch it on.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant={enabled ? 'outline' : 'primary'} onClick={() => setEnabled((e) => !e)}>
          {enabled ? 'Turn off' : 'Turn on'}
        </Button>
        <label className="flex items-center gap-2 text-xs">
          Block when at least
          <input type="range" min={0.5} max={0.99} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label="Threshold" />
          <span className="w-10 font-mono">{Math.round(threshold * 100)}%</span>
          sure
        </label>
        <Button size="sm" variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => test.mutate()} loading={test.isPending}>
          Test the detector
        </Button>
      </div>
      <InlineError message={save.error ? (save.error as Error).message : test.error ? (test.error as Error).message : null} />
      {results && (
        <div className="space-y-2">
          <div className={cn('rounded-md border p-2 text-xs', falseBlocks ? 'border-down/40 bg-down-muted' : 'border-up/40 bg-up-muted')}>
            At {Math.round(threshold * 100)}%: caught <b>{caught}</b> of {tricks} tricks, and wrongly blocked <b>{falseBlocks}</b> of {normal} normal questions.
            {scored.length < results.length && ` ${results.length - scored.length} could not be scored.`} Move the slider to see how the numbers change.
          </div>
          <table className="w-full text-xs">
            <tbody>
              {results.map((r) => {
                const blocked = r.score !== null && r.score >= threshold;
                const good = blocked === r.trick;
                return (
                  <tr key={r.text} className="border-t border-border">
                    <td className="py-1 pr-2 text-fg-subtle">{r.trick ? 'Trick' : 'Normal'}</td>
                    <td className="py-1 pr-2">{r.text}</td>
                    <td className="py-1 text-right font-mono">{r.score === null ? r.raw || '—' : `${Math.round(r.score * 100)}%`}</td>
                    <td className={cn('py-1 pl-2 text-right', good ? 'text-up' : 'text-down')}>{blocked ? 'blocked' : 'allowed'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

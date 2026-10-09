import { useState } from 'react';
import { Flag } from 'lucide-react';
import { REPORT_REASONS, reportAnswer, type ReportReason } from '@/services/api/ai';
import { cn } from '@/lib/utils';

/** "Report" link under a helper reply. Sends that reply and the question before it to the FINLAB team. */
export function ReportReply({ question, reply, model }: { question: string; reply: string; model?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  if (state === 'sent') return <div className="mt-1 text-[0.7rem] text-fg-subtle">Thanks. The FINLAB team will review it.</div>;

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-1 inline-flex items-center gap-1 text-[0.7rem] text-fg-subtle hover:text-fg" aria-label="Report this answer">
        <Flag className="h-3 w-3" /> Report
      </button>
    );

  const send = async () => {
    if (!reason) return;
    setState('sending');
    try {
      await reportAnswer({ reason, question, reply, note: note.trim(), model });
      setState('sent');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface p-2.5 text-xs">
      <div className="mb-1.5 font-medium">What's wrong with this answer?</div>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setReason(r.value)}
            aria-pressed={reason === r.value}
            className={cn('rounded-full border px-2 py-0.5', reason === r.value ? 'border-accent bg-accent-muted text-fg' : 'border-border text-fg-muted hover:border-border-strong')}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        placeholder="Add a note (optional)"
        aria-label="Report note"
        className="mt-2 w-full rounded-md border border-border-strong bg-surface-2 px-2 py-1.5 outline-none focus:border-accent"
      />
      <p className="mt-1.5 text-[0.65rem] text-fg-subtle">This sends this answer and your question to the FINLAB team. Nothing else from the chat is sent.</p>
      {state === 'error' && <p className="mt-1 text-down">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-fg-muted hover:text-fg">
          Cancel
        </button>
        <button onClick={send} disabled={!reason || state === 'sending'} className="rounded-md bg-accent px-2.5 py-1 font-medium text-black disabled:opacity-40">
          {state === 'sending' ? 'Sending…' : 'Send report'}
        </button>
      </div>
    </div>
  );
}

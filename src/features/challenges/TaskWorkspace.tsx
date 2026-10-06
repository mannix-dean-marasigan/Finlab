import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Loader2, Save } from 'lucide-react';
import type { ChallengeTask } from '@/types/domain';
import { Input, Textarea } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { cn, wordCount } from '@/lib/utils';
import { saveChallengeDraft } from '@/services/api/challenges';
import { timeAgo } from '@/lib/format';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Debounced autosave of challenge responses to the attempt draft. */
export function useAutosave(attemptId: string, initial: Record<string, string>, initialSavedAt: string | null) {
  const [responses, setResponses] = useState<Record<string, string>>(initial);
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(responses);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setState('saving');
    try {
      const at = await saveChallengeDraft(attemptId, latest.current);
      setSavedAt(at);
      setState('saved');
    } catch {
      dirty.current = true;
      setState('error');
    }
  }, [attemptId]);

  const update = useCallback(
    (id: string, value: string) => {
      setResponses((prev) => {
        const next = { ...prev, [id]: value };
        latest.current = next;
        return next;
      });
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1200);
    },
    [flush],
  );

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void saveChallengeDraft(attemptId, latest.current).catch(() => undefined);
    };
  }, [attemptId]);

  return { responses, update, state, savedAt, flush };
}

export function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted" aria-live="polite">
      {state === 'saving' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </>
      ) : state === 'error' ? (
        <span className="inline-flex items-center gap-1.5 text-down">
          <CloudOff className="h-3.5 w-3.5" /> Not saved — retrying on next edit
        </span>
      ) : savedAt ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-up" /> Draft saved {timeAgo(savedAt)}
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" /> Drafts save automatically
        </>
      )}
    </span>
  );
}

export function isTaskAnswered(value: string | undefined) {
  return !!value && value.trim() !== '';
}

export function TaskInput({ task, index, value, onChange, disabled }: { task: ChallengeTask; index: number; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const words = wordCount(value);
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-3 font-mono text-xs text-fg-muted">{index + 1}</span>
          <div>
            {task.label && <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">{task.label}</div>}
            <p className="mt-0.5 text-sm text-fg">{task.prompt}</p>
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-fg-subtle">{task.points ?? 10} pts</span>
      </div>
      <div className="mt-4 sm:pl-9">
        {task.type === 'mcq' && (
          <div className="grid gap-2">
            {task.options?.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                  value === o.id ? 'border-accent/60 bg-accent-muted' : 'border-border hover:border-border-strong',
                  disabled && 'pointer-events-none opacity-70',
                )}
              >
                <input type="radio" name={task.id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="accent-[#f5a524]" disabled={disabled} />
                {o.label}
              </label>
            ))}
          </div>
        )}
        {task.type === 'numeric' && (
          <div className="flex max-w-xs items-center gap-2">
            <Input
              inputMode="decimal"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="0.00"
              className="font-mono tabular"
              disabled={disabled}
              aria-label={task.label ?? task.prompt}
            />
            {task.unit && <span className="text-sm text-fg-muted">{task.unit}</span>}
          </div>
        )}
        {(task.type === 'text' || task.type === 'long_text') && (
          <>
            <Textarea
              autoGrow
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={task.type === 'long_text' ? 6 : 3}
              placeholder="Write your answer…"
              disabled={disabled}
              aria-label={task.label ?? task.prompt}
            />
            <div className={cn('mt-1 text-right text-xs', task.min_words && words < task.min_words ? 'text-fg-subtle' : 'text-up')}>
              {words} words{task.min_words ? ` · target ${task.min_words}+` : ''}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

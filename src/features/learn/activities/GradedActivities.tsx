import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Flag, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import type { LessonActivity } from '@/types/domain';
import { submitActivity, workedCheck, workedHint, workedState } from '@/services/api/misc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { cn } from '@/lib/utils';

type OnScored = (score: number) => void;

function ScoreBanner({ score, children, onRetry }: { score: number; children?: React.ReactNode; onRetry?: () => void }) {
  const good = score >= 80;
  return (
    <div className={cn('rounded-lg border p-3', good ? 'border-up/40 bg-up-muted' : score >= 50 ? 'border-accent/40 bg-accent-muted' : 'border-down/40 bg-down-muted')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('font-semibold', good ? 'text-up' : score >= 50 ? 'text-accent' : 'text-down')}>Score: {Math.round(score)}/100</span>
        {onRetry && (
          <Button size="xs" variant="ghost" onClick={onRetry}>
            <RotateCcw className="h-3 w-3" /> Try again
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- Spot the error
export function SpotErrorActivity({ activity, onScored }: { activity: LessonActivity; onScored: OnScored }) {
  const c = activity.content;
  const [selected, setSelected] = useState<string[]>([]);
  const submit = useMutation({
    mutationFn: () => submitActivity(activity.id, { selected }),
    onSuccess: (r) => onScored(r.score),
  });
  const result = submit.data as (Record<string, unknown> & { score: number; errors?: string[]; explanations?: Record<string, string>; found?: number; total_errors?: number; false_flags?: number }) | undefined;
  const errors = new Set(result?.errors ?? []);
  const toggle = (id: string) => !result && setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-3">
      {c.context && <p className="text-sm text-fg-muted">{c.context}</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="w-10 border-b border-border bg-surface-2 px-3 py-2" />
              {c.columns?.map((col) => (
                <th key={col} className="border-b border-border bg-surface-2 px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows?.map((r) => {
              const sel = selected.includes(r.id);
              const isErr = errors.has(r.id);
              return (
                <tr
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className={cn(
                    'border-b border-border/60 transition-colors',
                    !result && 'cursor-pointer hover:bg-surface-2',
                    !result && sel && 'bg-accent/10',
                    result && isErr && 'bg-down/10',
                    result && sel && !isErr && 'bg-amber-500/10',
                  )}
                >
                  <td className="px-3 py-2 text-center">
                    {result ? (
                      isErr ? (
                        sel ? <CheckCircle2 className="h-4 w-4 text-up" /> : <Flag className="h-4 w-4 text-down" />
                      ) : sel ? (
                        <XCircle className="h-4 w-4 text-amber-400" />
                      ) : null
                    ) : (
                      <input type="checkbox" checked={sel} readOnly className="accent-[#f5a524]" aria-label={`Flag row ${r.cells[0]}`} />
                    )}
                  </td>
                  {r.cells.map((cell, i) => (
                    <td key={i} className={cn('px-3 py-2', i > 0 && 'text-right font-mono tabular')}>
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {result ? (
        <ScoreBanner
          score={result.score}
          onRetry={() => {
            submit.reset();
            setSelected([]);
          }}
        >
          <p className="mt-1 text-sm text-fg-muted">
            Found {result.found} of {result.total_errors} errors{result.false_flags ? `, ${result.false_flags} false flag(s)` : ''}.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(result.explanations ?? {}).map(([row, text]) => (
              <li key={row} className="flex gap-2">
                <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-down" />
                <span>
                  <strong>{c.rows?.find((x) => x.id === row)?.cells[0]}:</strong> {text}
                </span>
              </li>
            ))}
          </ul>
        </ScoreBanner>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg-subtle">
            {selected.length} selected{c.select_count ? ` · find ${c.select_count}` : ''}. False flags cost points.
          </span>
          <Button size="sm" variant="primary" onClick={() => submit.mutate()} loading={submit.isPending} disabled={!selected.length}>
            Check
          </Button>
        </div>
      )}
      <InlineError message={submit.error ? (submit.error as Error).message : null} />
    </div>
  );
}

// ---------------------------------------------------------------- Matching (drag & drop, tap fallback)
export function MatchingActivity({ activity, onScored }: { activity: LessonActivity; onScored: OnScored }) {
  const c = activity.content;
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const submit = useMutation({
    mutationFn: () => submitActivity(activity.id, { placements }),
    onSuccess: (r) => onScored(r.score),
  });
  const result = submit.data as (Record<string, unknown> & { score: number; correct?: number; total?: number; results?: Record<string, boolean> }) | undefined;
  const items = c.items ?? [];
  const unplaced = items.filter((i) => !placements[i.id]);

  const place = (itemId: string, cat: string | null) => {
    if (result) return;
    setPlacements((p) => {
      const next = { ...p };
      if (cat) next[itemId] = cat;
      else delete next[itemId];
      return next;
    });
    setPicked(null);
  };
  const onDrop = (e: DragEvent, cat: string | null) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) place(id, cat);
  };
  const Chip = ({ id, label }: { id: string; label: string }) => {
    const verdict = result?.results?.[id];
    return (
      <button
        type="button"
        draggable={!result}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', id)}
        onClick={() => !result && setPicked(picked === id ? null : id)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors',
          result ? (verdict ? 'border-up/50 bg-up-muted' : 'border-down/50 bg-down-muted') : picked === id ? 'border-accent bg-accent-muted' : 'border-border-strong bg-surface-2 hover:border-accent/50',
          !result && 'cursor-grab active:cursor-grabbing',
        )}
      >
        {result && (verdict ? <CheckCircle2 className="h-3.5 w-3.5 text-up" /> : <XCircle className="h-3.5 w-3.5 text-down" />)}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, null)}
        className="min-h-[52px] rounded-lg border border-dashed border-border-strong p-2"
        aria-label="Unsorted items"
      >
        {unplaced.length ? (
          <div className="flex flex-wrap gap-2">
            {unplaced.map((i) => (
              <Chip key={i.id} id={i.id} label={i.label} />
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-fg-subtle">All items placed{result ? '' : ' — drag one back here to undo'}.</p>
        )}
      </div>
      <div className={cn('grid gap-3', (c.categories?.length ?? 0) > 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3')}>
        {c.categories?.map((cat) => (
          <div
            key={cat.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, cat.id)}
            onClick={() => picked && place(picked, cat.id)}
            className={cn('min-h-[110px] rounded-lg border bg-surface-2 p-2', picked ? 'cursor-pointer border-accent/50' : 'border-border')}
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">{cat.label}</div>
            <div className="flex flex-wrap gap-2">
              {items
                .filter((i) => placements[i.id] === cat.id)
                .map((i) => (
                  <Chip key={i.id} id={i.id} label={i.label} />
                ))}
            </div>
          </div>
        ))}
      </div>
      {result ? (
        <ScoreBanner
          score={result.score}
          onRetry={() => {
            submit.reset();
            setPlacements({});
          }}
        >
          <p className="mt-1 text-sm text-fg-muted">
            {result.correct} of {result.total} placed correctly. Items marked ✗ are in the wrong place. Think about why before you try again.
          </p>
        </ScoreBanner>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg-subtle">Drag items, or tap an item then tap a category.</span>
          <Button size="sm" variant="primary" onClick={() => submit.mutate()} loading={submit.isPending} disabled={unplaced.length > 0}>
            Check
          </Button>
        </div>
      )}
      <InlineError message={submit.error ? (submit.error as Error).message : null} />
    </div>
  );
}

// ---------------------------------------------------------------- Branching case
export function BranchingActivity({ activity, onScored }: { activity: LessonActivity; onScored: OnScored }) {
  const c = activity.content;
  const [path, setPath] = useState<{ node: string; choice: string }[]>([]);
  const current = useMemo(() => {
    let node = c.start ?? '';
    for (const step of path) {
      const ch = c.nodes?.[step.node]?.choices?.find((x) => x.id === step.choice);
      node = ch?.next ?? node;
    }
    return node;
  }, [path, c]);
  const nodeData = c.nodes?.[current];
  const submit = useMutation({
    mutationFn: () => submitActivity(activity.id, { path }),
    onSuccess: (r) => onScored(r.score),
  });
  const result = submit.data as (Record<string, unknown> & { score: number; debrief?: { node: string; choice: string; points: number; feedback?: string }[] }) | undefined;

  useEffect(() => {
    if (nodeData?.end && !submit.data && !submit.isPending && !submit.isError) submit.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeData?.end]);

  return (
    <div className="space-y-3">
      {path.map((step, i) => {
        const node = c.nodes?.[step.node];
        const ch = node?.choices?.find((x) => x.id === step.choice);
        const fb = result?.debrief?.[i];
        return (
          <div key={i} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
            <p className="text-fg-muted">{node?.text}</p>
            <p className="mt-2 flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="font-medium">{ch?.label}</span>
            </p>
            {fb && (
              <p className={cn('mt-1.5 text-xs', fb.points > 0 ? 'text-up' : 'text-down')}>
                +{fb.points} pts · {fb.feedback}
              </p>
            )}
          </div>
        );
      })}
      {nodeData && (
        <div className={cn('rounded-lg border p-4', nodeData.end ? 'border-accent/40 bg-accent/[0.05]' : 'border-border-strong')}>
          <p className="text-sm">{nodeData.text}</p>
          {!nodeData.end && (
            <div className="mt-3 grid gap-2">
              {nodeData.choices?.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setPath((p) => [...p, { node: current, choice: ch.id }])}
                  className="rounded-md border border-border-strong bg-surface px-3 py-2.5 text-left text-sm transition-colors hover:border-accent/60 hover:bg-accent/[0.05]"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {result && (
        <ScoreBanner
          score={result.score}
          onRetry={() => {
            submit.reset();
            setPath([]);
          }}
        >
          <p className="mt-1 text-sm text-fg-muted">Read the feedback on each decision above, then try a different path.</p>
        </ScoreBanner>
      )}
      {submit.isError && (
        <div className="space-y-2">
          <InlineError message={(submit.error as Error).message} />
          <Button size="xs" variant="outline" onClick={() => submit.mutate()}>
            Retry submission
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Worked example
export function WorkedExampleActivity({ activity, onScored }: { activity: LessonActivity; onScored: OnScored }) {
  const c = activity.content;
  const steps = c.steps ?? [];
  const initial = useQuery({ queryKey: ['worked', activity.id], queryFn: () => workedState(activity.id) });
  const [solved, setSolved] = useState<string[]>([]);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [hints, setHints] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [final, setFinal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial.data) return;
    setSolved(initial.data.state.solved ?? []);
    setExplanations(initial.data.explanations ?? {});
    setHints(initial.data.hints ?? {});
  }, [initial.data]);

  const check = useMutation({
    mutationFn: ({ step }: { step: string }) => workedCheck(activity.id, step, answers[step] ?? ''),
    onSuccess: (r, { step }) => {
      setError(null);
      if (r.correct) {
        setSolved((s) => [...s, step]);
        setWrong((w) => ({ ...w, [step]: false }));
        if (r.explanation) setExplanations((e) => ({ ...e, [step]: r.explanation! }));
        if (r.completed && r.score !== undefined) {
          setFinal(r.score);
          onScored(r.score);
        }
      } else setWrong((w) => ({ ...w, [step]: true }));
    },
    onError: (e) => setError((e as Error).message),
  });
  const hint = useMutation({
    mutationFn: (step: string) => workedHint(activity.id, step),
    onSuccess: (h, step) => setHints((x) => ({ ...x, [step]: h ?? 'No hint available.' })),
    onError: (e) => setError((e as Error).message),
  });

  const restart = () => {
    setFinal(null);
    setSolved([]);
    setExplanations({});
    setHints({});
    setAnswers({});
    setWrong({});
  };

  return (
    <div className="space-y-3">
      {c.intro && <p className="rounded-md border border-border bg-surface-2 p-3 text-sm">{c.intro}</p>}
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const done = final !== null || solved.includes(s.id);
          const unlocked = i === 0 || solved.includes(steps[i - 1].id) || final !== null;
          return (
            <li key={s.id} className={cn('rounded-lg border p-3', done ? 'border-up/40 bg-up-muted/40' : unlocked ? 'border-accent/40' : 'border-border opacity-50')}>
              <div className="flex items-start gap-2 text-sm">
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[0.7rem]', done ? 'bg-up text-black' : 'bg-surface-3 text-fg-muted')}>
                  {done ? '✓' : i + 1}
                </span>
                <span>{s.prompt}</span>
              </div>
              {unlocked && !done && (
                <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
                  <Input
                    inputMode="decimal"
                    value={answers[s.id] ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [s.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && answers[s.id] && check.mutate({ step: s.id })}
                    className={cn('w-36 font-mono', wrong[s.id] && 'border-down/60')}
                    placeholder="0.00"
                    aria-label={s.prompt}
                  />
                  {s.unit && <span className="text-xs text-fg-muted">{s.unit}</span>}
                  <Button size="sm" variant="primary" onClick={() => check.mutate({ step: s.id })} loading={check.isPending && check.variables?.step === s.id} disabled={!answers[s.id]}>
                    Check
                  </Button>
                  {!hints[s.id] && (
                    <Button size="sm" variant="ghost" onClick={() => hint.mutate(s.id)} loading={hint.isPending && hint.variables === s.id}>
                      <Lightbulb className="h-3.5 w-3.5" /> Hint (−10)
                    </Button>
                  )}
                  {wrong[s.id] && <span className="text-xs text-down">Not quite (−3). Try again.</span>}
                </div>
              )}
              {hints[s.id] && !done && <p className="mt-2 pl-7 text-xs text-accent">Hint: {hints[s.id]}</p>}
              {done && explanations[s.id] && <p className="mt-1 pl-7 text-xs text-fg-muted">{explanations[s.id]}</p>}
            </li>
          );
        })}
      </ol>
      {final !== null && (
        <ScoreBanner score={final} onRetry={restart}>
          <p className="mt-1 text-sm text-fg-muted">Hints cost 10 points and wrong tries 3 each (minimum 40).</p>
        </ScoreBanner>
      )}
      <InlineError message={error} />
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, Lock } from 'lucide-react';
import { getModelAnswer } from '@/services/api/challenges';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtNumber } from '@/lib/format';

/** "Compare with an analyst's answer": shown after a case, next to what the student wrote. */
export function AnalystAnswer({ challengeId, responses }: { challengeId: string; responses: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const answer = useQuery({ queryKey: ['modelAnswer', challengeId], queryFn: () => getModelAnswer(challengeId), enabled: open, retry: false });

  if (!open) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-medium">
              <BookOpenCheck className="h-4 w-4 text-accent" /> Compare with an analyst's answer
            </div>
            <p className="text-sm text-fg-muted">See the expected numbers and the key ideas a strong answer covers, next to yours.</p>
          </div>
          <Button variant="outline" onClick={() => setOpen(true)}>
            Show the answer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (answer.isPending) return <Card className="p-4 text-sm text-fg-muted">Loading the analyst's answer…</Card>;
  if (answer.isError) {
    return (
      <Card className="flex items-start gap-3 p-4 text-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
        <span className="text-fg-muted">{(answer.error as Error).message}</span>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="The analyst's answer" subtitle="Compare it with yours. Written answers are scored on these key ideas, so there is more than one good wording." icon={<BookOpenCheck className="h-3.5 w-3.5" />} />
      <CardContent className="space-y-3">
        {answer.data.tasks.map((t) => {
          const raw = (responses[t.id] ?? '').trim();
          // Multiple choice is saved as the option letter; show its text instead.
          const mine = t.type === 'mcq' ? (t.options?.find((o) => o.id === raw)?.label ?? raw) : raw;
          return (
            <div key={t.id} className="rounded-md border border-border p-3 text-sm">
              <div className="font-medium">{t.label}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Analyst</div>
                  {t.type === 'numeric' && t.answer !== null ? (
                    <div className="font-mono">
                      {fmtNumber(Number(t.answer), 2)} <span className="text-xs text-fg-subtle">(within ±{t.tolerance_pct ?? 1}% counts)</span>
                    </div>
                  ) : t.type === 'mcq' && t.answer ? (
                    <div>{String(t.answer)}</div>
                  ) : t.key_ideas?.length ? (
                    <div>
                      <div className="text-xs text-fg-muted">A strong answer covers {t.ideas_needed ?? t.key_ideas.length} of these ideas:</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {t.key_ideas.map((k) => (
                          <span key={k} className="rounded-full border border-accent/40 bg-accent-muted px-2 py-0.5 text-xs">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-fg-muted">A clear, complete explanation.</div>
                  )}
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">You</div>
                  <div className="line-clamp-4 whitespace-pre-wrap text-fg-muted">{mine || '(no answer)'}</div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

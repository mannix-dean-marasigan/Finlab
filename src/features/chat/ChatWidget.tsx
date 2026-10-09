import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles, X } from 'lucide-react';
import { askHelper, getAiStatus, type HelperMessage } from '@/services/api/ai';
import { Markdown } from '@/components/common';
import { cn } from '@/lib/utils';
import { tidyMath } from './tidyMath';

interface Bubble extends HelperMessage {
  error?: boolean;
}

const LESSON_PROMPTS = ['Explain this lesson simply', 'Give me a peso example', 'What should I remember most?'];
const GENERAL_PROMPTS = ['How do I earn a certificate?', 'How does the weekly challenge work?', 'Where should I start?'];

/** Floating study helper. Only appears when an admin has switched the AI helper on. */
export function ChatWidget() {
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const status = useQuery({ queryKey: ['ai-status'], queryFn: getAiStatus, staleTime: 60_000, retry: false });
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const lessonSlug = /^\/learn\/([a-z0-9-]+)/.exec(pathname)?.[1];

  // Block body on purpose: an effect must return nothing or a cleanup function (scrollIntoView can return a Promise).
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [bubbles, busy, open]);

  if (!status.data?.enabled) return null;
  const left = remaining ?? status.data.remaining;

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next: Bubble[] = [...bubbles, { role: 'user', text: t }];
    setBubbles(next);
    setInput('');
    setBusy(true);
    try {
      const res = await askHelper(next.filter((b) => !b.error).map(({ role, text: x }) => ({ role, text: x })), lessonSlug);
      setBubbles([...next, { role: 'assistant', text: tidyMath(res.reply) }]);
      if (res.remaining !== null) setRemaining(res.remaining);
      qc.invalidateQueries({ queryKey: ['ai-status'] });
    } catch (e) {
      setBubbles([...next, { role: 'assistant', text: (e as Error).message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const prompts = lessonSlug ? LESSON_PROMPTS : GENERAL_PROMPTS;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-16 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-accent/50 bg-surface-2/95 px-3.5 py-2 text-xs font-medium text-fg shadow-lg backdrop-blur hover:border-accent lg:left-64"
          aria-label="Open the AI study helper"
        >
          <Sparkles className="h-4 w-4 text-accent" /> {lessonSlug ? 'Ask about this lesson' : 'Ask the study helper'}
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="AI study helper"
          className="no-print fixed inset-x-2 bottom-2 top-16 z-50 flex animate-fade-in flex-col overflow-hidden rounded-xl border border-border-strong bg-surface shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:h-[540px] sm:w-[400px]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> Study helper
              </div>
              <div className="text-[0.7rem] text-fg-subtle">{lessonSlug ? 'Reading a lesson? Ask about it.' : 'Ask about finance or FINLAB PH.'}</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-fg-subtle hover:text-fg" aria-label="Close the study helper">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {!bubbles.length && (
              <div className="space-y-3">
                <p className="text-sm text-fg-muted">
                  Hi! I can explain concepts, give examples and help you find your way around. I won't give answers to graded questions, but I'll help you work them out.
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((p) => (
                    <button key={p} onClick={() => send(p)} className="rounded-full border border-border-strong px-3 py-1 text-xs text-fg-muted hover:border-accent/50 hover:text-fg">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {bubbles.map((b, i) => (
              <div key={i} className={cn('flex', b.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2 text-sm',
                    b.role === 'user' ? 'rounded-br-md bg-accent text-black' : b.error ? 'rounded-bl-md border border-down/40 bg-down-muted text-down' : 'rounded-bl-md bg-surface-2',
                  )}
                >
                  {b.role === 'user' || b.error ? <span className="whitespace-pre-wrap">{b.text}</span> : <Markdown className="[&_p]:my-1.5 [&_ul]:my-1.5">{b.text}</Markdown>}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5">
                  <span className="inline-flex gap-1" aria-label="Thinking">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-subtle" style={{ animationDelay: `${d * 150}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="border-t border-border p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 1000))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask a question…"
                aria-label="Your question"
                className="max-h-28 min-h-9 flex-1 resize-none rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={busy || !input.trim() || left <= 0}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-black disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-[0.65rem] leading-relaxed text-fg-subtle">
              {left > 0 ? `${left} message${left === 1 ? '' : 's'} left today. ` : 'You are out of messages for today. '}
              AI can be wrong, and this is not investment advice. Don't share personal details. Messages are sent to Google's Gemini, which may use them to improve its products.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

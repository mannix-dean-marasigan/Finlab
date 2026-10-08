import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, ExternalLink, Hourglass, Lock, MonitorPlay, RotateCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitCapstone } from '@/services/api/engage';
import type { ProgramModuleStatus } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Textarea } from '@/components/ui/form';
import { Progress } from '@/components/ui/misc';
import { InlineError } from '@/components/ui/states';
import { fmtDateTime, fmtMinutes } from '@/lib/format';
import { wordCount } from '@/lib/utils';

const HOSTS = 'YouTube (unlisted is fine), Google Drive, Loom, Vimeo, Canva or OneDrive';

export function CapstonePanel({ m, enrolled, slug }: { m: ProgramModuleStatus; enrolled: boolean; slug: string }) {
  const qc = useQueryClient();
  const cfg = m.config;
  const cap = m.capstone;
  const [video, setVideo] = useState(cap?.video_url ?? '');
  const [slides, setSlides] = useState(cap?.slides_url ?? '');
  const [summary, setSummary] = useState(cap?.summary ?? '');
  const [editing, setEditing] = useState(false);
  const words = wordCount(summary);
  const required = m.required_score ?? 70;
  const passed = m.complete;
  const failed = cap?.status === 'scored' && !passed;

  const submit = useMutation({
    mutationFn: () => {
      if (words < 150) throw new Error('Write at least 150 words of executive summary.');
      return submitCapstone(m.id, video, slides, summary);
    },
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['program', slug] });
      qc.invalidateQueries({ queryKey: ['today-plan'] });
      qc.invalidateQueries({ queryKey: ['my-activity'] });
      toast.success('Capstone submitted · +50 XP. A reviewer will score it against the rubric.');
    },
  });

  if (!cfg) return null;
  const locked = !enrolled || m.locked;
  const showForm = !locked && !passed && (!cap || cap.status === 'returned' || failed || editing) && cap?.status !== 'submitted';

  return (
    <Card id="capstone" className="scroll-mt-24 border-violet/30">
      <CardHeader
        title={cfg.title}
        subtitle={`Final module · recorded presentation · scored by a reviewer · ${required}+ to pass`}
        icon={<MonitorPlay className="h-3.5 w-3.5 text-violet" />}
        action={
          passed ? (
            <Badge tone="up">Passed</Badge>
          ) : cap?.status === 'submitted' ? (
            <Badge tone="info">Awaiting review</Badge>
          ) : cap?.status === 'returned' ? (
            <Badge tone="warn">Revise &amp; resubmit</Badge>
          ) : failed ? (
            <Badge tone="down">Below pass mark</Badge>
          ) : locked ? (
            <Badge>
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          ) : (
            <Badge tone="violet">Open</Badge>
          )
        }
      />
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-fg/90">{cfg.brief}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Deliverables</div>
            <ul className="list-disc space-y-1 pl-4 text-sm text-fg-muted">
              {cfg.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-fg-subtle">
              <Clock className="h-3 w-3" /> Plan for ~{fmtMinutes(cfg.minutes)} of preparation
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Rubric</div>
            <ul className="space-y-1.5 text-sm">
              {cfg.rubric.map((r) => {
                const got = cap?.criteria?.find((c) => c.key === r.key);
                return (
                  <li key={r.key}>
                    <div className="flex justify-between gap-2">
                      <span className="text-fg-muted">{r.label}</span>
                      <span className="font-mono text-xs">{got ? `${got.score}/${r.max}` : `${r.max} pts`}</span>
                    </div>
                    {got && <Progress value={(got.score / r.max) * 100} className="mt-1" tone={got.score / r.max >= 0.7 ? 'up' : 'accent'} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {locked && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm text-fg-muted">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            {!enrolled ? 'Enroll to unlock the capstone.' : 'Unlocks after you pass every earlier module, including the final exam. You can start preparing now.'}
          </div>
        )}

        {cap && (
          <div className="rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
              <span>Submitted {fmtDateTime(cap.submitted_at)}</span>
              <a href={cap.video_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                Presentation <ExternalLink className="h-3 w-3" />
              </a>
              {cap.slides_url && (
                <a href={cap.slides_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                  Slides <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {cap.score !== null && (
                <span className={passed ? 'font-semibold text-up' : 'font-semibold text-down'}>
                  Score {Number(cap.score).toFixed(0)}/100
                </span>
              )}
            </div>
            {cap.status === 'submitted' && (
              <p className="mt-2 flex items-center gap-2 text-fg-muted">
                <Hourglass className="h-4 w-4 text-info" /> In the review queue. You'll get a notification when it's scored.
              </p>
            )}
            {cap.feedback && (
              <div className="mt-2">
                <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Reviewer feedback</div>
                <p className="mt-0.5 whitespace-pre-line">{cap.feedback}</p>
              </div>
            )}
            {passed && (
              <p className="mt-2 flex items-center gap-2 text-up">
                <CheckCircle2 className="h-4 w-4" /> Capstone passed.
              </p>
            )}
            {(cap.status === 'returned' || failed) && !editing && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(true)}>
                <RotateCcw className="h-3.5 w-3.5" /> Revise and resubmit
              </Button>
            )}
          </div>
        )}

        {showForm && (!cap || editing) && (
          <div className="space-y-3 rounded-md border border-violet/30 bg-violet/[0.03] p-4">
            <Field label="Presentation link" required hint={HOSTS}>
              <Input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/…" inputMode="url" />
            </Field>
            <Field label="Slides link (optional)" hint="Google Slides, Canva, OneDrive…">
              <Input value={slides} onChange={(e) => setSlides(e.target.value)} placeholder="https://docs.google.com/presentation/…" inputMode="url" />
            </Field>
            <Field label="Executive summary" required hint={`${words}/150 words minimum: your call, the key numbers and the biggest risk.`}>
              <Textarea autoGrow rows={7} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </Field>
            <p className="text-xs text-fg-subtle">Make sure the link is viewable by anyone with it. Submissions are reviewed by a FINLAB admin against the rubric above.</p>
            <InlineError message={submit.error ? (submit.error as Error).message : null} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => submit.mutate()} loading={submit.isPending} disabled={!video.trim() || words < 150}>
                <Send className="h-4 w-4" /> Submit capstone
              </Button>
              {editing && (
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

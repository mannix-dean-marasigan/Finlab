import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, CheckCircle2, Circle, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { claimBetaCertificate, getBetaChecklist } from '@/services/api/engage';
import { CelebrationDialog } from '@/features/certifications/Celebration';
import { OPEN_FEEDBACK_EVENT } from '@/features/feedback/FeedbackButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const TITLE = 'FINLAB PH Founding Beta Tester';

/** Five real tasks → claim the Founding Beta Tester certificate. Hidden when the beta is closed. */
export function BetaChecklistCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['beta-checklist', user!.id], queryFn: getBetaChecklist });
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const claim = useMutation({
    mutationFn: claimBetaCertificate,
    onSuccess: (code) => {
      qc.invalidateQueries({ queryKey: ['beta-checklist'] });
      qc.invalidateQueries({ queryKey: ['myCertificates'] });
      invalidateProgress(qc);
      setCelebrate(code);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!q.data || q.isError) return null;
  const b = q.data;
  if (!b.open && !b.certificate_code) return null;

  if (b.certificate_code) {
    return (
      <Card className="flex items-center gap-3 border-up/30 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-up/40 bg-up-muted text-up">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{TITLE}</div>
          <div className="text-xs text-fg-muted">Thank you for testing FINLAB PH.</div>
        </div>
        <Link to={`/verify/${b.certificate_code}?share=1`} className="text-xs text-accent hover:underline">
          View &amp; share
        </Link>
        {celebrate && <CelebrationDialog code={celebrate} title={TITLE} onClose={() => setCelebrate(null)} />}
      </Card>
    );
  }

  const allDone = b.done >= b.total;
  return (
    <Card className="border-violet/40 bg-gradient-to-b from-violet/[0.07] to-surface">
      <CardHeader
        title="Beta tester checklist"
        subtitle={`Do all ${b.total} and claim your Founding Beta Tester certificate`}
        icon={<FlaskConical className="h-3.5 w-3.5 text-violet" />}
        action={<span className="font-mono text-xs text-fg-muted">{b.done}/{b.total}</span>}
      />
      <CardContent className="space-y-3">
        <Progress value={(b.done / Math.max(b.total, 1)) * 100} tone={allDone ? 'up' : 'accent'} />
        <ul className="space-y-1">
          {b.items.map((it) => {
            const row = (
              <>
                {it.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-up" /> : <Circle className="h-4 w-4 shrink-0 text-fg-subtle" />}
                <span className={cn('flex-1 text-sm', it.done && 'text-fg-muted line-through decoration-fg-subtle')}>{it.label}</span>
                {!it.done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />}
              </>
            );
            const cls = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2';
            if (it.done) return <li key={it.key} className="flex items-center gap-2 px-2 py-1.5">{row}</li>;
            if (it.key === 'feedback') {
              return (
                <li key={it.key}>
                  <button type="button" className={cls} onClick={() => window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT))}>
                    {row}
                  </button>
                </li>
              );
            }
            if (it.link.startsWith('/dashboard#')) {
              return (
                <li key={it.key}>
                  <button type="button" className={cls} onClick={() => document.getElementById(it.link.split('#')[1])?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                    {row}
                  </button>
                </li>
              );
            }
            return (
              <li key={it.key}>
                <Link to={it.link} className={cls}>
                  {row}
                </Link>
              </li>
            );
          })}
        </ul>
        {allDone ? (
          <Button variant="primary" className="w-full justify-center" onClick={() => claim.mutate()} loading={claim.isPending}>
            <BadgeCheck className="h-4 w-4" /> Claim your certificate
          </Button>
        ) : (
          <p className="text-xs text-fg-subtle">Each item ticks itself when you do it. Feedback counts when it's at least a sentence.</p>
        )}
      </CardContent>
    </Card>
  );
}

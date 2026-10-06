import { Bot, Hourglass, ShieldCheck, Trophy, User } from 'lucide-react';
import type { SubmissionWithScore } from '@/services/api/challenges';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/common';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { fmtDateTime } from '@/lib/format';

const SCORER = {
  auto: { label: 'Automated rubric (beta)', icon: Bot },
  admin: { label: 'Reviewer', icon: User },
  ai: { label: 'AI judge', icon: Bot },
} as const;

export function SubmissionResult({ submission, passingScore }: { submission: SubmissionWithScore; passingScore: number }) {
  const final = submission.scores.find((s) => s.is_final);
  const provisional = submission.scores[0];

  if (submission.status === 'pending_review') {
    return (
      <Card className="border-info/30">
        <CardHeader title="Awaiting review" icon={<Hourglass className="h-3.5 w-3.5 text-info" />} subtitle={`Submitted ${fmtDateTime(submission.submitted_at)}`} />
        <CardContent className="text-sm text-fg-muted">
          This challenge is scored by a reviewer. Your skills and FINLAB Score update as soon as it is scored — you'll get a notification.
        </CardContent>
      </Card>
    );
  }

  const score = Number(submission.final_score ?? final?.total_score ?? provisional?.total_score ?? 0);
  const passed = score >= passingScore;
  const scorer = SCORER[final?.scorer_type ?? 'auto'];
  return (
    <Card className={passed ? 'border-up/30' : 'border-down/30'}>
      <CardHeader
        title="Result"
        icon={passed ? <Trophy className="h-3.5 w-3.5 text-up" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        subtitle={`Scored ${fmtDateTime(submission.scored_at ?? submission.submitted_at)}`}
        action={<Badge tone={passed ? 'up' : 'down'}>{passed ? 'Passed' : 'Not passed'}</Badge>}
      />
      <CardContent>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <ScoreRing value={score} size={112} sub="/ 100" />
          <div className="w-full flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <scorer.icon className="h-3.5 w-3.5" /> {scorer.label} · pass mark {passingScore}
              {submission.attempt_number && submission.attempt_number > 1 && (
                <span className="rounded border border-border-strong px-1.5 py-0.5">
                  Attempt #{submission.attempt_number} · counts {Math.round(Math.max(0.7, 1 - 0.1 * (submission.attempt_number - 1)) * 100)}% toward skills
                </span>
              )}
            </div>
            {final?.criteria_scores?.length ? <ScoreBreakdown criteria={final.criteria_scores} /> : null}
            {final?.feedback && <p className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm text-fg-muted">{final.feedback}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

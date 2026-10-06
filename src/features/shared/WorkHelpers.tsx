import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { getAttemptForWork, getChallenge } from '@/services/api/challenges';
import { marketData, type Security } from '@/services/marketData';
import { Countdown } from '@/components/common';
import { Select } from '@/components/ui/form';

/** Banner shown when a pitch/report belongs to a challenge attempt. */
export function ChallengeContextBanner({ challengeId, work }: { challengeId: string; work: { pitchId?: string; projectId?: string } }) {
  const challenge = useQuery({ queryKey: ['challenge', challengeId], queryFn: () => getChallenge(challengeId) });
  const attempt = useQuery({ queryKey: ['attemptForWork', work.pitchId ?? work.projectId], queryFn: () => getAttemptForWork(work) });
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-muted px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Target className="h-4 w-4 text-info" />
        <span className="text-fg-muted">Challenge:</span>
        <Link to={`/challenges/${challengeId}${attempt.data?.competition_id ? `?competition=${attempt.data.competition_id}` : ''}`} className="font-medium hover:underline">
          {challenge.data?.title ?? '…'}
        </Link>
        {attempt.data?.competition_id && <span className="text-xs text-violet">· competition attempt</span>}
      </div>
      {attempt.data?.deadline_at && attempt.data.status === 'in_progress' && <Countdown deadline={attempt.data.deadline_at} />}
    </div>
  );
}

/** Pick a company from the sample market dataset to prefill fields. */
export function SecurityPicker({ onPick, disabled }: { onPick: (s: Security) => void; disabled?: boolean }) {
  const list = useQuery({ queryKey: ['securities', 'ALL'], queryFn: () => marketData.listSecurities() });
  return (
    <Select
      value=""
      disabled={disabled || list.isPending}
      onChange={(e) => {
        const s = list.data?.find((x) => x.id === e.target.value);
        if (s) onPick(s);
      }}
      aria-label="Prefill from FINLAB Markets"
    >
      <option value="">{list.isPending ? 'Loading companies…' : 'Prefill from Markets (sample data)…'}</option>
      {list.data?.map((s) => (
        <option key={s.id} value={s.id}>
          {s.exchange}:{s.symbol} — {s.name}
        </option>
      ))}
    </Select>
  );
}

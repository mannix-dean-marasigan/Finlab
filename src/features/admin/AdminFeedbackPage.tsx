import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { adminListFeedback, adminUpdateFeedback, type AdminFeedback } from '@/services/api/admin';
import type { FeedbackItem } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type Tone } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import { Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime } from '@/lib/format';

const CAT_TONE: Record<FeedbackItem['category'], Tone> = { bug: 'down', content: 'warn', idea: 'info', other: 'neutral' };

function Row({ f }: { f: AdminFeedback }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(f.admin_note ?? '');
  const update = useMutation({
    mutationFn: (status: FeedbackItem['status']) => adminUpdateFeedback(f.id, status, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feedback'] });
      toast.success('Updated');
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <li className="space-y-2 border-t border-border/70 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <Badge tone={CAT_TONE[f.category]}>{f.category}</Badge>
        <Badge tone={f.status === 'resolved' ? 'up' : f.status === 'in_progress' ? 'info' : 'neutral'}>{f.status.replace('_', ' ')}</Badge>
        <span>{f.profile ? `${f.profile.full_name} (@${f.profile.handle})` : 'Deleted user'}</span>
        <span>· {fmtDateTime(f.created_at)}</span>
        {f.page && (
          <Link to={f.page} className="font-mono text-accent hover:underline">
            {f.page}
          </Link>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm">{f.message}</p>
      {f.user_agent && <p className="truncate text-[0.7rem] text-fg-subtle">{f.user_agent}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (visible to the reporter)" className="max-w-md flex-1" />
        {f.status !== 'in_progress' && (
          <Button size="sm" variant="outline" onClick={() => update.mutate('in_progress')} loading={update.isPending && update.variables === 'in_progress'}>
            In progress
          </Button>
        )}
        {f.status !== 'resolved' ? (
          <Button size="sm" variant="success" onClick={() => update.mutate('resolved')} loading={update.isPending && update.variables === 'resolved'}>
            Resolve
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => update.mutate('open')}>
            Reopen
          </Button>
        )}
      </div>
    </li>
  );
}

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<FeedbackItem['status'] | 'all'>('open');
  const list = useQuery({ queryKey: ['admin', 'feedback', tab], queryFn: () => adminListFeedback(tab) });
  return (
    <Card>
      <Tabs
        className="px-4 pt-2"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'all', label: 'All' },
        ]}
      />
      {list.isPending ? (
        <PageSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.length ? (
        <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No feedback here" description="Beta testers send feedback with the button at the bottom of every page." />
      ) : (
        <ul>
          {list.data.map((f) => (
            <Row key={f.id} f={f} />
          ))}
        </ul>
      )}
    </Card>
  );
}

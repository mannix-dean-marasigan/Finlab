import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { adminListChallenges, adminSetPublished } from '@/services/api/admin';
import { useReference } from '@/app/queries';
import { DifficultyBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { timeAgo } from '@/lib/format';

export default function AdminChallengesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ref = useReference();
  const list = useQuery({ queryKey: ['admin', 'challenges'], queryFn: adminListChallenges });
  const publish = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => adminSetPublished(id, v),
    onSuccess: (_, { v }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'challenges'] });
      qc.invalidateQueries({ queryKey: ['challenges'] });
      toast.success(v ? 'Published' : 'Unpublished');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">{list.data.length} challenges</span>
        <Link to="/admin/challenges/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> New challenge
          </Button>
        </Link>
      </div>
      {!list.data.length ? (
        <EmptyState title="No challenges" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Kind</Th>
              <Th>Scoring</Th>
              <Th>Status</Th>
              <Th align="right">Updated</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {list.data.map((c) => (
              <tr key={c.id} className="hover:bg-surface-2">
                <Td>
                  <button onClick={() => navigate(`/admin/challenges/${c.id}`)} className="text-left font-medium hover:text-accent">
                    {c.title}
                  </button>
                  <div className="font-mono text-xs text-fg-subtle">{c.slug}</div>
                </Td>
                <Td className="text-fg-muted">
                  {ref.data?.categories.find((x) => x.id === c.category_id)?.name} <DifficultyBadge difficulty={c.difficulty} />
                </Td>
                <Td>
                  <Badge>{c.kind === 'stock_pitch' ? `${c.pitch_format} pitch` : c.kind}</Badge>
                </Td>
                <Td>
                  <Badge tone={c.scoring_method === 'manual' ? 'info' : 'neutral'}>{c.scoring_method}</Badge>
                </Td>
                <Td>{c.is_published ? <Badge tone="up">Published</Badge> : <Badge tone="warn">Draft</Badge>}</Td>
                <Td align="right" className="text-xs text-fg-subtle">
                  {timeAgo(c.updated_at)}
                </Td>
                <Td align="right">
                  <Button size="xs" variant="ghost" onClick={() => publish.mutate({ id: c.id, v: !c.is_published })}>
                    {c.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {c.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

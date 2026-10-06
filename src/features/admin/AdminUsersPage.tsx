import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { adminListUsers, adminSetAdmin } from '@/services/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { fmtDate, fmtScore, timeAgo } from '@/lib/format';
import type { AdminUserRow } from '@/services/api/admin';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search);
  const users = useQuery({ queryKey: ['admin', 'users', q], queryFn: () => adminListUsers(q) });
  const [confirm, setConfirm] = useState<AdminUserRow | null>(null);
  const toggle = useMutation({
    mutationFn: (u: AdminUserRow) => adminSetAdmin(u.id, !u.is_admin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['isAdmin'] });
      setConfirm(null);
      toast.success('Role updated');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="relative w-80 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or handle" className="pl-9" />
        </div>
        <span className="text-sm text-fg-muted">{users.data?.length ?? 0} users</span>
      </div>
      {users.isPending ? (
        <LoadingState />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : !users.data.length ? (
        <EmptyState title="No users found" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Level</Th>
              <Th align="right">Score</Th>
              <Th align="right">Submissions</Th>
              <Th>Joined</Th>
              <Th>Last sign-in</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {users.data.map((u) => (
              <tr key={u.id}>
                <Td>
                  <Link to={`/p/${u.handle}`} className="font-medium hover:text-accent">
                    {u.full_name}
                  </Link>
                  {u.is_admin && <Badge tone="violet" className="ml-1.5">admin</Badge>}
                  {!u.onboarded && <Badge tone="warn" className="ml-1.5">not onboarded</Badge>}
                  <div className="text-xs text-fg-muted">
                    {u.email} · @{u.handle} {u.university && `· ${u.university}`}
                  </div>
                </Td>
                <Td className="text-fg-muted">{u.career_level}</Td>
                <Td align="right" mono>{fmtScore(u.finlab_score)}</Td>
                <Td align="right" mono>{u.submissions}</Td>
                <Td className="text-xs text-fg-muted">{fmtDate(u.created_at)}</Td>
                <Td className="text-xs text-fg-muted">{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : '—'}</Td>
                <Td align="right">
                  {u.id !== user!.id && (
                    <Button size="xs" variant="ghost" onClick={() => setConfirm(u)}>
                      {u.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      {u.is_admin ? 'Revoke admin' : 'Make admin'}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.is_admin ? 'Revoke admin access?' : 'Grant admin access?'}
        description={confirm?.is_admin ? `${confirm?.full_name} will lose access to the admin console.` : `${confirm?.full_name} will be able to edit challenges, scores, competitions and roles.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant={confirm?.is_admin ? 'danger' : 'primary'} onClick={() => confirm && toggle.mutate(confirm)} loading={toggle.isPending}>
              Confirm
            </Button>
          </>
        }
      />
    </Card>
  );
}

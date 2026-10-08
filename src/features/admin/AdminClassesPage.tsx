import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, Lock, Plus, RefreshCw, Trash2, Unlock, UserMinus, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import {
  adminCreateCohort, adminDeleteCohort, adminListCohorts, adminSetCohortManager, adminSetCohortOpen,
} from '@/services/api/admin';
import type { AdminCohort } from '@/types/domain';
import { ClassDetail } from '@/features/classes/ClassDetail';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { appUrl } from '@/lib/utils';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () => `CLASS-${Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
const copy = (text: string, what: string) =>
  navigator.clipboard.writeText(text).then(() => toast.success(`${what} copied`)).catch(() => toast.error('Could not copy'));

function CreateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', description: '', join_code: randomCode() });
  const create = useMutation({
    mutationFn: () => adminCreateCohort({ name: f.name.trim(), description: f.description.trim(), join_code: f.join_code }, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cohorts'] });
      toast.success('Class created');
      setF({ name: '', description: '', join_code: randomCode() });
    },
  });
  return (
    <Card>
      <CardHeader title="New class" subtitle="A class is a group (a university course, an org or a batch) with its own leaderboard and progress roster." icon={<Plus className="h-3.5 w-3.5" />} />
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1.5fr_1fr_auto] md:items-end">
          <Field label="Name">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. UST JFINEX Batch 2026" maxLength={80} />
          </Field>
          <Field label="Description (optional)">
            <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} />
          </Field>
          <Field label="Join code">
            <div className="flex gap-1">
              <Input value={f.join_code} onChange={(e) => setF({ ...f, join_code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })} className="font-mono tracking-wider" maxLength={30} />
              <Button size="icon" variant="ghost" onClick={() => setF({ ...f, join_code: randomCode() })} aria-label="Generate a new code">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Field>
          <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending} disabled={f.name.trim().length < 3 || f.join_code.length < 4}>
            Create
          </Button>
        </div>
        <InlineError message={create.error ? (create.error as Error).message : null} />
      </CardContent>
    </Card>
  );
}

function ClassCard({ c }: { c: AdminCohort }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [view, setView] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'cohorts'] });
  const toggle = useMutation({ mutationFn: () => adminSetCohortOpen(c.id, !c.is_open), onSuccess: refresh, onError: (e) => toast.error((e as Error).message) });
  const remove = useMutation({
    mutationFn: () => adminDeleteCohort(c.id),
    onSuccess: () => {
      refresh();
      toast('Class deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const manager = useMutation({
    mutationFn: ({ mail, add }: { mail: string; add: boolean }) => adminSetCohortManager(c.id, mail, add),
    onSuccess: (_, v) => {
      refresh();
      setEmail('');
      toast.success(v.add ? 'Manager added' : 'Manager removed');
    },
  });

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{c.name}</h3>
        <Badge tone={c.is_open ? 'up' : 'neutral'}>{c.is_open ? 'Open' : 'Closed'}</Badge>
        <Badge>{c.members} member{c.members === 1 ? '' : 's'}</Badge>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button size="xs" variant="outline" onClick={() => copy(appUrl(`/classes?join=${c.join_code}`), 'Join link')}>
            <Copy className="h-3.5 w-3.5" /> Join link
          </Button>
          <Button size="xs" variant="ghost" onClick={() => copy(c.join_code, 'Code')}>
            {c.join_code}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setView(true)}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button size="xs" variant="ghost" onClick={() => toggle.mutate()} title={c.is_open ? 'Close to new members' : 'Reopen'}>
            {c.is_open ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
          <Button size="xs" variant="ghost" className="hover:text-down" onClick={() => window.confirm(`Delete "${c.name}"? Members keep their accounts.`) && remove.mutate()}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {c.description && <p className="mt-1 text-sm text-fg-muted">{c.description}</p>}
      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
          <Users className="h-3 w-3" /> Managers (can see the progress roster, nothing else)
        </div>
        <div className="flex flex-wrap gap-2">
          {c.managers.map((m) => (
            <span key={m.user_id} className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-2 px-2.5 py-1 text-xs">
              {m.full_name} · {m.email}
              <button onClick={() => manager.mutate({ mail: m.email, add: false })} aria-label={`Remove ${m.full_name}`} className="text-fg-subtle hover:text-down">
                <UserMinus className="h-3 w-3" />
              </button>
            </span>
          ))}
          {!c.managers.length && <span className="text-xs text-fg-subtle">No managers yet.</span>}
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Manager's account email" className="max-w-xs" aria-label="Manager email" />
          <Button size="sm" variant="outline" onClick={() => manager.mutate({ mail: email, add: true })} loading={manager.isPending} disabled={!email.includes('@')}>
            <UserPlus className="h-4 w-4" /> Add
          </Button>
        </div>
        <InlineError message={manager.error ? (manager.error as Error).message : null} />
      </div>
      <Modal open={view} onClose={() => setView(false)} size="xl" title={c.name}>
        <ClassDetail cohortId={c.id} name={c.name} joinCode={c.join_code} isManager members={c.members} />
      </Modal>
    </Card>
  );
}

export default function AdminClassesPage() {
  const list = useQuery({ queryKey: ['admin', 'cohorts'], queryFn: adminListCohorts });
  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  return (
    <div className="space-y-6">
      <CreateClass />
      {!list.data.length ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No classes yet" description="Create one above, then share its join link — or attach it to an invite code under Admin → Invites so new sign-ups join automatically." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.data.map((c) => (
            <ClassCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

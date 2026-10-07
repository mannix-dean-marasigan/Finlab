import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Copy, KeyRound, Lock, Plus, RefreshCw, Trash2, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminCreateInvite, adminDeleteInvite, adminListInvites, adminSetInviteActive, adminSetInviteRequired, fetchInviteRequired, type AdminInvite,
} from '@/services/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate, timeAgo } from '@/lib/format';
import { appUrl, cn } from '@/lib/utils';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid typos

function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `FINLAB-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}

const inviteLink = (code: string) => appUrl(`/register?invite=${encodeURIComponent(code)}`);

function copy(text: string, what: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${what} copied`))
    .catch(() => toast.error('Could not copy'));
}

function CreateInvite() {
  const qc = useQueryClient();
  const [f, setF] = useState({ code: randomCode(), label: '', max_uses: '20', expires: '' });
  const create = useMutation({
    mutationFn: () => {
      const max = f.max_uses.trim() ? Number(f.max_uses) : null;
      if (max !== null && (!Number.isInteger(max) || max < 1)) throw new Error('Max uses must be a whole number of at least 1 (or blank for unlimited).');
      return adminCreateInvite({
        code: f.code.trim().toUpperCase(),
        label: f.label.trim(),
        max_uses: max,
        expires_at: f.expires ? new Date(`${f.expires}T23:59:59+08:00`).toISOString() : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'invites'] });
      copy(inviteLink(f.code.trim().toUpperCase()), 'Invite link');
      setF({ code: randomCode(), label: '', max_uses: '20', expires: '' });
    },
  });
  return (
    <Card>
      <CardHeader title="New invite code" subtitle="The sign-up link is copied automatically when you create it." icon={<Plus className="h-3.5 w-3.5" />} />
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.5fr_0.8fr_1fr_auto] lg:items-end">
          <Field label="Code">
            <div className="flex gap-1">
              <Input
                value={f.code}
                onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                className="font-mono tracking-wider"
                maxLength={40}
              />
              <Button size="icon" variant="ghost" onClick={() => setF({ ...f, code: randomCode() })} aria-label="Generate a new code" title="Generate">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Field>
          <Field label="Label (who it's for)">
            <Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="e.g. UST JFINEX batch 1" maxLength={120} />
          </Field>
          <Field label="Max uses" hint="Blank = unlimited">
            <Input value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" className="font-mono" />
          </Field>
          <Field label="Expires (optional)">
            <Input type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} />
          </Field>
          <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending} disabled={f.code.length < 4}>
            <KeyRound className="h-4 w-4" /> Create
          </Button>
        </div>
        <InlineError message={create.error ? (create.error as Error).message : null} />
      </CardContent>
    </Card>
  );
}

function InviteRow({ inv }: { inv: AdminInvite }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'invites'] });
  const toggle = useMutation({
    mutationFn: () => adminSetInviteActive(inv.code, !inv.is_active),
    onSuccess: () => {
      refresh();
      toast.success(inv.is_active ? `${inv.code} switched off` : `${inv.code} switched on`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: () => adminDeleteInvite(inv.code),
    onSuccess: () => {
      refresh();
      toast(`${inv.code} deleted`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const usable = inv.status === 'ok';
  return (
    <>
      <tr className="hover:bg-surface-2">
        <Td>
          <div className="font-mono font-semibold tracking-wider">{inv.code}</div>
          <div className="text-xs text-fg-subtle">{inv.label || '—'}</div>
        </Td>
        <Td>
          {usable ? (
            <Badge tone="up">Active</Badge>
          ) : (
            <Badge tone={inv.is_active ? 'warn' : 'neutral'} title={inv.status}>
              {!inv.is_active ? 'Off' : /expired/.test(inv.status) ? 'Expired' : 'Used up'}
            </Badge>
          )}
        </Td>
        <Td align="right" mono>
          <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 hover:text-accent" disabled={!inv.uses}>
            {inv.uses}
            {inv.max_uses ? ` / ${inv.max_uses}` : ' / ∞'}
            {inv.uses > 0 && <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />}
          </button>
        </Td>
        <Td className="hidden text-xs text-fg-muted md:table-cell">{inv.expires_at ? fmtDate(inv.expires_at) : 'Never'}</Td>
        <Td align="right">
          <div className="flex justify-end gap-1">
            <Button size="xs" variant="outline" onClick={() => copy(inviteLink(inv.code), 'Invite link')} disabled={!usable}>
              <Copy className="h-3.5 w-3.5" /> Link
            </Button>
            <Button size="xs" variant="ghost" onClick={() => copy(inv.code, 'Code')}>
              Code
            </Button>
            <Button size="xs" variant="ghost" onClick={() => toggle.mutate()} loading={toggle.isPending} title={inv.is_active ? 'Switch off' : 'Switch on'}>
              {inv.is_active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </Button>
            {inv.uses === 0 && (
              <Button size="xs" variant="ghost" className="hover:text-down" onClick={() => remove.mutate()} loading={remove.isPending} title="Delete unused code">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </Td>
      </tr>
      {open && inv.redeemed_by.length > 0 && (
        <tr>
          <td colSpan={5} className="border-b border-border/70 bg-surface-2/50 px-4 py-2">
            <ul className="grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {inv.redeemed_by.map((r, i) => (
                <li key={i} className="flex justify-between gap-2">
                  {r.handle ? (
                    <Link to={`/p/${r.handle}`} className="truncate hover:text-accent">
                      {r.full_name ?? r.handle}
                    </Link>
                  ) : (
                    <span className="truncate">{r.full_name ?? 'Deleted account'}</span>
                  )}
                  <span className="shrink-0 text-fg-subtle">{timeAgo(r.redeemed_at)}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminInvitesPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'invites'], queryFn: adminListInvites });
  const required = useQuery({ queryKey: ['admin', 'invite-required'], queryFn: fetchInviteRequired });
  const setRequired = useMutation({
    mutationFn: (v: boolean) => adminSetInviteRequired(v),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['admin', 'invite-required'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success(v ? 'Closed beta: new sign-ups now need an invite code' : 'Sign-up is now open to anyone');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending || required.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const closed = required.data === true;
  const joined = list.data.reduce((s, i) => s + i.uses, 0);

  return (
    <div className="space-y-6">
      <Card className={cn('flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between', closed ? 'border-violet/40' : 'border-amber-500/40')}>
        <div className="flex items-start gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', closed ? 'border-violet/40 bg-violet/10 text-violet' : 'border-amber-500/40 bg-amber-500/10 text-amber-400')}>
            {closed ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </span>
          <div>
            <div className="font-semibold">{closed ? 'Closed beta — invite code required' : 'Open sign-up — anyone with the link can join'}</div>
            <p className="text-sm text-fg-muted">
              {closed
                ? 'New accounts need a valid code. The database enforces it, so it cannot be skipped. Existing accounts are unaffected.'
                : 'Codes are optional and still recorded if used.'}{' '}
              {joined} {joined === 1 ? 'person has' : 'people have'} joined with a code.
            </p>
            {closed && (
              <p className="mt-1 text-xs text-fg-subtle">
                Note: while this is on, "Add user" / "Invite user" in the Supabase dashboard will fail — switch it off first if you need those.
              </p>
            )}
          </div>
        </div>
        <Button variant={closed ? 'outline' : 'primary'} onClick={() => setRequired.mutate(!closed)} loading={setRequired.isPending}>
          {closed ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {closed ? 'Open sign-up' : 'Require invite codes'}
        </Button>
      </Card>

      <CreateInvite />

      <Card>
        <CardHeader title="Invite codes" subtitle="Click a usage count to see who joined. Unused codes can be deleted; used ones can be switched off." icon={<Check className="h-3.5 w-3.5" />} />
        {!list.data.length ? (
          <EmptyState icon={<KeyRound className="h-5 w-5" />} title="No invite codes yet" description="Create one above and send the link to your beta testers." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Status</Th>
                <Th align="right">Used</Th>
                <Th className="hidden md:table-cell">Expires</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {list.data.map((inv) => (
                <InviteRow key={inv.code} inv={inv} />
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

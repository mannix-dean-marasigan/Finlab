import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, BadgeCheck, Check, FlaskConical, Lock, Search, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { adminAwardCertificate, adminBetaTesters, adminSetBetaOpen, fetchBetaOpen } from '@/services/api/admin';
import type { AdminBetaTester } from '@/types/domain';
import { Stat } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const SHORT: Record<string, string> = { lesson: 'Lesson', daily: 'Daily', challenge: 'Challenge', trade: 'Trade', feedback: 'Feedback' };

function ManualAward({ tester, onClose }: { tester: AdminBetaTester; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('Tested the FINLAB PH beta and gave product feedback');
  const award = useMutation({
    mutationFn: () => adminAwardCertificate(tester.user_id, null, 'FINLAB PH Founding Beta Tester', reason.trim()),
    onSuccess: (code) => {
      qc.invalidateQueries({ queryKey: ['admin', 'beta-testers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
      toast.success(`Certificate ${code} awarded to ${tester.full_name}`);
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Award beta certificate to ${tester.full_name}?`}
      description={`They've done ${tester.done} of 5 checklist items. Use this when they helped in another way (e.g. detailed feedback by chat). The verification page will say it was awarded by an administrator, with your reason.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => award.mutate()} loading={award.isPending}>
            <Award className="h-4 w-4" /> Award
          </Button>
        </>
      }
    >
      <Field label="Reason (shown publicly)">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
      </Field>
      <div className="mt-3">
        <InlineError message={award.error ? (award.error as Error).message : null} />
      </div>
    </Modal>
  );
}

/** Testers who stopped before finishing: who they are, where they're stuck, and a reminder you can paste. */
function NeedsNudge({ rows }: { rows: AdminBetaTester[] }) {
  const DAY = 864e5;
  const quiet = rows
    .filter((r) => r.done < 5 && !r.certificate_code)
    .map((r) => ({ r, days: Math.floor((Date.now() - new Date(r.last_sign_in_at ?? r.joined_at).getTime()) / DAY), next: r.items.find((i) => !i.done) }))
    .filter((x) => x.days >= 3)
    .sort((a, b) => b.days - a.days);
  const stuck = rows
    .filter((r) => r.done < 5)
    .map((r) => r.items.find((i) => !i.done)?.label)
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, l) => ((acc[l as string] = (acc[l as string] ?? 0) + 1), acc), {});
  const top = Object.entries(stuck).sort((a, b) => b[1] - a[1])[0];
  const message = (name: string, next?: string) =>
    `Hi ${name.split(' ')[0]}! Thanks for joining the FINLAB PH beta. You're close to your Founding Beta Tester certificate.` +
    (next ? ` Next up: ${next.toLowerCase()}.` : '') +
    ` It only takes a few minutes: ${window.location.origin}${import.meta.env.BASE_URL}dashboard`;
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">Needs a nudge</div>
        {top && (
          <span className="text-xs text-fg-muted">
            Most common sticking point: <span className="text-fg">{top[0]}</span> ({top[1]} tester{top[1] === 1 ? '' : 's'})
          </span>
        )}
      </div>
      {!quiet.length ? (
        <p className="mt-2 text-sm text-fg-muted">Nobody has gone quiet. Everyone unfinished signed in within the last 3 days.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {quiet.map(({ r, days, next }) => (
            <li key={r.user_id} className="flex flex-wrap items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{r.full_name}</div>
                <div className="text-xs text-fg-muted">
                  {r.done}/5 done · quiet for {days} days{next ? ` · stuck on: ${next.label}` : ''}
                </div>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  navigator.clipboard
                    .writeText(message(r.full_name, next?.label))
                    .then(() => toast.success('Reminder copied. Paste it in Messenger or an email.'))
                    .catch(() => toast.error('Could not copy'))
                }
              >
                Copy reminder
              </Button>
              <a href={`mailto:${r.email}?subject=${encodeURIComponent('Your FINLAB PH beta certificate')}&body=${encodeURIComponent(message(r.full_name, next?.label))}`}>
                <Button size="xs" variant="ghost">Email</Button>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function AdminBetaTestersPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'beta-testers'], queryFn: adminBetaTesters });
  const open = useQuery({ queryKey: ['admin', 'beta-open'], queryFn: fetchBetaOpen });
  const [search, setSearch] = useState('');
  const [awarding, setAwarding] = useState<AdminBetaTester | null>(null);
  const toggle = useMutation({
    mutationFn: (v: boolean) => adminSetBetaOpen(v),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['admin', 'beta-open'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success(v ? 'Beta checklist is open. Testers can claim certificates.' : 'Beta checklist closed. Issued certificates stay valid.');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending || open.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const rows = list.data;
  const s = search.trim().toLowerCase();
  const shown = rows.filter((r) => !s || r.full_name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || (r.invite_code ?? '').toLowerCase().includes(s));
  const active7 = rows.filter((r) => r.last_sign_in_at && Date.now() - new Date(r.last_sign_in_at).getTime() < 7 * 864e5).length;
  const finished = rows.filter((r) => r.done >= 5).length;
  const certified = rows.filter((r) => r.certificate_code).length;
  const isOpen = open.data === true;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Testers" value={rows.length} sub={`${active7} signed in this week`} />
        <Stat label="Finished checklist" value={finished} sub={`of ${rows.length}`} />
        <Stat label="Certificates" value={certified} sub="claimed or awarded" />
        <Stat label="Feedback messages" value={rows.reduce((t, r) => t + r.feedback_count, 0)} sub={<Link to="/admin/feedback" className="text-accent hover:underline">Read feedback</Link>} />
      </div>

      <Card className={cn('flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between', isOpen ? 'border-violet/40' : 'border-border')}>
        <div className="flex items-start gap-3">
          <FlaskConical className={cn('mt-0.5 h-5 w-5 shrink-0', isOpen ? 'text-violet' : 'text-fg-subtle')} />
          <div>
            <div className="font-semibold">{isOpen ? 'Beta checklist is open' : 'Beta checklist is closed'}</div>
            <p className="text-sm text-fg-muted">
              {isOpen
                ? 'Every user sees the 5-item checklist on their dashboard and can claim the Founding Beta Tester certificate when done.'
                : 'The checklist is hidden and no new certificates can be claimed. Issued certificates stay valid.'}
            </p>
          </div>
        </div>
        <Button variant={isOpen ? 'outline' : 'primary'} onClick={() => toggle.mutate(!isOpen)} loading={toggle.isPending}>
          {isOpen ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} {isOpen ? 'Close the beta checklist' : 'Open the beta checklist'}
        </Button>
      </Card>

      <NeedsNudge rows={rows} />

      <Card>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or invite code" className="pl-9" />
          </div>
          <span className="text-xs text-fg-subtle">Admins are not listed</span>
        </div>
        {!shown.length ? (
          <EmptyState icon={<FlaskConical className="h-5 w-5" />} title="No testers yet" description="People who sign up appear here with their checklist progress." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tester</Th>
                <Th className="hidden md:table-cell">Invite</Th>
                <Th>Checklist</Th>
                <Th className="hidden lg:table-cell">Last seen</Th>
                <Th>Certificate</Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.user_id} className="hover:bg-surface-2">
                  <Td>
                    <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">
                      {r.full_name}
                    </Link>
                    <div className="text-xs text-fg-subtle">{r.email} · joined {fmtDate(r.joined_at)}</div>
                  </Td>
                  <Td className="hidden font-mono text-xs text-fg-muted md:table-cell">{r.invite_code ?? '—'}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      {r.items.map((it) => (
                        <span
                          key={it.key}
                          title={`${it.label}: ${it.done ? 'done' : 'not yet'}`}
                          className={cn(
                            'flex h-6 items-center gap-1 rounded px-1.5 text-[0.65rem] font-medium',
                            it.done ? 'bg-up-muted text-up' : 'bg-surface-3 text-fg-subtle',
                          )}
                        >
                          {it.done && <Check className="h-3 w-3" />}
                          {SHORT[it.key] ?? it.key}
                        </span>
                      ))}
                      <span className="ml-1 font-mono text-xs text-fg-muted">{r.done}/5</span>
                    </div>
                  </Td>
                  <Td className="hidden text-xs text-fg-muted lg:table-cell">{r.last_sign_in_at ? timeAgo(r.last_sign_in_at) : 'never'}</Td>
                  <Td>
                    {r.certificate_code ? (
                      <Link to={`/verify/${r.certificate_code}`}>
                        <Badge tone="up">
                          <BadgeCheck className="h-3 w-3" /> {r.certificate_code}
                        </Badge>
                      </Link>
                    ) : r.done >= 5 ? (
                      <span className="text-xs text-fg-muted">Ready to claim</span>
                    ) : (
                      <Button size="xs" variant="ghost" onClick={() => setAwarding(r)}>
                        <Award className="h-3.5 w-3.5" /> Award manually
                      </Button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {awarding && <ManualAward tester={awarding} onClose={() => setAwarding(null)} />}
    </div>
  );
}

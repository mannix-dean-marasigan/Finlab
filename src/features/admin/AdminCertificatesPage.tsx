import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Ban, FlaskConical, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminAwardCertificate, adminCreateTestCertificate, adminDeleteTestCertificate, adminListCertificates, adminListPrograms, adminListUsers,
  adminRevokeCertificate, type AdminCertificate,
} from '@/services/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal, Segmented, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';

const ISSUE_BADGE = {
  earned: { tone: 'neutral', label: 'Earned' },
  admin_award: { tone: 'violet', label: 'Awarded' },
  recognition: { tone: 'info', label: 'Recognition' },
  test: { tone: 'warn', label: 'Test' },
} as const;

function useAdminPrograms() {
  return useQuery({ queryKey: ['admin', 'programs'], queryFn: adminListPrograms });
}

function AwardPanel() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['admin', 'users', ''], queryFn: () => adminListUsers('') });
  const programs = useAdminPrograms();
  const [userId, setUserId] = useState('');
  const [mode, setMode] = useState<'program' | 'custom'>('program');
  const [programId, setProgramId] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const s = userSearch.trim().toLowerCase();
  const userOptions = (users.data ?? []).filter((u) => !s || u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.handle.includes(s));

  const award = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Choose who receives the certificate.');
      if (mode === 'program' && !programId) throw new Error('Choose a program.');
      if (mode === 'custom' && title.trim().length < 4) throw new Error('Give the certificate a title.');
      return adminAwardCertificate(userId, mode === 'program' ? programId : null, mode === 'custom' ? title.trim() : null, reason.trim());
    },
    onSuccess: (code) => {
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
      toast.success(`Certificate ${code} awarded`);
      setReason('');
      setTitle('');
    },
  });

  return (
    <Card>
      <CardHeader
        title="Award a certificate"
        subtitle="For people who completed the work another way (e.g. an in-person workshop). The public verification page says it was awarded by an administrator and shows your reason."
        icon={<Award className="h-3.5 w-3.5 text-violet" />}
      />
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Recipient" required>
            <div className="space-y-1.5">
              <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name or email…" />
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} aria-label="Recipient">
                <option value="">{users.isPending ? 'Loading…' : `Select a person (${userOptions.length})`}</option>
                {userOptions.slice(0, 200).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} — {u.email}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
          <Field label="Certificate">
            <div className="space-y-1.5">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'program', label: 'A program' },
                  { value: 'custom', label: 'Custom title' },
                ]}
              />
              {mode === 'program' ? (
                <Select value={programId} onChange={(e) => setProgramId(e.target.value)} aria-label="Program">
                  <option value="">Select a certification or track…</option>
                  {programs.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.certificate_title}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. UST Valuation Workshop 2026" maxLength={120} />
              )}
            </div>
          </Field>
        </div>
        <Field label="Reason (shown publicly on the verification page)" required hint={`${reason.trim().length}/10 characters minimum`}>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Completed the in-person UST valuation workshop, Oct 2026" maxLength={300} />
        </Field>
        <InlineError message={award.error ? (award.error as Error).message : null} />
        <Button variant="primary" onClick={() => award.mutate()} loading={award.isPending}>
          <Award className="h-4 w-4" /> Award certificate
        </Button>
      </CardContent>
    </Card>
  );
}

function TestPanel() {
  const qc = useQueryClient();
  const programs = useAdminPrograms();
  const [programId, setProgramId] = useState('');
  const create = useMutation({
    mutationFn: () => {
      if (!programId) throw new Error('Choose a program.');
      return adminCreateTestCertificate(programId);
    },
    onSuccess: (code) => {
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
      toast.success(`Test certificate ${code} created — opening it`);
      window.open(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/verify/${code}`, '_blank', 'noopener');
    },
  });
  return (
    <Card>
      <CardHeader
        title="Test certificate (for you)"
        subtitle="A real code, verification page, celebration and LinkedIn kit, marked TEST — NOT A CREDENTIAL. Never shown on your passport or counted anywhere. Delete it when done."
        icon={<FlaskConical className="h-3.5 w-3.5 text-amber-400" />}
      />
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Program" className="flex-1">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">Select a certification or track…</option>
            {programs.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.certificate_title}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={() => create.mutate()} loading={create.isPending}>
          <FlaskConical className="h-4 w-4" /> Create test certificate
        </Button>
      </CardContent>
      {create.error && (
        <div className="px-4 pb-4">
          <InlineError message={(create.error as Error).message} />
        </div>
      )}
    </Card>
  );
}

export default function AdminCertificatesPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'certificates'], queryFn: adminListCertificates });
  const [search, setSearch] = useState('');
  const [revoking, setRevoking] = useState<AdminCertificate | null>(null);
  const [reason, setReason] = useState('');
  const revoke = useMutation({
    mutationFn: () => adminRevokeCertificate(revoking!.code, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
      toast.success('Certificate revoked — its verification page now shows REVOKED');
      setRevoking(null);
      setReason('');
    },
  });
  const removeTest = useMutation({
    mutationFn: (code: string) => adminDeleteTestCertificate(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'certificates'] });
      toast('Test certificate deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const s = search.trim().toLowerCase();
  const rows = list.data.filter((c) => !s || c.code.toLowerCase().includes(s) || c.recipient_name.toLowerCase().includes(s) || c.title.toLowerCase().includes(s));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AwardPanel />
        <TestPanel />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code, name or title" className="pl-9" />
          </div>
          <span className="text-sm text-fg-muted">{list.data.filter((c) => c.issue_type !== 'test').length} issued</span>
        </div>
        {!rows.length ? (
          <EmptyState title="No certificates" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Recipient</Th>
                <Th>Certificate</Th>
                <Th>Type</Th>
                <Th>Issued</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const badge = ISSUE_BADGE[c.issue_type ?? 'earned'];
                return (
                  <tr key={c.id}>
                    <Td mono>
                      <Link to={`/verify/${c.code}`} className="hover:text-accent">
                        {c.code}
                      </Link>
                    </Td>
                    <Td>{c.recipient_name}</Td>
                    <Td>
                      <div>{c.title}</div>
                      <div className="text-xs text-fg-muted">{(c.issue_type === 'admin_award' || c.issue_type === 'recognition') && c.award_reason ? c.award_reason : c.subtitle}</div>
                    </Td>
                    <Td>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </Td>
                    <Td className="text-xs text-fg-muted">{fmtDate(c.issued_at)}</Td>
                    <Td>{c.revoked_at ? <Badge tone="down">Revoked</Badge> : <Badge tone="up">Valid</Badge>}</Td>
                    <Td align="right">
                      {c.issue_type === 'test' ? (
                        <Button size="xs" variant="ghost" className="hover:text-down" onClick={() => removeTest.mutate(c.code)} loading={removeTest.isPending && removeTest.variables === c.code}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      ) : (
                        !c.revoked_at && (
                          <Button size="xs" variant="ghost" onClick={() => setRevoking(c)}>
                            <Ban className="h-3.5 w-3.5" /> Revoke
                          </Button>
                        )
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      <Modal
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Revoke ${revoking?.code}?`}
        description={`${revoking?.recipient_name} — ${revoking?.title}. The public verification page will show it as revoked with your reason.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevoking(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => revoke.mutate()} loading={revoke.isPending} disabled={!reason.trim()}>
              Revoke
            </Button>
          </>
        }
      >
        <Field label="Reason (shown publicly)">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Exam answers were shared" />
        </Field>
        <div className="mt-3">
          <InlineError message={revoke.error ? (revoke.error as Error).message : null} />
        </div>
      </Modal>
    </div>
  );
}

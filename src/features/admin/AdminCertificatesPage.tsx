import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminListCertificates, adminRevokeCertificate, type AdminCertificate } from '@/services/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';

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

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const s = search.trim().toLowerCase();
  const rows = list.data.filter((c) => !s || c.code.toLowerCase().includes(s) || c.recipient_name.toLowerCase().includes(s) || c.title.toLowerCase().includes(s));

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="relative w-80 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code, name or title" className="pl-9" />
        </div>
        <span className="text-sm text-fg-muted">{list.data.length} issued</span>
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
              <Th>Issued</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td mono>
                  <Link to={`/verify/${c.code}`} className="hover:text-accent">
                    {c.code}
                  </Link>
                </Td>
                <Td>{c.recipient_name}</Td>
                <Td>
                  <div>{c.title}</div>
                  <div className="text-xs text-fg-muted">{c.subtitle}</div>
                </Td>
                <Td className="text-xs text-fg-muted">{fmtDate(c.issued_at)}</Td>
                <Td>{c.revoked_at ? <Badge tone="down">Revoked</Badge> : <Badge tone="up">Valid</Badge>}</Td>
                <Td align="right">
                  {!c.revoked_at && (
                    <Button size="xs" variant="ghost" onClick={() => setRevoking(c)}>
                      <Ban className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
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
    </Card>
  );
}

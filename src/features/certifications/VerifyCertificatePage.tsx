import { useParams } from 'react-router';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Copy, ExternalLink, Printer, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { verifyCertificate } from '@/services/api/misc';
import type { CertificateView } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { PublicShell } from '@/features/passport/PublicPassportPage';
import { fmtDate } from '@/lib/format';
import { appUrl } from '@/lib/utils';

const KIND_LABEL = { certification: 'Professional Certification', track: 'Learning Track Certificate', competition: 'Competition Certificate' } as const;

/** Paper-style certificate; prints cleanly on A4 landscape. */
export function CertificateDocument({ c, preview }: { c: CertificateView; preview?: boolean }) {
  const revoked = !!c.revoked_at;
  const detail =
    c.kind === 'competition'
      ? c.subtitle
      : [c.details.modules && `${c.details.modules} modules`, c.details.estimated_hours && `~${c.details.estimated_hours} hours`, c.details.average_score && `average challenge score ${c.details.average_score}`]
          .filter(Boolean)
          .join(' · ');
  return (
    <div className="certificate-paper relative mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden rounded-md bg-[#fbf8f1] text-[#1a1d23] shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
      <div className="absolute inset-3 rounded-sm border-2 border-[#c8922a] sm:inset-5" />
      <div className="absolute inset-[18px] rounded-sm border border-[#c8922a]/50 sm:inset-[28px]" />
      {preview && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rotate-[-18deg] select-none rounded border-4 border-[#c8922a]/40 px-6 py-2 text-3xl font-bold tracking-[0.3em] text-[#c8922a]/40 sm:text-6xl">PREVIEW</span>
        </div>
      )}
      {revoked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="rotate-[-18deg] rounded border-4 border-red-600/70 px-6 py-2 text-4xl font-bold tracking-widest text-red-600/70">REVOKED</span>
        </div>
      )}
      <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[6%] text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden>
              <rect width="32" height="32" rx="7" fill="#11161e" />
              <path d="M7 22 L13 15 L17 19 L25 9" stroke="#f5a524" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="25" cy="9" r="2.2" fill="#f5a524" />
            </svg>
            <span className="font-mono text-sm font-semibold tracking-[0.3em] sm:text-lg">
              FIN<span className="text-[#c8922a]">LAB</span>
            </span>
          </div>
          <div className="mt-2 text-[0.55rem] uppercase tracking-[0.35em] text-[#6b6f78] sm:text-xs">{KIND_LABEL[c.kind]}</div>
        </div>
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.25em] text-[#6b6f78] sm:text-sm">This certifies that</div>
          <div className="mt-1 font-serif text-2xl italic sm:mt-3 sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {c.recipient_name}
          </div>
          <div className="mx-auto mt-2 h-px w-2/3 bg-[#c8922a]/60 sm:mt-4" />
          <div className="mt-2 text-[0.6rem] text-[#6b6f78] sm:mt-4 sm:text-sm">
            {c.kind === 'competition' ? 'achieved the following result in' : 'has successfully completed all requirements of'}
          </div>
          <div className="mt-1 text-base font-semibold sm:mt-2 sm:text-3xl">{c.title}</div>
          {detail && <div className="mt-1 text-[0.6rem] text-[#6b6f78] sm:mt-2 sm:text-sm">{detail}</div>}
        </div>
        <div className="flex w-full items-end justify-between gap-4 text-left text-[0.5rem] text-[#6b6f78] sm:text-xs">
          <div>
            <div className="uppercase tracking-wider">Issued</div>
            <div className="font-semibold text-[#1a1d23]">{fmtDate(c.issued_at, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="flex flex-col items-center">
            <BadgeCheck className="h-6 w-6 text-[#c8922a] sm:h-10 sm:w-10" />
            <div className="mt-1 uppercase tracking-wider">Verified by FINLAB</div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-wider">Verification code</div>
            <div className="font-mono font-semibold text-[#1a1d23]">{c.code}</div>
            <div className="break-all">{appUrl(`/verify/${c.code}`).replace(/^https?:\/\//, '')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function linkedInUrl(c: CertificateView) {
  const d = new Date(c.issued_at);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.title,
    organizationName: 'FINLAB',
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
    certUrl: appUrl(`/verify/${c.code}`),
    certId: c.code,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export default function VerifyCertificatePage() {
  const { code = '' } = useParams();
  const q = useQuery({ queryKey: ['certificate', code], queryFn: () => verifyCertificate(code) });
  return (
    <PublicShell>
      {q.isPending ? (
        <PageSkeleton />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="Certificate not found" description={`No FINLAB certificate matches the code "${code}". Check the code and try again.`} />
      ) : (
        <div className="space-y-6">
          <div className={`no-print flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${q.data.revoked_at ? 'border-down/40 bg-down-muted' : 'border-up/40 bg-up-muted'}`}>
            <div className="flex items-start gap-3">
              {q.data.revoked_at ? <ShieldAlert className="h-6 w-6 shrink-0 text-down" /> : <ShieldCheck className="h-6 w-6 shrink-0 text-up" />}
              <div>
                <div className={`font-semibold ${q.data.revoked_at ? 'text-down' : 'text-up'}`}>
                  {q.data.revoked_at ? 'This certificate has been revoked' : 'Verified FINLAB certificate'}
                </div>
                <div className="text-sm text-fg-muted">
                  {q.data.revoked_at
                    ? `Revoked ${fmtDate(q.data.revoked_at)}${q.data.revoked_reason ? ` — ${q.data.revoked_reason}` : ''}.`
                    : `Issued to ${q.data.recipient_name} on ${fmtDate(q.data.issued_at)}. Issued automatically from scored work; it cannot be edited by its holder.`}
                  {q.data.handle && (
                    <>
                      {' '}
                      <Link to={`/p/${q.data.handle}`} className="text-accent hover:underline">
                        View Finance Passport
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            {!q.data.revoked_at && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(appUrl(`/verify/${q.data!.code}`))
                      .then(() => toast.success('Verification link copied'))
                      .catch(() => toast.error('Could not copy'))
                  }
                >
                  <Copy className="h-4 w-4" /> Copy link
                </Button>
                {q.data.kind !== 'competition' && (
                  <a href={linkedInUrl(q.data)} target="_blank" rel="noreferrer noopener">
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4" /> Add to LinkedIn
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="print-area">
            <CertificateDocument c={q.data} />
          </div>
          <p className="no-print text-center text-xs text-fg-subtle">
            Tip: in the print dialog choose "Save as PDF", landscape orientation, and turn off headers/footers.
          </p>
        </div>
      )}
    </PublicShell>
  );
}

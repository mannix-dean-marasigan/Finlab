import { useParams } from 'react-router';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Copy, ExternalLink, FlaskConical, Printer, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { verifyCertificate } from '@/services/api/misc';
import { isAwardedCertificate, type CertificateView } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { PublicShell } from '@/features/passport/PublicPassportPage';
import { fmtDate } from '@/lib/format';
import { appUrl } from '@/lib/utils';
import { ISSUER_NAME, LINKEDIN_PAGE_URL } from '@/lib/brand';
import { linkedInAddCertUrl } from './shareContent';
import { ShareKit } from './ShareKit';

const KIND_LABEL = { certification: 'Professional Certification', track: 'Learning Track Certificate', competition: 'Competition Certificate' } as const;

/** The FINLAB PH sun mark, drawn for light paper (dark chart line). */
function PaperMark({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="150 55 300 260" style={style} aria-hidden>
      <g transform="translate(360 148)" fill="#d99a1e">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M0 -82 L12 -52 L-12 -52 Z" transform={`rotate(${a})`} />
        ))}
        <circle r="36" />
      </g>
      <path d="M180 280 L240 210 L280 250 L360 148" stroke="#1a1d23" strokeWidth="30" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Paper-style certificate; prints cleanly on A4 landscape.
 * Every size is in `cqw` (1% of the certificate's own width), so it looks the same in a modal, on a phone or on paper.
 */
export function CertificateDocument({ c, preview }: { c: CertificateView; preview?: boolean }) {
  const revoked = !!c.revoked_at;
  const isTest = c.issue_type === 'test';
  const isAward = isAwardedCertificate(c);
  const detail =
    c.kind === 'competition'
      ? c.subtitle
      : [c.details.modules && `${c.details.modules} modules`, c.details.estimated_hours && `~${c.details.estimated_hours} hours`, c.details.average_score && `average challenge score ${c.details.average_score}`]
          .filter(Boolean)
          .join(' · ');
  // Long names and titles step down so they stay on one or two lines.
  const nameSize = c.recipient_name.length > 28 ? 3.8 : c.recipient_name.length > 20 ? 4.5 : 5.2;
  const titleSize = c.title.length > 48 ? 2.4 : c.title.length > 32 ? 2.75 : 3.1;
  const cq = (n: number) => `${n}cqw`;
  const label: React.CSSProperties = { fontSize: cq(1.25), letterSpacing: '0.32em' };
  return (
    <div
      className="certificate-paper relative mx-auto aspect-[1.414/1] w-full max-w-4xl overflow-hidden rounded-md bg-[#fbf8f1] text-[#1a1d23] shadow-2xl print:max-w-none print:rounded-none print:shadow-none"
      style={{ containerType: 'inline-size' }}
    >
      <div className="absolute rounded-sm border-[#c8922a]" style={{ inset: cq(2.2), borderWidth: cq(0.25) }} />
      <div className="absolute rounded-sm border border-[#c8922a]/50" style={{ inset: cq(3.1) }} />
      {isTest && !revoked && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rotate-[-14deg] select-none whitespace-nowrap rounded border-amber-600/50 font-bold text-amber-600/55"
            style={{ fontSize: cq(2.8), letterSpacing: '0.2em', borderWidth: cq(0.45), padding: `${cq(0.8)} ${cq(2)}` }}>
            TEST · NOT A CREDENTIAL
          </span>
        </div>
      )}
      {preview && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rotate-[-18deg] select-none rounded border-[#c8922a]/35 font-bold text-[#c8922a]/35"
            style={{ fontSize: cq(5.5), letterSpacing: '0.3em', borderWidth: cq(0.45), padding: `${cq(0.6)} ${cq(2.4)}` }}>
            PREVIEW
          </span>
        </div>
      )}
      {revoked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="rotate-[-18deg] rounded border-red-600/70 font-bold tracking-widest text-red-600/70"
            style={{ fontSize: cq(4.5), borderWidth: cq(0.45), padding: `${cq(0.6)} ${cq(2.4)}` }}>
            REVOKED
          </span>
        </div>
      )}
      <div className="relative flex h-full flex-col items-center justify-between text-center" style={{ padding: `${cq(5.6)} ${cq(8)} ${cq(5)}` }}>
        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex items-center" style={{ gap: cq(1.5) }}>
            <PaperMark style={{ width: cq(7.8), height: cq(6.8) }} />
            <div className="text-left leading-none">
              <div className="font-mono font-semibold" style={{ fontSize: cq(3.4), letterSpacing: '0.26em' }}>
                FIN<span className="text-[#c8922a]">LAB</span>
              </div>
              <div className="font-mono font-semibold text-[#6b6f78]" style={{ fontSize: cq(1.12), letterSpacing: '0.42em', marginTop: cq(0.6) }}>
                PHILIPPINES
              </div>
            </div>
          </div>
          <div className="uppercase text-[#6b6f78]" style={{ ...label, marginTop: cq(1.6) }}>
            {isAward && !c.program ? 'Certificate of Recognition' : KIND_LABEL[c.kind]}
          </div>
        </div>

        {/* Body */}
        <div className="w-full">
          <div className="uppercase text-[#6b6f78]" style={label}>This certifies that</div>
          <div className="italic leading-tight" style={{ fontSize: cq(nameSize), marginTop: cq(1.4), fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {c.recipient_name}
          </div>
          <div className="mx-auto bg-[#c8922a]/60" style={{ height: 1, width: '58%', marginTop: cq(1.6) }} />
          <div className="text-[#6b6f78]" style={{ fontSize: cq(1.5), marginTop: cq(1.8) }}>
            {c.kind === 'competition' ? 'achieved the following result in' : isAward ? 'has been awarded' : 'has successfully completed all requirements of'}
          </div>
          <div className="mx-auto font-semibold leading-tight" style={{ fontSize: cq(titleSize), marginTop: cq(0.8), maxWidth: '88%' }}>
            {c.title}
          </div>
          {detail && <div className="text-[#6b6f78]" style={{ fontSize: cq(1.3), marginTop: cq(1) }}>{detail}</div>}
        </div>

        {/* Footer */}
        <div className="flex w-full items-end justify-between text-left text-[#6b6f78]" style={{ fontSize: cq(1.15), gap: cq(2) }}>
          <div>
            <div className="uppercase tracking-wider">Issued</div>
            <div className="font-semibold text-[#1a1d23]">{fmtDate(c.issued_at, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div className="flex flex-col items-center">
            <BadgeCheck className="text-[#c8922a]" style={{ width: cq(3.4), height: cq(3.4) }} />
            <div className="uppercase tracking-wider" style={{ marginTop: cq(0.4) }}>Verified by {ISSUER_NAME}</div>
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
          <div
            className={`no-print flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
              q.data.revoked_at ? 'border-down/40 bg-down-muted' : q.data.issue_type === 'test' ? 'border-amber-500/40 bg-amber-500/10' : 'border-up/40 bg-up-muted'
            }`}
          >
            <div className="flex items-start gap-3">
              {q.data.revoked_at ? (
                <ShieldAlert className="h-6 w-6 shrink-0 text-down" />
              ) : q.data.issue_type === 'test' ? (
                <FlaskConical className="h-6 w-6 shrink-0 text-amber-400" />
              ) : (
                <ShieldCheck className="h-6 w-6 shrink-0 text-up" />
              )}
              <div>
                <div className={`font-semibold ${q.data.revoked_at ? 'text-down' : q.data.issue_type === 'test' ? 'text-amber-400' : 'text-up'}`}>
                  {q.data.revoked_at
                    ? 'This certificate has been revoked'
                    : q.data.issue_type === 'test'
                      ? 'Test certificate — not a credential'
                      : `Verified ${ISSUER_NAME} certificate`}
                </div>
                <div className="text-sm text-fg-muted">
                  {q.data.revoked_at
                    ? `Revoked ${fmtDate(q.data.revoked_at)}${q.data.revoked_reason ? ` — ${q.data.revoked_reason}` : ''}.`
                    : q.data.issue_type === 'test'
                      ? 'Created by a FINLAB PH administrator to test certificates and sharing. It does not represent completed work.'
                      : q.data.issue_type === 'recognition'
                        ? `Awarded to ${q.data.recipient_name} by ${ISSUER_NAME} on ${fmtDate(q.data.issued_at)}${q.data.award_reason ? ` — ${q.data.award_reason}` : ''}. It cannot be edited by its holder.`
                        : q.data.issue_type === 'admin_award'
                        ? `Awarded to ${q.data.recipient_name} by a ${ISSUER_NAME} administrator on ${fmtDate(q.data.issued_at)}${q.data.award_reason ? ` — ${q.data.award_reason}` : ''}. It cannot be edited by its holder.`
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
                <a href={linkedInAddCertUrl(q.data, appUrl(`/verify/${q.data.code}`))} target="_blank" rel="noreferrer noopener">
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4" /> Add to LinkedIn
                  </Button>
                </a>
              </div>
            )}
          </div>
          <div className="print-area">
            <CertificateDocument c={q.data} />
          </div>
          <p className="no-print text-center text-xs text-fg-subtle">
            Tip: in the print dialog choose "Save as PDF", landscape orientation, and turn off headers/footers.
          </p>
          <ShareKit c={q.data} />
          <p className="no-print text-center text-xs text-fg-subtle">
            <a href={LINKEDIN_PAGE_URL} target="_blank" rel="noreferrer noopener" className="hover:text-accent">
              Follow {ISSUER_NAME} on LinkedIn
            </a>
          </p>
        </div>
      )}
    </PublicShell>
  );
}

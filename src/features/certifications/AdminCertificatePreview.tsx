import { useState } from 'react';
import { Eye, PartyPopper, ShieldAlert } from 'lucide-react';
import type { CertificateView, ProgramDetail } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/misc';
import { CertificateDocument } from './VerifyCertificatePage';
import { CelebrationDialog } from './Celebration';
import { ShareKitPanel } from './ShareKit';

const SAMPLE_CODE = 'FLB-XXXX-XXXX';

/**
 * Admin-only: see exactly what a learner gets on completion — certificate,
 * celebration and LinkedIn share kit — without issuing a real certificate.
 */
export function AdminCertificatePreview({ detail, recipient }: { detail: ProgramDetail; recipient: string }) {
  const [open, setOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const p = detail.program;
  const c: CertificateView = {
    code: SAMPLE_CODE,
    kind: p.kind,
    recipient_name: recipient,
    title: p.certificate_title,
    subtitle: p.title,
    details: { modules: detail.modules.length, estimated_hours: Number(p.estimated_hours), average_score: 90 },
    issued_at: new Date().toISOString(),
    revoked_at: null,
    revoked_reason: null,
    handle: null,
    program: { title: p.title, level: p.level, estimated_hours: Number(p.estimated_hours), description: p.subtitle },
    competition: null,
  };

  return (
    <>
      <Button size="sm" variant="outline" className="w-full justify-center border-violet/40 text-violet hover:bg-violet/10" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4" /> Preview as earned (admin)
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        title={`Preview: ${p.certificate_title}`}
        description="What a learner sees after passing every module. Nothing is issued or saved."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setCelebrate(true)}>
              <PartyPopper className="h-4 w-4" /> Replay celebration
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-2 rounded-md border border-violet/30 bg-violet/10 p-3 text-xs text-fg-muted">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
            <span>
              Admin preview with a sample code ({SAMPLE_CODE}) and a sample average score of 90. The PREVIEW watermark stays so screenshots can't pass as a real
              certificate. Real certificates are only issued by completing the program.
            </span>
          </div>
          <CertificateDocument c={c} preview />
          <ShareKitPanel c={c} />
        </div>
      </Modal>
      {celebrate && <CelebrationDialog code={SAMPLE_CODE} title={p.certificate_title} preview onClose={() => setCelebrate(false)} />}
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, PenLine, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { supabase } from '@/lib/supabase';
import type { CertificateView } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form';
import { Segmented } from '@/components/ui/misc';
import { appUrl } from '@/lib/utils';
import {
  linkedInAddCertUrl, linkedInPost, linkedInShareUrl, profileDescription, programCopy, resumeLine, type PostTone,
} from './shareContent';

/** LinkedIn "in" mark (not included in our icon set). */
function Linkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="xs"
      variant="outline"
      onClick={() =>
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          })
          .catch(() => toast.error('Could not copy — select the text and copy it manually'))
      }
    >
      {done ? <Check className="h-3.5 w-3.5 text-up" /> : <Copy className="h-3.5 w-3.5" />} {done ? 'Copied' : label}
    </Button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent-muted font-mono text-xs font-semibold text-accent">{n}</span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="pt-1 text-sm font-semibold">{title}</div>
        {children}
      </div>
    </div>
  );
}

/** True when the signed-in user owns this certificate (RLS only returns your own rows). */
function useOwnsCertificate(code: string) {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['owns-certificate', code, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('certificates').select('code').eq('code', code).eq('user_id', user!.id).maybeSingle();
      return !!data;
    },
  });
  return q.data === true;
}

/** Shown on the public verification page only to the certificate's holder. */
export function ShareKit({ c }: { c: CertificateView }) {
  const owns = useOwnsCertificate(c.code);
  if (!owns || c.revoked_at) return null;
  return <ShareKitPanel c={c} />;
}

export function ShareKitPanel({ c }: { c: CertificateView }) {
  const verifyUrl = appUrl(`/verify/${c.code}`);
  const [tone, setTone] = useState<PostTone>('professional');
  const [post, setPost] = useState(() => linkedInPost(c, verifyUrl, 'professional'));
  const [params] = useSearchParams();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => setPost(linkedInPost(c, verifyUrl, tone)), [c, verifyUrl, tone]);
  // Arriving from the "Share on LinkedIn" button: bring the kit into view.
  useEffect(() => {
    if (params.get('share')) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params]);

  const description = profileDescription(c, verifyUrl);
  const skills = c.kind === 'competition' ? [] : programCopy(c).skills;
  const resume = resumeLine(c);

  const openPost = async () => {
    // LinkedIn usually pre-fills the composer from the URL; copying first means pasting always works.
    try {
      await navigator.clipboard.writeText(post);
      toast.success('Post copied — if LinkedIn opens empty, just paste it.');
    } catch {
      /* clipboard blocked: the URL pre-fill still works in most browsers */
    }
    window.open(linkedInShareUrl(post), '_blank', 'noopener,noreferrer');
  };

  return (
    <section ref={ref} className="no-print scroll-mt-6 rounded-lg border border-[#0a66c2]/40 bg-gradient-to-b from-[#0a66c2]/[0.08] to-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0a66c2] text-white">
          <Linkedin className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold">Share it on LinkedIn</h2>
          <p className="text-sm text-fg-muted">Only you see this panel. Everything is pre-written from what you actually completed — edit freely.</p>
        </div>
      </div>

      <div className="mt-5 space-y-6">
        <Step n={1} title="Add the certificate to your profile">
          <p className="text-xs text-fg-muted">Opens LinkedIn's "Add licence or certification" form with the name, issuer, date, credential ID and verification link filled in.</p>
          <a href={linkedInAddCertUrl(c, verifyUrl)} target="_blank" rel="noreferrer noopener" className="inline-block">
            <Button size="sm" className="border-[#0a66c2] bg-[#0a66c2] text-white hover:bg-[#004182]">
              <Linkedin className="h-4 w-4" /> Add to profile <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
          <div className="rounded-md border border-border bg-surface-2 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Paste into the Description field</span>
              <CopyButton text={description} />
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-fg/90">{description}</pre>
          </div>
          {skills.length > 0 && (
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Skills to add (LinkedIn allows up to 5 per entry)</span>
                <CopyButton text={skills.join(', ')} label="Copy all" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => navigator.clipboard.writeText(s).then(() => toast.success(`Copied "${s}"`)).catch(() => undefined)}
                    className="rounded-full border border-border-strong bg-surface px-2.5 py-1 text-xs hover:border-accent hover:text-accent"
                    title="Copy"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Step>

        <Step n={2} title="Announce it with a post">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              value={tone}
              onChange={setTone}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'story', label: 'Story' },
                { value: 'short', label: 'Short' },
              ]}
            />
            <span className={`font-mono text-xs ${post.length > 3000 ? 'text-down' : 'text-fg-subtle'}`}>{post.length}/3000</span>
          </div>
          <Textarea autoGrow rows={10} value={post} onChange={(e) => setPost(e.target.value)} aria-label="LinkedIn post draft" className="text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="border-[#0a66c2] bg-[#0a66c2] text-white hover:bg-[#004182]" onClick={openPost}>
              <PenLine className="h-4 w-4" /> Post on LinkedIn
            </Button>
            <CopyButton text={post} label="Copy post" />
            <Button size="xs" variant="ghost" onClick={() => setPost(linkedInPost(c, verifyUrl, tone))}>
              <Sparkles className="h-3.5 w-3.5" /> Reset draft
            </Button>
          </div>
          <p className="text-xs text-fg-subtle">Tip: posts with a personal line ("why I did this", "what surprised me") get noticeably more engagement. Tagging classmates who took it with you helps too.</p>
        </Step>

        <Step n={3} title="Add a line to your résumé">
          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface-2 p-3">
            <p className="text-sm text-fg/90">{resume}</p>
            <CopyButton text={resume} />
          </div>
        </Step>
      </div>
    </section>
  );
}

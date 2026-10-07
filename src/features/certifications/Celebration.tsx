import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { BadgeCheck, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#f5a524', '#ffb84d', '#22c55e', '#3b82f6', '#a78bfa', '#e6edf3'];
const seenKey = (code: string) => `finlab:celebrated:${code}`;

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 1.8,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 160,
        round: Math.random() > 0.6,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/** Shows once per certificate (remembered in this browser). */
export function CertificateCelebration({ code, title }: { code: string | null; title: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!code) return;
    try {
      if (!localStorage.getItem(seenKey(code))) setOpen(true);
    } catch {
      // Storage unavailable (private mode): skip the celebration rather than repeat it.
    }
  }, [code]);

  const close = () => {
    setOpen(false);
    try {
      if (code) localStorage.setItem(seenKey(code), new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!open || !code) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Certificate earned">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={close} />
      <Confetti />
      <div className="relative w-full max-w-md rounded-xl border border-accent/40 bg-surface p-8 text-center shadow-2xl animate-fade-in">
        <button onClick={close} className="absolute right-3 top-3 rounded p-1 text-fg-muted hover:bg-surface-3 hover:text-fg" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/50 bg-accent-muted text-accent shadow-[0_0_40px_#f5a52455]">
          <BadgeCheck className="h-9 w-9" />
        </span>
        <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-accent">Certificate earned</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-fg-muted">
          Issued with verification code <span className="font-mono text-fg">{code}</span>. Anyone can verify it — add it to your LinkedIn and résumé.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to={`/verify/${code}`} onClick={close}>
            <Button variant="primary" className="w-full justify-center">
              <BadgeCheck className="h-4 w-4" /> View certificate
            </Button>
          </Link>
          <Link to={`/verify/${code}?share=1`} onClick={close}>
            <Button className="w-full justify-center">
              <Share2 className="h-4 w-4" /> Share on LinkedIn
            </Button>
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

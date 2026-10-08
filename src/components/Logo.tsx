import { cn } from '@/lib/utils';

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/** The FINLAB PH sun mark, drawn from brand/finlab-ph-logo-linkedin.png (same 600px coordinates). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="150 55 300 260" className={cn('h-7 w-8 shrink-0', className)} aria-hidden>
      <g transform="translate(360 148)" fill="#f5a524">
        {RAYS.map((a) => (
          <path key={a} d="M0 -82 L12 -52 L-12 -52 Z" transform={`rotate(${a})`} />
        ))}
        <circle r="36" />
      </g>
      <path d="M180 280 L240 210 L280 250 L360 148" stroke="#e8edf5" strokeWidth="30" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-mono text-[1.05rem] font-semibold tracking-[0.2em]">
            FIN<span className="text-accent">LAB</span>
          </span>
          <span className="mt-1 font-mono text-[0.5rem] font-semibold tracking-[0.3em] text-fg-subtle">PHILIPPINES</span>
        </span>
      )}
    </div>
  );
}

import { cn } from '@/lib/utils';

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

/** The FINLAB PH sun mark: a rising chart line ending in a sun (matches brand/finlab-ph-logo-linkedin.png). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7 shrink-0', className)} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#11161e" stroke="#2a3443" />
      <g transform="translate(22.5 9.5)">
        {RAYS.map((a) => (
          <path key={a} d="M0 -7.4 L1.15 -5.3 L-1.15 -5.3 Z" fill="#f5a524" transform={`rotate(${a})`} />
        ))}
        <circle r="3.6" fill="#f5a524" />
      </g>
      <path d="M6.5 23 L11.5 17 L15 20.5 L22.5 10" stroke="#e8edf5" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <LogoMark />
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[1.05rem] font-semibold tracking-[0.2em]">
            FIN<span className="text-accent">LAB</span>
          </span>
          <span className="font-mono text-[0.62rem] font-semibold tracking-[0.25em] text-fg-subtle">PH</span>
        </span>
      )}
    </div>
  );
}

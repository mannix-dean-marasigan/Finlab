import { cn } from '@/lib/utils';

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 select-none', className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="7" fill="#11161e" stroke="#2a3443" />
        <path d="M7 22 L13 15 L17 19 L25 9" stroke="#f5a524" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="9" r="2.2" fill="#f5a524" />
      </svg>
      {!compact && (
        <span className="font-mono text-[1.05rem] font-semibold tracking-[0.2em]">
          FIN<span className="text-accent">LAB</span>
        </span>
      )}
    </div>
  );
}

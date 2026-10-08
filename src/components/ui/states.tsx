import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-fg-muted', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-3/70', className)} />;
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-12 text-sm text-fg-muted', className)} role="status">
      <Spinner />
      {label}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3 pt-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      <div className="relative mb-4 h-16 w-28">
        {/* A faint rising chart line heading toward a sun: the FINLAB PH mark, as a quiet illustration. */}
        <svg viewBox="0 0 112 64" className="absolute inset-0 h-full w-full" aria-hidden>
          <circle cx="92" cy="14" r="8" fill="none" stroke="currentColor" className="text-accent/35" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="92" y1="1" x2="92" y2="3.5" stroke="currentColor" className="text-accent/35" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${a} 92 14)`} />
          ))}
          <path d="M6 54 L30 36 L46 46 L84 20" fill="none" stroke="currentColor" className="text-border-strong" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-border-strong bg-surface-2 p-2.5 text-fg-muted">
          {icon ?? <Inbox className="h-5 w-5" />}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 px-6', className)} role="alert">
      <div className="mb-3 rounded-full border border-down/30 bg-down-muted p-3 text-down">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-fg-muted">{message}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-down/30 bg-down-muted px-3 py-2 text-sm text-down" role="alert">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

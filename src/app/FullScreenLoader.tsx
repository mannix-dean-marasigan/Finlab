import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui/states';

export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg" role="status">
      <Logo />
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Spinner /> {label}
      </div>
    </div>
  );
}

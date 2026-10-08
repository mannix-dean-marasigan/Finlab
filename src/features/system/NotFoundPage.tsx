import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <svg viewBox="0 0 240 120" className="h-28 w-56" aria-hidden>
        {/* The chart line goes up, then falls off a cliff: this page doesn't exist. */}
        <path d="M10 100 L60 70 L90 82 L140 34" fill="none" stroke="#f5a524" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M140 34 L150 30" fill="none" stroke="#f5a524" strokeWidth="6" strokeLinecap="round" />
        <path d="M150 30 L210 112" fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 9" />
      </svg>
      <div className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-fg-subtle">Error 404</div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">This page fell off the chart</h1>
      <p className="mt-2 max-w-sm text-sm text-fg-muted">The link may be old or mistyped. Your progress is safe.</p>
      <div className="mt-6 flex gap-2">
        <Link to="/dashboard">
          <Button variant="primary" size="sm">Back to dashboard</Button>
        </Link>
        <Link to="/certifications">
          <Button size="sm">Browse certifications</Button>
        </Link>
      </div>
    </div>
  );
}

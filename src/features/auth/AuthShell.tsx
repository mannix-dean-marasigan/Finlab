import type { ReactNode } from 'react';
import { Activity, Award, BarChart3, FileSearch } from 'lucide-react';
import { Logo } from '@/components/Logo';

const LOOP = ['Learn', 'Analyze', 'Build', 'Decide', 'Pitch', 'Defend', 'Get evaluated', 'Improve', 'Compete', 'Rank up'];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.1fr_1fr]">
      <div className="grid-bg relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <Logo />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">The flight simulator for finance</p>
          <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight">
            Learn finance. Do the work. Compete. <span className="text-accent">Prove it.</span>
          </h1>
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            {[
              { icon: FileSearch, t: 'Research & pitch', d: 'Write real reports and stock pitches' },
              { icon: BarChart3, t: 'Model & value', d: 'P/E, P/B, DCF and forecasts' },
              { icon: Activity, t: 'Decide', d: 'Simulated ₱10M portfolio & market events' },
              { icon: Award, t: 'Rank up', d: 'Junior Analyst → Managing Director' },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-border bg-surface/70 p-4 backdrop-blur">
                <f.icon className="h-4 w-4 text-accent" />
                <div className="mt-2 text-sm font-medium">{f.t}</div>
                <div className="mt-0.5 text-xs text-fg-muted">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex flex-wrap gap-x-2 gap-y-1 font-mono text-[0.7rem] uppercase tracking-wider text-fg-subtle">
          {LOOP.map((s, i) => (
            <span key={s}>
              {s}
              {i < LOOP.length - 1 && <span className="ml-2 text-accent/60">→</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

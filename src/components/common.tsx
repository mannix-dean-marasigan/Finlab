import { useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Award, BookOpen, Briefcase, Building2, Calculator, Crown, Database, FileSearch, FileText, Flag, Folder, Landmark,
  Library, LineChart, Medal, PieChart, Presentation, Rocket, Swords, Target, Timer, TrendingDown, TrendingUp, Trophy,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtDuration, fmtPct, fmtScore } from '@/lib/format';
import { Badge, type Tone } from './ui/badge';
import type { Difficulty, Rating } from '@/types/domain';

// Icons referenced by name from the database (achievements, categories, specializations).
const ICONS: Record<string, LucideIcon> = {
  award: Award, 'book-open': BookOpen, briefcase: Briefcase, 'building-2': Building2, calculator: Calculator, crown: Crown,
  'file-search': FileSearch, 'file-text': FileText, flag: Flag, folder: Folder, landmark: Landmark, library: Library,
  'line-chart': LineChart, medal: Medal, 'pie-chart': PieChart, presentation: Presentation, rocket: Rocket, swords: Swords,
  target: Target, trophy: Trophy, 'trending-up': TrendingUp,
};
export function DynamicIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || Award;
  return <Icon className={className} />;
}

// ---------------------------------------------------------------- Page header
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Stat tile
export function Stat({
  label,
  value,
  sub,
  icon,
  className,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4', className)}>
      <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
        <span>{label}</span>
        {icon && <span className="text-fg-subtle">{icon}</span>}
      </div>
      <div className={cn('mt-2 font-mono text-2xl font-semibold tabular text-fg', valueClassName)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-fg-muted">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- Badges
export function SampleDataBadge({ asOf, className }: { asOf?: string; className?: string }) {
  return (
    <Badge tone="warn" className={className} title="Curated static sample data for practice. Not live market data.">
      <Database className="h-3 w-3" /> Sample data{asOf ? ` · as of ${asOf}` : ''}
    </Badge>
  );
}

const DIFF_TONE: Record<Difficulty, Tone> = { beginner: 'up', intermediate: 'info', advanced: 'violet', expert: 'down' };
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge tone={DIFF_TONE[difficulty]}>{difficulty}</Badge>;
}

export function RatingBadge({ rating }: { rating: Rating | null | undefined }) {
  if (!rating) return <Badge>No rating</Badge>;
  const tone: Tone = rating === 'BUY' ? 'up' : rating === 'SELL' ? 'down' : 'neutral';
  return <Badge tone={tone} className="font-mono">{rating}</Badge>;
}

export function Delta({ value, digits = 2, className, suffix = '%' }: { value: number | null | undefined; digits?: number; className?: string; suffix?: string }) {
  if (value === null || value === undefined || Number.isNaN(value)) return <span className={cn('text-fg-subtle', className)}>—</span>;
  const up = value > 0;
  const flat = value === 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono tabular', flat ? 'text-fg-muted' : up ? 'text-up' : 'text-down', className)}>
      {!flat && <Icon className="h-3 w-3" />}
      {suffix === '%' ? fmtPct(value, digits, true) : `${up ? '+' : ''}${value.toFixed(digits)}${suffix}`}
    </span>
  );
}

export function scoreTone(score: number | null | undefined, passing = 60): string {
  if (score === null || score === undefined) return 'text-fg-muted';
  if (score >= 85) return 'text-up';
  if (score >= passing) return 'text-accent';
  return 'text-down';
}

export function ScorePill({ score, passing = 60, className }: { score: number | null | undefined; passing?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-xs tabular', scoreTone(score, passing), className)}>
      {score === null || score === undefined ? '—' : fmtScore(score)}
    </span>
  );
}

/** Circular score gauge (0–100). */
export function ScoreRing({ value, size = 120, stroke = 9, label, sub }: { value: number; size?: number; stroke?: number; label?: ReactNode; sub?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold tabular">{label ?? fmtScore(value)}</span>
        {sub && <span className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">{sub}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Markdown
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('prose-fin', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

// ---------------------------------------------------------------- Countdown
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function Countdown({ deadline, className }: { deadline: string; className?: string }) {
  const now = useNow();
  const ms = new Date(deadline).getTime() - now;
  const urgent = ms < 5 * 60 * 1000;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-sm tabular',
        ms <= 0 ? 'border-down/40 bg-down-muted text-down' : urgent ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-border-strong bg-surface-2 text-fg',
        className,
      )}
      title={`Deadline: ${new Date(deadline).toLocaleString()}`}
    >
      <Timer className="h-3.5 w-3.5" />
      {ms <= 0 ? 'Deadline passed' : fmtDuration(ms)}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">{children}</h2>
      {action}
    </div>
  );
}

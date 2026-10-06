import { useMemo, useState, type ReactNode } from 'react';
import { Lightbulb, RotateCcw } from 'lucide-react';
import type { LessonActivity } from '@/types/domain';
import { accretionLab, multiplesLab, npvLab, portfolioLab, ratioLab, waccLab } from '@/lib/finance/calculators';
import { DEFAULT_DCF_INPUTS, runDcf, validateDcf, type DcfInputs } from '@/lib/finance/valuation';
import { Button } from '@/components/ui/button';
import { RatingBadge } from '@/components/common';
import { fmtNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

interface FieldDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

const FIELDS: Record<string, FieldDef[]> = {
  ratios: [
    { key: 'revenue', label: 'Revenue', min: 100, max: 3000, step: 10 },
    { key: 'cogs', label: 'COGS', min: 0, max: 2500, step: 10 },
    { key: 'opex', label: 'Operating expenses', min: 0, max: 1500, step: 10 },
    { key: 'interest', label: 'Interest expense', min: 0, max: 300, step: 5 },
    { key: 'taxRate', label: 'Tax rate', min: 0, max: 40, step: 1, suffix: '%' },
    { key: 'assets', label: 'Total assets', min: 100, max: 5000, step: 50 },
    { key: 'equity', label: 'Equity', min: 50, max: 3000, step: 25 },
    { key: 'currentAssets', label: 'Current assets', min: 0, max: 2000, step: 10 },
    { key: 'inventory', label: 'Inventory', min: 0, max: 1000, step: 10 },
    { key: 'currentLiabilities', label: 'Current liabilities', min: 10, max: 2000, step: 10 },
  ],
  multiples: [
    { key: 'eps', label: 'EPS (₱)', min: 0.5, max: 20, step: 0.1 },
    { key: 'pe', label: 'Target P/E', min: 4, max: 30, step: 0.5, suffix: 'x' },
    { key: 'bvps', label: 'Book value / share (₱)', min: 5, max: 150, step: 1 },
    { key: 'pb', label: 'Target P/B', min: 0.3, max: 4, step: 0.05, suffix: 'x' },
    { key: 'price', label: 'Current price (₱)', min: 5, max: 150, step: 0.5 },
  ],
  wacc: [
    { key: 'rf', label: 'Risk-free rate', min: 0, max: 12, step: 0.1, suffix: '%' },
    { key: 'beta', label: 'Beta', min: 0.2, max: 2.5, step: 0.05 },
    { key: 'mrp', label: 'Market risk premium', min: 2, max: 10, step: 0.1, suffix: '%' },
    { key: 'kd', label: 'Pre-tax cost of debt', min: 2, max: 15, step: 0.1, suffix: '%' },
    { key: 'tax', label: 'Tax rate', min: 0, max: 40, step: 1, suffix: '%' },
    { key: 'debtWeight', label: 'Debt / capital', min: 0, max: 80, step: 1, suffix: '%' },
  ],
  dcf: [
    { key: 'revenueGrowthPct', label: 'Revenue growth', min: -5, max: 25, step: 0.5, suffix: '%' },
    { key: 'ebitMarginPct', label: 'EBIT margin', min: 0, max: 40, step: 0.5, suffix: '%' },
    { key: 'capexPctRevenue', label: 'Capex % revenue', min: 0, max: 20, step: 0.5, suffix: '%' },
    { key: 'waccPct', label: 'WACC', min: 5, max: 15, step: 0.1, suffix: '%' },
    { key: 'terminalGrowthPct', label: 'Terminal growth', min: 0, max: 6, step: 0.1, suffix: '%' },
  ],
  portfolio: [
    { key: 'wEq', label: 'Equities weight', min: 0, max: 100, step: 5, suffix: '%' },
    { key: 'wBd', label: 'Bonds weight', min: 0, max: 100, step: 5, suffix: '%' },
    { key: 'rEq', label: 'Equity expected return', min: 0, max: 20, step: 0.5, suffix: '%' },
    { key: 'rBd', label: 'Bond expected return', min: 0, max: 12, step: 0.5, suffix: '%' },
    { key: 'volEq', label: 'Equity volatility', min: 5, max: 40, step: 1, suffix: '%' },
    { key: 'volBd', label: 'Bond volatility', min: 1, max: 15, step: 0.5, suffix: '%' },
    { key: 'corr', label: 'Equity–bond correlation', min: -1, max: 1, step: 0.05 },
  ],
  accretion: [
    { key: 'acqNi', label: 'Acquirer net income (₱m)', min: 50, max: 2000, step: 10 },
    { key: 'acqShares', label: 'Acquirer shares (m)', min: 10, max: 500, step: 5 },
    { key: 'tgtNi', label: 'Target net income (₱m)', min: 0, max: 500, step: 5 },
    { key: 'newShares', label: 'New shares issued (m)', min: 0, max: 200, step: 1 },
    { key: 'synergies', label: 'After-tax synergies (₱m)', min: 0, max: 200, step: 5 },
  ],
  npv: [
    { key: 'cost', label: 'Upfront cost (₱m)', min: 50, max: 2000, step: 10 },
    { key: 'cashFlow', label: 'Annual cash flow (₱m)', min: 0, max: 400, step: 5 },
    { key: 'years', label: 'Project life (years)', min: 1, max: 25, step: 1 },
    { key: 'rate', label: 'Hurdle rate', min: 2, max: 20, step: 0.5, suffix: '%' },
    { key: 'downside', label: 'Downside: cash flow cut', min: 0, max: 50, step: 5, suffix: '%' },
  ],
};

function Out({ label, value, tone }: { label: string; value: ReactNode; tone?: 'up' | 'down' | 'accent' }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn('mt-0.5 font-mono text-lg font-semibold tabular', tone === 'up' && 'text-up', tone === 'down' && 'text-down', tone === 'accent' && 'text-accent')}>{value}</div>
    </div>
  );
}

const f = (n: number, d = 2, s = '') => (Number.isFinite(n) ? `${fmtNumber(n, d)}${s}` : '—');
const signTone = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : undefined);

function Outputs({ kind, v }: { kind: string; v: Record<string, number> }) {
  if (kind === 'ratios') {
    const r = ratioLab(v as Parameters<typeof ratioLab>[0]);
    return (
      <>
        <Out label="Gross margin" value={f(r.grossMargin, 1, '%')} />
        <Out label="EBIT margin" value={f(r.ebitMargin, 1, '%')} />
        <Out label="Net income" value={f(r.netIncome, 1)} />
        <Out label="ROE" value={f(r.roe, 1, '%')} tone="accent" />
        <Out label="ROA" value={f(r.roa, 1, '%')} />
        <Out label="Equity multiplier" value={f(r.equityMultiplier, 2, 'x')} />
        <Out label="Current ratio" value={f(r.currentRatio, 2, 'x')} />
        <Out label="Quick ratio" value={f(r.quickRatio, 2, 'x')} />
      </>
    );
  }
  if (kind === 'multiples') {
    const m = multiplesLab(v as Parameters<typeof multiplesLab>[0]);
    return (
      <>
        <Out label="Target (P/E)" value={`₱${f(m.tpPe)}`} />
        <Out label="Target (P/B)" value={`₱${f(m.tpPb)}`} />
        <Out label="Blended target" value={`₱${f(m.blended)}`} tone="accent" />
        <Out label="Upside" value={f(m.upside, 1, '%')} tone={signTone(m.upside)} />
        <Out label="Implied rating" value={<RatingBadge rating={m.rating as 'BUY' | 'HOLD' | 'SELL' | null} />} />
      </>
    );
  }
  if (kind === 'wacc') {
    const w = waccLab(v as Parameters<typeof waccLab>[0]);
    return (
      <>
        <Out label="Cost of equity" value={f(w.ke, 2, '%')} />
        <Out label="After-tax cost of debt" value={f(w.kdAfter, 2, '%')} />
        <Out label="WACC" value={f(w.wacc, 2, '%')} tone="accent" />
      </>
    );
  }
  if (kind === 'dcf') {
    const inputs = { ...DEFAULT_DCF_INPUTS, ...v } as DcfInputs;
    const errors = validateDcf(inputs);
    if (errors.length) return <p className="col-span-full text-sm text-down">{errors[0]}</p>;
    const d = runDcf(inputs);
    return (
      <>
        <Out label="Enterprise value" value={f(d.enterpriseValue, 0)} />
        <Out label="Equity value" value={f(d.equityValue, 0)} />
        <Out label="Value per share" value={`₱${f(d.valuePerShare)}`} tone="accent" />
        <Out label="Terminal value share of EV" value={f(d.terminalValueShare, 0, '%')} tone={d.terminalValueShare > 80 ? 'down' : undefined} />
      </>
    );
  }
  if (kind === 'portfolio') {
    const p = portfolioLab({ rCash: 4, rf: 4, ...v } as Parameters<typeof portfolioLab>[0]);
    return (
      <>
        <Out label="Cash weight" value={f(p.cash, 0, '%')} />
        <Out label="Expected return" value={f(p.expected, 2, '%')} />
        <Out label="Volatility" value={f(p.vol, 2, '%')} />
        <Out label="Sharpe ratio" value={f(p.sharpe, 2)} tone="accent" />
        <Out label="Effective positions" value={f(p.effectiveN, 2)} />
      </>
    );
  }
  if (kind === 'accretion') {
    const a = accretionLab(v as Parameters<typeof accretionLab>[0]);
    return (
      <>
        <Out label="Standalone EPS" value={`₱${f(a.standalone)}`} />
        <Out label="Pro forma EPS" value={`₱${f(a.proForma)}`} />
        <Out label="Accretion / (dilution)" value={f(a.accretion, 2, '%')} tone={signTone(a.accretion)} />
        <Out label="Break-even synergies" value={`₱${f(Math.max(0, a.breakEvenSynergies), 1)}m`} />
        <Out label="Max new shares (no synergies)" value={`${f(a.maxSharesNoSynergies, 1)}m`} />
      </>
    );
  }
  const n = npvLab(v as Parameters<typeof npvLab>[0]);
  return (
    <>
      <Out label="NPV" value={`₱${f(n.npv, 1)}m`} tone={signTone(n.npv)} />
      <Out label="IRR" value={n.irr === null ? 'n/a' : f(n.irr, 2, '%')} tone="accent" />
      <Out label="Downside NPV" value={`₱${f(n.downsideNpv, 1)}m`} tone={signTone(n.downsideNpv)} />
      <Out label="Payback" value={Number.isFinite(n.payback) ? `${f(n.payback, 1)} yrs` : '—'} />
      <Out label="Break-even cash flow" value={`₱${f(n.breakEvenCashFlow, 1)}m`} />
    </>
  );
}

export function CalculatorActivity({ activity }: { activity: LessonActivity }) {
  const kind = activity.content.calculator ?? 'ratios';
  const defaults = activity.content.defaults ?? {};
  const [values, setValues] = useState<Record<string, number>>(defaults);
  const fields = FIELDS[kind] ?? [];
  const portfolioOver = kind === 'portfolio' && (values.wEq ?? 0) + (values.wBd ?? 0) > 100;
  const outputs = useMemo(() => <Outputs kind={kind} v={values} />, [kind, values]);

  return (
    <div className="space-y-5">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {fields.map((fd) => (
          <label key={fd.key} className="block text-xs text-fg-muted">
            <div className="mb-1 flex justify-between">
              <span>{fd.label}</span>
              <span className="font-mono text-fg">
                {fmtNumber(values[fd.key] ?? 0, fd.step < 1 ? 2 : 0)}
                {fd.suffix ?? ''}
              </span>
            </div>
            <input
              type="range"
              min={fd.min}
              max={fd.max}
              step={fd.step}
              value={values[fd.key] ?? 0}
              onChange={(e) => setValues((v) => ({ ...v, [fd.key]: Number(e.target.value) }))}
              className="w-full accent-[#f5a524]"
              aria-label={fd.label}
            />
          </label>
        ))}
      </div>
      {portfolioOver && <p className="text-xs text-down">Equities + bonds exceed 100%. Reduce one of them.</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{outputs}</div>
      {!!activity.content.prompts?.length && (
        <div className="rounded-md border border-accent/30 bg-accent/[0.04] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <Lightbulb className="h-3.5 w-3.5" /> Try this
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
            {activity.content.prompts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end">
        <Button size="xs" variant="ghost" onClick={() => setValues(defaults)}>
          <RotateCcw className="h-3 w-3" /> Reset inputs
        </Button>
      </div>
    </div>
  );
}

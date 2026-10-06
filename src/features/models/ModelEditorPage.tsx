import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { getFinancialModel, saveFinancialModel } from '@/services/api/work';
import { computeModel, parseModelData, type FinancialModelData, type ForecastAssumption, type HistoricalYear, type ModelRow } from '@/lib/finance/model';
import type { FinancialModelRecord } from '@/types/domain';
import { usePatchAutosave } from '@/hooks/usePatchAutosave';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Select, Textarea } from '@/components/ui/form';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { SaveIndicator } from '@/features/challenges/TaskWorkspace';
import { fmtNumber, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';

function Cell({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        step="any"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={cn('h-8 w-full min-w-[84px] rounded border border-transparent bg-accent/[0.06] px-2 text-right font-mono text-[0.82rem] tabular text-info hover:border-border-strong focus:border-accent/60 focus:outline-none', suffix && 'pr-6')}
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-fg-subtle">{suffix}</span>}
    </div>
  );
}

type RowDef = { label: string; get: (r: ModelRow) => number | null; pct?: boolean; bold?: boolean; indent?: boolean; hist?: keyof HistoricalYear; fc?: keyof ForecastAssumption };

const ROWS: RowDef[] = [
  { label: 'Revenue', get: (r) => r.revenue, bold: true, hist: 'revenue' },
  { label: 'Revenue growth', get: (r) => r.revenueGrowthPct, pct: true, indent: true, fc: 'revenueGrowthPct' },
  { label: 'COGS', get: (r) => -r.cogs, hist: 'cogs' },
  { label: 'Gross profit', get: (r) => r.grossProfit, bold: true },
  { label: 'Gross margin', get: (r) => r.grossMarginPct, pct: true, indent: true, fc: 'grossMarginPct' },
  { label: 'Operating expenses', get: (r) => -r.opex, hist: 'opex' },
  { label: 'Opex % revenue', get: (r) => r.opexPctRevenue, pct: true, indent: true, fc: 'opexPctRevenue' },
  { label: 'EBIT', get: (r) => r.ebit, bold: true },
  { label: 'EBIT margin', get: (r) => r.ebitMarginPct, pct: true, indent: true },
  { label: 'Taxes', get: (r) => -r.taxes, hist: 'taxes' },
  { label: 'Effective tax rate', get: (r) => r.taxRatePct, pct: true, indent: true, fc: 'taxRatePct' },
  { label: 'Net income', get: (r) => r.netIncome, bold: true },
  { label: 'Net margin', get: (r) => r.netMarginPct, pct: true, indent: true },
];

export default function ModelEditorPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['financialModel', id], queryFn: () => getFinancialModel(id) });
  if (q.isPending) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <EmptyState title="Model not found" action={<Link to="/models" className="text-accent">Back to models</Link>} />;
  return <Editor key={q.data.id} model={q.data} />;
}

function Editor({ model }: { model: FinancialModelRecord }) {
  const qc = useQueryClient();
  const [meta, setMeta] = useState({ name: model.name, company: model.company, ticker: model.ticker, currency: model.currency, unit: model.unit, notes: model.notes });
  const [data, setData] = useState<FinancialModelData>(() => parseModelData(model.data));
  const autosave = usePatchAutosave<Pick<FinancialModelRecord, 'name' | 'company' | 'ticker' | 'currency' | 'unit' | 'data' | 'notes'>>(async (patch) => {
    await saveFinancialModel({ ...meta, data, ...patch } as Parameters<typeof saveFinancialModel>[0], model.id);
    qc.invalidateQueries({ queryKey: ['financialModels'] });
  });

  const rows = useMemo(() => computeModel(data), [data]);
  const updateData = (next: FinancialModelData) => {
    setData(next);
    autosave.queue({ data: next });
  };
  const setHist = (i: number, k: keyof HistoricalYear, v: number | string) =>
    updateData({ ...data, historical: data.historical.map((h, j) => (j === i ? { ...h, [k]: v } : h)) });
  const setFc = (i: number, k: keyof ForecastAssumption, v: number | string) =>
    updateData({ ...data, forecast: data.forecast.map((f, j) => (j === i ? { ...f, [k]: v } : f)) });
  const setM = <K extends keyof typeof meta>(k: K, v: (typeof meta)[K]) => {
    setMeta((m) => ({ ...m, [k]: v }));
    autosave.queue({ [k]: v });
  };
  const yearNum = (label: string) => Number(label.match(/\d{4}/)?.[0] ?? new Date().getFullYear());

  const addHistorical = () => {
    const first = data.historical[0];
    const label = first ? `FY${yearNum(first.label) - 1}` : `FY${new Date().getFullYear() - 1}`;
    updateData({ ...data, historical: [{ label, revenue: 0, cogs: 0, opex: 0, taxes: 0 }, ...data.historical] });
  };
  const addForecast = () => {
    const last = data.forecast[data.forecast.length - 1] ?? null;
    const lastHist = data.historical[data.historical.length - 1];
    const base = last ? yearNum(last.label) : lastHist ? yearNum(lastHist.label) : new Date().getFullYear();
    updateData({
      ...data,
      forecast: [...data.forecast, last ? { ...last, label: `FY${base + 1}E` } : { label: `FY${base + 1}E`, revenueGrowthPct: 5, grossMarginPct: 30, opexPctRevenue: 15, taxRatePct: 25 }],
    });
  };

  const chart = rows.map((r) => ({ name: r.label, Revenue: Math.round(r.revenue * 10) / 10, 'Net income': Math.round(r.netIncome * 10) / 10, 'EBIT margin': r.ebitMarginPct }));

  return (
    <div className="animate-fade-in">
      <Link to="/models" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Financial Models
      </Link>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input value={meta.name} onChange={(e) => setM('name', e.target.value)} className="bg-transparent text-2xl font-semibold tracking-tight focus:outline-none" aria-label="Model name" maxLength={160} />
        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator state={autosave.state} savedAt={autosave.savedAt} />
          <Input value={meta.company} onChange={(e) => setM('company', e.target.value)} placeholder="Company" className="w-44" aria-label="Company" />
          <Select value={meta.currency} onChange={(e) => setM('currency', e.target.value)} className="w-24" aria-label="Currency">
            <option>PHP</option>
            <option>USD</option>
          </Select>
          <Select value={meta.unit} onChange={(e) => setM('unit', e.target.value as FinancialModelRecord['unit'])} className="w-32" aria-label="Unit">
            <option value="units">Units</option>
            <option value="thousands">Thousands</option>
            <option value="millions">Millions</option>
            <option value="billions">Billions</option>
          </Select>
        </div>
      </div>
      {autosave.error && <div className="mb-3"><InlineError message={autosave.error} /></div>}

      <Card className="mb-4">
        <CardHeader
          title="Income statement"
          subtitle={<span>Blue cells are inputs. Historical: enter line items. Forecast: enter assumptions. Everything else is calculated. Figures in {meta.currency} {meta.unit}.</span>}
          action={
            <div className="flex gap-2">
              <Button size="xs" variant="outline" onClick={addHistorical}>
                <Plus className="h-3 w-3" /> Historical year
              </Button>
              <Button size="xs" variant="outline" onClick={addForecast}>
                <Plus className="h-3 w-3" /> Forecast year
              </Button>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[180px] border-b border-border bg-surface px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Line item</th>
                {data.historical.map((h, i) => (
                  <th key={`h${i}`} className="border-b border-border bg-surface-2/60 px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input value={h.label} onChange={(e) => setHist(i, 'label', e.target.value)} className="w-20 bg-transparent text-right font-mono text-xs text-fg focus:outline-none" aria-label="Year label" />
                      <button onClick={() => updateData({ ...data, historical: data.historical.filter((_, j) => j !== i) })} className="text-fg-subtle hover:text-down" aria-label={`Remove ${h.label}`}>
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-[0.6rem] font-normal uppercase text-fg-subtle">Actual</div>
                  </th>
                ))}
                {data.forecast.map((f, i) => (
                  <th key={`f${i}`} className="border-b border-border bg-accent/[0.04] px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input value={f.label} onChange={(e) => setFc(i, 'label', e.target.value)} className="w-20 bg-transparent text-right font-mono text-xs text-accent focus:outline-none" aria-label="Year label" />
                      <button onClick={() => updateData({ ...data, forecast: data.forecast.filter((_, j) => j !== i) })} className="text-fg-subtle hover:text-down" aria-label={`Remove ${f.label}`}>
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-[0.6rem] font-normal uppercase text-accent/70">Forecast</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((def) => (
                <tr key={def.label} className={cn(def.bold && 'bg-surface-2/40')}>
                  <td className={cn('sticky left-0 z-10 border-b border-border/60 bg-surface px-3 py-1.5', def.bold ? 'font-semibold' : 'text-fg-muted', def.indent && 'pl-6 text-xs italic')}>{def.label}</td>
                  {rows.map((r, i) => {
                    const isHist = r.type === 'historical';
                    const fi = i - data.historical.length;
                    if (isHist && def.hist) {
                      return (
                        <td key={i} className="border-b border-border/60 px-1 py-1">
                          <Cell value={data.historical[i][def.hist] as number} onChange={(v) => setHist(i, def.hist!, v)} />
                        </td>
                      );
                    }
                    if (!isHist && def.fc) {
                      return (
                        <td key={i} className="border-b border-border/60 bg-accent/[0.02] px-1 py-1">
                          <Cell value={data.forecast[fi][def.fc] as number} onChange={(v) => setFc(fi, def.fc!, v)} suffix="%" />
                        </td>
                      );
                    }
                    const v = def.get(r);
                    return (
                      <td key={i} className={cn('border-b border-border/60 px-3 py-1.5 text-right font-mono text-[0.82rem] tabular', !isHist && 'bg-accent/[0.02]', def.pct && 'text-xs text-fg-muted', v !== null && v < 0 && !def.pct && 'text-fg-muted')}>
                        {v === null ? '—' : def.pct ? fmtPct(v, 1) : v < 0 ? `(${fmtNumber(-v, 1)})` : fmtNumber(v, 1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Revenue, net income & EBIT margin" />
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart}>
                  <CartesianGrid stroke="#1c2430" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} unit="%" />
                  <Tooltip contentStyle={{ background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 }} cursor={{ fill: '#ffffff08' }} formatter={(v, n) => (n === 'EBIT margin' ? fmtPct(Number(v), 1) : fmtNumber(Number(v), 1))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="l" dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="l" dataKey="Net income" fill="#f5a524" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="r" dataKey="EBIT margin" stroke="#22c55e" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Assumption notes" subtitle="Justify every forecast assumption." action={<Badge tone="info">{rows.filter((r) => r.type === 'forecast').length} forecast yrs</Badge>} />
          <CardContent>
            <Textarea rows={10} value={meta.notes} onChange={(e) => setM('notes', e.target.value)} maxLength={5000} placeholder="e.g. Growth fades from 10% to 8% as store openings slow; gross margin +50bp/yr from procurement scale…" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

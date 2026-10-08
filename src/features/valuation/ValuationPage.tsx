import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Calculator, FolderOpen, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { deleteValuationModel, listValuationModels, saveValuationModel } from '@/services/api/work';
import {
  DEFAULT_DCF_INPUTS, dcfSensitivity, median, pbTargetPrice, peTargetPrice, ratingFromUpside, runDcf, upsidePct, validateDcf,
  type DcfInputs,
} from '@/lib/finance/valuation';
import { Delta, PageHeader, RatingBadge } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Textarea } from '@/components/ui/form';
import { Modal, Tabs, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError } from '@/components/ui/states';
import { SecurityPicker } from '@/features/shared/WorkHelpers';
import { fmtMoney, fmtNumber, fmtPct, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ValuationModel } from '@/types/domain';

type Method = 'pe' | 'pb' | 'dcf';

interface Company {
  company: string;
  ticker: string;
  currency: string;
  currentPrice: number | null;
}

function NumberInput({ label, value, onChange, step = 'any', suffix, hint }: { label: string; value: number; onChange: (v: number) => void; step?: string; suffix?: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input type="number" step={step} value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} className={cn('font-mono tabular', suffix && 'pr-8')} />
        {suffix && <span className="pointer-events-none absolute right-3 top-2 text-sm text-fg-subtle">{suffix}</span>}
      </div>
    </Field>
  );
}

function ResultPanel({ target, current, currency, extra }: { target: number | null; current: number | null; currency: string; extra?: React.ReactNode }) {
  const up = target !== null && current ? upsidePct(target, current) : null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-accent/30 bg-accent-muted p-4">
        <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">Target price</div>
        <div className="mt-1 font-mono text-2xl font-semibold tabular">{target !== null && Number.isFinite(target) ? fmtMoney(target, currency) : '—'}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Upside vs current</div>
        <div className="mt-1 text-xl">
          <Delta value={up} />
        </div>
        <div className="mt-0.5 text-xs text-fg-muted">Current {fmtMoney(current, currency)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">Implied rating (±10%)</div>
        <div className="mt-2">
          <RatingBadge rating={ratingFromUpside(up)} />
        </div>
        {extra}
      </div>
    </div>
  );
}

export default function ValuationPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const models = useQuery({ queryKey: ['valuationModels', user!.id], queryFn: () => listValuationModels(user!.id) });
  const [method, setMethod] = useState<Method>('pe');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [co, setCo] = useState<Company>({ company: '', ticker: '', currency: 'PHP', currentPrice: null });
  // P/E
  const [eps, setEps] = useState(4.2);
  const [peers, setPeers] = useState('11, 12, 13');
  const [peOverride, setPeOverride] = useState<number>(NaN);
  // P/B
  const [bvps, setBvps] = useState(30);
  const [pb, setPb] = useState(1.6);
  const [roe, setRoe] = useState<number>(NaN);
  const [coe, setCoe] = useState<number>(NaN);
  const [gPb, setGPb] = useState<number>(NaN);
  // DCF
  const [dcf, setDcf] = useState<DcfInputs>(DEFAULT_DCF_INPUTS);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const peerList = peers.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const peerMedian = median(peerList);
  const targetPE = Number.isFinite(peOverride) ? peOverride : peerMedian ?? NaN;
  const peTarget = Number.isFinite(eps) && Number.isFinite(targetPE) ? peTargetPrice(eps, targetPE) : null;
  const justifiedPb = Number.isFinite(roe) && Number.isFinite(coe) && Number.isFinite(gPb) && coe > gPb ? (roe - gPb) / (coe - gPb) : null;
  const pbTarget = Number.isFinite(bvps) && Number.isFinite(pb) ? pbTargetPrice(bvps, pb) : null;
  const dcfErrors = validateDcf(dcf);
  const dcfResult = useMemo(() => (dcfErrors.length ? null : runDcf(dcf)), [dcf, dcfErrors.length]);
  const sensitivity = useMemo(() => (dcfErrors.length ? null : dcfSensitivity(dcf)), [dcf, dcfErrors.length]);
  const setD = (k: keyof DcfInputs) => (v: number) => setDcf((d) => ({ ...d, [k]: v }));

  const current = () => {
    if (method === 'pe') return { inputs: { eps, peers: peerList, targetPE }, outputs: { targetPrice: peTarget } };
    if (method === 'pb') return { inputs: { bvps, targetPB: pb, roe, coe, g: gPb }, outputs: { targetPrice: pbTarget, justifiedPB: justifiedPb } };
    return {
      inputs: dcf as unknown as Record<string, unknown>,
      outputs: dcfResult
        ? { targetPrice: dcfResult.valuePerShare, enterpriseValue: dcfResult.enterpriseValue, equityValue: dcfResult.equityValue, terminalValueShare: dcfResult.terminalValueShare }
        : {},
    };
  };

  const save = useMutation({
    mutationFn: () => {
      const { inputs, outputs } = current();
      return saveValuationModel(
        { name: name.trim(), company: co.company, ticker: co.ticker, method, currency: co.currency, current_price: co.currentPrice, inputs, outputs, notes },
        loadedId ?? undefined,
      );
    },
    onSuccess: (m) => {
      setLoadedId(m.id);
      setSaveOpen(false);
      qc.invalidateQueries({ queryKey: ['valuationModels'] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      toast.success('Valuation model saved');
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteValuationModel(id),
    onSuccess: (_, id) => {
      if (id === loadedId) setLoadedId(null);
      qc.invalidateQueries({ queryKey: ['valuationModels'] });
      toast('Model deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const load = (m: ValuationModel) => {
    setLoadedId(m.id);
    setMethod(m.method);
    setName(m.name);
    setNotes(m.notes);
    setCo({ company: m.company, ticker: m.ticker, currency: m.currency, currentPrice: m.current_price !== null ? Number(m.current_price) : null });
    const i = m.inputs as Record<string, unknown>;
    if (m.method === 'pe') {
      setEps(Number(i.eps));
      setPeers(((i.peers as number[]) ?? []).join(', '));
      setPeOverride(NaN);
    } else if (m.method === 'pb') {
      setBvps(Number(i.bvps));
      setPb(Number(i.targetPB));
      setRoe(Number(i.roe));
      setCoe(Number(i.coe));
      setGPb(Number(i.g));
    } else setDcf({ ...DEFAULT_DCF_INPUTS, ...(i as Partial<DcfInputs>) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chartData = dcfResult
    ? [...dcfResult.rows.map((r) => ({ name: `Y${r.year}`, pv: r.pvFcff })), { name: 'TV', pv: dcfResult.pvTerminalValue }]
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Valuation"
        title="Value the business"
        description="Value a company with multiples or a simple DCF. Built for learning, not for real investment decisions."
        actions={
          <>
            <Badge tone="warn">
              <AlertTriangle className="h-3 w-3" /> Simplified beta model
            </Badge>
            <Button variant="primary" onClick={() => (setName((n) => n || `${co.ticker || 'Untitled'} ${method.toUpperCase()}`), setSaveOpen(true))}>
              <Save className="h-4 w-4" /> {loadedId ? 'Save changes' : 'Save model'}
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Field label="Company">
              <SecurityPicker
                onPick={(s) => {
                  setCo({ company: s.name, ticker: s.symbol, currency: s.currency, currentPrice: s.price });
                  if (s.eps) setEps(s.eps);
                  if (s.bvps) setBvps(s.bvps);
                  if (s.revenue && s.sharesOutstanding) {
                    const unit = 1e6;
                    setDcf((d) => ({ ...d, baseRevenue: Math.round(s.revenue! / unit), sharesOutstanding: Math.round(s.sharesOutstanding! / unit) }));
                  }
                }}
              />
            </Field>
          </div>
          <Field label="Name">
            <Input value={co.company} onChange={(e) => setCo({ ...co, company: e.target.value })} placeholder="Company name" />
          </Field>
          <Field label="Ticker">
            <Input value={co.ticker} onChange={(e) => setCo({ ...co, ticker: e.target.value.toUpperCase() })} className="font-mono" />
          </Field>
          <Field label={`Current price (${co.currency})`}>
            <Input type="number" step="any" value={co.currentPrice ?? ''} onChange={(e) => setCo({ ...co, currentPrice: e.target.value ? Number(e.target.value) : null })} className="font-mono" />
          </Field>
        </CardContent>
      </Card>

      <Tabs
        className="mb-4"
        value={method}
        onChange={setMethod}
        tabs={[
          { value: 'pe', label: 'P/E multiple' },
          { value: 'pb', label: 'P/B multiple' },
          { value: 'dcf', label: 'Simplified DCF' },
        ]}
      />

      {method === 'pe' && (
        <Card>
          <CardHeader title="Target price = EPS × Target P/E" icon={<Calculator className="h-3.5 w-3.5" />} />
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberInput label="EPS (forward)" value={eps} onChange={setEps} />
              <Field label="Peer P/E multiples" hint={peerMedian !== null ? `Median ${fmtNumber(peerMedian, 2)}x` : 'Comma-separated'}>
                <Input value={peers} onChange={(e) => setPeers(e.target.value)} className="font-mono" placeholder="11, 12, 13" />
              </Field>
              <NumberInput label="Target P/E override (optional)" value={peOverride} onChange={setPeOverride} suffix="x" hint="Leave blank to use the peer median" />
            </div>
            <ResultPanel target={peTarget} current={co.currentPrice} currency={co.currency} extra={<div className="mt-1 text-xs text-fg-muted">Using {fmtNumber(targetPE, 2)}x</div>} />
          </CardContent>
        </Card>
      )}

      {method === 'pb' && (
        <Card>
          <CardHeader title="Target price = BVPS × Target P/B" icon={<Calculator className="h-3.5 w-3.5" />} />
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput label="Book value per share" value={bvps} onChange={setBvps} />
              <NumberInput label="Target P/B" value={pb} onChange={setPb} suffix="x" />
            </div>
            <div className="rounded-md border border-border bg-surface-2 p-4">
              <div className="mb-3 text-xs text-fg-muted">
                Optional: justified P/B = (ROE − g) / (COE − g). Useful for banks.
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <NumberInput label="ROE" value={roe} onChange={setRoe} suffix="%" />
                <NumberInput label="Cost of equity" value={coe} onChange={setCoe} suffix="%" />
                <NumberInput label="Growth" value={gPb} onChange={setGPb} suffix="%" />
                <div className="flex items-end">
                  <Button size="md" variant="outline" disabled={justifiedPb === null} onClick={() => justifiedPb !== null && setPb(Number(justifiedPb.toFixed(2)))} className="w-full justify-center">
                    Use {justifiedPb !== null ? `${justifiedPb.toFixed(2)}x` : '—'}
                  </Button>
                </div>
              </div>
            </div>
            <ResultPanel target={pbTarget} current={co.currentPrice} currency={co.currency} />
          </CardContent>
        </Card>
      )}

      {method === 'dcf' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Simplified DCF inputs" subtitle="FCFF = EBIT × (1 − tax) + D&A − CapEx − ΔNWC. Figures in millions." icon={<Calculator className="h-3.5 w-3.5" />} />
            <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <NumberInput label="Base revenue" value={dcf.baseRevenue} onChange={setD('baseRevenue')} />
              <NumberInput label="Years" value={dcf.years} onChange={setD('years')} step="1" />
              <NumberInput label="Revenue growth" value={dcf.revenueGrowthPct} onChange={setD('revenueGrowthPct')} suffix="%" />
              <NumberInput label="EBIT margin" value={dcf.ebitMarginPct} onChange={setD('ebitMarginPct')} suffix="%" />
              <NumberInput label="Tax rate" value={dcf.taxRatePct} onChange={setD('taxRatePct')} suffix="%" />
              <NumberInput label="D&A % revenue" value={dcf.daPctRevenue} onChange={setD('daPctRevenue')} suffix="%" />
              <NumberInput label="CapEx % revenue" value={dcf.capexPctRevenue} onChange={setD('capexPctRevenue')} suffix="%" />
              <NumberInput label="NWC % revenue" value={dcf.nwcPctRevenue} onChange={setD('nwcPctRevenue')} suffix="%" hint="ΔNWC = % × Δrevenue" />
              <NumberInput label="WACC" value={dcf.waccPct} onChange={setD('waccPct')} suffix="%" />
              <NumberInput label="Terminal growth" value={dcf.terminalGrowthPct} onChange={setD('terminalGrowthPct')} suffix="%" />
              <NumberInput label="Net debt" value={dcf.netDebt} onChange={setD('netDebt')} />
              <NumberInput label="Shares (millions)" value={dcf.sharesOutstanding} onChange={setD('sharesOutstanding')} />
            </CardContent>
          </Card>
          {dcfErrors.length > 0 ? (
            <InlineError message={dcfErrors.join(' ')} />
          ) : (
            dcfResult && (
              <>
                <ResultPanel
                  target={dcfResult.valuePerShare}
                  current={co.currentPrice}
                  currency={co.currency}
                  extra={<div className="mt-1 text-xs text-fg-muted">TV = {fmtPct(dcfResult.terminalValueShare, 0)} of EV</div>}
                />
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader title="Projection" />
                    <Table>
                      <thead>
                        <tr>
                          <Th>Year</Th>
                          <Th align="right">Revenue</Th>
                          <Th align="right">EBIT</Th>
                          <Th align="right">NOPAT</Th>
                          <Th align="right">FCFF</Th>
                          <Th align="right">PV</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {dcfResult.rows.map((r) => (
                          <tr key={r.year}>
                            <Td mono>Y{r.year}</Td>
                            <Td align="right" mono>{fmtNumber(r.revenue, 1)}</Td>
                            <Td align="right" mono>{fmtNumber(r.ebit, 1)}</Td>
                            <Td align="right" mono>{fmtNumber(r.nopat, 1)}</Td>
                            <Td align="right" mono>{fmtNumber(r.fcff, 1)}</Td>
                            <Td align="right" mono>{fmtNumber(r.pvFcff, 1)}</Td>
                          </tr>
                        ))}
                        <tr className="text-fg-muted">
                          <Td>Terminal</Td>
                          <Td align="right" mono className="text-xs">TV {fmtNumber(dcfResult.terminalValue, 1)}</Td>
                          <Td />
                          <Td />
                          <Td />
                          <Td align="right" mono>{fmtNumber(dcfResult.pvTerminalValue, 1)}</Td>
                        </tr>
                        <tr className="font-semibold">
                          <Td>Enterprise value</Td>
                          <Td />
                          <Td />
                          <Td />
                          <Td />
                          <Td align="right" mono>{fmtNumber(dcfResult.enterpriseValue, 1)}</Td>
                        </tr>
                        <tr>
                          <Td>− Net debt</Td>
                          <Td />
                          <Td />
                          <Td />
                          <Td />
                          <Td align="right" mono>{fmtNumber(dcf.netDebt, 1)}</Td>
                        </tr>
                        <tr className="font-semibold text-accent">
                          <Td>Equity value</Td>
                          <Td />
                          <Td />
                          <Td />
                          <Td />
                          <Td align="right" mono>{fmtNumber(dcfResult.equityValue, 1)}</Td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card>
                  <Card>
                    <CardHeader title="Value build (present value)" />
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid stroke="#1c2430" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{ background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 }} formatter={(v) => fmtNumber(Number(v), 1)} cursor={{ fill: '#ffffff08' }} />
                            <Bar dataKey="pv" fill="#f5a524" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {sensitivity && (
                  <Card>
                    <CardHeader title="Sensitivity: value per share" subtitle="Rows: WACC · Columns: terminal growth" />
                    <Table>
                      <thead>
                        <tr>
                          <Th>WACC \ g</Th>
                          {sensitivity[0].values.map((v) => (
                            <Th key={v.g} align="right">
                              {fmtPct(v.g, 2)}
                            </Th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivity.map((row) => (
                          <tr key={row.wacc}>
                            <Td mono className="text-fg-muted">
                              {fmtPct(row.wacc, 1)}
                            </Td>
                            {row.values.map((v) => {
                              const base = row.wacc === dcf.waccPct && v.g === dcf.terminalGrowthPct;
                              return (
                                <Td key={v.g} align="right" mono className={cn(base && 'bg-accent-muted font-semibold text-accent')}>
                                  {v.value === null ? '—' : fmtNumber(v.value, 2)}
                                </Td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                )}
              </>
            )
          )}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader title="Saved valuation models" icon={<FolderOpen className="h-3.5 w-3.5" />} />
        {models.isPending ? (
          <div className="mx-4 mb-4 h-16 animate-pulse rounded bg-surface-3" />
        ) : models.isError ? (
          <ErrorState error={models.error} onRetry={() => models.refetch()} />
        ) : !models.data.length ? (
          <EmptyState title="No saved models" description="Save a valuation to build your proof-of-work. Saved models count on your Finance Passport." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Method</Th>
                <Th align="right">Target</Th>
                <Th align="right">Current</Th>
                <Th align="right">Updated</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {models.data.map((m) => (
                <tr key={m.id} className={cn('hover:bg-surface-2', m.id === loadedId && 'bg-surface-2')}>
                  <Td>
                    <button className="text-left hover:text-accent" onClick={() => load(m)}>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-fg-muted">{m.company || m.ticker}</div>
                    </button>
                  </Td>
                  <Td>
                    <Badge>{m.method}</Badge>
                  </Td>
                  <Td align="right" mono>{fmtMoney((m.outputs as { targetPrice?: number }).targetPrice ?? null, m.currency)}</Td>
                  <Td align="right" mono>{fmtMoney(m.current_price, m.currency)}</Td>
                  <Td align="right" className="text-xs text-fg-subtle">{timeAgo(m.updated_at)}</Td>
                  <Td align="right">
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(m.id)} aria-label={`Delete ${m.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={loadedId ? 'Save changes' : 'Save valuation model'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending} disabled={!name.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Model name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={160} autoFocus />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={5000} placeholder="Key assumptions, peer set rationale…" />
          </Field>
          <InlineError message={save.error ? (save.error as Error).message : null} />
        </div>
      </Modal>
    </div>
  );
}

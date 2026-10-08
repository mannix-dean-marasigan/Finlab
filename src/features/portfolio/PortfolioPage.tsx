import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { History, PieChart as PieIcon, RotateCcw, Send, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress } from '@/app/queries';
import { executeTrade, fetchPortfolio, resetPortfolio } from '@/services/api/markets';
import { fxToBase, marketData } from '@/services/marketData';
import { computePortfolio, concentrationLabel } from '@/lib/finance/portfolio';
import { Delta, PageHeader, SampleDataBadge, Stat } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Segmented, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime, fmtMoney, fmtNumber, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';

const COLORS = ['#f5a524', '#3b82f6', '#22c55e', '#a78bfa', '#f43f5e', '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#8b98a8'];

export default function PortfolioPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const pf = useQuery({ queryKey: ['portfolio', user!.id], queryFn: () => fetchPortfolio(user!.id) });
  const secs = useQuery({ queryKey: ['securities', 'ALL'], queryFn: () => marketData.listSecurities() });
  const fx = useQuery({ queryKey: ['fx'], queryFn: () => marketData.getFxRates() });

  const [securityId, setSecurityId] = useState(params.get('security') ?? '');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState('');
  const [rationale, setRationale] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const metrics = useMemo(() => {
    if (!pf.data || !secs.data || !fx.data) return null;
    const bySec = new Map(secs.data.map((s) => [s.id, s]));
    return computePortfolio(
      pf.data.positions.map((p) => {
        const s = bySec.get(p.security_id);
        return {
          securityId: p.security_id,
          shares: p.shares,
          avgCostLocal: p.avg_cost_local,
          costBasisBase: p.cost_basis_base,
          priceLocal: s?.price ?? p.avg_cost_local,
          fxToBase: s ? fxToBase(fx.data, s.currency) : 1,
        };
      }),
      pf.data.portfolio.cash,
      pf.data.portfolio.starting_capital,
      pf.data.portfolio.realized_pl,
    );
  }, [pf.data, secs.data, fx.data]);

  const selected = secs.data?.find((s) => s.id === securityId);
  const rate = selected && fx.data ? fxToBase(fx.data, selected.currency) : 1;
  const qty = Math.floor(Number(shares) || 0);
  const estimate = selected ? qty * selected.price * rate : 0;
  const held = pf.data?.positions.find((p) => p.security_id === securityId)?.shares ?? 0;
  const tradeError =
    !selected ? null : qty <= 0 ? null : side === 'buy' && estimate > (pf.data?.portfolio.cash ?? 0) ? 'Not enough simulated cash.' : side === 'sell' && qty > held ? `You hold ${fmtNumber(held, 0)} shares.` : null;

  const trade = useMutation({
    mutationFn: () => executeTrade({ securityId, side, shares: qty, rationale }),
    onSuccess: (r) => {
      toast.success(`${r.side === 'buy' ? 'Bought' : 'Sold'} ${fmtNumber(r.shares, 0)} ${r.security_id.split(':')[1]} for ${fmtMoney(r.amount_base)}`);
      setShares('');
      setRationale('');
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      invalidateProgress(qc);
    },
  });
  const reset = useMutation({
    mutationFn: resetPortfolio,
    onSuccess: () => {
      setConfirmReset(false);
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      invalidateProgress(qc);
      toast('Portfolio reset to starting capital');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (pf.isPending || secs.isPending || fx.isPending) return <PageSkeleton />;
  if (pf.isError) return <ErrorState error={pf.error} onRetry={() => pf.refetch()} />;
  if (secs.isError) return <ErrorState error={secs.error} onRetry={() => secs.refetch()} />;
  if (fx.isError) return <ErrorState error={fx.error} onRetry={() => fx.refetch()} />;

  const p = pf.data.portfolio;
  const m = metrics!;
  const conc = concentrationLabel(m);
  const bySec = new Map(secs.data.map((s) => [s.id, s]));
  const pieData = [...m.positions.map((x) => ({ name: x.securityId.split(':')[1], value: x.marketValueBase })), ...(m.cash > 0 ? [{ name: 'Cash', value: m.cash }] : [])];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Portfolio Simulator"
        title={p.name}
        description="Practice money only. Trades fill at the current sample price, converted to pesos. Every trade needs a short reason."
        actions={
          <>
            <SampleDataBadge />
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total value" value={fmtMoney(m.totalValue, 'PHP', 0)} sub={<>Start {fmtMoney(p.starting_capital, 'PHP', 0)}</>} />
        <Stat label="Return" value={<Delta value={m.totalReturnPct} />} sub="Since start / last reset" />
        <Stat label="Cash" value={fmtMoney(m.cash, 'PHP', 0)} sub={`${fmtPct(m.cashWeightPct, 1)} of portfolio`} />
        <Stat label="Unrealized P/L" value={<span className={m.unrealizedPl >= 0 ? 'text-up' : 'text-down'}>{fmtMoney(m.unrealizedPl, 'PHP', 0)}</span>} sub={<>Realized {fmtMoney(m.realizedPl, 'PHP', 0)}</>} />
        <Stat
          label="Concentration"
          value={<span className={conc.tone === 'up' ? 'text-up' : conc.tone === 'warn' ? 'text-amber-400' : 'text-down'}>{fmtNumber(m.effectivePositions, 1)}</span>}
          sub={`${conc.label} · effective positions · top ${fmtPct(m.largestWeightPct, 0)}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader title="Positions" icon={<Wallet className="h-3.5 w-3.5" />} />
            {!m.positions.length ? (
              <EmptyState title="No positions yet" description="Use the trade ticket to make your first simulated investment decision." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Security</Th>
                    <Th align="right">Shares</Th>
                    <Th align="right">Avg cost</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">Value (PHP)</Th>
                    <Th align="right">Unrealized P/L</Th>
                    <Th align="right">Weight</Th>
                  </tr>
                </thead>
                <tbody>
                  {m.positions.map((x) => {
                    const s = bySec.get(x.securityId);
                    return (
                      <tr key={x.securityId} className="cursor-pointer hover:bg-surface-2" onClick={() => setSecurityId(x.securityId)}>
                        <Td>
                          <span className="font-mono font-semibold">{x.securityId.split(':')[1]}</span>
                          <span className="ml-1 text-xs text-fg-subtle">{s?.exchange}</span>
                        </Td>
                        <Td align="right" mono>{fmtNumber(x.shares, 0)}</Td>
                        <Td align="right" mono>{fmtMoney(x.avgCostLocal, s?.currency)}</Td>
                        <Td align="right" mono>{fmtMoney(x.priceLocal, s?.currency)}</Td>
                        <Td align="right" mono>{fmtMoney(x.marketValueBase, 'PHP', 0)}</Td>
                        <Td align="right">
                          <span className={cn('font-mono tabular', x.unrealizedPl >= 0 ? 'text-up' : 'text-down')}>{fmtMoney(x.unrealizedPl, 'PHP', 0)}</span>
                          <div className="text-xs"><Delta value={x.unrealizedPlPct} /></div>
                        </Td>
                        <Td align="right" mono>{fmtPct(x.weightPct, 1)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Decision log" subtitle="Your last 50 trades with the reasoning behind them" icon={<History className="h-3.5 w-3.5" />} />
            {!pf.data.transactions.length ? (
              <EmptyState title="No trades yet" />
            ) : (
              <ul>
                {pf.data.transactions.map((t) => (
                  <li key={t.id} className="border-t border-border/70 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Badge tone={t.side === 'buy' ? 'up' : 'down'}>{t.side}</Badge>
                        <span className="font-mono">{fmtNumber(t.shares, 0)} {t.security_id.split(':')[1]}</span>
                        <span className="text-fg-muted">@ {fmtNumber(t.price_local, 2)}</span>
                      </span>
                      <span className="font-mono text-xs text-fg-muted">
                        {fmtMoney(t.amount_base, 'PHP', 0)}
                        {t.realized_pl_base !== null && <span className={cn('ml-2', t.realized_pl_base >= 0 ? 'text-up' : 'text-down')}>P/L {fmtMoney(t.realized_pl_base, 'PHP', 0)}</span>}
                        <span className="ml-2 text-fg-subtle">{fmtDateTime(t.created_at)}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">"{t.rationale}"</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-accent/30">
            <CardHeader title="Trade ticket" icon={<Send className="h-3.5 w-3.5 text-accent" />} />
            <CardContent className="space-y-4">
              <Segmented
                value={side}
                onChange={setSide}
                className="w-full"
                options={[
                  { value: 'buy', label: <span className="px-6">Buy</span> },
                  { value: 'sell', label: <span className="px-6">Sell</span> },
                ]}
              />
              <Field label="Security">
                <Select value={securityId} onChange={(e) => setSecurityId(e.target.value)}>
                  <option value="">Select…</option>
                  {secs.data.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.exchange}:{s.symbol} — {fmtMoney(s.price, s.currency)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Shares" hint={selected ? `Price ${fmtMoney(selected.price, selected.currency)}${selected.currency !== 'PHP' ? ` · FX ${fmtNumber(rate, 2)}` : ''}${held ? ` · You hold ${fmtNumber(held, 0)}` : ''}` : undefined}>
                <Input inputMode="numeric" value={shares} onChange={(e) => setShares(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className="font-mono" />
              </Field>
              <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                <span className="text-fg-muted">Estimated {side === 'buy' ? 'cost' : 'proceeds'}</span>
                <span className="font-mono tabular">{fmtMoney(estimate, 'PHP')}</span>
              </div>
              <Field label="Rationale" required hint={`${rationale.trim().length}/15 characters minimum. Why this, why now, and what would make you exit?`}>
                <Textarea rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} maxLength={2000} placeholder="e.g. Rate hike should widen NIMs; adding to banks while trimming property exposure." />
              </Field>
              {tradeError && <InlineError message={tradeError} />}
              <InlineError message={trade.error ? (trade.error as Error).message : null} />
              <Button
                variant={side === 'buy' ? 'success' : 'danger'}
                className="w-full justify-center"
                disabled={!selected || qty <= 0 || rationale.trim().length < 15 || !!tradeError}
                loading={trade.isPending}
                onClick={() => trade.mutate()}
              >
                {side === 'buy' ? 'Buy' : 'Sell'} {qty > 0 ? fmtNumber(qty, 0) : ''} {selected?.symbol ?? ''}
              </Button>
              <p className="text-xs text-fg-subtle">
                Responding to news? See <Link to="/events" className="text-accent hover:underline">Market Events</Link>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Allocation" icon={<PieIcon className="h-3.5 w-3.5" />} />
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={1} stroke="none">
                      {pieData.map((d, i) => (
                        <Cell key={d.name} fill={d.name === 'Cash' ? '#2a3443' : COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 }} formatter={(v) => fmtMoney(Number(v), 'PHP', 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {pieData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: d.name === 'Cash' ? '#2a3443' : COLORS[i % COLORS.length] }} />
                    <span className="text-fg-muted">{d.name}</span>
                    <span className="ml-auto font-mono">{fmtPct((d.value / m.totalValue) * 100, 1)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        size="sm"
        title="Reset portfolio?"
        description="Positions are cleared and cash returns to the starting capital. Your decision log is kept, and the portfolio leaderboard only counts trades after the reset."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => reset.mutate()} loading={reset.isPending}>
              Reset
            </Button>
          </>
        }
      />
    </div>
  );
}

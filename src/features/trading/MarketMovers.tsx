import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { liveCandles, type LiveTicker } from '@/services/api/trading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs } from '@/components/ui/misc';
import { fmtNumber, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { moverStats, sectorAverages } from './movers';

const WINDOWS = { '1d': { hours: 24, label: 'Last 24 hours' }, '1w': { hours: 168, label: 'Last 7 days' } } as const;
type WindowKey = keyof typeof WINDOWS;

/** Biggest gainers and losers, price ranges and sector moves on the practice market. */
export function MarketMovers({ tickers, selected, onPick }: { tickers: LiveTicker[]; selected: string; onPick: (symbol: string) => void }) {
  const [win, setWin] = useState<WindowKey>('1d');
  const charts = useQueries({
    queries: tickers.map((t) => ({ queryKey: ['tf', 'live-candles', t.symbol], queryFn: () => liveCandles(t.symbol), refetchInterval: 60_000 })),
  });

  const rows = useMemo(() => {
    const hours = WINDOWS[win].hours;
    return tickers
      .map((t, i) => {
        const candles = charts[i]?.data?.candles;
        const s = candles ? moverStats(candles, hours) : null;
        return s ? { ...t, ...s } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.changePct - a.changePct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers, win, charts.map((q) => q.dataUpdatedAt).join()]);

  const sectors = useMemo(() => sectorAverages(rows), [rows]);
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.changePct)));

  return (
    <Card>
      <CardHeader
        title="Market movers"
        subtitle="Who moved most on the practice market, and how much each stock swings. Click a row to open its chart."
        icon={<Activity className="h-3.5 w-3.5" />}
        action={<Tabs value={win} onChange={setWin} tabs={[{ value: '1d', label: '1 day' }, { value: '1w', label: '1 week' }]} />}
      />
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[0.65rem] uppercase tracking-wider text-fg-subtle">
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">{WINDOWS[win].label}</th>
                <th className="pb-2 text-right font-medium">Low to high</th>
                <th className="pb-2 text-right font-medium" title="Typical size of one hourly move. Bigger means riskier.">Hourly swing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.symbol}
                  onClick={() => onPick(r.symbol)}
                  className={cn('cursor-pointer border-t border-border hover:bg-surface-2', r.symbol === selected && 'bg-accent-muted')}
                >
                  <td className="py-2 pr-3">
                    <div className="font-mono font-semibold">{r.symbol}</div>
                    <div className="text-[0.7rem] text-fg-subtle">{r.sector}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-28 rounded bg-surface-3">
                        <div
                          className={cn('absolute top-0 h-2 rounded', r.changePct >= 0 ? 'left-1/2 bg-up' : 'right-1/2 bg-down')}
                          style={{ width: `${(Math.abs(r.changePct) / maxAbs) * 50}%` }}
                        />
                      </div>
                      <span className={cn('font-mono text-xs', r.changePct >= 0 ? 'text-up' : 'text-down')}>{fmtPct(r.changePct, 2, true)}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono text-xs text-fg-muted">
                    {fmtNumber(r.low, r.low < 10 ? 3 : 2)} to {fmtNumber(r.high, r.high < 10 ? 3 : 2)}
                  </td>
                  <td className="py-2 text-right font-mono text-xs">{fmtPct(r.swingPct, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="py-4 text-sm text-fg-muted">Loading the market…</p>}
        </div>
        <div>
          <div className="mb-2 text-[0.65rem] uppercase tracking-wider text-fg-subtle">By sector</div>
          <div className="space-y-2">
            {sectors.map((s) => (
              <div key={s.sector} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {s.sector}
                  <span className="ml-1 text-[0.7rem] text-fg-subtle">· {s.count}</span>
                </span>
                <span className={cn('font-mono text-xs', s.changePct >= 0 ? 'text-up' : 'text-down')}>{fmtPct(s.changePct, 2, true)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.7rem] leading-relaxed text-fg-subtle">
            A stock can rise while its sector falls. Compare both before you trade. Prices here are simulated practice data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

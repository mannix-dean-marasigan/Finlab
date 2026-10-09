import { useMemo, useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { ClipboardPaste, Download, PencilLine, RotateCcw, Star, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { liveCandles, liveTickers } from '@/services/api/trading';
import { fmtMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { frontier, maxSharpe, portfolioReturn, portfolioRisk } from './optimizer';
import { applyViews, detectFrequency, parsePriceTable, PERIODS_PER_YEAR, sharesFor, stockStats, type Frequency } from './prices';

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
const PALETTE = ['#f5a524', '#38bdf8', '#22c55e', '#a78bfa', '#ef4444', '#14b8a6', '#f472b6', '#facc15', '#60a5fa', '#fb923c', '#4ade80', '#c084fc', '#f87171', '#2dd4bf', '#e879f9'];

const PLACEHOLDER = `Date\tBDO\tJFC\tTEL
2025-10-03\t142.50\t251.00\t1310
2025-10-10\t144.10\t249.60\t1298
...`;

/** Max-Sharpe optimizer for stocks the student chooses, from closing prices they paste. */
export function StockOptimizer() {
  const [text, setText] = useState('');
  const [freqOverride, setFreqOverride] = useState<Frequency | 'auto'>('auto');
  const [riskFree, setRiskFree] = useState(5);
  const [cap, setCap] = useState(0.4);
  const [amount, setAmount] = useState(50_000);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  // The student's own expected return per stock, in %, keyed by ticker. Empty = use history.
  const [views, setViews] = useState<Record<string, string>>({});

  const table = useMemo(() => (text.trim() ? parsePriceTable(text) : null), [text]);
  const detected = table && typeof table !== 'string' ? detectFrequency(table.dates) : null;
  const freq: Frequency = freqOverride === 'auto' ? (detected ?? 'daily') : freqOverride;

  const result = useMemo(() => {
    if (!table || typeof table === 'string') return null;
    const s = stockStats(table.rows, PERIODS_PER_YEAR[freq]);
    // Risk and correlations come from the prices; expected returns can be the student's own view.
    const { mu, custom } = applyViews(s.mu, table.tickers, views);
    const pts = frontier(mu, s.cov, cap);
    const best = maxSharpe(pts, riskFree / 100);
    const n = table.tickers.length;
    const equal = Array(n).fill(1 / n);
    return { s, mu, custom, pts, best, minRisk: pts[0], equal };
  }, [table, freq, cap, riskFree, views]);

  const loadTradingFloor = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const tickers = await liveTickers();
      const charts = await Promise.all(tickers.map((t) => liveCandles(t.symbol, 1500)));
      // One close per day: every 24th hourly candle, counting back from the latest.
      const len = Math.min(...charts.map((c) => c.candles.length));
      const idx: number[] = [];
      for (let i = len - 1; i >= 0; i -= 24) idx.unshift(i);
      const lines = [['Date', ...tickers.map((t) => t.symbol)].join('\t')];
      for (const i of idx) {
        const row = charts.map((c) => c.candles[c.candles.length - len + i]);
        lines.push([new Date(row[0].time * 1000).toISOString().slice(0, 10), ...row.map((x) => x.c.toFixed(3))].join('\t'));
      }
      setText(lines.join('\n'));
      setFreqOverride('daily');
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sharpe = (w: number[]) => {
    if (!result) return 0;
    const r = portfolioRisk(w, result.s.cov);
    return r > 0 ? (portfolioReturn(w, result.mu) - riskFree / 100) / r : 0;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="1. Paste closing prices"
          subtitle="Copy a table from Excel, Google Sheets or a CSV export: a date column (optional), then one column per stock, with the ticker on top."
          icon={<ClipboardPaste className="h-3.5 w-3.5" />}
        />
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Button size="sm" variant="outline" onClick={loadTradingFloor} loading={loading}>
              <Download className="h-3.5 w-3.5" /> Load the Trading Floor stocks
            </Button>
            <span>No data handy? Fill it in from FINLAB's practice market, one close per day.</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            wrap="off"
            aria-label="Closing prices"
            className="h-44 w-full resize-y rounded-md border border-border-strong bg-surface-2 p-3 font-mono text-xs outline-none focus:border-accent"
          />
          {loadError && <p className="text-xs text-down">{loadError}</p>}
          {typeof table === 'string' && <p className="text-sm text-down">{table}</p>}
          {table && typeof table !== 'string' && (
            <p className="text-xs text-fg-muted">
              Read <b className="text-fg">{table.tickers.length} stocks</b> × <b className="text-fg">{table.rows.length} prices</b>
              {detected && ` · looks like ${detected} data`}. {table.warnings.join(' ')}
            </p>
          )}
          <div className="grid gap-3 text-xs sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-fg-subtle">Price frequency</span>
              <select value={freqOverride} onChange={(e) => setFreqOverride(e.target.value as Frequency | 'auto')} className="w-full rounded border border-border-strong bg-surface-2 px-2 py-1.5">
                <option value="auto">Detect from dates{detected ? ` (${detected})` : ''}</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-fg-subtle">Risk-free rate % (e.g. a T-bill)</span>
              <input type="number" step={0.25} value={riskFree} onChange={(e) => setRiskFree(Number(e.target.value))} className="w-full rounded border border-border-strong bg-surface-2 px-2 py-1.5 font-mono" />
            </label>
            <label className="space-y-1">
              <span className="text-fg-subtle">Most in one stock: {Math.round(cap * 100)}%</span>
              <input type="range" min={0.1} max={1} step={0.05} value={cap} onChange={(e) => setCap(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" aria-label="Most in one stock" />
            </label>
            <label className="space-y-1">
              <span className="text-fg-subtle">Amount to invest (₱)</span>
              <input type="number" step={1000} min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="w-full rounded border border-border-strong bg-surface-2 px-2 py-1.5 font-mono" />
            </label>
          </div>
        </CardContent>
      </Card>

      {result && table && typeof table !== 'string' && (
        <>
          <Card>
            <CardHeader
              title="2. Expected returns"
              subtitle="History is the starting guess. Type your own view for any stock, for example from your valuation or an analyst's target, and everything below updates."
              icon={<PencilLine className="h-3.5 w-3.5" />}
            />
            <CardContent>
              {result.custom.some(Boolean) && (
                <Button size="sm" variant="outline" className="mb-3" onClick={() => setViews({})}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset all to history
                </Button>
              )}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {table.tickers.map((t, k) => (
                  <div key={t} className={cn('flex items-center gap-3 rounded-md border px-3 py-2 text-sm', result.custom[k] ? 'border-accent/50 bg-accent-muted' : 'border-border')}>
                    <span className="w-16 shrink-0 truncate font-medium">
                      <span style={{ color: PALETTE[k] }}>◆</span> {t}
                    </span>
                    <span className="flex-1 text-xs text-fg-subtle">
                      History <span className={cn('font-mono', result.s.mu[k] < 0 ? 'text-down' : 'text-fg-muted')}>{pct(result.s.mu[k])}</span>
                    </span>
                    <label className="flex items-center gap-1 text-xs">
                      <span className="sr-only">Your expected return for {t}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={views[t] ?? ''}
                        onChange={(e) => setViews((v) => ({ ...v, [t]: e.target.value.slice(0, 7) }))}
                        placeholder={(result.s.mu[k] * 100).toFixed(1)}
                        aria-label={`Your expected return for ${t}`}
                        className="w-16 rounded border border-border-strong bg-surface-2 px-1.5 py-1 text-right font-mono outline-none focus:border-accent"
                      />
                      %
                    </label>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[0.7rem] text-fg-subtle">
                Risk and how the stocks move together still come from the prices you pasted. A small change in one expected return can move the whole mix, so try a few.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
            <Card>
              <CardHeader title="3. Risk and return" subtitle="Each diamond is one stock. The curve is the best mix for each level of risk; the star has the highest Sharpe ratio." />
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 10 }}>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="risk" name="Risk" tickFormatter={(v) => pct(v, 0)} stroke="var(--color-fg-subtle)" fontSize={11}
                        label={{ value: 'Risk per year', position: 'insideBottom', offset: -14, fill: 'var(--color-fg-subtle)', fontSize: 11 }} />
                      <YAxis type="number" dataKey="ret" name="Return" tickFormatter={(v) => pct(v, 0)} stroke="var(--color-fg-subtle)" fontSize={11} width={48} />
                      <ZAxis range={[60, 60]} />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', fontSize: 12 }}
                        formatter={(v, n) => [pct(Number(v)), String(n)]} />
                      <Scatter name="Frontier" data={result.pts} fill="var(--color-accent)" line={{ stroke: 'var(--color-accent)', strokeWidth: 2.5 }} shape={() => <g />} isAnimationActive={false} />
                      {table.tickers.map((t, k) => (
                        <Scatter key={t} name={t} data={[{ risk: result.s.vol[k], ret: result.mu[k] }]} fill={PALETTE[k]} shape="diamond" isAnimationActive={false} />
                      ))}
                      <Scatter name="Lowest risk" data={[result.minRisk]} fill="#38bdf8" shape="circle" isAnimationActive={false} />
                      {result.best && <Scatter name="Max Sharpe" data={[result.best]} fill="#22c55e" shape="star" isAnimationActive={false} />}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-fg-muted">
                  {table.tickers.map((t, k) => (
                    <span key={t}><span style={{ color: PALETTE[k] }}>◆</span> {t}</span>
                  ))}
                  <span><span className="text-[#22c55e]">★</span> Max Sharpe</span>
                  <span><span className="text-[#38bdf8]">●</span> Lowest risk</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-up/30">
              <CardHeader title="4. Max-Sharpe portfolio" icon={<Star className="h-3.5 w-3.5 text-up" />} subtitle={`For ${fmtMoney(amount, 'PHP', 0)} at the latest prices`} />
              <CardContent className="space-y-3 text-sm">
                {result.best ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Return/yr</div><div className="font-mono font-semibold">{pct(result.best.ret)}</div></div>
                      <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Risk/yr</div><div className="font-mono font-semibold">±{pct(result.best.risk)}</div></div>
                      <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Sharpe</div><div className="font-mono font-semibold">{result.best.sharpe.toFixed(2)}</div></div>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-fg-subtle">
                          <th className="pb-1 font-medium">Stock</th>
                          <th className="pb-1 text-right font-medium">Weight</th>
                          <th className="pb-1 text-right font-medium">Shares</th>
                          <th className="pb-1 text-right font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const buys = sharesFor(result.best!.weights, result.s.last, amount);
                          return table.tickers
                            .map((t, k) => ({ t, k, w: result.best!.weights[k], ...buys[k] }))
                            .sort((a, b) => b.w - a.w)
                            .map((r) => (
                              <tr key={r.t} className={cn('border-t border-border', r.w < 0.005 && 'text-fg-subtle')}>
                                <td className="py-1.5"><span style={{ color: PALETTE[r.k] }}>◆</span> {r.t}</td>
                                <td className="py-1.5 text-right font-mono">{Math.round(r.w * 100)}%</td>
                                <td className="py-1.5 text-right font-mono">{r.shares.toLocaleString()}</td>
                                <td className="py-1.5 text-right font-mono">{fmtMoney(r.cost, 'PHP', 0)}</td>
                              </tr>
                            ));
                        })()}
                      </tbody>
                    </table>
                    <p className="text-[0.7rem] text-fg-subtle">
                      Shares are rounded down, so a little cash is left over. Real orders also have board lots and fees.
                    </p>
                  </>
                ) : (
                  <p className="text-fg-muted">No mix beats the risk-free rate with this data. Try a lower risk-free rate or more history.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Each stock on its own" subtitle={`Risk from ${result.s.periods} ${freq} returns, scaled to a year. ✎ marks your own expected return.`} />
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-fg-subtle">
                      <th className="pb-1 font-medium">Stock</th>
                      <th className="pb-1 text-right font-medium">Expected/yr</th>
                      <th className="pb-1 text-right font-medium">Risk/yr</th>
                      <th className="pb-1 text-right font-medium">Sharpe</th>
                      <th className="pb-1 text-right font-medium">Last price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.tickers.map((t, k) => (
                      <tr key={t} className="border-t border-border">
                        <td className="py-1.5"><span style={{ color: PALETTE[k] }}>◆</span> {t}</td>
                        <td className={cn('py-1.5 text-right font-mono', result.mu[k] < 0 && 'text-down', result.custom[k] && 'text-accent')}>
                          {pct(result.mu[k])}
                          {result.custom[k] && <span title="Your own view"> ✎</span>}
                        </td>
                        <td className="py-1.5 text-right font-mono">±{pct(result.s.vol[k])}</td>
                        <td className="py-1.5 text-right font-mono">{result.s.vol[k] > 0 ? ((result.mu[k] - riskFree / 100) / result.s.vol[k]).toFixed(2) : '—'}</td>
                        <td className="py-1.5 text-right font-mono">{result.s.last[k].toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-[0.65rem] uppercase tracking-wider text-fg-subtle">Compare</div>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {[
                      ['Max Sharpe', result.best?.weights],
                      ['Lowest risk', result.minRisk.weights],
                      ['Equal split', result.equal],
                    ].map(([label, w]) =>
                      w ? (
                        <tr key={label as string} className="border-t border-border">
                          <td className="py-1.5">{label as string}</td>
                          <td className="py-1.5 text-right font-mono">{pct(portfolioReturn(w as number[], result.mu))}</td>
                          <td className="py-1.5 text-right font-mono">±{pct(portfolioRisk(w as number[], result.s.cov))}</td>
                          <td className="py-1.5 text-right font-mono">{sharpe(w as number[]).toFixed(2)}</td>
                        </tr>
                      ) : null,
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="How the stocks move together" subtitle="Correlation: +1 moves together, 0 unrelated, −1 opposite. Low numbers are what make mixing useful." />
              <CardContent className="overflow-x-auto">
                <table className="text-[0.7rem]">
                  <thead>
                    <tr>
                      <th />
                      {table.tickers.map((t) => (
                        <th key={t} className="px-1 pb-1 font-medium text-fg-subtle">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.tickers.map((t, i) => (
                      <tr key={t}>
                        <td className="pr-2 font-medium text-fg-subtle">{t}</td>
                        {result.s.corr[i].map((c, j) => (
                          <td key={j} className="p-0.5">
                            <div
                              className="grid h-9 min-w-[42px] place-items-center rounded font-mono"
                              style={{ background: c >= 0 ? `rgba(245,165,36,${Math.abs(c) * 0.55})` : `rgba(56,189,248,${Math.abs(c) * 0.55})` }}
                            >
                              {c.toFixed(2)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card className="flex gap-3 border-accent/30 p-4 text-sm">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="text-fg-muted">
              <b className="text-fg">Past prices are not a forecast.</b> The optimizer assumes each stock keeps its past average return and swings, which rarely
              happens. A stock that went up a lot recently gets a big weight, then may fall. Use a cap, use years of data, and treat the result as a starting point
              for your own research. This is a learning tool, not investment advice.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

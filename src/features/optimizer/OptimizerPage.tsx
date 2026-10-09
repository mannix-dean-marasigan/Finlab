import { useMemo, useState } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { Lightbulb, RotateCcw, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ASSETS, correlation, type AssetId } from '@/features/planner/planner';
import { covariance, frontier, maxSharpe, portfolioReturn, portfolioRisk, randomPortfolios } from './optimizer';

const COLORS: Record<AssetId, string> = {
  cash: '#94a3b8', td: '#64748b', govbond: '#38bdf8', corpbond: '#0ea5e9', reit: '#a78bfa', index: '#f5a524', global: '#22c55e', stocks: '#ef4444',
};
type Inputs = Record<AssetId, { on: boolean; ret: number; vol: number }>;
const DEFAULTS = Object.fromEntries(ASSETS.map((a) => [a.id, { on: true, ret: a.ret, vol: a.vol }])) as Inputs;
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

export default function OptimizerPage() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [cap, setCap] = useState(0.5);
  // The time deposit rate: what you can earn with almost no risk. With the savings rate instead, a near-riskless
  // time deposit looks like a free lunch and the "best" mix is all time deposits.
  const [riskFree, setRiskFree] = useState(5);
  const [pick, setPick] = useState(0.5); // position along the frontier, 0 = lowest risk, 1 = highest return

  const ids = ASSETS.filter((a) => inputs[a.id].on).map((a) => a.id);
  const model = useMemo(() => {
    if (ids.length < 2) return null;
    const mu = ids.map((id) => inputs[id].ret / 100);
    const vols = ids.map((id) => Math.max(0.0001, inputs[id].vol / 100));
    const cov = covariance(vols, (i, j) => correlation(ids[i], ids[j]));
    const pts = frontier(mu, cov, cap);
    const top = Math.max(...vols, ...pts.map((p) => p.risk));
    const topRet = Math.max(...mu);
    const steps = (max: number) => Array.from({ length: Math.ceil(max / 0.05 + 0.0001) + 1 }, (_, k) => +(k * 0.05).toFixed(2));
    return {
      mu, cov, pts,
      xTicks: steps(top),
      yTicks: steps(topRet),
      cloud: randomPortfolios(mu, cov, cap, 900),
      best: maxSharpe(pts, riskFree / 100),
      singles: ids.map((id, i) => ({ id, ret: mu[i], risk: vols[i] })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(inputs), cap, riskFree]);

  const set = (id: AssetId, patch: Partial<Inputs[AssetId]>) => setInputs((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const chosen = model ? model.pts[Math.round(pick * (model.pts.length - 1))] : null;
  const lowest = model?.pts[0] ?? null;
  const sharpeOf = (r: number, s: number) => (s > 0 ? (r - riskFree / 100) / s : 0);
  const tooTight = cap * ids.length < 1;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Tools"
        title="Portfolio optimizer"
        description="See the efficient frontier: the best return you can get for each level of risk. Change the assumptions and watch the best mixes move. For learning, not investment advice."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader
            title="Risk and return of every possible mix"
            subtitle="Grey dots are random mixes. The curve is the efficient frontier: no mix sits above it."
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <CardContent>
            {!model ? (
              <p className="text-sm text-fg-muted">Turn on at least two options to draw the frontier.</p>
            ) : (
              <>
                <div className="h-[320px] sm:h-[460px]">
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="risk" name="Risk" ticks={model.xTicks} domain={[0, model.xTicks.at(-1)!]} tickFormatter={(v) => pct(v, 0)} stroke="var(--color-fg-subtle)" fontSize={11}
                        label={{ value: 'Risk (typical yearly swing)', position: 'insideBottom', offset: -18, fill: 'var(--color-fg-subtle)', fontSize: 11 }} />
                      <YAxis type="number" dataKey="ret" name="Return" ticks={model.yTicks} domain={[0, model.yTicks.at(-1)!]} tickFormatter={(v) => pct(v, 0)} stroke="var(--color-fg-subtle)" fontSize={11} width={44}
                        label={{ value: 'Expected return', angle: -90, position: 'insideLeft', fill: 'var(--color-fg-subtle)', fontSize: 11 }} />
                      <ZAxis range={[14, 14]} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', fontSize: 12 }}
                        formatter={(v, n) => [pct(Number(v)), String(n)]}
                      />
                      <Scatter name="Random mix" data={model.cloud} fill="var(--color-fg-subtle)" fillOpacity={0.25} isAnimationActive={false} />
                      <Scatter name="Frontier" data={model.pts} fill="var(--color-accent)" line={{ stroke: 'var(--color-accent)', strokeWidth: 2.5 }} shape={() => <g />} isAnimationActive={false} />
                      {model.singles.map((s) => (
                        <Scatter key={s.id} name={ASSETS.find((a) => a.id === s.id)!.label} data={[s]} fill={COLORS[s.id]} shape="diamond" isAnimationActive={false} />
                      ))}
                      {lowest && <Scatter name="Lowest risk" data={[lowest]} fill="#38bdf8" shape="circle" isAnimationActive={false} />}
                      {model.best && <Scatter name="Best return per risk" data={[model.best]} fill="#22c55e" shape="star" isAnimationActive={false} />}
                      {chosen && <Scatter name="Your pick" data={[chosen]} fill="#fff" stroke="var(--color-accent)" shape="circle" isAnimationActive={false} />}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-fg-muted">
                  <span><span className="mr-1 inline-block h-2 w-3 rounded bg-accent align-middle" />Efficient frontier</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#38bdf8] align-middle" />Lowest risk</span>
                  <span><span className="mr-1 text-[#22c55e]">★</span>Best return per unit of risk</span>
                  <span><span className="mr-1 inline-block h-2 w-2 rounded-full border border-accent bg-white align-middle" />Your pick</span>
                  <span>◆ Single options</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pick a point on the curve" />
            <CardContent className="space-y-3 text-sm">
              <input type="range" min={0} max={1} step={0.01} value={pick} onChange={(e) => setPick(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" aria-label="Position on the frontier" />
              <div className="flex justify-between text-[0.7rem] text-fg-subtle"><span>Safer</span><span>More return</span></div>
              {chosen && model && (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Return</div><div className="font-mono font-semibold">{pct(chosen.ret)}</div></div>
                    <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Risk</div><div className="font-mono font-semibold">±{pct(chosen.risk)}</div></div>
                    <div className="rounded-md border border-border p-2"><div className="text-[0.65rem] text-fg-subtle">Sharpe</div><div className="font-mono font-semibold">{sharpeOf(chosen.ret, chosen.risk).toFixed(2)}</div></div>
                  </div>
                  <div className="space-y-1.5">
                    {ids.map((id, i) => (
                      <div key={id} className="flex items-center gap-2 text-xs">
                        <span className="w-32 shrink-0 truncate">{ASSETS.find((a) => a.id === id)!.label}</span>
                        <div className="h-2 flex-1 rounded bg-surface-3"><div className="h-2 rounded" style={{ width: pct(chosen.weights[i]), background: COLORS[id] }} /></div>
                        <span className="w-10 text-right font-mono">{Math.round(chosen.weights[i] * 100)}%</span>
                      </div>
                    ))}
                  </div>
                  {model.best && (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setPick(model.pts.indexOf(model.pts.find((p) => p.risk >= model.best!.risk - 1e-9)!) / Math.max(1, model.pts.length - 1))}>
                      Jump to the best return per risk
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Assumptions" icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
              action={<Button size="sm" variant="outline" onClick={() => (setInputs(DEFAULTS), setCap(0.5), setRiskFree(5))}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>} />
            <CardContent className="space-y-2 text-xs">
              <div className="grid grid-cols-[minmax(0,1fr)_64px_64px] gap-2 text-[0.65rem] text-fg-subtle"><span>Option</span><span>Return %</span><span>Risk %</span></div>
              {ASSETS.map((a) => (
                <div key={a.id} className={cn('grid grid-cols-[minmax(0,1fr)_64px_64px] items-center gap-2', !inputs[a.id].on && 'opacity-50')}>
                  <label className="flex items-center gap-2 truncate">
                    <input type="checkbox" checked={inputs[a.id].on} onChange={(e) => set(a.id, { on: e.target.checked })} />
                    <span className="truncate">{a.label}</span>
                  </label>
                  <input type="number" step={0.5} value={inputs[a.id].ret} onChange={(e) => set(a.id, { ret: Number(e.target.value) })} aria-label={`${a.label} return`} className="rounded border border-border-strong bg-surface-2 px-1.5 py-1 font-mono" />
                  <input type="number" step={0.5} min={0} value={inputs[a.id].vol} onChange={(e) => set(a.id, { vol: Number(e.target.value) })} aria-label={`${a.label} risk`} className="rounded border border-border-strong bg-surface-2 px-1.5 py-1 font-mono" />
                </div>
              ))}
              <label className="mt-3 block">
                Most in any one option: <b className="font-mono">{Math.round(cap * 100)}%</b>
                <input type="range" min={0.15} max={1} step={0.05} value={cap} onChange={(e) => setCap(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-accent)]" aria-label="Most in any one option" />
              </label>
              {tooTight && <p className="text-down">With {ids.length} options, the cap must be at least {Math.ceil(100 / ids.length)}% to add up to 100%. Using that instead.</p>}
              <label className="mt-2 flex items-center justify-between gap-2">
                Risk-free rate (time deposit) %
                <input type="number" step={0.25} value={riskFree} onChange={(e) => setRiskFree(Number(e.target.value))} aria-label="Risk-free rate" className="w-16 rounded border border-border-strong bg-surface-2 px-1.5 py-1 font-mono" />
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-accent" /> Why the curve bends</div>
          <p className="text-fg-muted">Options that don't move together cancel out some of each other's swings. That is why a mix can be less risky than its parts, and why the frontier curves to the left.</p>
        </Card>
        <Card className="p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-accent" /> What the star means</div>
          <p className="text-fg-muted">The Sharpe ratio is extra return above the risk-free rate (here, a time deposit) per unit of risk. The star is the mix with the highest Sharpe ratio. Anything below the curve takes risk without being paid for it.</p>
        </Card>
        <Card className="p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-accent" /> The optimizer's weakness</div>
          <p className="text-fg-muted">Change one expected return by 1% and watch the mix jump. Optimizers trust their inputs completely, and nobody knows future returns. That is why analysts add caps and use judgment.</p>
        </Card>
      </div>

      <p className="mt-4 text-xs text-fg-subtle">
        Returns, risks and correlations are rough assumptions for learning (the same ones as the Portfolio planner). Real results differ, and nothing here is advice to buy any product.
        {model && ` Current best mix: ${pct(portfolioReturn(model.best?.weights ?? [], model.mu))} return at ±${pct(portfolioRisk(model.best?.weights ?? [], model.cov))} risk.`}
      </p>
    </div>
  );
}

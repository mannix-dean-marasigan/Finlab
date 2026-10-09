import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { CheckCircle2, CircleAlert, PieChart as PieIcon, RotateCcw, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fmtMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ASSETS, EMPTY, metrics, projected, review, SCENARIOS, total, type Allocation, type AssetId } from './planner';

const COLORS: Record<AssetId, string> = {
  cash: '#94a3b8', td: '#64748b', govbond: '#38bdf8', corpbond: '#0ea5e9', reit: '#a78bfa', index: '#f5a524', global: '#22c55e', stocks: '#ef4444',
};

export default function PlannerPage() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [alloc, setAlloc] = useState<Allocation>(EMPTY);
  const [checked, setChecked] = useState(false);
  const s = SCENARIOS.find((x) => x.id === scenarioId)!;
  const m = useMemo(() => metrics(alloc), [alloc]);
  const sum = total(alloc);
  const result = checked ? review(alloc, s) : null;
  const coachM = metrics(s.coach);

  const pick = (id: string) => {
    setScenarioId(id);
    setAlloc(EMPTY);
    setChecked(false);
  };
  const set = (id: AssetId, v: number) => {
    setChecked(false);
    setAlloc((a) => ({ ...a, [id]: Math.max(0, Math.min(100, v)) }));
  };

  const pie = ASSETS.filter((x) => alloc[x.id] > 0).map((x) => ({ name: x.label, value: alloc[x.id], id: x.id }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Tools"
        title="Portfolio planner"
        description="Match a portfolio to a real person's goal, then compare your plan with a coach's. Practice only, not investment advice."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {SCENARIOS.map((x) => (
          <button
            key={x.id}
            onClick={() => pick(x.id)}
            className={cn('rounded-lg border p-4 text-left transition-colors', x.id === scenarioId ? 'border-accent bg-accent-muted' : 'border-border hover:border-border-strong')}
          >
            <div className="flex items-center gap-2 font-semibold">
              <UserRound className="h-4 w-4 text-accent" /> {x.name}
            </div>
            <div className="mt-1 text-xs text-fg-muted">
              {fmtMoney(x.amount, 'PHP', 0)} · {x.years} year{x.years === 1 ? '' : 's'}
            </div>
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4 text-sm leading-relaxed">
          <p>{s.story}</p>
          <p className="mt-2 text-fg-muted">
            <span className="font-medium text-fg">Goal:</span> {s.goal}.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader
            title="Build the plan"
            subtitle="Split 100% across the options. Use steps of 5%."
            icon={<PieIcon className="h-3.5 w-3.5" />}
            action={
              <Button size="sm" variant="outline" onClick={() => (setAlloc(EMPTY), setChecked(false))}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            }
          />
          <CardContent className="space-y-3">
            {ASSETS.map((x) => (
              <div key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[200px_minmax(0,1fr)_64px]">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[x.id] }} />
                    {x.label}
                  </div>
                  <div className="text-[0.7rem] text-fg-subtle">
                    {x.note} · about {x.ret}% a year, swings ±{x.vol}%
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={alloc[x.id]}
                  onChange={(e) => set(x.id, Number(e.target.value))}
                  aria-label={`${x.label} percent`}
                  className="col-span-2 accent-[var(--color-accent)] sm:col-span-1"
                />
                <div className="col-start-2 row-start-1 self-start text-right font-mono text-sm sm:col-start-auto sm:row-start-auto sm:self-center">{alloc[x.id]}%</div>
              </div>
            ))}
            <div className={cn('flex items-center justify-between rounded-md border px-3 py-2 text-sm', sum === 100 ? 'border-up/40 text-up' : 'border-border text-fg-muted')}>
              <span>Total</span>
              <span className="font-mono font-semibold">
                {sum}% {sum !== 100 && <span className="font-normal">({sum < 100 ? `${100 - sum}% left` : `${sum - 100}% too much`})</span>}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Your plan at a glance" />
            <CardContent>
              <div className="h-40">
                {pie.length ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pie} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
                        {pie.map((p) => (
                          <Cell key={p.id} fill={COLORS[p.id]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-sm text-fg-subtle">Move a slider to start.</div>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[0.7rem] text-fg-subtle">Expected return</dt>
                  <dd className="font-mono font-semibold">{m.expectedReturn.toFixed(1)}% a year</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] text-fg-subtle">Typical swing</dt>
                  <dd className="font-mono font-semibold">±{m.volatility.toFixed(1)}%</dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] text-fg-subtle">A bad year (1 in 20)</dt>
                  <dd className={cn('font-mono font-semibold', m.badYear < 0 ? 'text-down' : '')}>
                    {m.badYear < 0 ? `lose ${fmtMoney((-m.badYear / 100) * s.amount, 'PHP', 0)}` : 'still positive'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.7rem] text-fg-subtle">After {s.years} year{s.years === 1 ? '' : 's'}</dt>
                  <dd className="font-mono font-semibold">{sum ? fmtMoney(projected(s.amount, m.expectedReturn, s.years), 'PHP', 0) : '—'}</dd>
                </div>
              </dl>
              <Button className="mt-4 w-full" variant="primary" disabled={sum === 0} onClick={() => setChecked(true)}>
                Check my plan
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader title={`Fit for ${s.name.split(' ·')[0]}: ${result.score}%`} />
              <CardContent className="space-y-2">
                {result.checks.map((c) => (
                  <div key={c.label} className="flex gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-down" />}
                    <div>
                      <div className="font-medium">{c.label}</div>
                      <div className="text-xs text-fg-muted">{c.detail}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {result && (
        <Card className="mt-4">
          <CardHeader title="Compare with a coach's plan" subtitle="One sensible answer, not the only one." />
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {ASSETS.filter((x) => s.coach[x.id] > 0 || alloc[x.id] > 0).map((x) => (
                  <span key={x.id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[x.id] }} />
                    {x.label} <b className="font-mono">{s.coach[x.id]}%</b>
                    {alloc[x.id] !== s.coach[x.id] && <span className="text-fg-subtle">(you: {alloc[x.id]}%)</span>}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-fg-muted">{s.coachWhy}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 text-sm">
              <div>
                <dt className="text-[0.7rem] text-fg-subtle">Coach's return</dt>
                <dd className="font-mono">{coachM.expectedReturn.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] text-fg-subtle">Coach's swing</dt>
                <dd className="font-mono">±{coachM.volatility.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] text-fg-subtle">Your return</dt>
                <dd className="font-mono">{m.expectedReturn.toFixed(1)}%</dd>
              </div>
              <div>
                <dt className="text-[0.7rem] text-fg-subtle">Your swing</dt>
                <dd className="font-mono">±{m.volatility.toFixed(1)}%</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 text-xs text-fg-subtle">
        Returns and swings are rough long-run assumptions for learning. Real results differ, and nothing here is advice to buy any product.
      </p>
    </div>
  );
}

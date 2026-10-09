import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { axisBounds, verdictFor, type FieldBar } from '@/lib/finance/footballField';
import { fmtMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const VERDICT = {
  undervalued: { label: 'Looks undervalued', tone: 'text-up border-up/40 bg-up-muted', note: 'The price sits below most of your value ranges.' },
  fair: { label: 'Looks fairly valued', tone: 'text-accent border-accent/40 bg-accent-muted', note: 'The price sits inside your value ranges.' },
  overvalued: { label: 'Looks overvalued', tone: 'text-down border-down/40 bg-down-muted', note: 'The price sits above most of your value ranges.' },
} as const;

/** "Football field" chart: each method's value range against the current price. */
export function ValuationPicture({ bars, price, currency }: { bars: FieldBar[]; price: number | null; currency: string }) {
  const { min, max } = axisBounds(bars, price);
  const x = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  const v = verdictFor(bars, price);
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);

  return (
    <Card className="mt-4" data-tour="valuation-picture">
      <CardHeader
        title="Valuation in one picture"
        subtitle="Each bar is the range of value per share from one method. The line is today's price."
        icon={<BarChart3 className="h-3.5 w-3.5" />}
      />
      <CardContent className="space-y-4">
        {bars.length < 2 ? (
          <p className="text-sm text-fg-muted">Fill in at least two methods (P/E, P/B or DCF) to compare them here.</p>
        ) : (
          <>
            <div className="relative pl-28 pr-2">
              {/* price line */}
              {price !== null && price > 0 && (
                <div className="pointer-events-none absolute bottom-6 top-0 z-10 w-px bg-fg" style={{ left: `calc(7rem + (100% - 7.5rem) * ${(price - min) / (max - min)})` }}>
                  <span className="absolute -top-1 left-1 whitespace-nowrap rounded bg-fg px-1.5 py-0.5 text-[0.65rem] font-semibold text-bg">
                    Price {fmtMoney(price, currency)}
                  </span>
                </div>
              )}
              <div className="space-y-3 pt-6">
                {bars.map((b) => (
                  <div key={b.key} className="relative h-9">
                    <div className="absolute -left-28 top-1/2 w-26 -translate-y-1/2 text-xs font-medium text-fg-muted">{b.label}</div>
                    <div className="absolute inset-y-1 rounded-md bg-accent/25 ring-1 ring-accent/50" style={{ left: x(b.low), width: `calc(${x(b.high)} - ${x(b.low)})` }} title={b.basis} />
                    <div className="absolute inset-y-0 w-1 rounded bg-accent" style={{ left: x(b.point) }} title={`Central estimate ${fmtMoney(b.point, currency)}`} />
                    <span className="absolute top-1/2 -translate-x-full -translate-y-1/2 pr-1.5 font-mono text-[0.65rem] text-fg-subtle" style={{ left: x(b.low) }}>
                      {fmtMoney(b.low, currency)}
                    </span>
                    <span className="absolute top-1/2 -translate-y-1/2 pl-1.5 font-mono text-[0.65rem] text-fg-subtle" style={{ left: x(b.high) }}>
                      {fmtMoney(b.high, currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative mt-2 h-4 border-t border-border">
                {ticks.map((t) => (
                  <span key={t} className="absolute -translate-x-1/2 pt-1 font-mono text-[0.6rem] text-fg-subtle" style={{ left: x(t) }}>
                    {Math.round(t).toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
            {v ? (
              <div className={cn('rounded-md border p-3 text-sm', VERDICT[v.verdict].tone)}>
                <div className="font-semibold">{VERDICT[v.verdict].label}</div>
                <div className="mt-0.5 text-fg-muted">
                  {VERDICT[v.verdict].note} The middle of your ranges is {fmtMoney(v.mid, currency)}, {Math.abs(v.gapPct).toFixed(1)}% {v.gapPct >= 0 ? 'above' : 'below'} the price.
                  Analysts treat anything within about 15% as fair, because every input is an estimate.
                </div>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">Enter the current price above to see where it sits.</p>
            )}
            <ul className="space-y-1 text-xs text-fg-subtle">
              {bars.map((b) => (
                <li key={b.key}>
                  <span className="font-medium text-fg-muted">{b.label}:</span> {b.basis}.
                </li>
              ))}
              <li>This is a learning tool with simplified inputs. It is not investment advice.</li>
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

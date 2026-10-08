import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FastForward, Flag, Pause, Play, RotateCcw, SkipForward, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { advanceRound, cancelRoundLimit, finishRound, placeRoundLimit, placeRoundOrder, roundTime, setRoundExits, type RoundView } from '@/services/api/trading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fmtMoney, fmtNumber, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TradingChart } from './TradingChart';
import { OrderTicket } from './OrderTicket';
import type { Candle } from './indicators';

const SPEEDS = [
  { label: '1×', ms: 800 },
  { label: '2×', ms: 400 },
  { label: '4×', ms: 180 },
];

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div>
      <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">{label}</div>
      <div className={cn('font-mono text-sm font-semibold', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>{value}</div>
    </div>
  );
}

/** Plays one round: chart, playback, orders, exits, and the result when it ends. */
export function RoundPlayer({ kind, initial, onNew }: { kind: 'practice' | 'weekly'; initial: RoundView; onNew?: () => void }) {
  const qc = useQueryClient();
  const [round, setRound] = useState<RoundView>(initial);
  const [candles, setCandles] = useState<Candle[]>(initial.candles);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    setRound(initial);
    setCandles(initial.candles);
    setPlaying(false);
  }, [initial]);

  // Every server reply carries the round state plus any newly revealed candles.
  const apply = useCallback((v: RoundView) => {
    setRound(v);
    if (v.candles.length) setCandles((cs) => [...cs.filter((c) => c.time < roundTime(v.from)), ...v.candles]);
    if (v.status === 'finished') {
      setPlaying(false);
      qc.invalidateQueries({ queryKey: ['tf'] });
    }
  }, [qc]);

  const step = useCallback(async (n = 1) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      apply(await advanceRound(round.id, n));
    } catch (e) {
      setPlaying(false);
      toast.error((e as Error).message);
    } finally {
      inFlight.current = false;
    }
  }, [round.id, apply]);

  useEffect(() => {
    if (!playing || round.status !== 'active') return;
    const timer = window.setInterval(() => step(1), SPEEDS[speed].ms);
    return () => window.clearInterval(timer);
  }, [playing, speed, step, round.status]);

  const act = async (fn: () => Promise<RoundView>) => {
    setBusy(true);
    setError(null);
    try {
      apply(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const done = round.status === 'finished';
  const left = round.last_index - round.cursor;
  const unreal = round.qty !== 0 ? (round.price - round.avg_price) * round.qty : 0;
  const ret = ((round.equity - round.start_cash) / round.start_cash) * 100;
  const fills = round.fills.map((f) => ({ time: roundTime(f.i), side: f.side, price: f.price, reason: f.reason }));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold">{round.symbol}</span>
          <Badge tone={kind === 'weekly' ? 'accent' : 'neutral'}>{kind === 'weekly' ? 'Weekly challenge' : 'Practice round'}</Badge>
          <span className="font-mono text-lg">{fmtNumber(round.price, round.price < 10 ? 3 : 2)}</span>
          <span className="text-xs text-fg-subtle">Simulated stock · daily candles</span>
          <span className="ml-auto text-xs text-fg-muted">{done ? 'Round over' : `${left} candle${left === 1 ? '' : 's'} left`}</span>
        </div>
        <TradingChart
          candles={candles}
          storageKey={`round-${round.id}`}
          fills={fills}
          position={round.qty !== 0 ? { qty: round.qty, avg: round.avg_price, stop: round.stop_price, take: round.take_price } : null}
          pendingLimit={round.limit_side ? { side: round.limit_side, price: round.limit_price ?? 0 } : null}
        />
        {!done && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? 'Pause' : 'Play'}
            </Button>
            <div className="flex overflow-hidden rounded-md border border-border-strong">
              {SPEEDS.map((s, i) => (
                <button key={s.label} onClick={() => setSpeed(i)} className={cn('px-2.5 py-1.5 text-xs', speed === i ? 'bg-accent-muted text-accent' : 'text-fg-muted hover:text-fg')}>
                  {s.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => step(1)} disabled={playing}>
              <SkipForward className="h-4 w-4" /> Next candle
            </Button>
            <Button variant="outline" onClick={() => step(10)} disabled={playing}>
              <FastForward className="h-4 w-4" /> +10
            </Button>
            <Button
              variant="ghost"
              className="ml-auto hover:text-down"
              onClick={() => window.confirm(kind === 'weekly' ? 'End your weekly attempt now? You only get one per week.' : 'End this round now?') && act(() => finishRound(round.id))}
            >
              <Flag className="h-4 w-4" /> End round
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {done ? (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-accent" /> Round result
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="Return" value={fmtPct(round.return_pct, 2, true)} tone={(round.return_pct ?? 0) >= 0 ? 'up' : 'down'} />
              <Stat label="Max drawdown" value={fmtPct(round.max_drawdown)} />
              <Stat label="Score" value={fmtNumber(round.score, 2)} />
              <Stat label="Win rate" value={round.trades ? `${Math.round((round.wins / round.trades) * 100)}% of ${round.trades}` : '—'} />
              <Stat label="Final equity" value={fmtMoney(round.final_equity, 'PHP', 0)} />
              <Stat label="Fees paid" value={fmtMoney(round.fees, 'PHP', 0)} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">Score = return minus half your worst drawdown, so steady, controlled trading beats lucky all-in bets.</p>
            {round.fills.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Trade journal</div>
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {round.fills.map((f, i) => (
                    <li key={i} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          <span className={f.side === 'buy' ? 'text-up' : 'text-down'}>{f.side === 'buy' ? 'Buy' : 'Sell'}</span> {fmtNumber(f.qty, 0)} @{' '}
                          <span className="font-mono">{fmtNumber(f.price, f.price < 10 ? 3 : 2)}</span>
                          {f.reason !== 'market' && <span className="ml-1 text-fg-subtle">({f.reason === 'take' ? 'target' : f.reason})</span>}
                        </span>
                        {f.pnl !== 0 && <span className={cn('font-mono', f.pnl > 0 ? 'text-up' : 'text-down')}>{fmtMoney(f.pnl, 'PHP', 0)}</span>}
                      </div>
                      {f.note && <div className="mt-0.5 italic text-fg-muted">“{f.note}”</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onNew && (
              <Button variant="primary" className="mt-3 w-full justify-center" onClick={onNew}>
                <RotateCcw className="h-4 w-4" /> New practice round
              </Button>
            )}
          </Card>
        ) : (
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Equity" value={fmtMoney(round.equity, 'PHP', 0)} />
              <Stat label="Return" value={fmtPct(ret, 2, true)} tone={ret >= 0 ? 'up' : 'down'} />
              <Stat label="Position" value={round.qty === 0 ? 'Flat' : `${round.qty > 0 ? 'Long' : 'Short'} ${fmtNumber(Math.abs(round.qty), 0)}`} />
              <Stat label="Open P&L" value={fmtMoney(unreal, 'PHP', 0)} tone={unreal > 0 ? 'up' : unreal < 0 ? 'down' : undefined} />
              <Stat label="Cash" value={fmtMoney(round.cash, 'PHP', 0)} />
              <Stat label="Max drawdown" value={fmtPct(round.max_drawdown)} />
            </div>
          </Card>
        )}
        {!done && (
          <Card className="p-4">
            <OrderTicket
              price={round.price}
              qty={round.qty}
              equity={round.equity}
              stop={round.stop_price}
              take={round.take_price}
              busy={busy}
              error={error}
              disabled={playing}
              onOrder={(side, n, note) => act(() => placeRoundOrder(round.id, side, n, note))}
              onLimit={(side, n, px) => act(() => placeRoundLimit(round.id, side, n, px))}
              onCancelLimit={() => act(() => cancelRoundLimit(round.id))}
              pendingLimit={round.limit_side ? { side: round.limit_side, qty: round.limit_qty ?? 0, price: round.limit_price ?? 0 } : null}
              onExits={(s, t) => act(() => setRoundExits(round.id, s, t))}
            />
            {playing && <p className="mt-2 text-[0.7rem] text-accent">Pause to place orders.</p>}
          </Card>
        )}
      </div>
    </div>
  );
}


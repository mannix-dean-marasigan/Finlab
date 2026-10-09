import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CandlestickChart, Clock, Crown, Medal, Trophy } from 'lucide-react';
import {
  liveAccount, liveCandles, liveSetExits, liveTickers, liveTrade, myRounds, startRound, weeklyTradingLeaderboard,
  type LiveAccount, type RoundView,
} from '@/services/api/trading';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Tabs, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { fmtDate, fmtDateTime, fmtMoney, fmtNumber, fmtPct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { RoundPlayer } from './RoundPlayer';
import { TradingChart } from './TradingChart';
import { OrderTicket } from './OrderTicket';
import { MarketMovers } from './MarketMovers';

type TabId = 'practice' | 'weekly' | 'live' | 'history';

// ------------------------------------------------------------------ practice
function PracticeTab() {
  const [round, setRound] = useState<RoundView | null>(null);
  const start = useMutation({ mutationFn: () => startRound('practice'), onSuccess: setRound });
  useEffect(() => {
    if (!round && !start.isPending && !start.isError) start.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (start.isError) return <ErrorState error={start.error} onRetry={() => start.mutate()} />;
  if (!round) return <LoadingState label="Opening a new market…" />;
  return <RoundPlayer kind="practice" initial={round} onNew={() => start.mutate()} />;
}

// ------------------------------------------------------------------ weekly
function WeeklyLeaderboard() {
  const rows = useQuery({ queryKey: ['tf', 'weekly-lb'], queryFn: weeklyTradingLeaderboard });
  return (
    <Card>
      <CardHeader title="This week's leaderboard" subtitle="Ranked by score: return minus half the worst drawdown." icon={<Trophy className="h-3.5 w-3.5" />} />
      <CardContent className="px-0 pb-1">
        {rows.isPending ? (
          <LoadingState />
        ) : rows.isError ? (
          <ErrorState error={rows.error} onRetry={() => rows.refetch()} />
        ) : !rows.data.length ? (
          <EmptyState title="No finished attempts yet" description="Be the first to post a score this week." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-14">Rank</Th>
                <Th>Trader</Th>
                <Th align="right">Return</Th>
                <Th align="right" className="hidden sm:table-cell">Max DD</Th>
                <Th align="right">Score</Th>
              </tr>
            </thead>
            <tbody>
              {rows.data.map((r) => (
                <tr key={r.user_id} className={cn('hover:bg-surface-2', r.is_me && 'bg-accent/[0.06]')}>
                  <Td mono>
                    <span className="inline-flex items-center gap-1.5">
                      {r.rank === 1 ? <Crown className="h-4 w-4 text-accent" /> : r.rank <= 3 ? <Medal className="h-4 w-4 text-fg-muted" /> : null}
                      {r.rank}
                    </span>
                  </Td>
                  <Td>
                    <Link to={`/p/${r.handle}`} className="font-medium hover:text-accent">{r.display_name}</Link>
                    {r.is_me && <span className="ml-1.5 text-xs text-accent">(you)</span>}
                  </Td>
                  <Td align="right" mono className={r.return_pct >= 0 ? 'text-up' : 'text-down'}>{fmtPct(r.return_pct, 2, true)}</Td>
                  <Td align="right" mono className="hidden sm:table-cell">{fmtPct(r.max_drawdown)}</Td>
                  <Td align="right" mono className="font-semibold">{fmtNumber(r.score, 2)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WeeklyTab() {
  const [round, setRound] = useState<RoundView | null>(null);
  const start = useMutation({ mutationFn: () => startRound('weekly'), onSuccess: setRound });
  return (
    <div className="space-y-6">
      {round ? (
        <RoundPlayer kind="weekly" initial={round} />
      ) : (
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-accent">Weekly challenge</div>
              <h2 className="mt-1 text-lg font-semibold">Same chart for everyone. One attempt.</h2>
              <p className="mt-1 max-w-2xl text-sm text-fg-muted">
                You start with ₱100,000 and 120 candles of history, then trade the next 140 candles as they appear. Scored by return minus half your worst drawdown.
                A new chart every Monday (Manila time). If you already started this week, this continues your attempt.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={() => start.mutate()} loading={start.isPending}>
              <CandlestickChart className="h-4 w-4" /> Open this week's chart
            </Button>
          </div>
          {start.isError && <p className="mt-3 text-sm text-down">{(start.error as Error).message}</p>}
        </Card>
      )}
      <WeeklyLeaderboard />
    </div>
  );
}

// ------------------------------------------------------------------ live market
function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  return <span className="font-mono">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</span>;
}

function LiveTab() {
  const qc = useQueryClient();
  const [symbol, setSymbol] = useState('MNLX');
  const [error, setError] = useState<string | null>(null);
  const tickers = useQuery({ queryKey: ['tf', 'tickers'], queryFn: liveTickers, refetchInterval: 60_000 });
  const chart = useQuery({ queryKey: ['tf', 'live-candles', symbol], queryFn: () => liveCandles(symbol), refetchInterval: 60_000 });
  const account = useQuery({ queryKey: ['tf', 'account'], queryFn: liveAccount, refetchInterval: 60_000 });
  const setAcct = (a: LiveAccount) => {
    qc.setQueryData(['tf', 'account'], a);
    setError(null);
  };
  const trade = useMutation({ mutationFn: ({ side, qty, note }: { side: 'buy' | 'sell'; qty: number; note?: string }) => liveTrade(symbol, side, qty, note), onSuccess: setAcct, onError: (e) => setError((e as Error).message) });
  const exits = useMutation({ mutationFn: ({ stop, take }: { stop: number | null; take: number | null }) => liveSetExits(symbol, stop, take), onSuccess: setAcct, onError: (e) => setError((e as Error).message) });

  const pos = account.data?.positions.find((p) => p.symbol === symbol);
  const price = chart.data?.candles.at(-1)?.c ?? 0;
  const fills = useMemo(() => [], []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tickers.data?.map((t) => (
          <button
            key={t.symbol}
            onClick={() => setSymbol(t.symbol)}
            className={cn('min-w-[130px] rounded-lg border px-3 py-2 text-left', t.symbol === symbol ? 'border-accent bg-accent-muted' : 'border-border hover:border-border-strong')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold">{t.symbol}</span>
              <span className={cn('font-mono text-xs', t.change_pct >= 0 ? 'text-up' : 'text-down')}>{fmtPct(t.change_pct, 2, true)}</span>
            </div>
            <div className="truncate text-[0.7rem] text-fg-subtle">{t.name}</div>
            <div className="font-mono text-sm">{fmtNumber(t.price, t.price < 10 ? 3 : 2)}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <span className="font-mono text-base font-semibold text-fg">{symbol}</span>
            <span>{tickers.data?.find((t) => t.symbol === symbol)?.name}</span>
            <span>· hourly candles · simulated</span>
            {chart.data && (
              <span className="ml-auto inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Next candle in <Countdown to={chart.data.nextCandleAt} />
              </span>
            )}
          </div>
          {chart.isPending ? (
            <LoadingState />
          ) : chart.isError ? (
            <ErrorState error={chart.error} onRetry={() => chart.refetch()} />
          ) : (
            <TradingChart
              candles={chart.data.candles}
              storageKey={`live-${symbol}`}
              hourly
              fills={fills}
              position={pos ? { qty: pos.qty, avg: pos.avg_price, stop: pos.stop_price, take: pos.take_price } : null}
            />
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            {account.data ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Equity</div>
                  <div className="font-mono text-sm font-semibold">{fmtMoney(account.data.equity, 'PHP', 0)}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Return</div>
                  <div className={cn('font-mono text-sm font-semibold', account.data.return_pct >= 0 ? 'text-up' : 'text-down')}>{fmtPct(account.data.return_pct, 2, true)}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Cash</div>
                  <div className="font-mono text-sm font-semibold">{fmtMoney(account.data.cash, 'PHP', 0)}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">{symbol}</div>
                  <div className="font-mono text-sm font-semibold">{pos ? `${pos.qty > 0 ? 'Long' : 'Short'} ${fmtNumber(Math.abs(pos.qty), 0)}` : 'Flat'}</div>
                </div>
              </div>
            ) : (
              <LoadingState />
            )}
          </Card>
          {account.data && price > 0 && (
            <Card className="p-4">
              <OrderTicket
                price={price}
                qty={pos?.qty ?? 0}
                equity={account.data.equity}
                stop={pos?.stop_price ?? null}
                take={pos?.take_price ?? null}
                busy={trade.isPending || exits.isPending}
                error={error}
                onOrder={(side, qty, note) => trade.mutate({ side, qty, note })}
                onExits={(stop, take) => exits.mutate({ stop, take })}
              />
            </Card>
          )}
        </div>
      </div>
      {tickers.data && tickers.data.length > 0 && <MarketMovers tickers={tickers.data} selected={symbol} onPick={setSymbol} />}
      {account.data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Positions" />
            <CardContent className="px-0 pb-1">
              {!account.data.positions.length ? (
                <p className="px-4 pb-3 text-sm text-fg-muted">No open positions.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Ticker</Th>
                      <Th align="right">Qty</Th>
                      <Th align="right">Avg</Th>
                      <Th align="right">Last</Th>
                      <Th align="right">P&L</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.data.positions.map((p) => (
                      <tr key={p.symbol} className="cursor-pointer hover:bg-surface-2" onClick={() => setSymbol(p.symbol)}>
                        <Td mono>{p.symbol}</Td>
                        <Td align="right" mono>{fmtNumber(p.qty, 0)}</Td>
                        <Td align="right" mono>{fmtNumber(p.avg_price, 2)}</Td>
                        <Td align="right" mono>{fmtNumber(p.price, 2)}</Td>
                        <Td align="right" mono className={p.unrealized >= 0 ? 'text-up' : 'text-down'}>{fmtMoney(p.unrealized, 'PHP', 0)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Recent trades" />
            <CardContent className="px-0 pb-1">
              {!account.data.trades.length ? (
                <p className="px-4 pb-3 text-sm text-fg-muted">No trades yet.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>When</Th>
                      <Th>Trade</Th>
                      <Th align="right">Price</Th>
                      <Th align="right">P&L</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.data.trades.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <Td className="text-xs text-fg-muted">{fmtDateTime(t.created_at)}</Td>
                        <Td>
                          <span className={t.side === 'buy' ? 'text-up' : 'text-down'}>{t.side === 'buy' ? 'Buy' : 'Sell'}</span> {fmtNumber(t.qty, 0)} {t.symbol}
                          {t.reason !== 'market' && <Badge className="ml-1.5" tone={t.reason === 'stop' ? 'down' : 'up'}>{t.reason === 'stop' ? 'Stop' : 'Target'}</Badge>}
                          {t.note && <div className="mt-0.5 max-w-xs truncate text-xs italic text-fg-muted" title={t.note}>“{t.note}”</div>}
                        </Td>
                        <Td align="right" mono>{fmtNumber(t.price, 2)}</Td>
                        <Td align="right" mono className={t.pnl > 0 ? 'text-up' : t.pnl < 0 ? 'text-down' : 'text-fg-subtle'}>{t.pnl ? fmtMoney(t.pnl, 'PHP', 0) : '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ history
function HistoryTab() {
  const rows = useQuery({ queryKey: ['tf', 'history'], queryFn: () => myRounds(50) });
  if (rows.isPending) return <LoadingState />;
  if (rows.isError) return <ErrorState error={rows.error} onRetry={() => rows.refetch()} />;
  if (!rows.data.length) return <EmptyState icon={<CandlestickChart className="h-5 w-5" />} title="No rounds yet" description="Play a practice round to see your results here." />;
  return (
    <Card>
      <CardContent className="px-0 pb-1 pt-1">
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Round</Th>
              <Th align="right">Return</Th>
              <Th align="right" className="hidden sm:table-cell">Max DD</Th>
              <Th align="right" className="hidden sm:table-cell">Trades</Th>
              <Th align="right">Score</Th>
            </tr>
          </thead>
          <tbody>
            {rows.data.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <Td className="text-xs text-fg-muted">{fmtDate(r.created_at)}</Td>
                <Td>
                  <span className="font-mono">{r.symbol}</span>{' '}
                  <Badge tone={r.kind === 'weekly' ? 'accent' : 'neutral'}>{r.kind === 'weekly' ? 'Weekly' : 'Practice'}</Badge>
                  {r.status === 'active' && <Badge className="ml-1" tone="info">In progress</Badge>}
                </Td>
                <Td align="right" mono className={(r.return_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}>{fmtPct(r.return_pct, 2, true)}</Td>
                <Td align="right" mono className="hidden sm:table-cell">{fmtPct(r.max_drawdown)}</Td>
                <Td align="right" mono className="hidden sm:table-cell">{r.trades}</Td>
                <Td align="right" mono className="font-semibold">{r.score === null ? '—' : fmtNumber(r.score, 2)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function TradingFloorPage() {
  const [params, setParams] = useSearchParams();
  const tab = (['practice', 'weekly', 'live', 'history'].includes(params.get('tab') ?? '') ? params.get('tab') : 'practice') as TabId;
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Markets"
        title="Trading Floor"
        description="Trade simulated stocks on real charts with indicators, support and resistance, trend lines and Fibonacci. Play quick rounds, take the weekly challenge, or run a live account. Practice money only."
      />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(v) => setParams({ tab: v })}
        tabs={[
          { value: 'practice', label: 'Practice round' },
          { value: 'weekly', label: 'Weekly challenge' },
          { value: 'live', label: 'Live market' },
          { value: 'history', label: 'My rounds' },
        ]}
      />
      {tab === 'practice' && <PracticeTab />}
      {tab === 'weekly' && <WeeklyTab />}
      {tab === 'live' && <LiveTab />}
      {tab === 'history' && <HistoryTab />}
      <p className="mt-6 text-[0.7rem] text-fg-subtle">
        Charts by{' '}
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="underline hover:text-fg-muted">
          TradingView Lightweight Charts
        </a>
        . All tickers are fictional and prices are simulated; nothing here is investment advice.
      </p>
    </div>
  );
}

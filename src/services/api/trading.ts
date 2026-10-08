// Trading Floor: simulated-market rounds, the weekly challenge and the live market.
// Every price and fill comes from the database; future candles are never sent.
import { supabase, unwrap } from '@/lib/supabase';
import type { Candle } from '@/features/trading/indicators';

type RawCandle = [number | string, number | string, number | string, number | string, number | string];

export interface RoundFill { i: number; side: 'buy' | 'sell'; qty: number; price: number; reason: 'market' | 'stop' | 'take' | 'close'; pnl: number }
export interface RoundView {
  id: string;
  kind: 'practice' | 'weekly';
  symbol: string;
  week_start: string | null;
  status: 'active' | 'finished';
  cursor: number;
  last_index: number;
  start_cash: number;
  cash: number;
  qty: number;
  avg_price: number;
  stop_price: number | null;
  take_price: number | null;
  fees: number;
  realized: number;
  trades: number;
  wins: number;
  max_drawdown: number;
  price: number;
  equity: number;
  final_equity: number | null;
  return_pct: number | null;
  score: number | null;
  /** Index of the first candle in `candles`. */
  from: number;
  candles: Candle[];
  fills: RoundFill[];
}

/** Rounds use daily candles on a made-up calendar starting Monday 6 January 2025. */
const ROUND_BASE = Date.UTC(2025, 0, 6) / 1000;
export const roundTime = (i: number) => ROUND_BASE + i * 86400;

function toRound(raw: Record<string, unknown>): RoundView {
  const n = (x: unknown) => (x === null || x === undefined ? null : Number(x));
  const from = Number(raw.from ?? 0);
  return {
    ...(raw as unknown as RoundView),
    cursor: Number(raw.cursor), last_index: Number(raw.last_index), start_cash: Number(raw.start_cash), cash: Number(raw.cash),
    qty: Number(raw.qty), avg_price: Number(raw.avg_price), stop_price: n(raw.stop_price), take_price: n(raw.take_price),
    fees: Number(raw.fees), realized: Number(raw.realized), trades: Number(raw.trades), wins: Number(raw.wins),
    max_drawdown: Number(raw.max_drawdown), price: Number(raw.price), equity: Number(raw.equity),
    final_equity: n(raw.final_equity), return_pct: n(raw.return_pct), score: n(raw.score), from,
    candles: ((raw.candles as RawCandle[]) ?? []).map(([o, h, l, c, v], k) => ({ time: roundTime(from + k), o: +o, h: +h, l: +l, c: +c, v: +v })),
    fills: ((raw.fills as RoundFill[]) ?? []).map((f) => ({ ...f, i: Number(f.i), qty: Number(f.qty), price: Number(f.price), pnl: Number(f.pnl) })),
  };
}

export async function startRound(kind: 'practice' | 'weekly') {
  return toRound(unwrap(await supabase.rpc('tf_start_round', { p_kind: kind })) as Record<string, unknown>);
}
export async function getRound(id: string) {
  return toRound(unwrap(await supabase.rpc('tf_get_round', { p_round: id })) as Record<string, unknown>);
}
export async function advanceRound(id: string, steps = 1) {
  return toRound(unwrap(await supabase.rpc('tf_advance', { p_round: id, p_steps: steps })) as Record<string, unknown>);
}
export async function placeRoundOrder(id: string, side: 'buy' | 'sell', qty: number) {
  return toRound(unwrap(await supabase.rpc('tf_order', { p_round: id, p_side: side, p_qty: qty })) as Record<string, unknown>);
}
export async function setRoundExits(id: string, stop: number | null, take: number | null) {
  return toRound(unwrap(await supabase.rpc('tf_set_exits', { p_round: id, p_stop: stop, p_take: take })) as Record<string, unknown>);
}
export async function finishRound(id: string) {
  return toRound(unwrap(await supabase.rpc('tf_finish', { p_round: id })) as Record<string, unknown>);
}

export interface RoundSummary {
  id: string; kind: 'practice' | 'weekly'; symbol: string; week_start: string | null; status: string;
  return_pct: number | null; max_drawdown: number; score: number | null; trades: number; wins: number; created_at: string;
}
export async function myRounds(limit = 30): Promise<RoundSummary[]> {
  return unwrap(await supabase.rpc('tf_my_rounds', { p_limit: limit })) as RoundSummary[];
}

export interface TradingLeaderRow {
  rank: number; user_id: string; handle: string; display_name: string; return_pct: number; max_drawdown: number; score: number; trades: number; is_me: boolean;
}
export async function weeklyTradingLeaderboard(): Promise<TradingLeaderRow[]> {
  const rows = unwrap(await supabase.rpc('tf_weekly_leaderboard', { p_limit: 100 })) as TradingLeaderRow[];
  return rows.map((r) => ({ ...r, rank: Number(r.rank), return_pct: Number(r.return_pct), max_drawdown: Number(r.max_drawdown), score: Number(r.score), trades: Number(r.trades) }));
}

// ------------------------------------------------------------ live market
export interface LiveTicker { symbol: string; name: string; sector: string; price: number; change_pct: number }
export async function liveTickers(): Promise<LiveTicker[]> {
  const rows = unwrap(await supabase.rpc('tf_live_tickers')) as LiveTicker[];
  return rows.map((r) => ({ ...r, price: Number(r.price), change_pct: Number(r.change_pct) }));
}
export async function liveCandles(symbol: string, limit = 500): Promise<{ candles: Candle[]; nextCandleAt: string }> {
  const raw = unwrap(await supabase.rpc('tf_live_candles', { p_symbol: symbol, p_limit: limit })) as {
    epoch: number; next_candle_at: string; candles: [number, ...RawCandle][];
  };
  return {
    nextCandleAt: raw.next_candle_at,
    candles: raw.candles.map(([i, o, h, l, c, v]) => ({ time: Number(raw.epoch) + Number(i) * 3600, o: +o, h: +h, l: +l, c: +c, v: +v })),
  };
}
export interface LivePosition { symbol: string; qty: number; avg_price: number; price: number; stop_price: number | null; take_price: number | null; unrealized: number }
export interface LiveTrade { symbol: string; side: 'buy' | 'sell'; qty: number; price: number; reason: string; pnl: number; created_at: string }
export interface LiveAccount { cash: number; start_cash: number; fees: number; equity: number; return_pct: number; positions: LivePosition[]; trades: LiveTrade[] }
function toAccount(raw: Record<string, unknown>): LiveAccount {
  const num = (x: unknown) => (x === null || x === undefined ? null : Number(x));
  return {
    cash: Number(raw.cash), start_cash: Number(raw.start_cash), fees: Number(raw.fees), equity: Number(raw.equity), return_pct: Number(raw.return_pct),
    positions: ((raw.positions as LivePosition[]) ?? []).map((p) => ({
      ...p, qty: Number(p.qty), avg_price: Number(p.avg_price), price: Number(p.price), stop_price: num(p.stop_price), take_price: num(p.take_price), unrealized: Number(p.unrealized),
    })),
    trades: ((raw.trades as LiveTrade[]) ?? []).map((t) => ({ ...t, qty: Number(t.qty), price: Number(t.price), pnl: Number(t.pnl) })),
  };
}
export async function liveAccount() {
  return toAccount(unwrap(await supabase.rpc('tf_live_account')) as Record<string, unknown>);
}
export async function liveTrade(symbol: string, side: 'buy' | 'sell', qty: number) {
  return toAccount(unwrap(await supabase.rpc('tf_live_trade', { p_symbol: symbol, p_side: side, p_qty: qty })) as Record<string, unknown>);
}
export async function liveSetExits(symbol: string, stop: number | null, take: number | null) {
  return toAccount(unwrap(await supabase.rpc('tf_live_set_exits', { p_symbol: symbol, p_stop: stop, p_take: take })) as Record<string, unknown>);
}

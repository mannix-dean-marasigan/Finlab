// Technical indicators, computed in the browser from the candles the player can already see.
// Each returns one value per candle (null while there isn't enough history yet).

export interface Candle {
  time: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
type Series = (number | null)[];

export function sma(values: number[], n: number): Series {
  const out: Series = [];
  let sum = 0;
  values.forEach((v, i) => {
    sum += v;
    if (i >= n) sum -= values[i - n];
    out.push(i >= n - 1 ? sum / n : null);
  });
  return out;
}

export function ema(values: number[], n: number): Series {
  const out: Series = [];
  const k = 2 / (n + 1);
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i < n - 1) return out.push(null);
    if (prev === null) prev = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
    else prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

/** Wilder's RSI. */
export function rsi(closes: number[], n = 14): Series {
  const out: Series = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = Math.max(d, 0);
    const l = Math.max(-d, 0);
    if (i <= n) {
      gain += g / n;
      loss += l / n;
      out.push(i === n ? (loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)) : null);
    } else {
      gain = (gain * (n - 1) + g) / n;
      loss = (loss * (n - 1) + l) / n;
      out.push(loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
    }
  }
  return out;
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(closes, fast);
  const s = ema(closes, slow);
  const line: Series = closes.map((_, i) => (f[i] !== null && s[i] !== null ? (f[i] as number) - (s[i] as number) : null));
  const start = line.findIndex((x) => x !== null);
  const sig: Series = closes.map(() => null);
  if (start >= 0) {
    const e = ema(line.slice(start) as number[], signal);
    e.forEach((x, j) => (sig[start + j] = x));
  }
  const hist: Series = line.map((x, i) => (x !== null && sig[i] !== null ? x - (sig[i] as number) : null));
  return { line, signal: sig, hist };
}

export function bollinger(closes: number[], n = 20, k = 2) {
  const mid = sma(closes, n);
  const upper: Series = [];
  const lower: Series = [];
  closes.forEach((_, i) => {
    if (mid[i] === null) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const win = closes.slice(i - n + 1, i + 1);
    const m = mid[i] as number;
    const sd = Math.sqrt(win.reduce((a, x) => a + (x - m) ** 2, 0) / n);
    upper.push(m + k * sd);
    lower.push(m - k * sd);
  });
  return { mid, upper, lower };
}

/** Volume-weighted average price, cumulative over the candles shown. */
export function vwap(candles: Candle[]): Series {
  let pv = 0;
  let vol = 0;
  return candles.map((c) => {
    pv += ((c.h + c.l + c.c) / 3) * c.v;
    vol += c.v;
    return vol ? pv / vol : null;
  });
}

export interface Level {
  price: number;
  kind: 'support' | 'resistance';
  touches: number;
}

/**
 * Automatic support and resistance: swing highs and lows over the recent candles, grouped when they sit within
 * ~1% of each other. The most-tested levels below the price are support, above it resistance.
 */
export function supportResistance(candles: Candle[], lookback = 150, span = 3, maxEach = 3): Level[] {
  const cs = candles.slice(-lookback);
  if (cs.length < span * 2 + 5) return [];
  const pivots: number[] = [];
  for (let i = span; i < cs.length - span; i++) {
    const win = cs.slice(i - span, i + span + 1);
    if (cs[i].h >= Math.max(...win.map((x) => x.h))) pivots.push(cs[i].h);
    if (cs[i].l <= Math.min(...win.map((x) => x.l))) pivots.push(cs[i].l);
  }
  const clusters: { price: number; touches: number }[] = [];
  for (const p of pivots.sort((a, b) => a - b)) {
    const last = clusters[clusters.length - 1];
    if (last && Math.abs(p - last.price) / last.price < 0.01) {
      last.price = (last.price * last.touches + p) / (last.touches + 1);
      last.touches++;
    } else clusters.push({ price: p, touches: 1 });
  }
  const price = cs[cs.length - 1].c;
  const strong = clusters.filter((x) => x.touches >= 2);
  const pick = (kind: Level['kind']) =>
    strong
      .filter((x) => (kind === 'support' ? x.price < price : x.price > price))
      .sort((a, b) => b.touches - a.touches || Math.abs(a.price - price) - Math.abs(b.price - price))
      .slice(0, maxEach)
      .map((x) => ({ price: x.price, touches: x.touches, kind }));
  return [...pick('support'), ...pick('resistance')];
}

export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

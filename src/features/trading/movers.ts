import type { Candle } from './indicators';

export interface MoverStats {
  changePct: number;
  high: number;
  low: number;
  /** Typical size of one hourly move in the window, in %. A simple way to show risk. */
  swingPct: number;
}

/** Change, high, low and typical hourly swing over the last `hours` hourly candles. */
export function moverStats(candles: Candle[], hours: number): MoverStats | null {
  if (candles.length < 2) return null;
  const window = candles.slice(-(hours + 1));
  const first = window[0].c;
  const last = window[window.length - 1].c;
  if (!(first > 0)) return null;
  const rets: number[] = [];
  for (let i = 1; i < window.length; i++) if (window[i - 1].c > 0) rets.push(window[i].c / window[i - 1].c - 1);
  const mean = rets.reduce((s, r) => s + r, 0) / (rets.length || 1);
  const sd = Math.sqrt(rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length || 1));
  return {
    changePct: (last / first - 1) * 100,
    high: Math.max(...window.slice(1).map((c) => c.h)),
    low: Math.min(...window.slice(1).map((c) => c.l)),
    swingPct: sd * 100,
  };
}

/** Average change per sector, biggest first. */
export function sectorAverages(rows: { sector: string; changePct: number }[]): { sector: string; changePct: number; count: number }[] {
  const by = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const s = by.get(r.sector) ?? { sum: 0, count: 0 };
    s.sum += r.changePct;
    s.count += 1;
    by.set(r.sector, s);
  }
  return [...by.entries()].map(([sector, s]) => ({ sector, changePct: s.sum / s.count, count: s.count })).sort((a, b) => b.changePct - a.changePct);
}

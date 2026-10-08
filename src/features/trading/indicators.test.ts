import { describe, expect, it } from 'vitest';
import { bollinger, ema, macd, rsi, sma, supportResistance, vwap, type Candle } from './indicators';

const closes = [10, 11, 12, 13, 14, 13, 12, 13, 14, 15];

describe('indicators', () => {
  it('sma averages the last n values', () => {
    expect(sma(closes, 3).slice(0, 4)).toEqual([null, null, 11, 12]);
  });

  it('ema starts at the sma and then weights recent prices more', () => {
    const e = ema(closes, 3);
    expect(e[2]).toBeCloseTo(11);
    expect(e[3]).toBeCloseTo(12);
    expect(e[9]!).toBeGreaterThan(sma(closes, 3)[9]! - 0.5);
  });

  it('rsi stays between 0 and 100 and is 100 in a straight rise', () => {
    const r = rsi(closes, 3).filter((x) => x !== null) as number[];
    expect(r.every((x) => x >= 0 && x <= 100)).toBe(true);
    expect(rsi([1, 2, 3, 4, 5], 3)[3]).toBe(100);
  });

  it('macd histogram equals line minus signal', () => {
    const series = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 4) * 5);
    const m = macd(series);
    const i = 50;
    expect(m.hist[i]).toBeCloseTo((m.line[i] as number) - (m.signal[i] as number));
  });

  it('bollinger bands surround the middle band', () => {
    const b = bollinger(closes, 5, 2);
    expect(b.upper[9]!).toBeGreaterThan(b.mid[9]!);
    expect(b.lower[9]!).toBeLessThan(b.mid[9]!);
  });

  it('vwap weights by volume', () => {
    const cs: Candle[] = [
      { time: 1, o: 10, h: 10, l: 10, c: 10, v: 100 },
      { time: 2, o: 20, h: 20, l: 20, c: 20, v: 300 },
    ];
    expect(vwap(cs)[1]).toBeCloseTo(17.5);
  });

  it('finds support and resistance in a trading range', () => {
    // A range bouncing between ~90 and ~110, ending near the middle.
    const cs: Candle[] = Array.from({ length: 120 }, (_, i) => {
      const mid = 100 + 10 * Math.sin(i / 3);
      return { time: i, o: mid, h: mid + 0.5, l: mid - 0.5, c: mid, v: 1000 };
    });
    cs.push({ time: 200, o: 100, h: 100.5, l: 99.5, c: 100, v: 1000 });
    const levels = supportResistance(cs);
    const support = levels.filter((l) => l.kind === 'support');
    const resistance = levels.filter((l) => l.kind === 'resistance');
    expect(support.some((l) => Math.abs(l.price - 89.5) < 1.5)).toBe(true);
    expect(resistance.some((l) => Math.abs(l.price - 110.5) < 1.5)).toBe(true);
  });
});

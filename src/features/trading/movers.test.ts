import { describe, expect, it } from 'vitest';
import { moverStats, sectorAverages } from './movers';

const c = (time: number, close: number, h = close + 1, l = close - 1) => ({ time, o: close, h, l, c: close, v: 100 });

describe('market movers', () => {
  it('measures change, range and swing over the window', () => {
    const candles = [c(0, 90), c(1, 100), c(2, 102), c(3, 99), c(4, 110)];
    const s = moverStats(candles, 3)!;
    expect(s.changePct).toBeCloseTo(10); // 100 -> 110
    expect(s.high).toBe(111);
    expect(s.low).toBe(98);
    expect(s.swingPct).toBeGreaterThan(0);
  });

  it('uses whatever history exists when the window is longer', () => {
    expect(moverStats([c(0, 50), c(1, 55)], 168)!.changePct).toBeCloseTo(10);
    expect(moverStats([c(0, 50)], 24)).toBeNull();
  });

  it('averages sectors and sorts best first', () => {
    const out = sectorAverages([
      { sector: 'Banks', changePct: 2 },
      { sector: 'Mining', changePct: -4 },
      { sector: 'Banks', changePct: 4 },
    ]);
    expect(out).toEqual([
      { sector: 'Banks', changePct: 3, count: 2 },
      { sector: 'Mining', changePct: -4, count: 1 },
    ]);
  });
});

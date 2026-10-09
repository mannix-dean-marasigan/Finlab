import { describe, expect, it } from 'vitest';
import { EMPTY, metrics, projected, review, SCENARIOS, total } from './planner';

const s = (id: string) => SCENARIOS.find((x) => x.id === id)!;

describe('portfolio planner', () => {
  it('computes return and risk, with diversification lowering risk', () => {
    const allIndex = metrics({ ...EMPTY, index: 100 });
    expect(allIndex.expectedReturn).toBeCloseTo(9);
    expect(allIndex.volatility).toBeCloseTo(20);
    const mixed = metrics({ ...EMPTY, index: 50, global: 50 });
    expect(mixed.volatility).toBeLessThan(18.5);
    const cash = metrics({ ...EMPTY, cash: 100 });
    expect(cash.volatility).toBeCloseTo(0.5);
    expect(cash.liquidShare).toBe(100);
  });

  it('every coach plan passes its own scenario', () => {
    for (const sc of SCENARIOS) {
      expect(total(sc.coach)).toBe(100);
      expect(review(sc.coach, sc).score, sc.id).toBe(100);
    }
  });

  it('flags a risky emergency fund and a timid retirement plan', () => {
    const risky = review({ ...EMPTY, stocks: 60, cash: 40 }, s('emergency'));
    expect(risky.score).toBeLessThan(60);
    expect(risky.checks.find((c) => c.label.startsWith('Growth'))!.ok).toBe(false);
    const timid = review({ ...EMPTY, cash: 50, td: 50 }, s('retire'));
    expect(timid.checks.find((c) => c.label.startsWith('Growth'))!.detail).toMatch(/could grow more/);
  });

  it('requires the plan to add up to 100%', () => {
    expect(review({ ...EMPTY, cash: 40 }, s('emergency')).checks[0].ok).toBe(false);
  });

  it('projects growth with compounding', () => {
    expect(projected(100_000, 10, 2)).toBeCloseTo(121_000);
  });
});

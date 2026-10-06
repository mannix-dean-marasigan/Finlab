import { describe, expect, it } from 'vitest';
import { accretionLab, irrAnnuity, multiplesLab, npvLab, portfolioLab, ratioLab, waccLab } from './calculators';

describe('lesson calculators', () => {
  it('ratio lab matches hand calculations', () => {
    const r = ratioLab({ revenue: 1000, cogs: 650, opex: 200, interest: 20, taxRate: 25, assets: 1200, equity: 600, currentAssets: 450, inventory: 150, currentLiabilities: 300 });
    expect(r.ebit).toBe(150);
    expect(r.netIncome).toBe(97.5);
    expect(r.roe).toBeCloseTo(16.25, 6);
    expect(r.quickRatio).toBeCloseTo(1, 6);
    // DuPont identity: ROE = net margin × asset turnover × equity multiplier
    expect((r.netMargin / 100) * r.assetTurnover * r.equityMultiplier * 100).toBeCloseTo(r.roe, 6);
  });
  it('multiples lab: Mindanao Power case', () => {
    const m = multiplesLab({ eps: 4.2, pe: 12, bvps: 30, pb: 1.6, price: 42 });
    expect(m.blended).toBeCloseTo(49.2, 6);
    expect(m.rating).toBe('BUY');
  });
  it('WACC lab: Mindoro Utilities case', () => {
    expect(waccLab({ rf: 5.5, beta: 1.3, mrp: 6, kd: 8, tax: 25, debtWeight: 30 }).wacc).toBeCloseTo(11.11, 6);
  });
  it('portfolio lab: diversification lowers volatility', () => {
    const hi = portfolioLab({ wEq: 60, wBd: 40, rEq: 10, rBd: 5, rCash: 4, volEq: 18, volBd: 6, corr: 0.8, rf: 4 });
    const lo = portfolioLab({ wEq: 60, wBd: 40, rEq: 10, rBd: 5, rCash: 4, volEq: 18, volBd: 6, corr: -0.2, rf: 4 });
    expect(lo.vol).toBeLessThan(hi.vol);
    expect(hi.expected).toBeCloseTo(8, 6);
  });
  it('accretion lab: Archipelago Foods case', () => {
    const a = accretionLab({ acqNi: 800, acqShares: 200, tgtNi: 150, newShares: 50, synergies: 30 });
    expect(a.proForma).toBeCloseTo(3.92, 6);
    expect(a.accretion).toBeCloseTo(-2, 6);
    expect(a.breakEvenSynergies).toBeCloseTo(50, 6);
  });
  it('NPV lab and IRR: Cebu Logistics case', () => {
    const n = npvLab({ cost: 500, cashFlow: 90, years: 10, rate: 11, downside: 20 });
    expect(n.npv).toBeCloseTo(30.03, 1);
    expect(n.downsideNpv).toBeCloseTo(-75.98, 1);
    expect(n.irr!).toBeCloseTo(12.42, 1);
    expect(irrAnnuity(100, 5, 10)).toBeNull();
  });
});

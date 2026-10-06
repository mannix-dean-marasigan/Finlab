import { describe, expect, it } from 'vitest';
import { dcfSensitivity, median, pbTargetPrice, peTargetPrice, ratingFromUpside, runDcf, upsidePct, validateDcf, DEFAULT_DCF_INPUTS } from './valuation';
import { computeModel, emptyModel, assumptionsFromHistory } from './model';
import { computePortfolio, concentrationLabel } from './portfolio';

describe('multiples', () => {
  it('computes P/E and P/B target prices (Mindanao Power case)', () => {
    expect(peTargetPrice(4.2, median([11, 12, 13])!)).toBeCloseTo(50.4, 6);
    expect(pbTargetPrice(30, 1.6)).toBeCloseTo(48, 6);
    const blended = (50.4 + 48) / 2;
    expect(upsidePct(blended, 42)).toBeCloseTo(17.142857, 4);
    expect(ratingFromUpside(upsidePct(blended, 42))).toBe('BUY');
  });
  it('rating thresholds', () => {
    expect(ratingFromUpside(9.99)).toBe('HOLD');
    expect(ratingFromUpside(-10)).toBe('SELL');
    expect(ratingFromUpside(null)).toBeNull();
    expect(upsidePct(10, 0)).toBeNull();
  });
  it('median of even-length list', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe('simplified DCF', () => {
  it('matches a hand-computed constant-growth case', () => {
    // Zero capex/NWC/D&A, 0% growth: FCFF = revenue × margin × (1 − t)
    const r = runDcf({
      ...DEFAULT_DCF_INPUTS,
      baseRevenue: 1000, years: 3, revenueGrowthPct: 0, ebitMarginPct: 20, taxRatePct: 25,
      daPctRevenue: 0, capexPctRevenue: 0, nwcPctRevenue: 0, waccPct: 10, terminalGrowthPct: 0,
      netDebt: 0, sharesOutstanding: 10,
    });
    // FCFF = 150 each year; perpetuity value = 150 / 0.10 = 1500
    expect(r.rows.every((y) => Math.abs(y.fcff - 150) < 1e-9)).toBe(true);
    expect(r.enterpriseValue).toBeCloseTo(1500, 6);
    expect(r.valuePerShare).toBeCloseTo(150, 6);
  });
  it('validates WACC above terminal growth', () => {
    expect(validateDcf({ ...DEFAULT_DCF_INPUTS, waccPct: 3, terminalGrowthPct: 3 })).toContain('Terminal growth must be below WACC.');
    expect(validateDcf(DEFAULT_DCF_INPUTS)).toEqual([]);
  });
  it('sensitivity: value falls as WACC rises', () => {
    const grid = dcfSensitivity(DEFAULT_DCF_INPUTS);
    const mid = grid.map((row) => row.values[2].value!);
    for (let i = 1; i < mid.length; i++) expect(mid[i]).toBeLessThan(mid[i - 1]);
  });
});

describe('financial model', () => {
  it('derives gross profit, EBIT, net income and margins', () => {
    const rows = computeModel({
      historical: [{ label: 'FY2025', revenue: 800, cogs: 520, opex: 144, taxes: 34 }],
      forecast: [{ label: 'FY2026E', revenueGrowthPct: 10, grossMarginPct: 35, opexPctRevenue: 18, taxRatePct: 25 }],
    });
    expect(rows[0].grossProfit).toBe(280);
    expect(rows[0].ebit).toBe(136);
    expect(rows[0].netIncome).toBe(102);
    // Pampanga Foods challenge numbers
    expect(rows[1].revenue).toBeCloseTo(880, 6);
    expect(rows[1].grossProfit).toBeCloseTo(308, 6);
    expect(rows[1].ebit).toBeCloseTo(149.6, 6);
    expect(rows[1].netIncome).toBeCloseTo(112.2, 6);
    expect(rows[1].ebitMarginPct).toBeCloseTo(17, 6);
  });
  it('seeds assumptions from history', () => {
    const a = assumptionsFromHistory(emptyModel().historical, 2, 2026);
    expect(a).toHaveLength(2);
    expect(a[0].label).toBe('FY2026E');
    expect(a[0].revenueGrowthPct).toBeCloseTo(5.3, 1);
  });
});

describe('portfolio', () => {
  it('computes values, P/L, weights and concentration', () => {
    const m = computePortfolio(
      [
        { securityId: 'PSE:BDO', shares: 1000, avgCostLocal: 140, costBasisBase: 140000, priceLocal: 150, fxToBase: 1 },
        { securityId: 'NASDAQ:AAPL', shares: 10, avgCostLocal: 200, costBasisBase: 115000, priceLocal: 228, fxToBase: 57.5 },
      ],
      745000,
      1000000,
    );
    expect(m.investedValue).toBeCloseTo(150000 + 131100, 6);
    expect(m.totalValue).toBeCloseTo(1026100, 6);
    expect(m.totalReturnPct).toBeCloseTo(2.61, 2);
    expect(m.unrealizedPl).toBeCloseTo(10000 + 16100, 6);
    expect(m.positions[0].securityId).toBe('PSE:BDO');
    expect(m.effectivePositions).toBeGreaterThan(1.9);
    expect(concentrationLabel(m).tone).toBe('down');
  });
});

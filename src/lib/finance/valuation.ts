// Valuation engines. Pure functions — no React, no I/O.
// These are SIMPLIFIED EDUCATIONAL models (beta), not professional banking models.

import type { Rating } from '@/types/domain';

export const RATING_THRESHOLD_PCT = 10;

export function peTargetPrice(eps: number, targetPE: number): number {
  return eps * targetPE;
}

export function pbTargetPrice(bvps: number, targetPB: number): number {
  return bvps * targetPB;
}

export function upsidePct(target: number, current: number): number | null {
  if (!(current > 0) || !Number.isFinite(target)) return null;
  return ((target - current) / current) * 100;
}

export function ratingFromUpside(upside: number | null, threshold = RATING_THRESHOLD_PCT): Rating | null {
  if (upside === null) return null;
  if (upside >= threshold) return 'BUY';
  if (upside <= -threshold) return 'SELL';
  return 'HOLD';
}

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// ---------------------------------------------------------------- DCF
export interface DcfInputs {
  baseRevenue: number; // last actual year revenue
  years: number; // explicit forecast years (1–10)
  revenueGrowthPct: number; // annual growth
  ebitMarginPct: number;
  taxRatePct: number;
  daPctRevenue: number; // depreciation & amortisation, % of revenue
  capexPctRevenue: number; // capital expenditure, % of revenue
  nwcPctRevenue: number; // net working capital as % of revenue (ΔNWC = % × Δrevenue)
  waccPct: number;
  terminalGrowthPct: number;
  netDebt: number;
  sharesOutstanding: number;
}

export interface DcfYear {
  year: number;
  revenue: number;
  ebit: number;
  nopat: number;
  da: number;
  capex: number;
  deltaNwc: number;
  fcff: number;
  discountFactor: number;
  pvFcff: number;
}

export interface DcfResult {
  rows: DcfYear[];
  sumPvFcff: number;
  terminalValue: number;
  pvTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  valuePerShare: number;
  terminalValueShare: number; // % of EV from terminal value
}

export const DEFAULT_DCF_INPUTS: DcfInputs = {
  baseRevenue: 1000,
  years: 5,
  revenueGrowthPct: 8,
  ebitMarginPct: 18,
  taxRatePct: 25,
  daPctRevenue: 4,
  capexPctRevenue: 5,
  nwcPctRevenue: 10,
  waccPct: 10,
  terminalGrowthPct: 3,
  netDebt: 300,
  sharesOutstanding: 100,
};

export function validateDcf(i: DcfInputs): string[] {
  const errors: string[] = [];
  if (!(i.baseRevenue > 0)) errors.push('Base revenue must be positive.');
  if (!(i.years >= 1 && i.years <= 10)) errors.push('Forecast years must be between 1 and 10.');
  if (!(i.waccPct > 0)) errors.push('WACC must be positive.');
  if (i.terminalGrowthPct >= i.waccPct) errors.push('Terminal growth must be below WACC.');
  if (i.terminalGrowthPct > 6) errors.push('Terminal growth above 6% is unrealistic for a perpetuity.');
  if (!(i.sharesOutstanding > 0)) errors.push('Shares outstanding must be positive.');
  if (i.taxRatePct < 0 || i.taxRatePct >= 100) errors.push('Tax rate must be between 0% and 100%.');
  return errors;
}

export function runDcf(i: DcfInputs): DcfResult {
  const wacc = i.waccPct / 100;
  const g = i.terminalGrowthPct / 100;
  const rows: DcfYear[] = [];
  let prevRevenue = i.baseRevenue;
  for (let t = 1; t <= Math.round(i.years); t++) {
    const revenue = prevRevenue * (1 + i.revenueGrowthPct / 100);
    const ebit = revenue * (i.ebitMarginPct / 100);
    const nopat = ebit * (1 - i.taxRatePct / 100);
    const da = revenue * (i.daPctRevenue / 100);
    const capex = revenue * (i.capexPctRevenue / 100);
    const deltaNwc = (revenue - prevRevenue) * (i.nwcPctRevenue / 100);
    const fcff = nopat + da - capex - deltaNwc;
    const discountFactor = 1 / Math.pow(1 + wacc, t);
    rows.push({ year: t, revenue, ebit, nopat, da, capex, deltaNwc, fcff, discountFactor, pvFcff: fcff * discountFactor });
    prevRevenue = revenue;
  }
  const last = rows[rows.length - 1];
  const sumPvFcff = rows.reduce((s, r) => s + r.pvFcff, 0);
  const terminalValue = wacc > g ? (last.fcff * (1 + g)) / (wacc - g) : NaN;
  const pvTerminalValue = terminalValue * last.discountFactor;
  const enterpriseValue = sumPvFcff + pvTerminalValue;
  const equityValue = enterpriseValue - i.netDebt;
  return {
    rows,
    sumPvFcff,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    equityValue,
    valuePerShare: equityValue / i.sharesOutstanding,
    terminalValueShare: enterpriseValue !== 0 ? (pvTerminalValue / enterpriseValue) * 100 : NaN,
  };
}

/** Value-per-share grid: rows = WACC, columns = terminal growth. */
export function dcfSensitivity(
  i: DcfInputs,
  waccSteps = [-1, -0.5, 0, 0.5, 1],
  gSteps = [-0.5, -0.25, 0, 0.25, 0.5],
): { wacc: number; values: { g: number; value: number | null }[] }[] {
  return waccSteps.map((dw) => {
    const wacc = i.waccPct + dw;
    return {
      wacc,
      values: gSteps.map((dg) => {
        const g = i.terminalGrowthPct + dg;
        if (g >= wacc || wacc <= 0) return { g, value: null };
        return { g, value: runDcf({ ...i, waccPct: wacc, terminalGrowthPct: g }).valuePerShare };
      }),
    };
  });
}

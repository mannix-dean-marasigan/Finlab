// Lightweight income-statement model: historicals + assumption-driven forecast.
// Deliberately NOT a spreadsheet: fixed line items, derived metrics computed here.

export interface HistoricalYear {
  label: string;
  revenue: number;
  cogs: number;
  opex: number;
  taxes: number;
}

export interface ForecastAssumption {
  label: string;
  revenueGrowthPct: number;
  grossMarginPct: number;
  opexPctRevenue: number;
  taxRatePct: number;
}

export interface FinancialModelData {
  historical: HistoricalYear[];
  forecast: ForecastAssumption[];
}

export interface ModelRow {
  label: string;
  type: 'historical' | 'forecast';
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebit: number;
  taxes: number;
  netIncome: number;
  revenueGrowthPct: number | null;
  grossMarginPct: number | null;
  opexPctRevenue: number | null;
  ebitMarginPct: number | null;
  taxRatePct: number | null;
  netMarginPct: number | null;
}

const pct = (num: number, den: number) => (den !== 0 && Number.isFinite(den) ? (num / den) * 100 : null);

export function computeModel(data: FinancialModelData): ModelRow[] {
  const rows: ModelRow[] = [];
  let prevRevenue: number | null = null;

  for (const h of data.historical) {
    const grossProfit = h.revenue - h.cogs;
    const ebit = grossProfit - h.opex;
    const netIncome = ebit - h.taxes;
    rows.push({
      label: h.label,
      type: 'historical',
      revenue: h.revenue,
      cogs: h.cogs,
      grossProfit,
      opex: h.opex,
      ebit,
      taxes: h.taxes,
      netIncome,
      revenueGrowthPct: prevRevenue !== null ? pct(h.revenue - prevRevenue, prevRevenue) : null,
      grossMarginPct: pct(grossProfit, h.revenue),
      opexPctRevenue: pct(h.opex, h.revenue),
      ebitMarginPct: pct(ebit, h.revenue),
      taxRatePct: pct(h.taxes, ebit),
      netMarginPct: pct(netIncome, h.revenue),
    });
    prevRevenue = h.revenue;
  }

  for (const f of data.forecast) {
    const revenue = (prevRevenue ?? 0) * (1 + f.revenueGrowthPct / 100);
    const grossProfit = revenue * (f.grossMarginPct / 100);
    const cogs = revenue - grossProfit;
    const opex = revenue * (f.opexPctRevenue / 100);
    const ebit = grossProfit - opex;
    const taxes = Math.max(0, ebit) * (f.taxRatePct / 100);
    const netIncome = ebit - taxes;
    rows.push({
      label: f.label,
      type: 'forecast',
      revenue,
      cogs,
      grossProfit,
      opex,
      ebit,
      taxes,
      netIncome,
      revenueGrowthPct: f.revenueGrowthPct,
      grossMarginPct: f.grossMarginPct,
      opexPctRevenue: f.opexPctRevenue,
      ebitMarginPct: pct(ebit, revenue),
      taxRatePct: f.taxRatePct,
      netMarginPct: pct(netIncome, revenue),
    });
    prevRevenue = revenue;
  }
  return rows;
}

/** Seed forecast assumptions from the last historical year's ratios. */
export function assumptionsFromHistory(history: HistoricalYear[], years: number, startLabel: number): ForecastAssumption[] {
  const rows = computeModel({ historical: history, forecast: [] });
  const last = rows[rows.length - 1];
  const growth = rows.length > 1 && last.revenueGrowthPct !== null ? last.revenueGrowthPct : 5;
  return Array.from({ length: years }, (_, i) => ({
    label: `FY${startLabel + i}E`,
    revenueGrowthPct: round1(growth),
    grossMarginPct: round1(last?.grossMarginPct ?? 30),
    opexPctRevenue: round1(last?.opexPctRevenue ?? 15),
    taxRatePct: round1(last?.taxRatePct ?? 25),
  }));
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function emptyModel(): FinancialModelData {
  return {
    historical: [
      { label: 'FY2023', revenue: 700, cogs: 455, opex: 126, taxes: 30 },
      { label: 'FY2024', revenue: 760, cogs: 494, opex: 137, taxes: 32 },
      { label: 'FY2025', revenue: 800, cogs: 520, opex: 144, taxes: 34 },
    ],
    forecast: [
      { label: 'FY2026E', revenueGrowthPct: 10, grossMarginPct: 35, opexPctRevenue: 18, taxRatePct: 25 },
      { label: 'FY2027E', revenueGrowthPct: 9, grossMarginPct: 35.5, opexPctRevenue: 17.5, taxRatePct: 25 },
      { label: 'FY2028E', revenueGrowthPct: 8, grossMarginPct: 36, opexPctRevenue: 17, taxRatePct: 25 },
    ],
  };
}

/** Defensive parse of stored JSON (models saved by older versions, etc.). */
export function parseModelData(raw: unknown): FinancialModelData {
  const d = (raw ?? {}) as Partial<FinancialModelData>;
  const num = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0);
  return {
    historical: Array.isArray(d.historical)
      ? d.historical.map((h) => ({ label: String(h.label ?? ''), revenue: num(h.revenue), cogs: num(h.cogs), opex: num(h.opex), taxes: num(h.taxes) }))
      : [],
    forecast: Array.isArray(d.forecast)
      ? d.forecast.map((f) => ({
          label: String(f.label ?? ''),
          revenueGrowthPct: num(f.revenueGrowthPct),
          grossMarginPct: num(f.grossMarginPct),
          opexPctRevenue: num(f.opexPctRevenue),
          taxRatePct: num(f.taxRatePct),
        }))
      : [],
  };
}

// Turns pasted closing prices (from Excel, Google Sheets or a CSV export) into yearly return, risk and covariance.

export interface PriceTable {
  tickers: string[];
  /** Oldest first. */
  dates: (Date | null)[];
  /** rows[t][k] = close of stock k on row t, oldest first. Rows with a missing price are dropped. */
  rows: number[][];
  warnings: string[];
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** Reads common date formats: 2026-09-30, 09/30/2026, 30/09/2026, Sep 30, 2026, 30-Sep-2026. */
export function parseDate(s: string): Date | null {
  const t = s.trim().replace(/"/g, '');
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(t);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    const [a, b] = [+m[1], +m[2]];
    // Month first (US style) unless the first number cannot be a month.
    const [mo, d] = a > 12 ? [b, a] : [a, b];
    return new Date(Date.UTC(y, mo - 1, d));
  }
  m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(t);
  if (m && MONTHS[m[1].toLowerCase()] !== undefined) return new Date(Date.UTC(+m[3], MONTHS[m[1].toLowerCase()], +m[2]));
  m = /^(\d{1,2})[-\s]([A-Za-z]{3})[a-z]*[-\s](\d{2,4})$/.exec(t);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) return new Date(Date.UTC(m[3].length === 2 ? 2000 + +m[3] : +m[3], MONTHS[m[2].toLowerCase()], +m[1]));
  return null;
}

/** "₱1,234.50" or "1234.5" -> 1234.5. Blank or non-numbers -> NaN. */
export function parsePrice(s: string): number {
  const t = s.trim().replace(/["₱$\s]/g, '').replace(/(PHP|USD)/gi, '');
  if (!t || t === '-') return NaN;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function splitLine(line: string, delim: string): string[] {
  if (delim !== ',') return line.split(delim);
  // CSV with quotes: "1,234.50" stays one cell.
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parsePriceTable(text: string): PriceTable | string {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());
  if (lines.length < 3) return 'Paste at least a header row and a few rows of prices.';
  const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : lines[0].includes(',') ? ',' : /\s{2,}|\s/.test(lines[0]) ? ' ' : '\t';
  const split = (l: string) => (delim === ' ' ? l.trim().split(/\s+/) : splitLine(l, delim)).map((c) => c.trim());
  const header = split(lines[0]);
  const body = lines.slice(1).map(split);
  const firstIsDate = body.slice(0, 5).every((r) => parseDate(r[0] ?? '') !== null);
  const startCol = firstIsDate ? 1 : 0;
  const tickers = header.slice(startCol).map((h, i) => (h.replace(/"/g, '').trim() || `Stock ${i + 1}`).slice(0, 16));
  if (tickers.length < 2) return 'Paste at least two stocks (one column each), so there is something to mix.';
  if (tickers.length > 15) return 'Paste at most 15 stocks at a time.';

  const warnings: string[] = [];
  let rows: { date: Date | null; p: number[] }[] = [];
  let dropped = 0;
  for (const r of body) {
    const p = tickers.map((_, k) => parsePrice(r[startCol + k] ?? ''));
    if (p.some((x) => !Number.isFinite(x))) {
      dropped++;
      continue;
    }
    rows.push({ date: firstIsDate ? parseDate(r[0]) : null, p });
  }
  if (dropped) warnings.push(`${dropped} row${dropped === 1 ? '' : 's'} with a missing price ${dropped === 1 ? 'was' : 'were'} skipped.`);
  if (firstIsDate && rows.length >= 2 && rows[0].date && rows[rows.length - 1].date && rows[0].date! > rows[rows.length - 1].date!) {
    rows = rows.reverse();
    warnings.push('Your data was newest first, so it was flipped to oldest first.');
  }
  if (rows.length < 13) return `Only ${rows.length} usable rows. Paste at least 13 prices per stock (more is better, like 52 weeks or 12 months).`;
  return { tickers, dates: rows.map((r) => r.date), rows: rows.map((r) => r.p), warnings };
}

export type Frequency = 'daily' | 'weekly' | 'monthly';
export const PERIODS_PER_YEAR: Record<Frequency, number> = { daily: 252, weekly: 52, monthly: 12 };

/** Guesses the data frequency from the typical gap between dates. */
export function detectFrequency(dates: (Date | null)[]): Frequency | null {
  const ds = dates.filter((d): d is Date => d !== null);
  if (ds.length < 3) return null;
  const gaps = ds.slice(1).map((d, i) => (d.getTime() - ds[i].getTime()) / 86_400_000).sort((a, b) => a - b);
  const mid = gaps[Math.floor(gaps.length / 2)];
  if (mid <= 3.5) return 'daily';
  if (mid <= 10) return 'weekly';
  return 'monthly';
}

export interface StockStats {
  /** Yearly expected return (decimal), from the average period return. */
  mu: number[];
  /** Yearly volatility (decimal). */
  vol: number[];
  /** Yearly covariance. */
  cov: number[][];
  corr: number[][];
  periods: number;
  last: number[];
}

/** Simple period returns, then yearly mean, covariance and correlation (sample estimates). */
export function stockStats(rows: number[][], perYear: number): StockStats {
  const n = rows[0].length;
  const rets = rows.slice(1).map((r, t) => r.map((p, k) => p / rows[t][k] - 1));
  const T = rets.length;
  const mean = Array.from({ length: n }, (_, k) => rets.reduce((s, r) => s + r[k], 0) / T);
  const cov = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (rets.reduce((s, r) => s + (r[i] - mean[i]) * (r[j] - mean[j]), 0) / Math.max(1, T - 1)) * perYear),
  );
  const vol = cov.map((r, i) => Math.sqrt(Math.max(0, r[i])));
  const corr = cov.map((r, i) => r.map((c, j) => (vol[i] > 0 && vol[j] > 0 ? c / (vol[i] * vol[j]) : i === j ? 1 : 0)));
  return { mu: mean.map((m) => m * perYear), vol, cov, corr, periods: T, last: rows[rows.length - 1] };
}

/** Whole shares to buy for each weight with a peso budget, at the latest prices. */
export function sharesFor(weights: number[], prices: number[], amount: number): { shares: number; cost: number }[] {
  return weights.map((w, k) => {
    const shares = prices[k] > 0 ? Math.floor((w * amount) / prices[k]) : 0;
    return { shares, cost: shares * prices[k] };
  });
}

/**
 * The expected return to use for each stock: the student's own view (in %) where they typed one,
 * otherwise the historical average. Views outside -100%..+300% are ignored.
 */
export function applyViews(historical: number[], tickers: string[], views: Record<string, string>): { mu: number[]; custom: boolean[] } {
  const custom: boolean[] = [];
  const mu = historical.map((h, k) => {
    const raw = (views[tickers[k]] ?? '').trim().replace('%', '');
    const v = raw === '' ? NaN : Number(raw);
    const ok = Number.isFinite(v) && v >= -100 && v <= 300;
    custom.push(ok);
    return ok ? v / 100 : h;
  });
  return { mu, custom };
}

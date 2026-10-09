import { describe, expect, it } from 'vitest';
import { applyViews, detectFrequency, parseDate, parsePrice, parsePriceTable, sharesFor, stockStats, type PriceTable } from './prices';

const sheet = (rows: string[][]) => rows.map((r) => r.join('\t')).join('\n');
const weekly = (n: number, f: (i: number) => [number, number, number]) => {
  const rows: string[][] = [['Date', 'BDO', 'JFC', 'TEL']];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(2026, 0, 5 + 7 * i));
    rows.push([d.toISOString().slice(0, 10), ...f(i).map(String)]);
  }
  return rows;
};

describe('reading pasted prices', () => {
  it('reads common date and price formats', () => {
    expect(parseDate('2026-09-30')!.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(parseDate('09/30/2026')!.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(parseDate('30/09/2026')!.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(parseDate('Sep 30, 2026')!.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(parseDate('30-Sep-2026')!.toISOString().slice(0, 10)).toBe('2026-09-30');
    expect(parseDate('BDO')).toBeNull();
    expect(parsePrice('₱1,234.50')).toBe(1234.5);
    expect(parsePrice('"142.5"')).toBe(142.5);
    expect(parsePrice('')).toBeNaN();
    expect(parsePrice('-3')).toBeNaN();
  });

  it('reads a sheet pasted from Excel, flips newest-first data and skips gaps', () => {
    const rows = weekly(20, (i) => [100 + i, 200 - i, 50 + (i % 3)]);
    rows[5][2] = ''; // a missing price
    const newestFirst = [rows[0], ...rows.slice(1).reverse()];
    const t = parsePriceTable(sheet(newestFirst)) as PriceTable;
    expect(t.tickers).toEqual(['BDO', 'JFC', 'TEL']);
    expect(t.rows.length).toBe(19);
    expect(t.rows[0][0]).toBe(100);
    expect(t.warnings.join(' ')).toMatch(/flipped/);
    expect(t.warnings.join(' ')).toMatch(/skipped/);
    expect(detectFrequency(t.dates)).toBe('weekly');
  });

  it('reads CSV with quoted thousands, and tables without dates', () => {
    const csv = ['Date,BDO,SM', ...Array.from({ length: 15 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')},"1,${100 + i}.50",${900 + i}`)].join('\n');
    const t = parsePriceTable(csv) as PriceTable;
    expect(t.rows[0]).toEqual([1100.5, 900]);
    expect(detectFrequency(t.dates)).toBe('daily');
    const noDates = parsePriceTable(['A\tB', ...Array.from({ length: 14 }, (_, i) => `${10 + i}\t${20 - i * 0.5}`)].join('\n')) as PriceTable;
    expect(noDates.tickers).toEqual(['A', 'B']);
    expect(noDates.dates.every((d) => d === null)).toBe(true);
  });

  it('explains what is wrong with unusable input', () => {
    expect(parsePriceTable('BDO\n1\n2')).toMatch(/at least/);
    expect(parsePriceTable(sheet(weekly(20, (i) => [100 + i, 0, 0]).map((r) => r.slice(0, 2))))).toMatch(/two stocks/);
    expect(parsePriceTable(sheet(weekly(8, (i) => [100 + i, 100, 100])))).toMatch(/Only 8 usable rows/);
  });
});

describe('stock statistics', () => {
  it('annualizes returns and finds correlation', () => {
    // Stock A grows 1% a period; B moves exactly with A; C moves against it.
    const rows: number[][] = [[100, 100, 100]];
    for (let t = 1; t <= 30; t++) {
      const shock = t % 2 ? 0.02 : -0.01;
      const p = rows[t - 1];
      rows.push([p[0] * (1 + shock), p[1] * (1 + 2 * shock), p[2] * (1 - shock)]);
    }
    const s = stockStats(rows, 52);
    expect(s.periods).toBe(30);
    expect(s.corr[0][1]).toBeCloseTo(1, 6);
    expect(s.corr[0][2]).toBeCloseTo(-1, 6);
    expect(s.vol[1]).toBeCloseTo(2 * s.vol[0], 6);
    expect(s.mu[0]).toBeCloseTo(((0.02 - 0.01) / 2) * 52, 6);
  });

  it('turns weights into whole shares within the budget', () => {
    const out = sharesFor([0.5, 0.5], [142.5, 30], 10_000);
    expect(out).toEqual([{ shares: 35, cost: 4987.5 }, { shares: 166, cost: 4980 }]);
  });
});

describe('your own expected returns', () => {
  it('uses typed views where given and history elsewhere', () => {
    const { mu, custom } = applyViews([0.3, 0.05, -0.02], ['BDO', 'JFC', 'TEL'], { BDO: '12', TEL: '8%', JFC: '' });
    expect(mu).toEqual([0.12, 0.05, 0.08]);
    expect(custom).toEqual([true, false, true]);
  });
  it('ignores views that are not numbers or are unrealistic', () => {
    const { mu, custom } = applyViews([0.1, 0.2], ['A', 'B'], { A: 'abc', B: '500' });
    expect(mu).toEqual([0.1, 0.2]);
    expect(custom).toEqual([false, false]);
  });
});

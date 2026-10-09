// "Football field" valuation summary: each method gives a low-high range of value per share,
// shown against the current price. A classic analyst chart, used here for learning.

export interface FieldBar {
  key: 'pe' | 'pb' | 'dcf';
  label: string;
  low: number;
  high: number;
  /** The method's central estimate (median peer P/E, chosen P/B, base-case DCF). */
  point: number;
  /** Plain explanation of where the range comes from. */
  basis: string;
}

export type Verdict = 'undervalued' | 'fair' | 'overvalued';

export interface FieldInputs {
  eps: number;
  peers: number[];
  targetPE: number;
  bvps: number;
  targetPB: number;
  /** Justified P/B from ROE, cost of equity and growth, when the student entered them. */
  justifiedPB: number | null;
  dcfBase: number | null;
  dcfGrid: (number | null)[];
}

const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** Builds one bar per method that has usable inputs. */
export function buildFootballField(i: FieldInputs): FieldBar[] {
  const bars: FieldBar[] = [];

  const peers = i.peers.filter((p) => ok(p));
  if (ok(i.eps) && peers.length >= 2) {
    const point = ok(i.targetPE) ? i.eps * i.targetPE : i.eps * peers[Math.floor(peers.length / 2)];
    bars.push({
      key: 'pe',
      label: 'P/E multiple',
      low: i.eps * Math.min(...peers),
      high: i.eps * Math.max(...peers),
      point,
      basis: `EPS × the lowest to highest peer P/E (${Math.min(...peers)}x to ${Math.max(...peers)}x)`,
    });
  } else if (ok(i.eps) && ok(i.targetPE)) {
    bars.push({ key: 'pe', label: 'P/E multiple', low: i.eps * i.targetPE * 0.85, high: i.eps * i.targetPE * 1.15, point: i.eps * i.targetPE, basis: 'EPS × target P/E, ±15%' });
  }

  if (ok(i.bvps) && ok(i.targetPB)) {
    if (ok(i.justifiedPB)) {
      const a = i.bvps * i.targetPB;
      const b = i.bvps * i.justifiedPB;
      bars.push({ key: 'pb', label: 'P/B multiple', low: Math.min(a, b), high: Math.max(a, b), point: a, basis: 'BVPS × your target P/B to the justified P/B' });
    } else {
      bars.push({ key: 'pb', label: 'P/B multiple', low: i.bvps * i.targetPB * 0.85, high: i.bvps * i.targetPB * 1.15, point: i.bvps * i.targetPB, basis: 'BVPS × target P/B, ±15%' });
    }
  }

  const grid = i.dcfGrid.filter((v) => ok(v));
  if (ok(i.dcfBase) && grid.length >= 2) {
    bars.push({ key: 'dcf', label: 'Simplified DCF', low: Math.min(...grid), high: Math.max(...grid), point: i.dcfBase, basis: 'Base case, with WACC ±1% and terminal growth ±0.5%' });
  }
  return bars;
}

/** Where the current price sits against the middle of all ranges. ±15% counts as fairly valued. */
export function verdictFor(bars: FieldBar[], price: number | null): { verdict: Verdict; mid: number; gapPct: number } | null {
  if (!bars.length || !ok(price)) return null;
  const mid = bars.reduce((s, b) => s + (b.low + b.high) / 2, 0) / bars.length;
  const gapPct = ((mid - price) / price) * 100;
  const verdict: Verdict = gapPct > 15 ? 'undervalued' : gapPct < -15 ? 'overvalued' : 'fair';
  return { verdict, mid, gapPct };
}

/** Axis bounds with a little padding, always including the current price. */
export function axisBounds(bars: FieldBar[], price: number | null): { min: number; max: number } {
  const vals = bars.flatMap((b) => [b.low, b.high]);
  if (ok(price)) vals.push(price);
  if (!vals.length) return { min: 0, max: 1 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = (hi - lo) * 0.1 || hi * 0.1 || 1;
  return { min: Math.max(0, lo - pad), max: hi + pad };
}

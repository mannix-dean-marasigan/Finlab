import { describe, expect, it } from 'vitest';
import { axisBounds, buildFootballField, verdictFor } from './footballField';

const base = { eps: 4, peers: [10, 12, 14], targetPE: 12, bvps: 30, targetPB: 1.6, justifiedPB: null, dcfBase: 50, dcfGrid: [40, 45, 50, 55, 62, null] };

describe('football field', () => {
  it('builds a range per method from the inputs', () => {
    const bars = buildFootballField(base);
    expect(bars.map((b) => b.key)).toEqual(['pe', 'pb', 'dcf']);
    const pe = bars[0];
    expect([pe.low, pe.high, pe.point]).toEqual([40, 56, 48]);
    const pb = bars[1];
    expect(pb.low).toBeCloseTo(40.8);
    expect(pb.high).toBeCloseTo(55.2);
    const dcf = bars[2];
    expect([dcf.low, dcf.high, dcf.point]).toEqual([40, 62, 50]);
  });

  it('uses the justified P/B as the other end of the range when given', () => {
    const pb = buildFootballField({ ...base, justifiedPB: 1.2 }).find((b) => b.key === 'pb')!;
    expect(pb.low).toBeCloseTo(36);
    expect(pb.high).toBeCloseTo(48);
  });

  it('skips methods without usable inputs', () => {
    const bars = buildFootballField({ ...base, eps: NaN, targetPE: NaN, dcfBase: null, dcfGrid: [] });
    expect(bars.map((b) => b.key)).toEqual(['pb']);
  });

  it('calls a price fair within 15% of the middle, and under or over beyond that', () => {
    const bars = buildFootballField(base); // middle of ranges is about 49
    expect(verdictFor(bars, 48)!.verdict).toBe('fair');
    expect(verdictFor(bars, 35)!.verdict).toBe('undervalued');
    expect(verdictFor(bars, 70)!.verdict).toBe('overvalued');
    expect(verdictFor(bars, null)).toBeNull();
    expect(verdictFor([], 40)).toBeNull();
  });

  it('pads the axis and always includes the price', () => {
    const b = axisBounds(buildFootballField(base), 80);
    expect(b.max).toBeGreaterThan(80);
    expect(b.min).toBeLessThan(40);
  });
});

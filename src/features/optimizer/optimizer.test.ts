import { describe, expect, it } from 'vitest';
import { covariance, frontier, maxSharpe, optimize, portfolioReturn, portfolioRisk, projectCappedSimplex, randomPortfolios } from './optimizer';

const mu = [0.03, 0.06, 0.09, 0.1];
const vols = [0.005, 0.04, 0.2, 0.3];
const cov = covariance(vols, (i, j) => (i === j ? 1 : i >= 2 && j >= 2 ? 0.7 : 0.1));
const sum = (w: number[]) => w.reduce((a, b) => a + b, 0);

describe('portfolio optimizer', () => {
  it('projects onto weights that add up to 100% and respect the cap', () => {
    const w = projectCappedSimplex([0.9, 0.5, -0.2, 0.1], 0.4);
    expect(sum(w)).toBeCloseTo(1, 6);
    expect(Math.max(...w)).toBeLessThanOrEqual(0.4 + 1e-9);
    expect(Math.min(...w)).toBeGreaterThanOrEqual(0);
  });

  it('treats a cap that is too small to add up as the smallest possible cap', () => {
    const w = projectCappedSimplex([1, 0, 0, 0], 0.1);
    expect(w.every((x) => Math.abs(x - 0.25) < 1e-6)).toBe(true);
  });

  it('the lowest-risk mix beats an equal split on risk', () => {
    const w = optimize(mu, cov, 0, 1);
    expect(portfolioRisk(w, cov)).toBeLessThan(portfolioRisk([0.25, 0.25, 0.25, 0.25], cov));
    expect(w[0]).toBeGreaterThan(0.8); // mostly the near-riskless option
  });

  it('chasing return with no cap ends in the highest-return option, and a cap forces spreading', () => {
    const greedy = optimize(mu, cov, 1000, 1);
    expect(greedy[3]).toBeGreaterThan(0.95);
    const capped = optimize(mu, cov, 1000, 0.5);
    expect(Math.max(...capped)).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(sum(capped)).toBeCloseTo(1, 6);
  });

  it('the frontier rises in both risk and return, and the best Sharpe point is on it', () => {
    const pts = frontier(mu, cov, 1);
    expect(pts.length).toBeGreaterThan(5);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].risk).toBeGreaterThanOrEqual(pts[i - 1].risk - 1e-9);
      expect(pts[i].ret).toBeGreaterThanOrEqual(pts[i - 1].ret - 1e-4);
    }
    const best = maxSharpe(pts, 0.03)!;
    for (const p of pts) if (p.risk > 0) expect((p.ret - 0.03) / p.risk).toBeLessThanOrEqual(best.sharpe + 1e-9);
  });

  it('no random portfolio beats the frontier at the same risk', () => {
    const pts = frontier(mu, cov, 1);
    const cloud = randomPortfolios(mu, cov, 1, 300);
    // The frontier is a set of points; compare each random mix with the curve between the two nearest points.
    const curveAt = (risk: number) => {
      const hi = pts.findIndex((p) => p.risk >= risk);
      if (hi <= 0) return hi === 0 ? pts[0].ret : pts.at(-1)!.ret;
      const a = pts[hi - 1];
      const b = pts[hi];
      return a.ret + ((b.ret - a.ret) * (risk - a.risk)) / Math.max(b.risk - a.risk, 1e-12);
    };
    for (const r of cloud) {
      expect(r.ret).toBeLessThanOrEqual(curveAt(r.risk) + 0.001);
      expect(sum(r.weights)).toBeCloseTo(1, 6);
    }
    expect(portfolioReturn([0, 0, 0, 1], mu)).toBe(0.1);
  });
});

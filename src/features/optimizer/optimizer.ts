// Mean-variance portfolio optimizer (Markowitz), long-only with a cap per asset.
// Works in decimals (0.09 = 9%). Small, dependency-free, and fast enough for a handful of assets.

export type Vec = number[];
export type Mat = number[][];

/** Covariance from volatilities and a correlation function. */
export function covariance(vols: Vec, corr: (i: number, j: number) => number): Mat {
  return vols.map((vi, i) => vols.map((vj, j) => vi * vj * corr(i, j)));
}

export function portfolioReturn(w: Vec, mu: Vec): number {
  return w.reduce((s, wi, i) => s + wi * mu[i], 0);
}

export function portfolioRisk(w: Vec, cov: Mat): number {
  let v = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) v += w[i] * w[j] * cov[i][j];
  return Math.sqrt(Math.max(0, v));
}

/** Projects v onto { 0 <= w_i <= cap, sum w = 1 } (Euclidean projection, by bisection on the shift). */
export function projectCappedSimplex(v: Vec, cap: number): Vec {
  const n = v.length;
  const u = Math.max(cap, 1 / n); // a cap below 1/n cannot add up to 100%
  const at = (tau: number) => v.map((x) => Math.min(u, Math.max(0, x - tau)));
  const sum = (w: Vec) => w.reduce((s, x) => s + x, 0);
  let lo = Math.min(...v) - u - 1;
  let hi = Math.max(...v) + 1;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (sum(at(mid)) > 1) lo = mid;
    else hi = mid;
  }
  return at((lo + hi) / 2);
}

/**
 * Minimizes risk² − λ·return over long-only weights capped at `cap` (projected gradient descent).
 * λ = 0 gives the lowest-risk mix; a large λ chases return.
 */
export function optimize(mu: Vec, cov: Mat, lambda: number, cap: number, iters = 1500): Vec {
  const n = mu.length;
  const rowMax = Math.max(...cov.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)));
  const step = 0.5 / Math.max(rowMax, 1e-9);
  let w = projectCappedSimplex(Array(n).fill(1 / n), cap);
  for (let k = 0; k < iters; k++) {
    const grad = w.map((_, i) => 2 * cov[i].reduce((s, c, j) => s + c * w[j], 0) - lambda * mu[i]);
    const next = projectCappedSimplex(w.map((wi, i) => wi - step * grad[i]), cap);
    const moved = next.reduce((s, x, i) => s + Math.abs(x - w[i]), 0);
    w = next;
    if (moved < 1e-9) break;
  }
  return w;
}

export interface Point {
  weights: Vec;
  ret: number;
  risk: number;
}

/** The efficient frontier: best-return mixes for each level of risk, from lowest risk upward. */
export function frontier(mu: Vec, cov: Mat, cap: number, steps = 40): Point[] {
  const scale = Math.max(...cov.map((r, i) => r[i])) / Math.max(...mu.map(Math.abs), 1e-9);
  const lambdas = [0, ...Array.from({ length: steps }, (_, k) => scale * 10 ** (-3 + (5 * k) / (steps - 1)))];
  const pts: Point[] = [];
  for (const lambda of lambdas) {
    const w = optimize(mu, cov, lambda, cap);
    const p = { weights: w, ret: portfolioReturn(w, mu), risk: portfolioRisk(w, cov) };
    const last = pts[pts.length - 1];
    if (!last || p.risk - last.risk > 1e-5 || p.ret - last.ret > 1e-5) pts.push(p);
  }
  return pts.sort((a, b) => a.risk - b.risk);
}

/** The frontier point with the most return per unit of risk above the risk-free rate (Sharpe ratio). */
export function maxSharpe(points: Point[], riskFree: number): (Point & { sharpe: number }) | null {
  let best: (Point & { sharpe: number }) | null = null;
  for (const p of points) {
    if (p.risk <= 1e-9) continue;
    const sharpe = (p.ret - riskFree) / p.risk;
    if (!best || sharpe > best.sharpe) best = { ...p, sharpe };
  }
  return best;
}

/** Random long-only portfolios (capped) to show the cloud of possible mixes. Seeded so it doesn't jump around. */
export function randomPortfolios(mu: Vec, cov: Mat, cap: number, count = 1200, seed = 7): Point[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out: Point[] = [];
  for (let k = 0; k < count; k++) {
    // Exponential draws raised to a random power: some mixes spread out, some concentrated.
    const raw = mu.map(() => (-Math.log(1 - rand())) ** (1 + rand() * 2));
    const total = raw.reduce((a, b) => a + b, 0) || 1;
    const w = projectCappedSimplex(raw.map((x) => x / total), cap);
    out.push({ weights: w, ret: portfolioReturn(w, mu), risk: portfolioRisk(w, cov) });
  }
  return out;
}

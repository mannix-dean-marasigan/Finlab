// Portfolio planner: a practice exercise in matching an allocation to a person's goal.
// Return and risk figures are rough long-run assumptions for learning, not forecasts.

export type AssetId = 'cash' | 'td' | 'govbond' | 'corpbond' | 'reit' | 'index' | 'global' | 'stocks';

export interface Asset {
  id: AssetId;
  label: string;
  note: string;
  /** Expected yearly return, % (illustrative). */
  ret: number;
  /** Yearly volatility (standard deviation), % (illustrative). */
  vol: number;
  group: 'safe' | 'growth';
  /** Can be withdrawn quickly without much loss. */
  liquid: boolean;
}

export const ASSETS: Asset[] = [
  { id: 'cash', label: 'Savings account', note: 'Digital bank or regular savings', ret: 3, vol: 0.5, group: 'safe', liquid: true },
  { id: 'td', label: 'Time deposit', note: 'Locked for months, small penalty to break', ret: 5, vol: 1, group: 'safe', liquid: true },
  { id: 'govbond', label: 'Government bonds', note: 'Retail Treasury Bonds and similar', ret: 6, vol: 4, group: 'safe', liquid: false },
  { id: 'corpbond', label: 'Corporate bonds', note: 'Bonds of large listed companies', ret: 7, vol: 6, group: 'safe', liquid: false },
  { id: 'reit', label: 'REITs', note: 'Real estate companies that pay dividends', ret: 8, vol: 15, group: 'growth', liquid: false },
  { id: 'index', label: 'PSEi index fund', note: 'The 30 biggest Philippine companies', ret: 9, vol: 20, group: 'growth', liquid: false },
  { id: 'global', label: 'Global stock fund', note: 'Companies around the world', ret: 9, vol: 16, group: 'growth', liquid: false },
  { id: 'stocks', label: 'Individual stocks', note: 'A few companies you pick yourself', ret: 10, vol: 30, group: 'growth', liquid: false },
];

const BY_ID = Object.fromEntries(ASSETS.map((a) => [a.id, a])) as Record<AssetId, Asset>;

/** Simplified correlations: safe assets barely move together; growth assets move together a lot. */
export function correlation(a: AssetId, b: AssetId): number {
  if (a === b) return 1;
  if (a === 'cash' || b === 'cash' || a === 'td' || b === 'td') return 0;
  const ga = BY_ID[a].group;
  const gb = BY_ID[b].group;
  if (ga === 'safe' && gb === 'safe') return 0.5;
  if (ga !== gb) return 0.1;
  if (a === 'global' || b === 'global') return 0.5;
  return 0.75;
}

export type Allocation = Record<AssetId, number>;

export const EMPTY: Allocation = { cash: 0, td: 0, govbond: 0, corpbond: 0, reit: 0, index: 0, global: 0, stocks: 0 };

export const total = (a: Allocation) => ASSETS.reduce((s, x) => s + (a[x.id] || 0), 0);

export interface Metrics {
  expectedReturn: number;
  volatility: number;
  /** A rough "bad year": about 1 year in 20 could be this bad or worse. */
  badYear: number;
  growthShare: number;
  liquidShare: number;
  /** Number of asset types holding at least 5%. */
  holdings: number;
  largest: { id: AssetId; pct: number } | null;
}

export function metrics(a: Allocation): Metrics {
  const t = total(a) || 1;
  const w = ASSETS.map((x) => (a[x.id] || 0) / t);
  const expectedReturn = ASSETS.reduce((s, x, i) => s + w[i] * x.ret, 0);
  let variance = 0;
  ASSETS.forEach((x, i) =>
    ASSETS.forEach((y, j) => {
      variance += w[i] * w[j] * x.vol * y.vol * correlation(x.id, y.id);
    }),
  );
  const volatility = Math.sqrt(Math.max(0, variance));
  const growthShare = ASSETS.reduce((s, x, i) => s + (x.group === 'growth' ? w[i] : 0), 0) * 100;
  const liquidShare = ASSETS.reduce((s, x, i) => s + (x.liquid ? w[i] : 0), 0) * 100;
  const holdings = ASSETS.filter((x) => (a[x.id] || 0) / t >= 0.05).length;
  const top = ASSETS.map((x) => ({ id: x.id, pct: ((a[x.id] || 0) / t) * 100 })).sort((p, q) => q.pct - p.pct)[0];
  return {
    expectedReturn,
    volatility,
    badYear: expectedReturn - 1.65 * volatility,
    growthShare,
    liquidShare,
    holdings,
    largest: top && top.pct > 0 ? top : null,
  };
}

/** Value after `years` at the expected return (compounded yearly). */
export const projected = (amount: number, ret: number, years: number) => amount * (1 + ret / 100) ** years;

export interface Scenario {
  id: string;
  name: string;
  story: string;
  amount: number;
  years: number;
  goal: string;
  /** Allowed range for the growth share (REITs and stocks), %. */
  growth: [number, number];
  /** Minimum share in savings and time deposits, %. */
  minLiquid: number;
  /** A coach's example allocation, revealed after checking. */
  coach: Allocation;
  coachWhy: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'emergency',
    name: 'Ana · emergency fund',
    story: 'Ana is 22 and just started her first job. She saved ₱50,000 as an emergency fund for job loss or hospital bills. She may need it any day.',
    amount: 50_000,
    years: 1,
    goal: 'Keep it safe and ready to withdraw',
    growth: [0, 10],
    minLiquid: 80,
    coach: { ...EMPTY, cash: 60, td: 40 },
    coachWhy: 'An emergency fund must be there on the worst day, so safety and quick access matter more than return. Splitting between savings and a short time deposit earns a bit more without locking it all.',
  },
  {
    id: 'condo',
    name: 'Paolo · condo down payment',
    story: 'Paolo is 25 and wants ₱200,000 for a condo down payment in 3 years. A big loss right before he buys would delay his plan.',
    amount: 200_000,
    years: 3,
    goal: 'Grow a little, but avoid a big drop near the deadline',
    growth: [10, 35],
    minLiquid: 20,
    coach: { ...EMPTY, td: 25, govbond: 30, corpbond: 20, index: 15, reit: 10 },
    coachWhy: 'Three years is short. Most of the money sits in bonds and time deposits, with a smaller growth slice for extra return. As the date gets closer, he should move even more into safe assets.',
  },
  {
    id: 'retire',
    name: 'Bea · long-term investing',
    story: 'Bea is 24 and invests ₱100,000 for retirement, more than 30 years away. She will not touch it and can stay calm when markets fall.',
    amount: 100_000,
    years: 30,
    goal: 'Maximize long-term growth with sensible spreading',
    growth: [60, 95],
    minLiquid: 0,
    coach: { ...EMPTY, govbond: 10, corpbond: 5, reit: 10, index: 35, global: 30, stocks: 10 },
    coachWhy: 'With 30 years, short-term drops have time to recover, so most of it is in stocks. Spreading across the PSEi, global funds and REITs avoids betting everything on one market or company.',
  },
];

export interface Check {
  ok: boolean;
  label: string;
  detail: string;
}

/** How well an allocation fits the scenario, with plain feedback. */
export function review(a: Allocation, s: Scenario): { score: number; checks: Check[] } {
  const m = metrics(a);
  const t = total(a);
  const checks: Check[] = [
    {
      ok: Math.round(t) === 100,
      label: 'Adds up to 100%',
      detail: Math.round(t) === 100 ? 'Every peso has a job.' : `Your plan adds up to ${Math.round(t)}%.`,
    },
    {
      ok: m.growthShare >= s.growth[0] - 0.5 && m.growthShare <= s.growth[1] + 0.5,
      label: `Growth share between ${s.growth[0]}% and ${s.growth[1]}%`,
      detail:
        m.growthShare > s.growth[1] + 0.5
          ? `You put ${m.growthShare.toFixed(0)}% in stocks and REITs. That is too risky for "${s.goal.toLowerCase()}".`
          : m.growthShare < s.growth[0] - 0.5
            ? `Only ${m.growthShare.toFixed(0)}% in stocks and REITs. With ${s.years} years, the money could grow more.`
            : `${m.growthShare.toFixed(0)}% in stocks and REITs suits a ${s.years}-year goal.`,
    },
    {
      ok: m.liquidShare >= s.minLiquid - 0.5,
      label: s.minLiquid ? `At least ${s.minLiquid}% easy to withdraw` : 'Easy-to-withdraw money',
      detail: s.minLiquid
        ? m.liquidShare >= s.minLiquid - 0.5
          ? `${m.liquidShare.toFixed(0)}% is in savings or time deposits.`
          : `Only ${m.liquidShare.toFixed(0)}% is quick to withdraw. This goal needs at least ${s.minLiquid}%.`
        : 'This goal does not need quick access.',
    },
    {
      ok: (a.stocks || 0) <= 20,
      label: 'No more than 20% in individual stocks',
      detail: (a.stocks || 0) <= 20 ? 'No single-company bet can sink the plan.' : `${a.stocks}% in a few companies is a concentrated bet.`,
    },
    {
      ok: s.id === 'emergency' ? m.holdings >= 1 : m.holdings >= 3,
      label: s.id === 'emergency' ? 'Kept simple' : 'Spread across at least 3 types',
      detail: `You hold ${m.holdings} type${m.holdings === 1 ? '' : 's'} at 5% or more.`,
    },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}

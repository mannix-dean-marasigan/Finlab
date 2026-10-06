// Portfolio analytics. Values are in the portfolio's base currency (PHP).

export interface PositionInput {
  securityId: string;
  shares: number;
  avgCostLocal: number;
  costBasisBase: number;
  priceLocal: number;
  fxToBase: number;
}

export interface PositionMetrics extends PositionInput {
  marketValueBase: number;
  unrealizedPl: number;
  unrealizedPlPct: number;
  weightPct: number;
}

export interface PortfolioMetrics {
  positions: PositionMetrics[];
  investedValue: number;
  cash: number;
  totalValue: number;
  costBasis: number;
  unrealizedPl: number;
  realizedPl: number;
  totalReturnPct: number;
  cashWeightPct: number;
  /** Herfindahl index of invested weights (0–1). */
  hhi: number;
  effectivePositions: number;
  largestWeightPct: number;
}

export function computePortfolio(
  inputs: PositionInput[],
  cash: number,
  startingCapital: number,
  realizedPl = 0,
): PortfolioMetrics {
  const withValue = inputs.map((p) => {
    const marketValueBase = p.shares * p.priceLocal * p.fxToBase;
    return { ...p, marketValueBase, unrealizedPl: marketValueBase - p.costBasisBase };
  });
  const investedValue = withValue.reduce((s, p) => s + p.marketValueBase, 0);
  const totalValue = investedValue + cash;
  const positions: PositionMetrics[] = withValue
    .map((p) => ({
      ...p,
      unrealizedPlPct: p.costBasisBase > 0 ? (p.unrealizedPl / p.costBasisBase) * 100 : 0,
      weightPct: totalValue > 0 ? (p.marketValueBase / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.marketValueBase - a.marketValueBase);

  const investedWeights = investedValue > 0 ? positions.map((p) => p.marketValueBase / investedValue) : [];
  const hhi = investedWeights.reduce((s, w) => s + w * w, 0);

  return {
    positions,
    investedValue,
    cash,
    totalValue,
    costBasis: positions.reduce((s, p) => s + p.costBasisBase, 0),
    unrealizedPl: positions.reduce((s, p) => s + p.unrealizedPl, 0),
    realizedPl,
    totalReturnPct: startingCapital > 0 ? (totalValue / startingCapital - 1) * 100 : 0,
    cashWeightPct: totalValue > 0 ? (cash / totalValue) * 100 : 100,
    hhi,
    effectivePositions: hhi > 0 ? 1 / hhi : 0,
    largestWeightPct: positions[0]?.weightPct ?? 0,
  };
}

export function concentrationLabel(m: PortfolioMetrics): { label: string; tone: 'up' | 'warn' | 'down' } {
  if (m.positions.length === 0) return { label: 'All cash', tone: 'warn' };
  if (m.largestWeightPct > 40 || m.effectivePositions < 2.5) return { label: 'Highly concentrated', tone: 'down' };
  if (m.largestWeightPct > 25 || m.effectivePositions < 5) return { label: 'Concentrated', tone: 'warn' };
  return { label: 'Diversified', tone: 'up' };
}

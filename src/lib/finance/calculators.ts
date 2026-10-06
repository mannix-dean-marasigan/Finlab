// Pure math behind the interactive lesson calculators.

export function ratioLab(i: {
  revenue: number; cogs: number; opex: number; interest: number; taxRate: number;
  assets: number; equity: number; currentAssets: number; inventory: number; currentLiabilities: number;
}) {
  const grossProfit = i.revenue - i.cogs;
  const ebit = grossProfit - i.opex;
  const pretax = ebit - i.interest;
  const netIncome = pretax - Math.max(0, pretax) * (i.taxRate / 100);
  const pct = (a: number, b: number) => (b ? (a / b) * 100 : NaN);
  return {
    grossProfit,
    ebit,
    netIncome,
    grossMargin: pct(grossProfit, i.revenue),
    ebitMargin: pct(ebit, i.revenue),
    netMargin: pct(netIncome, i.revenue),
    roe: pct(netIncome, i.equity),
    roa: pct(netIncome, i.assets),
    assetTurnover: i.assets ? i.revenue / i.assets : NaN,
    equityMultiplier: i.equity ? i.assets / i.equity : NaN,
    currentRatio: i.currentLiabilities ? i.currentAssets / i.currentLiabilities : NaN,
    quickRatio: i.currentLiabilities ? (i.currentAssets - i.inventory) / i.currentLiabilities : NaN,
  };
}

export function multiplesLab(i: { eps: number; pe: number; bvps: number; pb: number; price: number }) {
  const tpPe = i.eps * i.pe;
  const tpPb = i.bvps * i.pb;
  const blended = (tpPe + tpPb) / 2;
  const upside = i.price > 0 ? (blended / i.price - 1) * 100 : NaN;
  const rating = upside >= 10 ? 'BUY' : upside <= -10 ? 'SELL' : 'HOLD';
  return { tpPe, tpPb, blended, upside, rating: Number.isFinite(upside) ? rating : null };
}

export function waccLab(i: { rf: number; beta: number; mrp: number; kd: number; tax: number; debtWeight: number }) {
  const ke = i.rf + i.beta * i.mrp;
  const kdAfter = i.kd * (1 - i.tax / 100);
  const wd = i.debtWeight / 100;
  return { ke, kdAfter, wacc: (1 - wd) * ke + wd * kdAfter };
}

export function portfolioLab(i: {
  wEq: number; wBd: number; rEq: number; rBd: number; rCash: number; volEq: number; volBd: number; corr: number; rf: number;
}) {
  const we = i.wEq / 100;
  const wb = i.wBd / 100;
  const wc = Math.max(0, 1 - we - wb);
  const expected = we * i.rEq + wb * i.rBd + wc * i.rCash;
  const variance = (we * i.volEq) ** 2 + (wb * i.volBd) ** 2 + 2 * we * wb * i.corr * i.volEq * i.volBd;
  const vol = Math.sqrt(Math.max(0, variance));
  const hhi = we ** 2 + wb ** 2 + wc ** 2;
  return { cash: wc * 100, expected, vol, sharpe: vol > 0 ? (expected - i.rf) / vol : NaN, effectiveN: hhi > 0 ? 1 / hhi : 0 };
}

export function accretionLab(i: { acqNi: number; acqShares: number; tgtNi: number; newShares: number; synergies: number }) {
  const standalone = i.acqShares ? i.acqNi / i.acqShares : NaN;
  const proFormaShares = i.acqShares + i.newShares;
  const proForma = proFormaShares ? (i.acqNi + i.tgtNi + i.synergies) / proFormaShares : NaN;
  const accretion = standalone ? (proForma / standalone - 1) * 100 : NaN;
  const breakEvenSynergies = standalone * proFormaShares - (i.acqNi + i.tgtNi);
  const maxSharesNoSynergies = standalone ? (i.acqNi + i.tgtNi) / standalone - i.acqShares : NaN;
  return { standalone, proForma, accretion, breakEvenSynergies, maxSharesNoSynergies };
}

/** Level annuity project: cost today, equal cash flows for `years`. */
export function npvLab(i: { cost: number; cashFlow: number; years: number; rate: number; downside: number }) {
  const r = i.rate / 100;
  const n = Math.max(1, Math.round(i.years));
  const af = r === 0 ? n : (1 - (1 + r) ** -n) / r;
  const npv = i.cashFlow * af - i.cost;
  const downsideNpv = i.cashFlow * (1 - i.downside / 100) * af - i.cost;
  return { npv, downsideNpv, irr: irrAnnuity(i.cost, i.cashFlow, n), payback: i.cashFlow > 0 ? i.cost / i.cashFlow : Infinity, breakEvenCashFlow: i.cost / af };
}

/** IRR of an annuity by bisection (percent). Null if no positive IRR. */
export function irrAnnuity(cost: number, cashFlow: number, years: number): number | null {
  if (cost <= 0 || cashFlow <= 0 || cashFlow * years <= cost) return null;
  let lo = 0.0000001;
  let hi = 10;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const pv = (cashFlow * (1 - (1 + mid) ** -years)) / mid;
    if (pv > cost) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}

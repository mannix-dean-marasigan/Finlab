// Portfolio simulator and market events.
import { supabase, unwrap } from '@/lib/supabase';
import type { MarketEvent, MarketEventDecision, Portfolio, PortfolioPosition, PortfolioTransaction } from '@/types/domain';

export async function fetchPortfolio(userId: string): Promise<{
  portfolio: Portfolio;
  positions: PortfolioPosition[];
  transactions: PortfolioTransaction[];
}> {
  const pf = unwrap(await supabase.from('portfolios').select('*').eq('user_id', userId).single()) as Portfolio;
  const [pos, tx] = await Promise.all([
    supabase.from('portfolio_positions').select('*').eq('portfolio_id', pf.id),
    supabase.from('portfolio_transactions').select('*').eq('portfolio_id', pf.id).order('created_at', { ascending: false }).limit(50),
  ]);
  const n = Number;
  return {
    portfolio: { ...pf, cash: n(pf.cash), starting_capital: n(pf.starting_capital), realized_pl: n(pf.realized_pl) },
    positions: (unwrap(pos) as PortfolioPosition[]).map((p) => ({
      ...p,
      shares: n(p.shares),
      avg_cost_local: n(p.avg_cost_local),
      cost_basis_base: n(p.cost_basis_base),
    })),
    transactions: (unwrap(tx) as PortfolioTransaction[]).map((t) => ({
      ...t,
      shares: n(t.shares),
      price_local: n(t.price_local),
      fx_rate: n(t.fx_rate),
      amount_base: n(t.amount_base),
      realized_pl_base: t.realized_pl_base === null ? null : n(t.realized_pl_base),
    })),
  };
}

export interface TradeResult {
  security_id: string;
  side: 'buy' | 'sell';
  shares: number;
  price: number;
  fx_rate: number;
  amount_base: number;
  realized_pl: number | null;
}

export async function executeTrade(input: {
  securityId: string;
  side: 'buy' | 'sell';
  shares: number;
  rationale: string;
  marketEventId?: string | null;
}): Promise<TradeResult> {
  return unwrap(
    await supabase.rpc('execute_trade', {
      p_security: input.securityId,
      p_side: input.side,
      p_shares: input.shares,
      p_rationale: input.rationale,
      p_market_event: input.marketEventId ?? null,
    }),
  ) as TradeResult;
}

export async function resetPortfolio(): Promise<void> {
  unwrap(await supabase.rpc('reset_portfolio'));
}

// ------------------------------------------------------------ Market events
export async function listMarketEvents(): Promise<MarketEvent[]> {
  return unwrap(
    await supabase.from('market_events').select('*').neq('status', 'draft').order('opens_at', { ascending: false }),
  ) as MarketEvent[];
}

export async function listMyDecisions(userId: string): Promise<MarketEventDecision[]> {
  return unwrap(await supabase.from('market_event_decisions').select('*').eq('user_id', userId)) as MarketEventDecision[];
}

export async function submitDecision(input: {
  eventId: string;
  action: MarketEventDecision['action'];
  reasoning: string;
  securityId?: string | null;
  confidence: number;
}): Promise<string> {
  return unwrap(
    await supabase.rpc('submit_market_event_decision', {
      p_event: input.eventId,
      p_action: input.action,
      p_reasoning: input.reasoning,
      p_security: input.securityId ?? null,
      p_confidence: input.confidence,
    }),
  ) as string;
}

export interface EventResolution {
  best_actions: string[];
  acceptable_actions: string[];
  keywords: string[];
  summary: string;
  price_impacts: Record<string, number>;
}

export async function fetchEventResolution(eventId: string): Promise<EventResolution | null> {
  return unwrap(await supabase.rpc('get_market_event_resolution', { p_event: eventId })) as EventResolution | null;
}

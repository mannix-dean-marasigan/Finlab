import { supabase, unwrap } from '@/lib/supabase';
import type { FxRate, MarketDataProvider, PricePoint, Security } from './types';

interface SecurityRow {
  id: string;
  symbol: string;
  exchange: Security['exchange'];
  name: string;
  sector: string;
  currency: string;
  price: number;
  prev_close: number | null;
  eps: number | null;
  bvps: number | null;
  pe: number | null;
  pb: number | null;
  market_cap: number | null;
  revenue: number | null;
  shares_outstanding: number | null;
  description: string;
  data_as_of: string;
  data_source: Security['dataSource'];
}

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function mapSecurity(r: SecurityRow): Security {
  const price = Number(r.price);
  const prev = n(r.prev_close);
  const change = prev !== null ? price - prev : null;
  return {
    id: r.id,
    symbol: r.symbol,
    exchange: r.exchange,
    name: r.name,
    sector: r.sector,
    currency: r.currency,
    price,
    prevClose: prev,
    change,
    changePct: prev ? (change! / prev) * 100 : null,
    eps: n(r.eps),
    bvps: n(r.bvps),
    pe: n(r.pe),
    pb: n(r.pb),
    marketCap: n(r.market_cap),
    revenue: n(r.revenue),
    sharesOutstanding: n(r.shares_outstanding),
    description: r.description,
    dataAsOf: r.data_as_of,
    dataSource: r.data_source,
  };
}

/** Reads the curated sample dataset stored in Supabase (market_* tables). */
export class SupabaseSampleProvider implements MarketDataProvider {
  readonly label = 'FINLAB sample dataset';
  readonly isLive = false;

  async listSecurities(filter?: { exchange?: string; search?: string }): Promise<Security[]> {
    let query = supabase.from('market_securities').select('*').eq('is_active', true).order('exchange').order('symbol');
    if (filter?.exchange && filter.exchange !== 'ALL') {
      query = filter.exchange === 'US' ? query.in('exchange', ['NYSE', 'NASDAQ']) : query.eq('exchange', filter.exchange);
    }
    const rows = unwrap(await query) as SecurityRow[];
    const s = filter?.search?.trim().toLowerCase();
    return rows
      .map(mapSecurity)
      .filter((x) => !s || x.symbol.toLowerCase().includes(s) || x.name.toLowerCase().includes(s) || x.sector.toLowerCase().includes(s));
  }

  async getSecurity(id: string): Promise<Security | null> {
    const row = unwrap(await supabase.from('market_securities').select('*').eq('id', id).maybeSingle()) as SecurityRow | null;
    return row ? mapSecurity(row) : null;
  }

  async getPriceHistory(id: string, days = 180): Promise<PricePoint[]> {
    const rows = unwrap(
      await supabase
        .from('market_price_history')
        .select('trade_date, close')
        .eq('security_id', id)
        .order('trade_date', { ascending: false })
        .limit(days),
    ) as { trade_date: string; close: number }[];
    return rows.reverse().map((r) => ({ date: r.trade_date, close: Number(r.close) }));
  }

  async getFxRates(): Promise<FxRate[]> {
    const rows = unwrap(await supabase.from('market_fx_rates').select('*')) as {
      pair: string;
      rate: number;
      as_of: string;
      data_source: FxRate['dataSource'];
    }[];
    return rows.map((r) => ({ pair: r.pair, rate: Number(r.rate), asOf: r.as_of, dataSource: r.data_source }));
  }
}

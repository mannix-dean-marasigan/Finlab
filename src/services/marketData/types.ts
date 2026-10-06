// Market data abstraction. Phase 1 ships ONE implementation backed by the
// curated SAMPLE dataset in Supabase. A live PSE/US provider can be added by
// implementing this interface — no page or component needs to change.

export type DataSourceKind = 'sample' | 'manual' | 'live';

export interface Security {
  id: string; // e.g. "PSE:BDO"
  symbol: string;
  exchange: 'PSE' | 'NYSE' | 'NASDAQ';
  name: string;
  sector: string;
  currency: string;
  price: number;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  eps: number | null;
  bvps: number | null;
  pe: number | null;
  pb: number | null;
  marketCap: number | null;
  revenue: number | null;
  sharesOutstanding: number | null;
  description: string;
  dataAsOf: string;
  dataSource: DataSourceKind;
}

export interface PricePoint {
  date: string;
  close: number;
}

export interface FxRate {
  pair: string; // e.g. USDPHP
  rate: number;
  asOf: string;
  dataSource: DataSourceKind;
}

export interface MarketDataProvider {
  /** Human-readable name shown in the UI ("FINLAB sample dataset"). */
  readonly label: string;
  /** Whether quotes are real-time. Phase 1: always false. */
  readonly isLive: boolean;
  listSecurities(filter?: { exchange?: string; search?: string }): Promise<Security[]>;
  getSecurity(id: string): Promise<Security | null>;
  getPriceHistory(id: string, days?: number): Promise<PricePoint[]>;
  getFxRates(): Promise<FxRate[]>;
}

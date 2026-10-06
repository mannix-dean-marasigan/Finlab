import { SupabaseSampleProvider } from './sampleProvider';
import type { FxRate, MarketDataProvider } from './types';

export * from './types';

/**
 * The active market data provider. To go live later, implement
 * MarketDataProvider (e.g. a PSE feed behind a Supabase Edge Function that
 * also writes prices into market_securities so server-side trade execution
 * stays consistent) and swap it here.
 */
export const marketData: MarketDataProvider = new SupabaseSampleProvider();

export function fxToBase(rates: FxRate[], currency: string, base = 'PHP'): number {
  if (currency === base) return 1;
  const direct = rates.find((r) => r.pair === `${currency}${base}`);
  if (direct) return direct.rate;
  const inverse = rates.find((r) => r.pair === `${base}${currency}`);
  return inverse ? 1 / inverse.rate : NaN;
}

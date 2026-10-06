import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Search } from 'lucide-react';
import { marketData } from '@/services/marketData';
import { Delta, PageHeader, SampleDataBadge } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import { Segmented, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtCompact, fmtMoney, fmtNumber } from '@/lib/format';

export default function MarketsPage() {
  const [exchange, setExchange] = useState<'ALL' | 'PSE' | 'US'>('ALL');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const fx = useQuery({ queryKey: ['fx'], queryFn: () => marketData.getFxRates() });
  const securities = useQuery({ queryKey: ['securities', exchange], queryFn: () => marketData.listSecurities({ exchange }) });

  const s = search.trim().toLowerCase();
  const list = (securities.data ?? []).filter((x) => !s || x.symbol.toLowerCase().includes(s) || x.name.toLowerCase().includes(s) || x.sector.toLowerCase().includes(s));
  const asOf = securities.data?.[0]?.dataAsOf;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Markets"
        title="Market monitor"
        description={`Curated sample data for the Philippine Stock Exchange and US markets via the ${marketData.label}. Figures are illustrative and static — never live quotes.`}
        actions={<SampleDataBadge asOf={asOf} />}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={exchange}
            onChange={setExchange}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'PSE', label: 'PSE' },
              { value: 'US', label: 'US' },
            ]}
          />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ticker, name or sector" className="w-64 pl-9" aria-label="Search securities" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {fx.data?.map((r) => (
            <span key={r.pair} className="font-mono text-xs text-fg-muted">
              {r.pair.slice(0, 3)}/{r.pair.slice(3)} {fmtNumber(r.rate, 2)} <span className="text-fg-subtle">({r.dataSource})</span>
            </span>
          ))}
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'cards', label: <LayoutGrid className="h-3.5 w-3.5" /> },
              { value: 'table', label: <List className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </div>

      {securities.isPending ? (
        <PageSkeleton />
      ) : securities.isError ? (
        <ErrorState error={securities.error} onRetry={() => securities.refetch()} />
      ) : !list.length ? (
        <EmptyState title="No securities match" />
      ) : view === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((x) => (
            <Link key={x.id} to={`/markets/${encodeURIComponent(x.id)}`}>
              <Card className="h-full p-4 transition-colors hover:border-border-strong">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{x.symbol}</span>
                      <Badge>{x.exchange}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-fg-muted">{x.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold tabular">{fmtMoney(x.price, x.currency)}</div>
                    <Delta value={x.changePct} className="text-xs" />
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-y-2 text-xs">
                  {[
                    ['P/E', x.pe !== null ? `${fmtNumber(x.pe, 1)}x` : '—'],
                    ['P/B', x.pb !== null ? `${fmtNumber(x.pb, 2)}x` : '—'],
                    ['EPS', fmtNumber(x.eps, 2)],
                    ['Mkt cap', fmtCompact(x.marketCap, x.currency)],
                    ['Revenue', fmtCompact(x.revenue, x.currency)],
                    ['Sector', x.sector],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-fg-subtle">{k}</dt>
                      <dd className="truncate font-mono tabular text-fg/90">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Security</Th>
                <Th>Sector</Th>
                <Th align="right">Price</Th>
                <Th align="right">Day chg</Th>
                <Th align="right">P/E</Th>
                <Th align="right">P/B</Th>
                <Th align="right">EPS</Th>
                <Th align="right">Mkt cap</Th>
                <Th align="right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id} className="hover:bg-surface-2">
                  <Td>
                    <Link to={`/markets/${encodeURIComponent(x.id)}`} className="hover:text-accent">
                      <span className="font-mono font-semibold">{x.symbol}</span> <span className="text-xs text-fg-subtle">{x.exchange}</span>
                      <div className="text-xs text-fg-muted">{x.name}</div>
                    </Link>
                  </Td>
                  <Td className="text-fg-muted">{x.sector}</Td>
                  <Td align="right" mono>{fmtMoney(x.price, x.currency)}</Td>
                  <Td align="right"><Delta value={x.changePct} /></Td>
                  <Td align="right" mono>{x.pe !== null ? `${fmtNumber(x.pe, 1)}x` : '—'}</Td>
                  <Td align="right" mono>{x.pb !== null ? `${fmtNumber(x.pb, 2)}x` : '—'}</Td>
                  <Td align="right" mono>{fmtNumber(x.eps, 2)}</Td>
                  <Td align="right" mono>{fmtCompact(x.marketCap, x.currency)}</Td>
                  <Td align="right" mono>{fmtCompact(x.revenue, x.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, Calculator, PieChart, Presentation } from 'lucide-react';
import { marketData } from '@/services/marketData';
import { createPitch } from '@/services/api/work';
import { Delta, SampleDataBadge } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtCompact, fmtDate, fmtMoney, fmtNumber } from '@/lib/format';
import { toast } from 'sonner';

export default function SecurityPage() {
  const { id = '' } = useParams();
  const securityId = decodeURIComponent(id);
  const navigate = useNavigate();
  const [range, setRange] = useState<'30' | '90' | '180'>('90');
  const sec = useQuery({ queryKey: ['security', securityId], queryFn: () => marketData.getSecurity(securityId) });
  const history = useQuery({ queryKey: ['history', securityId], queryFn: () => marketData.getPriceHistory(securityId, 180) });
  const pitch = useMutation({
    mutationFn: () =>
      createPitch({ format: 'quick', company: sec.data!.name, ticker: sec.data!.symbol, exchange: sec.data!.exchange, currency: sec.data!.currency, current_price: sec.data!.price }),
    onSuccess: (p) => navigate(`/pitches/${p.id}`),
    onError: (e) => toast.error((e as Error).message),
  });

  if (sec.isPending) return <PageSkeleton />;
  if (sec.isError) return <ErrorState error={sec.error} onRetry={() => sec.refetch()} />;
  if (!sec.data) return <EmptyState title="Security not found" action={<Link to="/markets" className="text-accent">Back to Markets</Link>} />;
  const s = sec.data;
  const points = (history.data ?? []).slice(-Number(range));
  const first = points[0]?.close;
  const rangeChange = first ? ((s.price - first) / first) * 100 : null;
  const up = (rangeChange ?? 0) >= 0;

  const metrics: [string, string][] = [
    ['Previous close', fmtMoney(s.prevClose, s.currency)],
    ['Day change', s.change !== null ? `${s.change >= 0 ? '+' : ''}${fmtNumber(s.change, 2)}` : '—'],
    ['P/E', s.pe !== null ? `${fmtNumber(s.pe, 2)}x` : '—'],
    ['P/B', s.pb !== null ? `${fmtNumber(s.pb, 2)}x` : '—'],
    ['EPS', fmtNumber(s.eps, 2)],
    ['Book value / share', fmtNumber(s.bvps, 2)],
    ['Market cap', fmtCompact(s.marketCap, s.currency)],
    ['Revenue', fmtCompact(s.revenue, s.currency)],
    ['Shares outstanding', fmtCompact(s.sharesOutstanding)],
  ];

  return (
    <div className="animate-fade-in">
      <Link to="/markets" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Markets
      </Link>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-3xl font-semibold">{s.symbol}</h1>
            <Badge>{s.exchange}</Badge>
            <Badge tone="neutral">{s.sector}</Badge>
            <SampleDataBadge asOf={s.dataAsOf} />
          </div>
          <p className="mt-1 text-fg-muted">{s.name}</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold tabular">{fmtMoney(s.price, s.currency)}</span>
            <Delta value={s.changePct} className="text-base" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(`/portfolio?security=${encodeURIComponent(s.id)}`)}>
            <PieChart className="h-4 w-4" /> Trade (simulated)
          </Button>
          <Button onClick={() => pitch.mutate()} loading={pitch.isPending}>
            <Presentation className="h-4 w-4" /> Pitch it
          </Button>
          <Link to="/valuation">
            <Button>
              <Calculator className="h-4 w-4" /> Value it
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader
            title="Price history"
            subtitle="Illustrative sample series — not actual historical prices."
            action={
              <Segmented
                value={range}
                onChange={setRange}
                options={[
                  { value: '30', label: '1M' },
                  { value: '90', label: '3M' },
                  { value: '180', label: '6M' },
                ]}
              />
            }
          />
          <CardContent>
            {history.isPending ? (
              <div className="h-72 animate-pulse rounded bg-surface-3" />
            ) : history.isError ? (
              <ErrorState error={history.error} onRetry={() => history.refetch()} />
            ) : !points.length ? (
              <EmptyState title="No price history" />
            ) : (
              <>
                <div className="mb-2 text-xs text-fg-muted">
                  Range change <Delta value={rangeChange} />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points}>
                      <defs>
                        <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={up ? '#22c55e' : '#f43f5e'} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={up ? '#22c55e' : '#f43f5e'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1c2430" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(d) => fmtDate(d, { month: 'short', day: 'numeric' })} minTickGap={40} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#8b98a8', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip contentStyle={{ background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 }} labelFormatter={(d) => fmtDate(String(d))} formatter={(v) => [fmtMoney(Number(v), s.currency), 'Close']} />
                      <Area dataKey="close" stroke={up ? '#22c55e' : '#f43f5e'} strokeWidth={2} fill="url(#px)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Key metrics" />
            <CardContent>
              <dl className="divide-y divide-border">
                {metrics.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-sm">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="font-mono tabular">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Profile" />
            <CardContent className="text-sm text-fg-muted">{s.description || 'No description.'}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

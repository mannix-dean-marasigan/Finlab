import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { marketData } from '@/services/marketData';
import { adminUpdateSecurityPrice } from '@/services/api/admin';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import { Table, Td, Th } from '@/components/ui/misc';
import { ErrorState, PageSkeleton } from '@/components/ui/states';

/** Maintain the curated sample dataset (no paid data feed in Phase 1). */
export default function AdminMarketPage() {
  const qc = useQueryClient();
  const secs = useQuery({ queryKey: ['securities', 'ALL'], queryFn: () => marketData.listSecurities() });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async () => {
      for (const [id, v] of Object.entries(edits)) {
        const price = Number(v);
        if (!(price > 0)) throw new Error(`Invalid price for ${id}`);
        const cur = secs.data?.find((s) => s.id === id);
        await adminUpdateSecurityPrice(id, price, cur?.price ?? null);
      }
    },
    onSuccess: () => {
      setEdits({});
      qc.invalidateQueries({ queryKey: ['securities'] });
      qc.invalidateQueries({ queryKey: ['security'] });
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Prices updated (previous price becomes previous close). Source marked "manual".');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (secs.isPending) return <PageSkeleton />;
  if (secs.isError) return <ErrorState error={secs.error} onRetry={() => secs.refetch()} />;

  return (
    <Card>
      <CardHeader
        title="Sample market data"
        subtitle="Manually maintained prices. P/E, P/B and market cap are not recomputed here — resolving a market event does that automatically."
        action={
          <Button size="sm" variant="primary" disabled={!Object.keys(edits).length} onClick={() => save.mutate()} loading={save.isPending}>
            <Save className="h-4 w-4" /> Save {Object.keys(edits).length || ''} change(s)
          </Button>
        }
      />
      <Table>
        <thead>
          <tr>
            <Th>Security</Th>
            <Th>Source</Th>
            <Th align="right">Prev close</Th>
            <Th align="right">Price</Th>
            <Th align="right">New price</Th>
          </tr>
        </thead>
        <tbody>
          {secs.data.map((s) => (
            <tr key={s.id}>
              <Td>
                <span className="font-mono font-semibold">{s.id}</span>
                <div className="text-xs text-fg-muted">{s.name}</div>
              </Td>
              <Td>
                <Badge tone={s.dataSource === 'sample' ? 'warn' : 'info'}>{s.dataSource}</Badge>
                <div className="text-xs text-fg-subtle">{s.dataAsOf}</div>
              </Td>
              <Td align="right" mono>{s.prevClose ?? '—'}</Td>
              <Td align="right" mono>{s.price}</Td>
              <Td align="right">
                <Input value={edits[s.id] ?? ''} onChange={(e) => setEdits({ ...edits, [s.id]: e.target.value })} placeholder={String(s.price)} className="ml-auto w-28 text-right font-mono" />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminOverview, adminRecalculateAll } from '@/services/api/admin';
import { fetchSettings } from '@/services/api/reference';
import { useReference, invalidateProgress } from '@/app/queries';
import { supabase, unwrap } from '@/lib/supabase';
import { Stat } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { ErrorState, PageSkeleton } from '@/components/ui/states';
import { BackupCard } from './BackupCard';
import { InstallContentCard } from './InstallContentCard';
import { AiHelperCard } from './AiHelperCard';

export default function AdminOverviewPage() {
  const qc = useQueryClient();
  const ov = useQuery({ queryKey: ['admin', 'overview'], queryFn: fetchAdminOverview });
  const settings = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });
  const ref = useReference();
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [vals, setVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ref.data) setWeights(Object.fromEntries(ref.data.skills.map((s) => [s.id, String(s.weight)])));
  }, [ref.data]);
  useEffect(() => {
    if (settings.data) setVals(Object.fromEntries(settings.data.map((s) => [s.key, String(s.value)])));
  }, [settings.data]);

  const recalc = useMutation({
    mutationFn: adminRecalculateAll,
    onSuccess: (n) => {
      invalidateProgress(qc);
      toast.success(`Recalculated ${n} users`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const saveScoring = useMutation({
    mutationFn: async () => {
      for (const [id, w] of Object.entries(weights)) {
        const n = Number(w);
        if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid weight for ${id}`);
        unwrap(await supabase.from('skills').update({ weight: n }).eq('id', id));
      }
      for (const [key, v] of Object.entries(vals)) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid value for ${key}`);
        unwrap(await supabase.from('app_settings').update({ value: n }).eq('key', key));
      }
      return adminRecalculateAll();
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['reference'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
      invalidateProgress(qc);
      toast.success(`Scoring updated and ${n} users recalculated`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (ov.isPending) return <PageSkeleton />;
  if (ov.isError) return <ErrorState error={ov.error} onRetry={() => ov.refetch()} />;
  const o = ov.data;
  const total = Object.values(weights).reduce((s, w) => s + (Number(w) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Users" value={o.users} sub={`${o.onboarded} onboarded`} />
        <Stat label="Challenges" value={`${o.challenges_published}/${o.challenges_total}`} sub="published / total" />
        <Stat label="Submissions" value={o.submissions} sub={<Link to="/admin/submissions" className="text-accent hover:underline">{o.pending_reviews} awaiting review</Link>} />
        <Stat label="Pitches · Reports" value={`${o.pitches} · ${o.reports}`} sub="submitted" />
        <Stat label="Competitions · Events" value={`${o.competitions} · ${o.open_events}`} sub="total · open events" />
      </div>
      <InstallContentCard />
      <AiHelperCard />
      <BackupCard />
      <Card>
        <CardHeader
          title="Scoring configuration"
          subtitle="FINLAB Score skill weights (normalised by their sum) and engine settings. Saving recalculates every user."
          action={
            <Button size="sm" variant="outline" onClick={() => recalc.mutate()} loading={recalc.isPending}>
              <RefreshCw className="h-4 w-4" /> Recalculate all
            </Button>
          }
        />
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {ref.data?.skills.map((s) => (
              <label key={s.id} className="text-xs text-fg-muted">
                {s.name}
                <Input value={weights[s.id] ?? ''} onChange={(e) => setWeights({ ...weights, [s.id]: e.target.value })} className="mt-1 font-mono" />
              </label>
            ))}
          </div>
          <p className="text-xs text-fg-subtle">Sum of weights: {total} (weights are normalised, so 100 is conventional but not required)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {settings.data?.map((s) => (
              <label key={s.key} className="text-xs text-fg-muted">
                <span className="font-mono">{s.key}</span>
                <Input value={vals[s.key] ?? ''} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} className="mt-1 font-mono" />
                <span className="mt-1 block text-fg-subtle">{s.description}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => saveScoring.mutate()} loading={saveScoring.isPending}>
              <Save className="h-4 w-4" /> Save & recalculate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

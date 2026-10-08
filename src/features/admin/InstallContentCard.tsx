import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, unwrap } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { installContentBundle, type ContentBundle, type InstallDb } from './installContent';

// The bundle is ~230 KB, so it is only downloaded when an admin opens this card.
const loadBundle = () => import('./contentBundle.json').then((m) => m.default as unknown as ContentBundle);

const PROGRAMS = ['accounting-fundamentals', 'corporate-finance-fpa', 'financial-modeling', 'finance-interview-prep', 'personal-finance-essentials'];

const db: InstallDb = {
  async upsert(table, rows, onConflict, returning) {
    return unwrap(await supabase.from(table).upsert(rows, { onConflict }).select(returning)) as unknown as Record<string, unknown>[];
  },
  async selectIn(table, columns, column, values) {
    return unwrap(await supabase.from(table).select(columns).in(column, values)) as unknown as Record<string, unknown>[];
  },
};

/** Loads the newest certifications and daily questions without using the SQL Editor. Safe to run more than once. */
export function InstallContentCard() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const installed = useQuery({
    queryKey: ['admin', 'content-installed'],
    queryFn: async () => (unwrap(await supabase.from('certification_programs').select('slug').in('slug', PROGRAMS)) as { slug: string }[]).length,
  });
  const done = installed.data === PROGRAMS.length;

  const run = async () => {
    setBusy(true);
    try {
      const r = await installContentBundle(db, await loadBundle(), setStep);
      await qc.invalidateQueries();
      toast.success(`Installed ${r.programs} certifications, ${r.lessons} lessons, ${r.flashcards} flashcards and ${r.daily_questions} daily questions`);
    } catch (e) {
      toast.error(`Install stopped: ${(e as Error).message}. Nothing is lost — fix the problem and click again.`);
    } finally {
      setBusy(false);
      setStep('');
    }
  };

  return (
    <Card>
      <CardHeader
        title="New content"
        subtitle="Accounting Fundamentals, Corporate Finance & FP&A, Financial Modeling, Finance Interview Prep, Personal Finance Essentials and 45 daily questions."
        icon={<PackagePlus className="h-3.5 w-3.5" />}
        action={
          <Button size="sm" variant={done ? 'outline' : 'primary'} onClick={run} loading={busy}>
            {done ? 'Reinstall' : 'Install content'}
          </Button>
        }
      />
      <CardContent className="space-y-2 text-xs text-fg-muted">
        {busy ? (
          <p className="font-mono text-accent">Installing: {step}…</p>
        ) : done ? (
          <p className="flex items-center gap-1.5 text-up">
            <CheckCircle2 className="h-3.5 w-3.5" /> All 5 are installed. Reinstalling is harmless — it only rewrites the same content.
          </p>
        ) : (
          <p>
            {installed.data ?? 0} of {PROGRAMS.length} installed. One click adds them; nobody's existing progress is touched. Takes about 20 seconds.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

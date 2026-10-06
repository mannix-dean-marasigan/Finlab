import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Info, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress, useReference } from '@/app/queries';
import { deletePitch, getPitch, submitPitch, updatePitch, type PitchDraft } from '@/services/api/work';
import { fetchRubric } from '@/services/api/reference';
import type { Rating, StockPitch } from '@/types/domain';
import { usePatchAutosave } from '@/hooks/usePatchAutosave';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Segmented } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { Countdown, Delta, Markdown, RatingBadge, ScoreRing } from '@/components/common';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { SaveIndicator } from '@/features/challenges/TaskWorkspace';
import { SourcesEditor } from '@/features/shared/SourcesEditor';
import { ChallengeContextBanner, SecurityPicker } from '@/features/shared/WorkHelpers';
import { ratingFromUpside, upsidePct } from '@/lib/finance/valuation';
import { currencySymbol, fmtDateTime, fmtMoney } from '@/lib/format';
import { itemCount, wordCount } from '@/lib/utils';

type TextKey = 'thesis' | 'catalysts' | 'risks' | 'company_analysis' | 'financial_analysis' | 'forecast' | 'valuation' | 'variant_perception';

const TEXT_FIELDS: { key: TextKey; label: string; hint: string; pro?: boolean; rows: number; target: number; list?: boolean }[] = [
  { key: 'thesis', label: 'Investment thesis', hint: '2–3 specific, quantified reasons the market is mispricing this stock.', rows: 6, target: 120 },
  { key: 'variant_perception', label: 'Variant perception', hint: 'What do you believe that the consensus does not?', pro: true, rows: 4, target: 100 },
  { key: 'company_analysis', label: 'Company analysis', hint: 'Business model, segments, competitive position, management.', pro: true, rows: 6, target: 150 },
  { key: 'financial_analysis', label: 'Financial analysis', hint: 'Growth, margins, returns, balance sheet — with numbers.', pro: true, rows: 6, target: 250 },
  { key: 'forecast', label: 'Forecast', hint: 'Key assumptions and the resulting revenue / earnings path.', pro: true, rows: 5, target: 150 },
  { key: 'valuation', label: 'Valuation', hint: 'Method (P/E, P/B, DCF…), key inputs, and how you reach the target.', pro: true, rows: 5, target: 200 },
  { key: 'catalysts', label: 'Catalysts', hint: 'One per line, with timing (e.g. "Q4 2026 results").', rows: 4, target: 3, list: true },
  { key: 'risks', label: 'Risks', hint: 'One per line. Include what you will monitor or how it is mitigated.', rows: 4, target: 3, list: true },
];

function PitchReadOnly({ pitch, isOwner }: { pitch: StockPitch; isOwner: boolean }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (v: boolean) => updatePitch(pitch.id, { is_public: v }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['pitch', pitch.id] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      toast.success(v ? 'Pitch is public on your Finance Passport' : 'Pitch is now private');
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const up = pitch.current_price && pitch.target_price ? upsidePct(pitch.target_price, pitch.current_price) : null;
  const fields = TEXT_FIELDS.filter((f) => !f.pro || pitch.format === 'professional');
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4 min-w-0">
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="font-mono text-2xl font-semibold">{pitch.ticker}</div>
              <div className="text-sm text-fg-muted">{pitch.company} · {pitch.exchange ?? '—'}</div>
            </div>
            <RatingBadge rating={pitch.rating} />
            <div className="ml-auto grid grid-cols-3 gap-6 text-right">
              <div>
                <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Price</div>
                <div className="font-mono tabular">{fmtMoney(pitch.current_price, pitch.currency)}</div>
              </div>
              <div>
                <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Target</div>
                <div className="font-mono tabular">{fmtMoney(pitch.target_price, pitch.currency)}</div>
              </div>
              <div>
                <div className="text-[0.7rem] uppercase tracking-wider text-fg-subtle">Upside</div>
                <Delta value={up} />
              </div>
            </div>
          </div>
          {pitch.valuation_method && <div className="mt-3 text-xs text-fg-muted">Valuation basis: {pitch.valuation_method}</div>}
        </Card>
        {fields.map((f) =>
          pitch[f.key]?.trim() ? (
            <Card key={f.key}>
              <CardHeader title={f.label} />
              <CardContent>
                <Markdown>{f.list ? pitch[f.key].split('\n').filter((l) => l.trim()).map((l) => `- ${l.replace(/^[\s\-*•]+/, '')}`).join('\n') : pitch[f.key]}</Markdown>
              </CardContent>
            </Card>
          ) : null,
        )}
        <Card>
          <CardHeader title="Sources" />
          <CardContent>
            <SourcesEditor parent={{ pitchId: pitch.id }} readOnly />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Rubric score" subtitle={`Submitted ${fmtDateTime(pitch.submitted_at)}`} />
          <CardContent>
            <div className="mb-4 flex justify-center">
              <ScoreRing value={Number(pitch.score ?? 0)} sub="/ 100" />
            </div>
            {pitch.criteria_scores && <ScoreBreakdown criteria={pitch.criteria_scores} showWeights />}
            <p className="mt-3 text-xs text-fg-subtle">
              Automated deterministic rubric (beta): measures completeness, consistency, quantitative support and structure — not whether the call is right.
            </p>
          </CardContent>
        </Card>
        {isOwner && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{pitch.is_public ? 'Public on Passport' : 'Private'}</div>
                <div className="text-xs text-fg-muted">Public pitches appear on your recruiter-facing Finance Passport.</div>
              </div>
              <Button size="sm" variant={pitch.is_public ? 'outline' : 'primary'} onClick={() => toggle.mutate(!pitch.is_public)} loading={toggle.isPending}>
                {pitch.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {pitch.is_public ? 'Make private' : 'Publish'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function PitchEditor({ pitch }: { pitch: StockPitch }) {
  const qc = useQueryClient();
  const ref = useReference();
  const navigate = useNavigate();
  const [form, setForm] = useState<StockPitch>(pitch);
  const [confirm, setConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rubric = useQuery({ queryKey: ['rubric', 'stock_pitch_v1'], queryFn: () => fetchRubric('stock_pitch_v1'), staleTime: Infinity });
  const autosave = usePatchAutosave<PitchDraft>((patch) => updatePitch(pitch.id, patch));
  const isPro = pitch.format === 'professional';

  const set = <K extends keyof PitchDraft>(key: K, value: PitchDraft[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    autosave.queue({ [key]: value } as PitchDraft);
  };

  const upside = form.current_price && form.target_price ? upsidePct(form.target_price, form.current_price) : null;
  const implied = ratingFromUpside(upside, rubric.data?.config.rating_threshold_pct ?? 10);
  const inconsistent = form.rating && implied && form.rating !== implied;

  const submit = useMutation({
    mutationFn: async () => {
      await autosave.flush();
      return submitPitch(pitch.id);
    },
    onSuccess: (res) => {
      setConfirm(false);
      invalidateProgress(qc);
      qc.invalidateQueries({ queryKey: ['pitch', pitch.id] });
      qc.invalidateQueries({ queryKey: ['pitches'] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['attempt'] });
      toast.success(`Pitch scored ${res.score} / 100`);
      const names = new Map(ref.data?.achievements.map((a) => [a.id, a.name]));
      for (const id of res.new_achievements ?? []) toast.success(`Achievement unlocked: ${names.get(id) ?? id}`);
    },
  });
  const remove = useMutation({
    mutationFn: () => deletePitch(pitch.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pitches'] });
      toast('Draft deleted');
      navigate('/pitches');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const missing = [
    !form.company.trim() && 'company',
    !form.ticker.trim() && 'ticker',
    !form.rating && 'rating',
    !form.current_price && 'current price',
    !form.target_price && 'target price',
    ...TEXT_FIELDS.filter((f) => (!f.pro || isPro) && !form[f.key]?.trim()).map((f) => f.label.toLowerCase()),
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4 min-w-0">
        <Card>
          <CardHeader title="Recommendation" subtitle="Prefill from the sample market dataset or enter your own figures." action={<div className="w-64 max-w-full"><SecurityPicker onPick={(s) => {
            setForm((f) => ({ ...f, company: s.name, ticker: s.symbol, exchange: s.exchange, currency: s.currency, current_price: s.price }));
            autosave.queue({ company: s.name, ticker: s.symbol, exchange: s.exchange, currency: s.currency, current_price: s.price });
          }} /></div>} />
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Company" required className="sm:col-span-2">
              <Input value={form.company} onChange={(e) => set('company', e.target.value)} maxLength={160} placeholder="BDO Unibank, Inc." />
            </Field>
            <Field label="Ticker" required>
              <Input value={form.ticker} onChange={(e) => set('ticker', e.target.value.toUpperCase())} maxLength={20} className="font-mono uppercase" placeholder="BDO" />
            </Field>
            <Field label="Exchange">
              <Input value={form.exchange ?? ''} onChange={(e) => set('exchange', e.target.value.toUpperCase() || null)} maxLength={20} placeholder="PSE" />
            </Field>
            <Field label="Rating" required>
              <Segmented<Rating>
                value={(form.rating ?? '') as Rating}
                onChange={(v) => set('rating', v)}
                options={[
                  { value: 'BUY', label: 'BUY' },
                  { value: 'HOLD', label: 'HOLD' },
                  { value: 'SELL', label: 'SELL' },
                ]}
              />
            </Field>
            <Field label={`Current price (${currencySymbol(form.currency)})`} required>
              <Input type="number" min={0} step="0.01" value={form.current_price ?? ''} onChange={(e) => set('current_price', e.target.value ? Number(e.target.value) : null)} className="font-mono" />
            </Field>
            <Field label={`Target price (${currencySymbol(form.currency)})`} required>
              <Input type="number" min={0} step="0.01" value={form.target_price ?? ''} onChange={(e) => set('target_price', e.target.value ? Number(e.target.value) : null)} className="font-mono" />
            </Field>
            <Field label="Currency">
              <Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
              </Select>
            </Field>
            <Field label="Valuation basis" className="sm:col-span-2">
              <Select value={form.valuation_method ?? ''} onChange={(e) => set('valuation_method', e.target.value || null)}>
                <option value="">Select method…</option>
                {['P/E multiple', 'P/B multiple', 'DCF', 'EV/EBITDA', 'Dividend discount', 'Sum of the parts', 'Other'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end gap-3 sm:col-span-2">
              <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
                <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Upside</div>
                <Delta value={upside} />
              </div>
              {inconsistent && (
                <p className="flex items-start gap-1.5 text-xs text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  A {form.rating} with {upside?.toFixed(1)}% upside looks inconsistent (convention implies {implied}). The rubric checks this.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {TEXT_FIELDS.filter((f) => !f.pro || isPro).map((f) => {
          const value = form[f.key] ?? '';
          const progress = f.list ? itemCount(value) : wordCount(value);
          return (
            <Card key={f.key}>
              <CardHeader
                title={f.label}
                subtitle={f.hint}
                action={
                  <span className={`font-mono text-xs ${progress >= f.target ? 'text-up' : 'text-fg-subtle'}`}>
                    {progress}/{f.target} {f.list ? 'items' : 'words'}
                  </span>
                }
              />
              <CardContent>
                <Textarea autoGrow rows={f.rows} value={value} onChange={(e) => set(f.key, e.target.value)} placeholder={f.list ? 'One per line…' : 'Write here…'} className="font-[450]" />
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader title="Sources" subtitle="At least one is required; three or more scores best." />
          <CardContent>
            <SourcesEditor parent={{ pitchId: pitch.id }} target={3} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="sticky top-20 space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-4">
              <SaveIndicator state={autosave.state} savedAt={autosave.savedAt} />
              {autosave.error && <InlineError message={autosave.error} />}
              {pitch.deadline_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Deadline</span>
                  <Countdown deadline={pitch.deadline_at} />
                </div>
              )}
              <Button variant="primary" className="w-full justify-center" onClick={() => setConfirm(true)}>
                <Send className="h-4 w-4" /> Submit pitch
              </Button>
              {!pitch.challenge_id && (
                <Button variant="ghost" size="sm" className="w-full justify-center text-fg-muted hover:text-down" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" /> Delete draft
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Rubric" subtitle="Deterministic beta scoring" icon={<Info className="h-3.5 w-3.5" />} />
            <CardContent>
              {rubric.data ? (
                <ul className="space-y-2 text-sm">
                  {rubric.data.criteria.map((c) => (
                    <li key={c.key}>
                      <div className="flex justify-between">
                        <span>{c.label}</span>
                        <span className="font-mono text-xs text-fg-subtle">{c.weight}%</span>
                      </div>
                      <p className="text-xs text-fg-muted">{c.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-40 animate-pulse rounded bg-surface-3" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => !submit.isPending && setConfirm(false)}
        title="Submit for scoring?"
        description="Submitted pitches are locked and become part of your track record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={submit.isPending}>
              Keep editing
            </Button>
            <Button variant="primary" onClick={() => submit.mutate()} loading={submit.isPending} disabled={missing.length > 0}>
              Submit
            </Button>
          </>
        }
      >
        {missing.length ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            Complete these first: {missing.join(', ')}.
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-up">
            <CheckCircle2 className="h-4 w-4" /> All required fields complete.
          </p>
        )}
        <div className="mt-3">
          <InlineError message={submit.error ? (submit.error as Error).message : null} />
        </div>
      </Modal>
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="Delete this draft?"
        description="This permanently removes the draft and its sources."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function PitchEditorPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const pitch = useQuery({ queryKey: ['pitch', id], queryFn: () => getPitch(id) });

  useEffect(() => {
    if (pitch.data?.ticker) document.title = `${pitch.data.ticker} pitch · FINLAB`;
    return () => {
      document.title = 'FINLAB — The flight simulator for finance';
    };
  }, [pitch.data?.ticker]);

  if (pitch.isPending) return <PageSkeleton />;
  if (pitch.isError) return <ErrorState error={pitch.error} onRetry={() => pitch.refetch()} />;
  if (!pitch.data) return <EmptyState title="Pitch not found" description="It may be private or deleted." action={<Link to="/pitches" className="text-accent">Back to pitches</Link>} />;

  const p = pitch.data;
  const isOwner = p.user_id === user!.id;
  const editable = isOwner && p.status === 'draft';

  return (
    <div className="animate-fade-in">
      <Link to="/pitches" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Stock Pitch Arena
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{p.ticker ? `${p.ticker} — ${p.company}` : 'New stock pitch'}</h1>
        <Badge tone={p.format === 'professional' ? 'violet' : 'neutral'}>{p.format} pitch</Badge>
        <Badge tone={p.status === 'draft' ? 'accent' : 'up'}>{p.status}</Badge>
      </div>
      {p.challenge_id && <ChallengeContextBanner challengeId={p.challenge_id} work={{ pitchId: p.id }} />}
      {editable ? <PitchEditor key={p.id} pitch={p} /> : <PitchReadOnly pitch={p} isOwner={isOwner} />}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Circle, Copy, Eye, EyeOff, FileText, PenLine, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { invalidateProgress, useReference } from '@/app/queries';
import { duplicateResearch, getResearch, submitResearch, updateResearch, updateSection, type ResearchMeta } from '@/services/api/work';
import type { Rating, ResearchProject, ResearchSection } from '@/types/domain';
import { usePatchAutosave } from '@/hooks/usePatchAutosave';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Segmented } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { Delta, Markdown, RatingBadge, ScoreRing } from '@/components/common';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { SaveIndicator } from '@/features/challenges/TaskWorkspace';
import { SourcesEditor } from '@/features/shared/SourcesEditor';
import { ChallengeContextBanner, SecurityPicker } from '@/features/shared/WorkHelpers';
import { upsidePct } from '@/lib/finance/valuation';
import { currencySymbol, fmtDateTime, fmtMoney } from '@/lib/format';
import { cn, itemCount, wordCount } from '@/lib/utils';
import { RESEARCH_SECTIONS } from './sections';

function sectionDone(key: string, content: string) {
  const def = RESEARCH_SECTIONS.find((s) => s.key === key)!;
  return def.list ? itemCount(content) >= def.target : wordCount(content) >= def.target;
}

function asListMarkdown(text: string) {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `- ${l.replace(/^[\s\-*•]+/, '')}`)
    .join('\n');
}

export default function ResearchEditorPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['researchProject', id], queryFn: () => getResearch(id) });

  if (q.isPending) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <EmptyState title="Report not found" description="It may be private or deleted." action={<Link to="/research" className="text-accent">Back to Research Studio</Link>} />;

  return <Editor key={q.data.project.id + q.data.project.status} project={q.data.project} sections={q.data.sections} isOwner={q.data.project.user_id === user!.id} />;
}

function Editor({ project, sections, isOwner }: { project: ResearchProject; sections: ResearchSection[]; isOwner: boolean }) {
  const qc = useQueryClient();
  const ref = useReference();
  const navigate = useNavigate();
  const editable = isOwner && project.status === 'draft';
  const [meta, setMeta] = useState<ResearchProject>(project);
  const [content, setContent] = useState<Record<string, string>>(() => Object.fromEntries(sections.map((s) => [s.section_key, s.content])));
  const [preview, setPreview] = useState(!editable);
  const [confirm, setConfirm] = useState(false);
  const sectionIds = Object.fromEntries(sections.map((s) => [s.section_key, s.id]));

  const metaSave = usePatchAutosave<ResearchMeta>((patch) => updateResearch(project.id, patch));
  const sectionSave = usePatchAutosave<Record<string, string>>(async (patch) => {
    await Promise.all(Object.entries(patch).map(([sid, c]) => updateSection(sid, c ?? '')));
  });
  const saveState = metaSave.state === 'error' || sectionSave.state === 'error' ? 'error' : metaSave.state === 'saving' || sectionSave.state === 'saving' ? 'saving' : sectionSave.savedAt || metaSave.savedAt ? 'saved' : 'idle';
  const savedAt = [metaSave.savedAt, sectionSave.savedAt].filter(Boolean).sort().pop() ?? null;

  const setM = <K extends keyof ResearchMeta>(k: K, v: ResearchMeta[K]) => {
    setMeta((m) => ({ ...m, [k]: v }));
    metaSave.queue({ [k]: v } as ResearchMeta);
  };
  const setSection = (key: string, v: string) => {
    setContent((c) => ({ ...c, [key]: v }));
    sectionSave.queue({ [sectionIds[key]]: v });
  };

  const submit = useMutation({
    mutationFn: async () => {
      await Promise.all([metaSave.flush(), sectionSave.flush()]);
      return submitResearch(project.id);
    },
    onSuccess: (res) => {
      setConfirm(false);
      invalidateProgress(qc);
      qc.invalidateQueries({ queryKey: ['researchProject', project.id] });
      qc.invalidateQueries({ queryKey: ['research'] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      toast.success(`Report scored ${res.score} / 100`);
      const names = new Map(ref.data?.achievements.map((a) => [a.id, a.name]));
      for (const a of res.new_achievements ?? []) toast.success(`Achievement unlocked: ${names.get(a) ?? a}`);
    },
  });
  const dup = useMutation({
    mutationFn: () => duplicateResearch(project.id),
    onSuccess: (nid) => {
      qc.invalidateQueries({ queryKey: ['research'] });
      toast.success('Duplicated as a new draft');
      navigate(`/research/${nid}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const visibility = useMutation({
    mutationFn: (v: boolean) => updateResearch(project.id, { is_public: v }),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['researchProject', project.id] });
      qc.invalidateQueries({ queryKey: ['passport'] });
      toast.success(v ? 'Report is public on your Finance Passport' : 'Report is now private');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const done = RESEARCH_SECTIONS.filter((s) => sectionDone(s.key, content[s.key] ?? '')).length;
  const totalWords = Object.values(content).reduce((s, c) => s + wordCount(c), 0);
  const upside = meta.current_price && meta.target_price ? upsidePct(meta.target_price, meta.current_price) : null;
  const emptySections = RESEARCH_SECTIONS.filter((s) => !(content[s.key] ?? '').trim()).map((s) => s.title);
  const missing = [...(meta.company.trim() ? [] : ['company']), ...(meta.rating ? [] : ['rating']), ...emptySections];

  return (
    <div className="animate-fade-in">
      <Link to="/research" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Research Studio
      </Link>
      {project.challenge_id && <ChallengeContextBanner challengeId={project.challenge_id} work={{ projectId: project.id }} />}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1">
            <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-fg-subtle">
              Sections · {done}/{RESEARCH_SECTIONS.length}
            </div>
            {RESEARCH_SECTIONS.map((s, i) => (
              <a key={s.key} href={`#sec-${s.key}`} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">
                {sectionDone(s.key, content[s.key] ?? '') ? <CheckCircle2 className="h-3.5 w-3.5 text-up" /> : <Circle className="h-3.5 w-3.5 text-fg-subtle" />}
                <span className="font-mono text-[0.7rem] text-fg-subtle">{i + 1}</span> {s.title}
              </a>
            ))}
            <a href="#sec-sources" className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">
              <Circle className="h-3.5 w-3.5 text-fg-subtle" />
              <span className="font-mono text-[0.7rem] text-fg-subtle">11</span> Sources
            </a>
          </div>
        </aside>

        {/* Document */}
        <div className="min-w-0">
          <div className="rounded-xl border border-border bg-surface">
            {/* Cover */}
            <div className="border-b border-border p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="accent">Equity Research</Badge>
                <Badge tone={project.status === 'draft' ? 'neutral' : 'up'}>{project.status === 'draft' ? 'Draft' : 'Completed'}</Badge>
                {editable && (
                  <div className="ml-auto">
                    <Segmented
                      value={preview ? 'preview' : 'edit'}
                      onChange={(v) => setPreview(v === 'preview')}
                      options={[
                        { value: 'edit', label: <span className="inline-flex items-center gap-1"><PenLine className="h-3 w-3" />Write</span> },
                        { value: 'preview', label: <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />Preview</span> },
                      ]}
                    />
                  </div>
                )}
              </div>
              {editable && !preview ? (
                <>
                  <input
                    value={meta.title}
                    onChange={(e) => setM('title', e.target.value)}
                    placeholder="Report title"
                    maxLength={200}
                    className="w-full bg-transparent text-2xl font-semibold tracking-tight placeholder:text-fg-subtle focus:outline-none"
                    aria-label="Report title"
                  />
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <SecurityPicker
                        onPick={(s) => {
                          const patch = { company: s.name, ticker: s.symbol, exchange: s.exchange, currency: s.currency, current_price: s.price };
                          setMeta((m) => ({ ...m, ...patch }));
                          metaSave.queue(patch);
                        }}
                      />
                    </div>
                    <Input value={meta.company} onChange={(e) => setM('company', e.target.value)} placeholder="Company" aria-label="Company" maxLength={160} />
                    <Input value={meta.ticker} onChange={(e) => setM('ticker', e.target.value.toUpperCase())} placeholder="Ticker" aria-label="Ticker" className="font-mono" maxLength={20} />
                    <Segmented<Rating>
                      value={(meta.rating ?? '') as Rating}
                      onChange={(v) => setM('rating', v)}
                      options={[
                        { value: 'BUY', label: 'BUY' },
                        { value: 'HOLD', label: 'HOLD' },
                        { value: 'SELL', label: 'SELL' },
                      ]}
                    />
                    <Input type="number" min={0} step="0.01" value={meta.current_price ?? ''} onChange={(e) => setM('current_price', e.target.value ? Number(e.target.value) : null)} placeholder={`Current price (${currencySymbol(meta.currency)})`} aria-label="Current price" className="font-mono" />
                    <Input type="number" min={0} step="0.01" value={meta.target_price ?? ''} onChange={(e) => setM('target_price', e.target.value ? Number(e.target.value) : null)} placeholder={`Target price (${currencySymbol(meta.currency)})`} aria-label="Target price" className="font-mono" />
                    <Select value={meta.currency} onChange={(e) => setM('currency', e.target.value)} aria-label="Currency">
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <span className="text-fg-muted">
                      {meta.company || '—'} {meta.ticker && <span className="font-mono text-fg">({meta.ticker})</span>}
                    </span>
                    <RatingBadge rating={meta.rating} />
                    <span className="font-mono tabular">
                      {fmtMoney(meta.current_price, meta.currency)} → {fmtMoney(meta.target_price, meta.currency)}
                    </span>
                    <Delta value={upside} />
                  </div>
                </>
              )}
            </div>

            {/* Sections */}
            <div className="divide-y divide-border">
              {RESEARCH_SECTIONS.map((s, i) => {
                const value = content[s.key] ?? '';
                const progress = s.list ? itemCount(value) : wordCount(value);
                return (
                  <section key={s.key} id={`sec-${s.key}`} className="scroll-mt-20 px-6 py-5 sm:px-8">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <h2 className="text-lg font-semibold">
                        <span className="mr-2 font-mono text-sm text-fg-subtle">{i + 1}.</span>
                        {s.title}
                      </h2>
                      {editable && !preview && (
                        <span className={cn('font-mono text-xs', progress >= s.target ? 'text-up' : 'text-fg-subtle')}>
                          {progress}/{s.target} {s.list ? 'items' : 'words'}
                        </span>
                      )}
                    </div>
                    {editable && !preview ? (
                      <Textarea
                        autoGrow
                        value={value}
                        onChange={(e) => setSection(s.key, e.target.value)}
                        placeholder={s.prompt}
                        rows={s.list ? 3 : 4}
                        className="border-transparent bg-transparent px-0 text-[0.95rem] focus:border-transparent focus:ring-0"
                        aria-label={s.title}
                      />
                    ) : value.trim() ? (
                      <Markdown>{s.list ? asListMarkdown(value) : value}</Markdown>
                    ) : (
                      <p className="text-sm italic text-fg-subtle">Not written yet.</p>
                    )}
                  </section>
                );
              })}
              <section id="sec-sources" className="scroll-mt-20 px-6 py-5 sm:px-8">
                <h2 className="mb-3 text-lg font-semibold">
                  <span className="mr-2 font-mono text-sm text-fg-subtle">11.</span>Sources
                </h2>
                <SourcesEditor parent={{ projectId: project.id }} readOnly={!editable} target={5} />
              </section>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
          <div className="sticky top-20 space-y-4">
            {editable ? (
              <Card>
                <CardContent className="space-y-3 pt-4">
                  <SaveIndicator state={saveState} savedAt={savedAt} />
                  {(metaSave.error || sectionSave.error) && <InlineError message={metaSave.error || sectionSave.error} />}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-md border border-border bg-surface-2 p-2">
                      <div className="font-mono text-lg tabular">{done}/10</div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Sections</div>
                    </div>
                    <div className="rounded-md border border-border bg-surface-2 p-2">
                      <div className="font-mono text-lg tabular">{totalWords.toLocaleString()}</div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-fg-subtle">Words</div>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full justify-center" onClick={() => setConfirm(true)}>
                    <Send className="h-4 w-4" /> Submit report
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => dup.mutate()} loading={dup.isPending}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {project.score !== null && (
                  <Card>
                    <CardHeader title="Rubric score" subtitle={`Submitted ${fmtDateTime(project.submitted_at)}`} />
                    <CardContent>
                      <div className="mb-4 flex justify-center">
                        <ScoreRing value={project.score} sub="/ 100" />
                      </div>
                      {project.criteria_scores && <ScoreBreakdown criteria={project.criteria_scores} showWeights />}
                      <p className="mt-3 text-xs text-fg-subtle">Automated deterministic rubric (beta). Measures completeness, quantification and structure.</p>
                    </CardContent>
                  </Card>
                )}
                {isOwner && (
                  <Card className="space-y-3 p-4">
                    <div className="text-sm font-medium">{project.is_public ? 'Public on Passport' : 'Private'}</div>
                    <Button size="sm" className="w-full justify-center" variant={project.is_public ? 'outline' : 'primary'} onClick={() => visibility.mutate(!project.is_public)} loading={visibility.isPending}>
                      {project.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {project.is_public ? 'Make private' : 'Publish to Passport'}
                    </Button>
                    <Button size="sm" variant="ghost" className="w-full justify-center" onClick={() => dup.mutate()} loading={dup.isPending}>
                      <Copy className="h-4 w-4" /> Duplicate as new draft
                    </Button>
                  </Card>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={confirm}
        onClose={() => !submit.isPending && setConfirm(false)}
        title="Submit this report?"
        description="Submitted reports are locked, scored, and added to your track record."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={submit.isPending}>
              Keep writing
            </Button>
            <Button variant="primary" onClick={() => submit.mutate()} loading={submit.isPending} disabled={missing.length > 0}>
              Submit
            </Button>
          </>
        }
      >
        {missing.length ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">Complete these first: {missing.join(', ')}. At least one source is also required.</div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-up">
            <CheckCircle2 className="h-4 w-4" /> Every section has content. Make sure you've cited at least one source.
          </p>
        )}
        <div className="mt-3">
          <InlineError message={submit.error ? (submit.error as Error).message : null} />
        </div>
      </Modal>
    </div>
  );
}

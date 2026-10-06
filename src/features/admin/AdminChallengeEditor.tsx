import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import { adminDeleteChallenge, adminGetAnswerKey, adminSaveChallenge, type ChallengeInput } from '@/services/api/admin';
import { getChallenge } from '@/services/api/challenges';
import type { ChallengeTask, Difficulty } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

interface TaskDraft {
  id: string;
  type: ChallengeTask['type'];
  label: string;
  prompt: string;
  points: string;
  unit: string;
  min_words: string;
  options: string; // "a|Label" per line
  answer: string;
  tolerance_pct: string;
  keywords: string; // comma-separated, synonyms with |
  keywords_required: string;
}

const emptyTask = (n: number): TaskDraft => ({
  id: `t${n}`, type: 'numeric', label: '', prompt: '', points: '10', unit: '', min_words: '40', options: '', answer: '', tolerance_pct: '1', keywords: '', keywords_required: '',
});

const blank = {
  slug: '', title: '', summary: '', description: '', instructions: '', category_id: 'accounting', kind: 'tasks' as ChallengeInput['kind'],
  pitch_format: null as ChallengeInput['pitch_format'], difficulty: 'beginner' as Difficulty, estimated_minutes: '20', time_limit_minutes: '', duration_days: '',
  points: '100', passing_score: '60', scoring_method: 'auto' as ChallengeInput['scoring_method'], criteria: '', tags: '', max_attempts: '', is_published: false,
  company: '', ticker: '', exchange: '', currency: 'PHP', current_price: '',
};

export default function AdminChallengeEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ref = useReference();
  const existing = useQuery({ queryKey: ['admin', 'challenge', id], queryFn: () => getChallenge(id!), enabled: !isNew });
  const key = useQuery({ queryKey: ['admin', 'answerKey', id], queryFn: () => adminGetAnswerKey(id!), enabled: !isNew });
  const [f, setF] = useState(blank);
  const [impact, setImpact] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<TaskDraft[]>([emptyTask(1)]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const c = existing.data;
    if (!c || !key.data) return;
    setF({
      slug: c.slug, title: c.title, summary: c.summary, description: c.description, instructions: c.instructions, category_id: c.category_id,
      kind: c.kind, pitch_format: c.pitch_format, difficulty: c.difficulty, estimated_minutes: String(c.estimated_minutes),
      time_limit_minutes: c.time_limit_minutes ? String(c.time_limit_minutes) : '', duration_days: c.duration_days ? String(c.duration_days) : '',
      points: String(c.points), passing_score: String(c.passing_score), scoring_method: c.scoring_method,
      criteria: (c.scoring_criteria ?? []).map((x) => `${x.label}|${x.weight ?? ''}`).join('\n'), tags: c.tags.join(', '),
      max_attempts: c.max_attempts ? String(c.max_attempts) : '', is_published: c.is_published,
      company: c.content.company ?? '', ticker: c.content.ticker ?? '', exchange: c.content.exchange ?? '', currency: c.content.currency ?? 'PHP', current_price: c.content.current_price ?? '',
    });
    setImpact(Object.fromEntries(Object.entries(c.skill_impact ?? {}).map(([k, v]) => [k, String(v)])));
    const answers = key.data as Record<string, { answer?: unknown; tolerance_pct?: number; keywords?: string[]; keywords_required?: number }>;
    setTasks(
      (c.content.tasks ?? []).map((t) => ({
        id: t.id, type: t.type, label: t.label ?? '', prompt: t.prompt, points: String(t.points ?? 10), unit: t.unit ?? '', min_words: String(t.min_words ?? 40),
        options: (t.options ?? []).map((o) => `${o.id}|${o.label}`).join('\n'),
        answer: answers[t.id]?.answer !== undefined ? String(answers[t.id].answer) : '',
        tolerance_pct: String(answers[t.id]?.tolerance_pct ?? 1),
        keywords: (answers[t.id]?.keywords ?? []).join(', '),
        keywords_required: answers[t.id]?.keywords_required ? String(answers[t.id].keywords_required) : '',
      })),
    );
  }, [existing.data, key.data]);

  const setT = (i: number, patch: Partial<TaskDraft>) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const optNum = (s: string) => (s.trim() === '' ? null : Number(s));

  const save = useMutation({
    mutationFn: async () => {
      if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) throw new Error('Slug: 3–80 chars, lowercase letters, numbers and hyphens.');
      if (f.title.trim().length < 3) throw new Error('Title is required.');
      const ids = new Set<string>();
      const taskJson: ChallengeTask[] = [];
      const answerKey: Record<string, unknown> = {};
      if (f.kind === 'tasks') {
        if (!tasks.length) throw new Error('Add at least one task.');
        for (const t of tasks) {
          if (!/^[a-z0-9_]{1,40}$/.test(t.id) || ids.has(t.id)) throw new Error(`Task id "${t.id}" must be unique (a-z, 0-9, _).`);
          ids.add(t.id);
          if (!t.prompt.trim()) throw new Error(`Task ${t.id} needs a prompt.`);
          const task: ChallengeTask = { id: t.id, type: t.type, label: t.label || undefined, prompt: t.prompt, points: Number(t.points) || 10 };
          if (t.type === 'mcq') {
            task.options = t.options.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
              const [oid, ...rest] = l.split('|');
              return { id: oid.trim(), label: rest.join('|').trim() || oid.trim() };
            });
            if ((task.options?.length ?? 0) < 2) throw new Error(`Task ${t.id}: add at least two options.`);
            if (!task.options!.some((o) => o.id === t.answer.trim())) throw new Error(`Task ${t.id}: correct answer must match an option id.`);
            answerKey[t.id] = { answer: t.answer.trim() };
          } else if (t.type === 'numeric') {
            task.unit = t.unit || undefined;
            if (!Number.isFinite(Number(t.answer)) || t.answer.trim() === '') throw new Error(`Task ${t.id}: numeric answer required.`);
            answerKey[t.id] = { answer: Number(t.answer), tolerance_pct: Number(t.tolerance_pct) || 1 };
          } else {
            task.min_words = Number(t.min_words) || 40;
            const kws = t.keywords.split(',').map((k) => k.trim()).filter(Boolean);
            answerKey[t.id] = kws.length ? { keywords: kws, ...(t.keywords_required ? { keywords_required: Number(t.keywords_required) } : {}) } : {};
          }
          taskJson.push(task);
        }
      }
      const skill_impact = Object.fromEntries(
        Object.entries(impact).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Math.min(1, Number(v))]),
      );
      if (!Object.keys(skill_impact).length) throw new Error('Set at least one skill impact (0–1) so results update skills.');
      const content: Record<string, unknown> = { tasks: taskJson };
      if (f.kind !== 'tasks') {
        for (const k of ['company', 'ticker', 'exchange', 'currency', 'current_price'] as const) if (f[k]) content[k] = f[k];
      }
      const input: ChallengeInput = {
        slug: f.slug, title: f.title.trim(), summary: f.summary, description: f.description, instructions: f.instructions,
        category_id: f.category_id, kind: f.kind, pitch_format: f.kind === 'stock_pitch' ? f.pitch_format ?? 'quick' : null,
        difficulty: f.difficulty, estimated_minutes: Number(f.estimated_minutes) || 20, time_limit_minutes: optNum(f.time_limit_minutes),
        duration_days: optNum(f.duration_days), points: Number(f.points) || 0, passing_score: Number(f.passing_score) || 60,
        scoring_method: f.scoring_method,
        scoring_criteria: f.criteria.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
          const [label, w] = l.split('|');
          return { label: label.trim(), ...(w && Number.isFinite(Number(w)) ? { weight: Number(w) } : {}) };
        }),
        skill_impact, content: content as ChallengeInput['content'], tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
        max_attempts: optNum(f.max_attempts), is_published: f.is_published,
      };
      return adminSaveChallenge(input, answerKey, id);
    },
    onSuccess: (savedId) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['challenges'] });
      qc.invalidateQueries({ queryKey: ['challenge'] });
      toast.success('Challenge saved');
      if (isNew) navigate(`/admin/challenges/${savedId}`, { replace: true });
    },
  });
  const remove = useMutation({
    mutationFn: () => adminDeleteChallenge(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['challenges'] });
      toast('Challenge deleted');
      navigate('/admin/challenges');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!isNew && (existing.isPending || key.isPending)) return <PageSkeleton />;
  if (existing.isError) return <ErrorState error={existing.error} />;

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/admin/challenges" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Challenges
        </Link>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => save.mutate()} loading={save.isPending}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>
      <InlineError message={save.error ? (save.error as Error).message : null} />

      <Card>
        <CardHeader title={isNew ? 'New challenge' : 'Edit challenge'} />
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="Title" required className="md:col-span-2">
            <Input value={f.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Slug" required>
            <Input value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="font-mono" />
          </Field>
          <Field label="Category">
            <Select value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {ref.data?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Summary" className="md:col-span-4">
            <Input value={f.summary} onChange={(e) => set('summary', e.target.value)} />
          </Field>
          <Field label="Brief / case (markdown)" className="md:col-span-2">
            <Textarea rows={8} value={f.description} onChange={(e) => set('description', e.target.value)} className="font-mono text-xs" />
          </Field>
          <Field label="Instructions (markdown)" className="md:col-span-2">
            <Textarea rows={8} value={f.instructions} onChange={(e) => set('instructions', e.target.value)} className="font-mono text-xs" />
          </Field>
          <Field label="Kind">
            <Select value={f.kind} onChange={(e) => set('kind', e.target.value as ChallengeInput['kind'])}>
              <option value="tasks">Tasks (MCQ / numeric / written)</option>
              <option value="stock_pitch">Stock pitch</option>
              <option value="research_report">Research report</option>
            </Select>
          </Field>
          {f.kind === 'stock_pitch' && (
            <Field label="Pitch format">
              <Select value={f.pitch_format ?? 'quick'} onChange={(e) => set('pitch_format', e.target.value as ChallengeInput['pitch_format'])}>
                <option value="quick">Quick</option>
                <option value="professional">Professional</option>
              </Select>
            </Field>
          )}
          <Field label="Difficulty">
            <Select value={f.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
              {['beginner', 'intermediate', 'advanced', 'expert'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Scoring method" hint="manual = reviewer scores; hybrid = auto now, reviewer may override">
            <Select value={f.scoring_method} onChange={(e) => set('scoring_method', e.target.value as ChallengeInput['scoring_method'])}>
              <option value="auto">Auto</option>
              <option value="hybrid">Hybrid</option>
              <option value="manual">Manual review</option>
            </Select>
          </Field>
          <Field label="Est. minutes">
            <Input value={f.estimated_minutes} onChange={(e) => set('estimated_minutes', e.target.value)} />
          </Field>
          <Field label="Time limit (min)" hint="Enforced. Blank = untimed">
            <Input value={f.time_limit_minutes} onChange={(e) => set('time_limit_minutes', e.target.value)} />
          </Field>
          <Field label="Duration (days)" hint="Multi-day window">
            <Input value={f.duration_days} onChange={(e) => set('duration_days', e.target.value)} />
          </Field>
          <Field label="Points">
            <Input value={f.points} onChange={(e) => set('points', e.target.value)} />
          </Field>
          <Field label="Passing score">
            <Input value={f.passing_score} onChange={(e) => set('passing_score', e.target.value)} />
          </Field>
          <Field label="Max attempts" hint="Blank = unlimited">
            <Input value={f.max_attempts} onChange={(e) => set('max_attempts', e.target.value)} />
          </Field>
          <Field label="Tags" hint="Used by promotion requirements, e.g. financial_modeling" className="md:col-span-2">
            <Input value={f.tags} onChange={(e) => set('tags', e.target.value)} className="font-mono" />
          </Field>
          <Field label="Displayed scoring criteria" hint="One per line: Label|weight" className="md:col-span-2">
            <Textarea rows={3} value={f.criteria} onChange={(e) => set('criteria', e.target.value)} className="font-mono text-xs" />
          </Field>
          <div className="md:col-span-4">
            <div className="mb-1.5 text-xs font-medium text-fg-muted">Skill impact (0–1 evidence weight per skill)</div>
            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {ref.data?.skills.map((s) => (
                <label key={s.id} className="text-xs text-fg-subtle">
                  {s.name}
                  <Input value={impact[s.id] ?? ''} onChange={(e) => setImpact({ ...impact, [s.id]: e.target.value })} placeholder="0" className="mt-1 font-mono" />
                </label>
              ))}
            </div>
          </div>
          {f.kind !== 'tasks' && (
            <div className="grid gap-3 md:col-span-4 md:grid-cols-5">
              <Field label="Prefill company">
                <Input value={f.company} onChange={(e) => set('company', e.target.value)} />
              </Field>
              <Field label="Ticker">
                <Input value={f.ticker} onChange={(e) => set('ticker', e.target.value)} />
              </Field>
              <Field label="Exchange">
                <Input value={f.exchange} onChange={(e) => set('exchange', e.target.value)} />
              </Field>
              <Field label="Currency">
                <Input value={f.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} />
              </Field>
              <Field label="Current price">
                <Input value={f.current_price} onChange={(e) => set('current_price', e.target.value)} />
              </Field>
            </div>
          )}
          <div className="md:col-span-4">
            <Checkbox checked={f.is_published} onChange={(v) => set('is_published', v)} label="Published" description="Visible to all users." />
          </div>
        </CardContent>
      </Card>

      {f.kind === 'tasks' && (
        <Card>
          <CardHeader
            title={`Tasks & answer key (${tasks.length})`}
            subtitle="Answer keys are stored in an admin-only table and never sent to users."
            action={
              <Button size="xs" variant="outline" onClick={() => setTasks((t) => [...t, emptyTask(t.length + 1)])}>
                <Plus className="h-3 w-3" /> Add task
              </Button>
            }
          />
          <CardContent className="space-y-4">
            {tasks.map((t, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="grid gap-3 md:grid-cols-6">
                  <Field label="Id">
                    <Input value={t.id} onChange={(e) => setT(i, { id: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Type">
                    <Select value={t.type} onChange={(e) => setT(i, { type: e.target.value as TaskDraft['type'] })}>
                      <option value="numeric">Numeric</option>
                      <option value="mcq">Multiple choice</option>
                      <option value="long_text">Written</option>
                    </Select>
                  </Field>
                  <Field label="Label" className="md:col-span-2">
                    <Input value={t.label} onChange={(e) => setT(i, { label: e.target.value })} />
                  </Field>
                  <Field label="Points">
                    <Input value={t.points} onChange={(e) => setT(i, { points: e.target.value })} />
                  </Field>
                  <div className="flex items-end justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setTasks((ts) => ts.filter((_, j) => j !== i))} aria-label="Remove task">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Field label="Prompt" className="md:col-span-6">
                    <Textarea rows={2} value={t.prompt} onChange={(e) => setT(i, { prompt: e.target.value })} />
                  </Field>
                  {t.type === 'mcq' && (
                    <>
                      <Field label="Options (id|label per line)" className="md:col-span-4">
                        <Textarea rows={4} value={t.options} onChange={(e) => setT(i, { options: e.target.value })} className="font-mono text-xs" />
                      </Field>
                      <Field label="Correct option id" className="md:col-span-2">
                        <Input value={t.answer} onChange={(e) => setT(i, { answer: e.target.value })} className="font-mono" />
                      </Field>
                    </>
                  )}
                  {t.type === 'numeric' && (
                    <>
                      <Field label="Correct answer" className="md:col-span-2">
                        <Input value={t.answer} onChange={(e) => setT(i, { answer: e.target.value })} className="font-mono" />
                      </Field>
                      <Field label="Tolerance %" hint="Within → full credit; within 3× → half">
                        <Input value={t.tolerance_pct} onChange={(e) => setT(i, { tolerance_pct: e.target.value })} />
                      </Field>
                      <Field label="Unit">
                        <Input value={t.unit} onChange={(e) => setT(i, { unit: e.target.value })} />
                      </Field>
                    </>
                  )}
                  {t.type !== 'mcq' && t.type !== 'numeric' && (
                    <>
                      <Field label="Min words">
                        <Input value={t.min_words} onChange={(e) => setT(i, { min_words: e.target.value })} />
                      </Field>
                      <Field label="Key concepts (comma-separated; synonyms with |)" className="md:col-span-4">
                        <Input value={t.keywords} onChange={(e) => setT(i, { keywords: e.target.value })} className="font-mono text-xs" placeholder="depreciation|non-cash, working capital|receivable" />
                      </Field>
                      <Field label="Required">
                        <Input value={t.keywords_required} onChange={(e) => setT(i, { keywords_required: e.target.value })} placeholder="all" />
                      </Field>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        size="sm"
        title="Delete challenge?"
        description="This permanently deletes the challenge and ALL attempts, submissions and scores for it. Consider unpublishing instead."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete permanently
            </Button>
          </>
        }
      />
    </div>
  );
}

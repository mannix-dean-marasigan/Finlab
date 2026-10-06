import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import { adminGetLessonKey, adminListLessons, adminSaveLesson, type AdminLesson, type LessonInput } from '@/services/api/admin';
import type { ChallengeTask, Difficulty } from '@/types/domain';
import { DifficultyBadge } from '@/components/common';
import { YouTubeEmbed, youTubeId } from '@/components/YouTubeEmbed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { ErrorState, InlineError, LoadingState, PageSkeleton } from '@/components/ui/states';

interface QDraft {
  id: string;
  type: 'mcq' | 'numeric';
  label: string;
  prompt: string;
  options: string; // id|label per line
  answer: string;
  tolerance_pct: string;
  unit: string;
}
const blankQ = (n: number): QDraft => ({ id: `q${n}`, type: 'mcq', label: '', prompt: '', options: 'a|\nb|\nc|\nd|', answer: '', tolerance_pct: '1', unit: '' });

function Editor({ lesson, onClose }: { lesson: AdminLesson | null; onClose: () => void }) {
  const qc = useQueryClient();
  const ref = useReference();
  const key = useQuery({ queryKey: ['admin', 'lessonKey', lesson?.id], queryFn: () => adminGetLessonKey(lesson!.id), enabled: !!lesson });
  const [f, setF] = useState({
    slug: lesson?.slug ?? '',
    title: lesson?.title ?? '',
    summary: lesson?.summary ?? '',
    category_id: lesson?.category_id ?? 'accounting',
    difficulty: (lesson?.difficulty ?? 'beginner') as Difficulty,
    estimated_minutes: String(lesson?.estimated_minutes ?? 10),
    body: lesson?.body ?? '',
    videos: (lesson?.video_urls ?? []).join('\n'),
    related: (lesson?.related_challenge_slugs ?? []).join(', '),
    sort_order: String(lesson?.sort_order ?? 0),
    is_published: lesson?.is_published ?? false,
  });
  const [qs, setQs] = useState<QDraft[]>(lesson ? [] : [blankQ(1)]);

  useEffect(() => {
    if (!lesson || !key.data) return;
    const answers = key.data as Record<string, { answer?: unknown; tolerance_pct?: number }>;
    setQs(
      (lesson.check_questions ?? []).map((q) => ({
        id: q.id,
        type: q.type === 'numeric' ? 'numeric' : 'mcq',
        label: q.label ?? '',
        prompt: q.prompt,
        options: (q.options ?? []).map((o) => `${o.id}|${o.label}`).join('\n'),
        answer: answers[q.id]?.answer !== undefined ? String(answers[q.id].answer) : '',
        tolerance_pct: String(answers[q.id]?.tolerance_pct ?? 1),
        unit: q.unit ?? '',
      })),
    );
  }, [lesson, key.data]);

  const setQ = (i: number, patch: Partial<QDraft>) => setQs((all) => all.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) throw new Error('Slug: 3–80 chars, lowercase letters, numbers and hyphens.');
      if (!f.title.trim()) throw new Error('Title is required.');
      const videoUrls = f.videos.split('\n').map((v) => v.trim()).filter(Boolean);
      const bad = videoUrls.find((v) => !youTubeId(v));
      if (bad) throw new Error(`Not a YouTube video link: ${bad}`);
      if (videoUrls.length > 6) throw new Error('At most 6 videos per lesson.');
      if (f.is_published && !qs.length) throw new Error('Published lessons need at least one knowledge-check question — otherwise they can never be completed.');
      const questions: ChallengeTask[] = [];
      const answers: Record<string, unknown> = {};
      const ids = new Set<string>();
      for (const q of qs) {
        if (!/^[a-z0-9_]{1,30}$/.test(q.id) || ids.has(q.id)) throw new Error(`Question id "${q.id}" must be unique (a-z, 0-9, _).`);
        ids.add(q.id);
        if (!q.prompt.trim()) throw new Error(`Question ${q.id} needs a prompt.`);
        const base: ChallengeTask = { id: q.id, type: q.type, label: q.label || undefined, prompt: q.prompt.trim(), points: 25 };
        if (q.type === 'mcq') {
          base.options = q.options.split('\n').map((l) => l.trim()).filter((l) => l && l.includes('|') && l.split('|')[1].trim()).map((l) => {
            const [oid, ...rest] = l.split('|');
            return { id: oid.trim(), label: rest.join('|').trim() };
          });
          if ((base.options?.length ?? 0) < 2) throw new Error(`Question ${q.id}: at least two options (format id|label).`);
          if (!base.options!.some((o) => o.id === q.answer.trim())) throw new Error(`Question ${q.id}: the correct answer must be one of the option ids.`);
          answers[q.id] = { answer: q.answer.trim() };
        } else {
          if (q.answer.trim() === '' || !Number.isFinite(Number(q.answer))) throw new Error(`Question ${q.id}: numeric answer required.`);
          base.unit = q.unit || undefined;
          answers[q.id] = { answer: Number(q.answer), tolerance_pct: Number(q.tolerance_pct) || 1 };
        }
        questions.push(base);
      }
      const input: LessonInput = {
        slug: f.slug, title: f.title.trim(), summary: f.summary, category_id: f.category_id, difficulty: f.difficulty,
        estimated_minutes: Number(f.estimated_minutes) || 10, body: f.body,
        related_challenge_slugs: f.related.split(',').map((s) => s.trim()).filter(Boolean),
        sort_order: Number(f.sort_order) || 0, is_published: f.is_published, check_questions: questions,
        video_urls: videoUrls,
      };
      return adminSaveLesson(input, answers, lesson?.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'lessons'] });
      qc.invalidateQueries({ queryKey: ['lessons'] });
      qc.invalidateQueries({ queryKey: ['lesson'] });
      toast.success('Lesson saved');
      onClose();
    },
  });

  if (lesson && key.isPending) return <Modal open onClose={onClose} title="Loading…"><LoadingState /></Modal>;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={lesson ? `Edit: ${lesson.title}` : 'New lesson'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save lesson
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Title" required className="md:col-span-2">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Slug" required>
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="font-mono" disabled={!!lesson} />
        </Field>
        <Field label="Category">
          <Select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            {ref.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Summary" className="md:col-span-4">
          <Input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
        </Field>
        <Field label="YouTube videos (optional, one per line)" hint="youtube.com/watch?v=… or youtu.be/… links. They play inside the lesson, in this order." className="md:col-span-2">
          <Textarea rows={3} value={f.videos} onChange={(e) => setF({ ...f, videos: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className="font-mono text-xs" />
        </Field>
        <Field label="Difficulty">
          <Select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value as Difficulty })}>
            {['beginner', 'intermediate', 'advanced', 'expert'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Minutes">
          <Input value={f.estimated_minutes} onChange={(e) => setF({ ...f, estimated_minutes: e.target.value })} />
        </Field>
        {f.videos
          .split('\n')
          .map((v) => v.trim())
          .filter((v) => youTubeId(v))
          .map((v) => (
            <div key={v} className="md:col-span-2">
              <YouTubeEmbed url={v} title="Preview" />
            </div>
          ))}
        <Field label="Body (markdown)" className="md:col-span-4">
          <Textarea rows={10} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="font-mono text-xs" />
        </Field>
        <Field label="Related challenge slugs" hint="Comma-separated" className="md:col-span-2">
          <Input value={f.related} onChange={(e) => setF({ ...f, related: e.target.value })} className="font-mono text-xs" />
        </Field>
        <Field label="Sort order">
          <Input value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Checkbox checked={f.is_published} onChange={(v) => setF({ ...f, is_published: v })} label="Published" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Knowledge check ({qs.length} questions)</div>
            <div className="text-xs text-fg-muted">Answers are stored in an admin-only table. Users pass at the lesson pass mark (default 75%).</div>
          </div>
          <Button size="xs" variant="outline" onClick={() => setQs((all) => [...all, blankQ(all.length + 1)])}>
            <Plus className="h-3 w-3" /> Question
          </Button>
        </div>
        <div className="space-y-3">
          {qs.map((q, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-6">
              <Field label="Id">
                <Input value={q.id} onChange={(e) => setQ(i, { id: e.target.value })} className="font-mono" />
              </Field>
              <Field label="Type">
                <Select value={q.type} onChange={(e) => setQ(i, { type: e.target.value as QDraft['type'] })}>
                  <option value="mcq">Multiple choice</option>
                  <option value="numeric">Numeric</option>
                </Select>
              </Field>
              <Field label="Label" className="md:col-span-3">
                <Input value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} />
              </Field>
              <div className="flex items-end justify-end">
                <Button size="sm" variant="ghost" onClick={() => setQs((all) => all.filter((_, j) => j !== i))} aria-label="Remove question">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field label="Prompt" className="md:col-span-6">
                <Textarea rows={2} value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} />
              </Field>
              {q.type === 'mcq' ? (
                <>
                  <Field label="Options (id|label per line)" className="md:col-span-4">
                    <Textarea rows={4} value={q.options} onChange={(e) => setQ(i, { options: e.target.value })} className="font-mono text-xs" />
                  </Field>
                  <Field label="Correct option id" className="md:col-span-2">
                    <Input value={q.answer} onChange={(e) => setQ(i, { answer: e.target.value })} className="font-mono" />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Correct answer" className="md:col-span-2">
                    <Input value={q.answer} onChange={(e) => setQ(i, { answer: e.target.value })} className="font-mono" />
                  </Field>
                  <Field label="Tolerance %">
                    <Input value={q.tolerance_pct} onChange={(e) => setQ(i, { tolerance_pct: e.target.value })} />
                  </Field>
                  <Field label="Unit">
                    <Input value={q.unit} onChange={(e) => setQ(i, { unit: e.target.value })} />
                  </Field>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminLessonsPage() {
  const ref = useReference();
  const list = useQuery({ queryKey: ['admin', 'lessons'], queryFn: adminListLessons });
  const [editing, setEditing] = useState<AdminLesson | null | 'new'>(null);

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">{list.data.length} lessons · completion requires passing the knowledge check</span>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New lesson
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Lesson</Th>
            <Th>Category</Th>
            <Th align="center">Check</Th>
            <Th align="center">Video</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {list.data.map((l) => (
            <tr key={l.id}>
              <Td>
                <div className="font-medium">{l.title}</div>
                <div className="font-mono text-xs text-fg-subtle">{l.slug}</div>
              </Td>
              <Td className="text-fg-muted">
                {ref.data?.categories.find((c) => c.id === l.category_id)?.name} <DifficultyBadge difficulty={l.difficulty} />
              </Td>
              <Td align="center">{l.check_questions?.length ? <Badge tone="up">{l.check_questions.length} Q</Badge> : <Badge tone="down">none</Badge>}</Td>
              <Td align="center">{l.video_urls?.length ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Video className="h-4 w-4" /> {l.video_urls.length}
                  </span>
                ) : (
                  <span className="text-fg-subtle">—</span>
                )}</Td>
              <Td>{l.is_published ? <Badge tone="up">Published</Badge> : <Badge tone="warn">Draft</Badge>}</Td>
              <Td align="right">
                <Button size="xs" variant="ghost" onClick={() => setEditing(l)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {editing && <Editor lesson={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

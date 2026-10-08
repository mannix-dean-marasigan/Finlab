import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import {
  adminDeleteDailyQuestion, adminGetDailyKey, adminListDailyQuestions, adminSaveDailyQuestion, adminSetDailyActive, type AdminDailyQuestion, type DailyAnswerKey,
} from '@/services/api/admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

const IDS = ['a', 'b', 'c', 'd'];

function QuestionEditor({ q, onClose }: { q: AdminDailyQuestion | null; onClose: () => void }) {
  const qc = useQueryClient();
  const ref = useReference();
  const key = useQuery({ queryKey: ['admin', 'daily-key', q?.id], queryFn: () => adminGetDailyKey(q!.id), enabled: !!q });
  const [f, setF] = useState({
    slug: q?.slug ?? `d${Date.now().toString(36)}`,
    category_id: q?.category_id ?? '',
    type: (q?.type ?? 'numeric') as 'mcq' | 'numeric',
    prompt: q?.prompt ?? '',
    unit: q?.unit ?? '',
    explanation: q?.explanation ?? '',
    is_active: q?.is_active ?? true,
  });
  const [options, setOptions] = useState<string[]>(IDS.map((id) => q?.options?.find((o) => o.id === id)?.label ?? ''));
  const [correct, setCorrect] = useState<string | null>(null);
  const [numAnswer, setNumAnswer] = useState<string | null>(null);
  const [tol, setTol] = useState<string | null>(null);

  // Fill the answer fields once the key loads (admin-only table).
  const k: DailyAnswerKey | null | undefined = key.data;
  const shownCorrect = correct ?? (f.type === 'mcq' && k ? String(k.answer) : 'a');
  const shownNum = numAnswer ?? (f.type === 'numeric' && k ? String(k.answer) : '');
  const shownTol = tol ?? (k?.tolerance_pct !== undefined ? String(k.tolerance_pct) : '0.5');

  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9-]{2,60}$/.test(f.slug)) throw new Error('Slug: lowercase letters, numbers and hyphens.');
      if (f.prompt.trim().length < 10) throw new Error('Write the question.');
      if (f.explanation.trim().length < 10) throw new Error('Write an explanation — learners see it after answering.');
      let answer: DailyAnswerKey;
      let opts: { id: string; label: string }[] | null = null;
      if (f.type === 'mcq') {
        opts = IDS.map((id, i) => ({ id, label: options[i].trim() })).filter((o) => o.label);
        if (opts.length < 2) throw new Error('Give at least two options.');
        if (!opts.some((o) => o.id === shownCorrect)) throw new Error('The correct option must be one of the filled-in options.');
        answer = { answer: shownCorrect };
      } else {
        const n = Number(shownNum);
        if (shownNum.trim() === '' || !Number.isFinite(n)) throw new Error('Enter the numeric answer.');
        answer = { answer: n, tolerance_pct: Number(shownTol) || 0.5 };
      }
      return adminSaveDailyQuestion(
        { id: q?.id, slug: f.slug, category_id: f.category_id || null, type: f.type, prompt: f.prompt.trim(), options: opts, unit: f.unit.trim() || null, explanation: f.explanation.trim(), is_active: f.is_active },
        answer,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'daily'] });
      toast.success('Question saved');
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={q ? `Edit ${q.slug}` : 'New daily question'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save question
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Slug" className="sm:col-span-1">
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} className="font-mono" disabled={!!q} />
        </Field>
        <Field label="Category">
          <Select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">—</option>
            {ref.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as 'mcq' | 'numeric' })}>
            <option value="numeric">Numeric answer</option>
            <option value="mcq">Multiple choice</option>
          </Select>
        </Field>
        <Field label="Question" className="sm:col-span-3">
          <Textarea rows={3} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
        </Field>
        {f.type === 'mcq' ? (
          <div className="space-y-2 sm:col-span-3">
            <div className="text-sm font-medium">Options — pick the correct one</div>
            {IDS.map((id, i) => (
              <label key={id} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={shownCorrect === id} onChange={() => setCorrect(id)} className="h-4 w-4 accent-[#f5a524]" aria-label={`Option ${id} is correct`} />
                <span className="w-4 font-mono text-xs uppercase text-fg-subtle">{id}</span>
                <Input value={options[i]} onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i < 2 ? 'Required' : 'Optional'} />
              </label>
            ))}
          </div>
        ) : (
          <>
            <Field label="Correct answer">
              <Input value={shownNum} onChange={(e) => setNumAnswer(e.target.value)} inputMode="decimal" className="font-mono" />
            </Field>
            <Field label="Tolerance %" hint="How far off still counts">
              <Input value={shownTol} onChange={(e) => setTol(e.target.value)} inputMode="decimal" className="font-mono" />
            </Field>
            <Field label="Unit shown after the box">
              <Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="₱, %, x, days…" />
            </Field>
          </>
        )}
        <Field label="Explanation (shown after answering)" className="sm:col-span-3">
          <Textarea rows={3} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
        </Field>
        <div className="sm:col-span-3">
          <Checkbox checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label="Active (can be picked as the daily question)" />
        </div>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminDailyPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'daily'], queryFn: adminListDailyQuestions });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminDailyQuestion | 'new' | null>(null);
  const toggle = useMutation({
    mutationFn: (q: AdminDailyQuestion) => adminSetDailyActive(q.id, !q.is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'daily'] }),
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteDailyQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'daily'] });
      toast('Question deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;
  const s = search.trim().toLowerCase();
  const rows = list.data.filter((q) => !s || q.prompt.toLowerCase().includes(s) || q.slug.includes(s));
  const active = list.data.filter((q) => q.is_active).length;

  return (
    <Card>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-80 max-w-full">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-fg-subtle" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions" className="pl-9" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted">
            {active} active · {Math.floor(active)} days before a repeat
          </span>
          <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> New question
          </Button>
        </div>
      </div>
      {!rows.length ? (
        <EmptyState icon={<CalendarCheck className="h-5 w-5" />} title="No questions" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Slug</Th>
              <Th>Question</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="hover:bg-surface-2">
                <Td mono>{q.slug}</Td>
                <Td className="max-w-xl">
                  <div className="line-clamp-2">{q.prompt}</div>
                  <div className="text-xs text-fg-subtle">{q.category_id}</div>
                </Td>
                <Td>
                  <Badge>{q.type}</Badge>
                </Td>
                <Td>
                  <button type="button" onClick={() => toggle.mutate(q)} aria-label={q.is_active ? 'Deactivate' : 'Activate'}>
                    {q.is_active ? <Badge tone="up">Active</Badge> : <Badge tone="neutral">Off</Badge>}
                  </button>
                </Td>
                <Td align="right">
                  <Button size="xs" variant="ghost" onClick={() => setEditing(q)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="xs" variant="ghost" className="hover:text-down" onClick={() => window.confirm(`Delete ${q.slug}?`) && remove.mutate(q.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {editing && <QuestionEditor q={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

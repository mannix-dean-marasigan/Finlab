import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDeleteActivity, adminListActivities, adminSaveActivity, type AdminActivity } from '@/services/api/admin';
import type { ActivityKind } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { ErrorState, InlineError, LoadingState } from '@/components/ui/states';

const KIND_HELP: Record<ActivityKind, { content: string; key: string }> = {
  calculator: {
    content: '{"calculator":"ratios|multiples|wacc|dcf|portfolio|accretion|npv","defaults":{…},"prompts":["…"]}',
    key: '{} (calculators are not graded)',
  },
  spot_error: {
    content: '{"context":"…","columns":["Line","Value"],"select_count":2,"rows":[{"id":"r1","cells":["Revenue","1,000"]}]}',
    key: '{"errors":["r5"],"explanations":{"r5":"Why it is wrong"}}',
  },
  matching: {
    content: '{"categories":[{"id":"a","label":"…"}],"items":[{"id":"i1","label":"…"}]}',
    key: '{"i1":"a"}',
  },
  branching: {
    content: '{"start":"n1","nodes":{"n1":{"text":"…","choices":[{"id":"a","label":"…","next":"end_x"}]},"end_x":{"end":true,"text":"…"}}}',
    key: '{"max":100,"points":{"n1.a":50},"feedback":{"n1.a":"…"}}',
  },
  worked_example: {
    content: '{"intro":"…","steps":[{"id":"s1","prompt":"…","unit":"₱m"}]}',
    key: '{"s1":{"answer":120,"tolerance_pct":1,"hint":"…","explanation":"…"}}',
  },
};

function Editor({ lessonId, activity, nextPosition, onClose }: { lessonId: string; activity: AdminActivity | null; nextPosition: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    slug: activity?.slug ?? '',
    kind: (activity?.kind ?? 'matching') as ActivityKind,
    title: activity?.title ?? '',
    instructions: activity?.instructions ?? '',
    position: String(activity?.position ?? nextPosition),
    is_required: activity?.is_required ?? true,
    content: JSON.stringify(activity?.content ?? {}, null, 2),
    key: JSON.stringify(activity?.key ?? {}, null, 2),
  });
  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) throw new Error('Slug: 3–80 chars, lowercase letters, numbers and hyphens.');
      if (!f.title.trim()) throw new Error('Title is required.');
      let content: Record<string, unknown>;
      let key: Record<string, unknown>;
      try {
        content = JSON.parse(f.content);
      } catch {
        throw new Error('Content is not valid JSON.');
      }
      try {
        key = JSON.parse(f.key);
      } catch {
        throw new Error('Answer key is not valid JSON.');
      }
      return adminSaveActivity(
        { lesson_id: lessonId, slug: f.slug, kind: f.kind, title: f.title.trim(), instructions: f.instructions, position: Number(f.position) || 0, is_required: f.kind === 'calculator' ? false : f.is_required, content },
        key,
        activity?.id,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'activities', lessonId] });
      qc.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity saved');
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={activity ? `Edit: ${activity.title}` : 'New practice activity'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Title" className="md:col-span-2">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Slug">
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="font-mono" />
        </Field>
        <Field label="Type">
          <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as ActivityKind })}>
            <option value="calculator">Calculator (ungraded)</option>
            <option value="spot_error">Spot the error</option>
            <option value="matching">Drag & drop matching</option>
            <option value="branching">Branching case</option>
            <option value="worked_example">Worked example</option>
          </Select>
        </Field>
        <Field label="Instructions" className="md:col-span-3">
          <Input value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} />
        </Field>
        <Field label="Position">
          <Input value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} />
        </Field>
        <Field label="Content (JSON, visible to learners)" hint={KIND_HELP[f.kind].content} className="md:col-span-2">
          <Textarea rows={14} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} className="font-mono text-xs" />
        </Field>
        <Field label="Answer key (JSON, admin-only)" hint={KIND_HELP[f.kind].key} className="md:col-span-2">
          <Textarea rows={14} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} className="font-mono text-xs" />
        </Field>
        {f.kind !== 'calculator' && (
          <div className="md:col-span-4">
            <Checkbox checked={f.is_required} onChange={(v) => setF({ ...f, is_required: v })} label="Required before the knowledge check" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export function AdminActivitiesModal({ lessonId, lessonTitle, onClose }: { lessonId: string; lessonTitle: string; onClose: () => void }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'activities', lessonId], queryFn: () => adminListActivities(lessonId) });
  const [editing, setEditing] = useState<AdminActivity | null | 'new'>(null);
  const remove = useMutation({
    mutationFn: adminDeleteActivity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'activities', lessonId] });
      toast('Activity deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <Modal open={!editing} onClose={onClose} size="lg" title={`Practice: ${lessonTitle}`} description="Interactive activities shown between the briefing and the knowledge check.">
        {list.isPending ? (
          <LoadingState />
        ) : list.isError ? (
          <ErrorState error={list.error} />
        ) : (
          <div className="space-y-2">
            {list.data.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <span className="font-mono text-xs text-fg-subtle">{a.position}</span>
                <span className="min-w-0 flex-1 truncate">{a.title}</span>
                <Badge>{a.kind.replace('_', ' ')}</Badge>
                {a.is_required && a.kind !== 'calculator' && <Badge tone="warn">required</Badge>}
                <Button size="icon" variant="ghost" onClick={() => setEditing(a)} aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {!list.data.length && <p className="text-sm text-fg-muted">No activities yet.</p>}
            <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> Add activity
            </Button>
          </div>
        )}
      </Modal>
      {editing && (
        <Editor
          lessonId={lessonId}
          activity={editing === 'new' ? null : editing}
          nextPosition={(list.data?.length ?? 0) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

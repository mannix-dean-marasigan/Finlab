import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import { adminListChallenges, adminListLessons, adminListPrograms, adminProgramEnrollmentCounts, adminSaveProgram, type AdminProgram } from '@/services/api/admin';
import type { Difficulty } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

type ModuleDraft = { kind: 'lesson' | 'challenge' | 'exam'; ref: string; min_score: string };

function Editor({ program, onClose }: { program: AdminProgram | null; onClose: () => void }) {
  const qc = useQueryClient();
  const ref = useReference();
  const lessons = useQuery({ queryKey: ['admin', 'lessons'], queryFn: adminListLessons });
  const challenges = useQuery({ queryKey: ['admin', 'challenges'], queryFn: adminListChallenges });
  const [f, setF] = useState({
    slug: program?.slug ?? '',
    kind: program?.kind ?? 'certification',
    title: program?.title ?? '',
    subtitle: program?.subtitle ?? '',
    description: program?.description ?? '',
    category_id: program?.category_id ?? '',
    level: (program?.level ?? 'intermediate') as Difficulty,
    estimated_hours: String(program?.estimated_hours ?? 2),
    certificate_title: program?.certificate_title ?? '',
    is_published: program?.is_published ?? false,
    sort_order: String(program?.sort_order ?? 0),
  });
  const [mods, setMods] = useState<ModuleDraft[]>(
    (program?.modules ?? []).map((m) => ({ kind: m.kind, ref: (m.lesson_id ?? m.challenge_id)!, min_score: m.min_score === null ? '' : String(m.min_score) })),
  );
  const move = (i: number, d: -1 | 1) =>
    setMods((all) => {
      const next = [...all];
      const j = i + d;
      if (j < 0 || j >= next.length) return all;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) throw new Error('Slug: 3–80 chars, lowercase letters, numbers and hyphens.');
      if (!f.title.trim() || !f.certificate_title.trim()) throw new Error('Title and certificate title are required.');
      if (mods.some((m) => !m.ref)) throw new Error('Every module needs a lesson or challenge selected.');
      if (f.kind === 'certification' && f.is_published && mods[mods.length - 1]?.kind !== 'exam') throw new Error('A certification should end with a final exam module.');
      return adminSaveProgram(
        {
          slug: f.slug, kind: f.kind, title: f.title.trim(), subtitle: f.subtitle, description: f.description,
          category_id: f.category_id || null, level: f.level, estimated_hours: Number(f.estimated_hours) || 1,
          certificate_title: f.certificate_title.trim(), is_published: f.is_published, sort_order: Number(f.sort_order) || 0,
        },
        mods.map((m) => ({
          kind: m.kind,
          lesson_id: m.kind === 'lesson' ? m.ref : null,
          challenge_id: m.kind !== 'lesson' ? m.ref : null,
          min_score: m.kind !== 'lesson' && m.min_score !== '' ? Number(m.min_score) : null,
        })),
        program?.id,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'programs'] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      qc.invalidateQueries({ queryKey: ['program'] });
      toast.success('Program saved');
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={program ? `Edit: ${program.title}` : 'New program'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save program
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Title" required className="md:col-span-2">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Slug" required>
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="font-mono" disabled={!!program} />
        </Field>
        <Field label="Type">
          <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as AdminProgram['kind'] })}>
            <option value="certification">Certification (with exam)</option>
            <option value="track">Learning track</option>
          </Select>
        </Field>
        <Field label="Certificate title" required hint="Printed on the certificate" className="md:col-span-2">
          <Input value={f.certificate_title} onChange={(e) => setF({ ...f, certificate_title: e.target.value })} />
        </Field>
        <Field label="Subtitle" className="md:col-span-2">
          <Input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} />
        </Field>
        <Field label="Description (markdown)" className="md:col-span-4">
          <Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
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
        <Field label="Level">
          <Select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Difficulty })}>
            {['beginner', 'intermediate', 'advanced', 'expert'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Hours">
          <Input value={f.estimated_hours} onChange={(e) => setF({ ...f, estimated_hours: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Checkbox checked={f.is_published} onChange={(v) => setF({ ...f, is_published: v })} label="Published" />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Modules (in order)</div>
          <Button size="xs" variant="outline" onClick={() => setMods((m) => [...m, { kind: 'lesson', ref: '', min_score: '' }])}>
            <Plus className="h-3 w-3" /> Module
          </Button>
        </div>
        <p className="mb-3 text-xs text-fg-muted">
          Exams should be certification-only challenges tagged <code className="font-mono">certification_exam</code> (hidden from the Challenges list) and placed last — they unlock only after every earlier module.
        </p>
        <div className="space-y-2">
          {mods.map((m, i) => (
            <div key={i} className="grid items-end gap-2 rounded-md border border-border p-2 md:grid-cols-[40px_160px_1fr_110px_auto]">
              <span className="pb-2 text-center font-mono text-xs text-fg-subtle">{i + 1}</span>
              <Select value={m.kind} onChange={(e) => setMods((all) => all.map((x, j) => (j === i ? { ...x, kind: e.target.value as ModuleDraft['kind'], ref: '' } : x)))} aria-label="Module type">
                <option value="lesson">Lesson + check</option>
                <option value="challenge">Challenge</option>
                <option value="exam">Final exam</option>
              </Select>
              <Select value={m.ref} onChange={(e) => setMods((all) => all.map((x, j) => (j === i ? { ...x, ref: e.target.value } : x)))} aria-label="Lesson or challenge">
                <option value="">Select…</option>
                {m.kind === 'lesson'
                  ? lessons.data?.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))
                  : challenges.data
                      ?.filter((c) => (m.kind === 'exam') === c.tags.includes('certification_exam'))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
              </Select>
              <Input
                value={m.min_score}
                onChange={(e) => setMods((all) => all.map((x, j) => (j === i ? { ...x, min_score: e.target.value } : x)))}
                placeholder={m.kind === 'lesson' ? '—' : 'Pass mark'}
                disabled={m.kind === 'lesson'}
                aria-label="Minimum score"
              />
              <div className="flex">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setMods((all) => all.filter((_, j) => j !== i))} aria-label="Remove module">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
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

export default function AdminProgramsPage() {
  const list = useQuery({ queryKey: ['admin', 'programs'], queryFn: adminListPrograms });
  const counts = useQuery({ queryKey: ['admin', 'programCounts'], queryFn: adminProgramEnrollmentCounts });
  const [editing, setEditing] = useState<AdminProgram | null | 'new'>(null);

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">Certificates are issued automatically when an enrolled user completes every module.</span>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New program
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Program</Th>
            <Th>Type</Th>
            <Th align="right">Modules</Th>
            <Th align="right">Enrolled</Th>
            <Th align="right">Certified</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {list.data.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link to={`/certifications/${p.slug}`} className="font-medium hover:text-accent">
                  {p.title}
                </Link>
                <div className="text-xs text-fg-subtle">{p.certificate_title}</div>
              </Td>
              <Td>
                <Badge tone={p.kind === 'certification' ? 'accent' : 'info'}>{p.kind}</Badge>
              </Td>
              <Td align="right" mono>{p.modules.length}</Td>
              <Td align="right" mono>{counts.data?.[p.id]?.enrolled ?? 0}</Td>
              <Td align="right" mono>{counts.data?.[p.id]?.completed ?? 0}</Td>
              <Td>{p.is_published ? <Badge tone="up">Published</Badge> : <Badge tone="warn">Draft</Badge>}</Td>
              <Td align="right">
                <Button size="xs" variant="ghost" onClick={() => setEditing(p)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {editing && <Editor program={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Card>
  );
}

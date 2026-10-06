import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminCompetitionChallengeIds, adminDeleteCompetition, adminFinalizeCompetition, adminListChallenges, adminListCompetitions, adminSaveCompetition,
  type CompetitionInput,
} from '@/services/api/admin';
import { competitionStatus } from '@/services/api/compete';
import type { Competition } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDateTime } from '@/lib/format';

const toLocal = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocal = (v: string) => new Date(v).toISOString();

function Editor({ comp, onClose }: { comp: Competition | null; onClose: () => void }) {
  const qc = useQueryClient();
  const challenges = useQuery({ queryKey: ['admin', 'challenges'], queryFn: adminListChallenges });
  const linked = useQuery({ queryKey: ['admin', 'compChallenges', comp?.id], queryFn: () => adminCompetitionChallengeIds(comp!.id), enabled: !!comp });
  const now = Date.now();
  const [f, setF] = useState({
    slug: comp?.slug ?? '',
    name: comp?.name ?? '',
    description: comp?.description ?? '',
    rules: comp?.rules ?? '',
    starts_at: toLocal(comp?.starts_at ?? new Date(now + 86400000).toISOString()),
    ends_at: toLocal(comp?.ends_at ?? new Date(now + 15 * 86400000).toISOString()),
    registration_deadline: toLocal(comp?.registration_deadline ?? new Date(now + 10 * 86400000).toISOString()),
    participant_limit: comp?.participant_limit ? String(comp.participant_limit) : '',
    scoring_method: comp?.scoring_method ?? 'sum',
    is_published: comp?.is_published ?? false,
  });
  const [selected, setSelected] = useState<string[] | null>(null);
  const chosen = selected ?? linked.data ?? [];

  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9-]{3,80}$/.test(f.slug)) throw new Error('Slug: 3–80 chars, lowercase letters, numbers and hyphens.');
      if (!f.name.trim()) throw new Error('Name is required.');
      if (new Date(f.ends_at) <= new Date(f.starts_at)) throw new Error('End must be after start.');
      if (new Date(f.registration_deadline) > new Date(f.ends_at)) throw new Error('Registration deadline must be before the end.');
      const input: CompetitionInput = {
        slug: f.slug, name: f.name.trim(), description: f.description, rules: f.rules,
        starts_at: fromLocal(f.starts_at), ends_at: fromLocal(f.ends_at), registration_deadline: fromLocal(f.registration_deadline),
        participant_limit: f.participant_limit ? Number(f.participant_limit) : null,
        scoring_method: f.scoring_method as Competition['scoring_method'], is_published: f.is_published,
      };
      return adminSaveCompetition(input, chosen, comp?.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['competitions'] });
      qc.invalidateQueries({ queryKey: ['competition'] });
      toast.success('Competition saved');
      onClose();
    },
  });

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={comp ? 'Edit competition' : 'New competition'}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Slug" required>
          <Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="font-mono" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label="Rules (markdown)" className="sm:col-span-2">
          <Textarea rows={3} value={f.rules} onChange={(e) => setF({ ...f, rules: e.target.value })} />
        </Field>
        <Field label="Starts">
          <Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
        </Field>
        <Field label="Ends">
          <Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
        </Field>
        <Field label="Registration deadline">
          <Input type="datetime-local" value={f.registration_deadline} onChange={(e) => setF({ ...f, registration_deadline: e.target.value })} />
        </Field>
        <Field label="Participant limit" hint="Blank = unlimited">
          <Input value={f.participant_limit} onChange={(e) => setF({ ...f, participant_limit: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Scoring method">
          <Select value={f.scoring_method} onChange={(e) => setF({ ...f, scoring_method: e.target.value as Competition['scoring_method'] })}>
            <option value="sum">Sum of best scores</option>
            <option value="average">Average (missing = 0)</option>
            <option value="best">Best single score</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox checked={f.is_published} onChange={(v) => setF({ ...f, is_published: v })} label="Published" />
        </div>
        <Field label="Challenges" className="sm:col-span-2">
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
            {challenges.data?.map((c) => (
              <Checkbox
                key={c.id}
                checked={chosen.includes(c.id)}
                onChange={(v) => setSelected(v ? [...chosen, c.id] : chosen.filter((x) => x !== c.id))}
                label={`${c.title}${c.is_published ? '' : ' (unpublished)'}`}
              />
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminCompetitionsPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'competitions'], queryFn: adminListCompetitions });
  const [editing, setEditing] = useState<Competition | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Competition | null>(null);
  const finalize = useMutation({
    mutationFn: (id: string) => adminFinalizeCompetition(id),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['competition'] });
      toast.success(`Finalized — ${n} ranked results written, Leadership evidence awarded`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteCompetition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['competitions'] });
      setDeleting(null);
      toast('Competition deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (list.isPending) return <PageSkeleton />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">{list.data.length} competitions</span>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New competition
        </Button>
      </div>
      {!list.data.length ? (
        <EmptyState title="No competitions" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Window</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {list.data.map((c) => {
              const st = competitionStatus(c);
              return (
                <tr key={c.id}>
                  <Td>
                    <Link to={`/competitions/${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                    <div className="font-mono text-xs text-fg-subtle">{c.slug}</div>
                  </Td>
                  <Td className="text-xs text-fg-muted">
                    {fmtDateTime(c.starts_at)} – {fmtDateTime(c.ends_at)}
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Badge tone={st === 'active' ? 'up' : st === 'upcoming' ? 'info' : 'neutral'}>{st}</Badge>
                      {!c.is_published && <Badge tone="warn">draft</Badge>}
                      {c.results_finalized_at && <Badge tone="accent">finalized</Badge>}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      {st === 'completed' && (
                        <Button size="xs" variant="outline" onClick={() => finalize.mutate(c.id)} loading={finalize.isPending && finalize.variables === c.id}>
                          <Flag className="h-3.5 w-3.5" /> {c.results_finalized_at ? 'Re-finalize' : 'Finalize results'}
                        </Button>
                      )}
                      <Button size="xs" variant="ghost" onClick={() => setEditing(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setDeleting(c)} aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      {editing && <Editor comp={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete competition?"
        description="Registrations and results are removed. Submissions remain as practice attempts."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleting && remove.mutate(deleting.id)} loading={remove.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </Card>
  );
}

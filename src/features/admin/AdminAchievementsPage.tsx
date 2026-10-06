import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import { adminAchievementCounts, adminAwardAchievement, adminListUsers, adminSaveAchievement } from '@/services/api/admin';
import type { Achievement } from '@/types/domain';
import { DynamicIcon } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal, Table, Td, Th } from '@/components/ui/misc';
import { ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

const ICONS = ['award', 'flag', 'presentation', 'file-text', 'swords', 'trending-up', 'medal', 'crown', 'calculator', 'file-search', 'pie-chart', 'target', 'library', 'trophy', 'rocket', 'landmark'];

const METRICS = [
  'challenges_completed', 'challenges_passed', 'category_passed', 'tag_passed', 'stock_pitches_submitted', 'research_reports_submitted', 'valuation_models',
  'financial_models', 'portfolio_trades', 'market_event_decisions', 'competitions_joined', 'competitions_won', 'competitions_top3', 'lessons_completed', 'finlab_score', 'skill_score',
];

function Editor({ a, onClose }: { a: Achievement | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<Achievement>(
    a ?? { id: '', name: '', description: '', icon: 'award', tier: 'bronze', criteria: { type: 'metric', metric: 'challenges_completed', gte: 1 }, is_active: true, sort_order: 100 },
  );
  const [criteria, setCriteria] = useState(JSON.stringify(f.criteria, null, 2));
  const save = useMutation({
    mutationFn: () => {
      if (!/^[a-z0-9_]{2,60}$/.test(f.id)) throw new Error('Id: lowercase letters, numbers and underscores.');
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(criteria);
      } catch {
        throw new Error('Criteria must be valid JSON.');
      }
      if (!['metric', 'percentile', 'all'].includes(String(parsed.type))) throw new Error('Criteria type must be metric, percentile or all.');
      return adminSaveAchievement({ ...f, criteria: parsed }, !a);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reference'] });
      toast.success('Achievement saved. Users receive it automatically when they next meet the criteria.');
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={a ? `Edit ${a.name}` : 'New achievement'}
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
        <Field label="Id" required>
          <Input value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} disabled={!!a} className="font-mono" />
        </Field>
        <Field label="Name" required>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label="Icon">
          <Select value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })}>
            {ICONS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tier">
          <Select value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value as Achievement['tier'] })}>
            {['bronze', 'silver', 'gold', 'platinum'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field
          label="Criteria (JSON)"
          className="sm:col-span-2"
          hint={
            <>
              {`{"type":"metric","metric":"…","arg":"…","gte":N}`} · {`{"type":"percentile","max_pct":10,"min_population":10}`} · {`{"type":"all","conditions":[…]}`}
              <br />
              Metrics: {METRICS.join(', ')}
            </>
          }
        >
          <Textarea rows={8} value={criteria} onChange={(e) => setCriteria(e.target.value)} className="font-mono text-xs" />
        </Field>
        <Field label="Sort order">
          <Input value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) || 0 })} />
        </Field>
        <div className="flex items-end">
          <Checkbox checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label="Active" />
        </div>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

function AwardModal({ a, onClose }: { a: Achievement; onClose: () => void }) {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['admin', 'users', ''], queryFn: () => adminListUsers('') });
  const [userId, setUserId] = useState('');
  const [note, setNote] = useState('');
  const award = useMutation({
    mutationFn: () => adminAwardAchievement(userId, a.id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'achievementCounts'] });
      toast.success('Achievement awarded (recorded as admin award)');
      onClose();
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      title={`Award "${a.name}" manually`}
      description="Manual awards are labelled as admin-awarded. Prefer automatic criteria where possible."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => award.mutate()} loading={award.isPending} disabled={!userId}>
            Award
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="User">
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select…</option>
            {users.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} — {u.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reason">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Won the in-person beta pitch night" />
        </Field>
        <InlineError message={award.error ? (award.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminAchievementsPage() {
  const ref = useReference();
  const counts = useQuery({ queryKey: ['admin', 'achievementCounts'], queryFn: adminAchievementCounts });
  const [editing, setEditing] = useState<Achievement | null | 'new'>(null);
  const [awarding, setAwarding] = useState<Achievement | null>(null);

  if (ref.isPending) return <PageSkeleton />;
  if (ref.isError) return <ErrorState error={ref.error} />;

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-muted">Achievements are awarded automatically by the database when criteria are met.</span>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New achievement
        </Button>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Achievement</Th>
            <Th>Criteria</Th>
            <Th align="right">Holders</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {ref.data.achievements.map((a) => (
            <tr key={a.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <DynamicIcon name={a.icon} className="h-5 w-5 text-accent" />
                  <div>
                    <div className="font-medium">
                      {a.name} <Badge className="ml-1">{a.tier}</Badge> {!a.is_active && <Badge tone="warn">inactive</Badge>}
                    </div>
                    <div className="text-xs text-fg-muted">{a.description}</div>
                  </div>
                </div>
              </Td>
              <Td>
                <code className="block max-w-md truncate font-mono text-xs text-fg-subtle">{JSON.stringify(a.criteria)}</code>
              </Td>
              <Td align="right" mono>
                {counts.data?.[a.id] ?? 0}
              </Td>
              <Td align="right">
                <div className="flex justify-end gap-1">
                  <Button size="xs" variant="ghost" onClick={() => setAwarding(a)}>
                    <Gift className="h-3.5 w-3.5" /> Award
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditing(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {editing && <Editor a={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {awarding && <AwardModal a={awarding} onClose={() => setAwarding(null)} />}
    </Card>
  );
}

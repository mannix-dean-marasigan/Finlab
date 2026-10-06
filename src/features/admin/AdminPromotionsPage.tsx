import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReference } from '@/app/queries';
import { adminDeleteRequirement, adminListRequirements, adminSaveRequirement } from '@/services/api/admin';
import type { PromotionRequirement, RequirementType } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';

const TYPES: { value: RequirementType; label: string; param?: { key: string; label: string; options?: 'category' | 'skill' | 'metric' } }[] = [
  { value: 'min_finlab_score', label: 'Minimum FINLAB Score' },
  { value: 'challenges_passed', label: 'Challenges passed (any)' },
  { value: 'category_passed', label: 'Challenges passed in category', param: { key: 'category', label: 'Category', options: 'category' } },
  { value: 'tag_passed', label: 'Challenges passed with tag', param: { key: 'tag', label: 'Tag (e.g. financial_modeling)' } },
  { value: 'metric_gte', label: 'Activity metric ≥ value', param: { key: 'metric', label: 'Metric', options: 'metric' } },
  { value: 'skill_min', label: 'Skill score ≥ value', param: { key: 'skill', label: 'Skill', options: 'skill' } },
];
const METRICS = ['stock_pitches_submitted', 'research_reports_submitted', 'valuation_models', 'financial_models', 'portfolio_trades', 'market_event_decisions', 'competitions_joined', 'competitions_won', 'competitions_top3', 'challenges_completed', 'lessons_completed'];

function Editor({ req, levelId, onClose }: { req: PromotionRequirement | null; levelId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const ref = useReference();
  const [type, setType] = useState<RequirementType>(req?.requirement_type ?? 'min_finlab_score');
  const def = TYPES.find((t) => t.value === type)!;
  const [value, setValue] = useState(String(req?.params.value ?? ''));
  const [param, setParam] = useState(def.param ? String(req?.params[def.param.key] ?? '') : '');
  const [label, setLabel] = useState(req?.label ?? '');
  const [order, setOrder] = useState(String(req?.sort_order ?? 10));
  const [active, setActive] = useState(req?.is_active ?? true);

  const save = useMutation({
    mutationFn: () => {
      if (!Number.isFinite(Number(value)) || value === '') throw new Error('Value must be a number.');
      if (def.param && !param) throw new Error(`${def.param.label} is required.`);
      if (!label.trim()) throw new Error('Label is required — users see it.');
      const params: Record<string, string | number> = { value: Number(value) };
      if (def.param) params[def.param.key] = param;
      return adminSaveRequirement({ target_level_id: levelId, requirement_type: type, params, label: label.trim(), sort_order: Number(order) || 0, is_active: active }, req?.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'requirements'] });
      qc.invalidateQueries({ queryKey: ['promotion'] });
      qc.invalidateQueries({ queryKey: ['promotionRequirements'] });
      toast.success('Requirement saved');
      onClose();
    },
  });
  const options =
    def.param?.options === 'category'
      ? ref.data?.categories.map((c) => [c.id, c.name])
      : def.param?.options === 'skill'
        ? ref.data?.skills.map((s) => [s.id, s.name])
        : def.param?.options === 'metric'
          ? METRICS.map((m) => [m, m])
          : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={`${req ? 'Edit' : 'Add'} requirement → ${ref.data?.careerLevels.find((l) => l.id === levelId)?.name}`}
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
        <Field label="Type" className="sm:col-span-2">
          <Select value={type} onChange={(e) => (setType(e.target.value as RequirementType), setParam(''))}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        {def.param && (
          <Field label={def.param.label}>
            {options ? (
              <Select value={param} onChange={(e) => setParam(e.target.value)}>
                <option value="">Select…</option>
                {options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={param} onChange={(e) => setParam(e.target.value)} className="font-mono" />
            )}
          </Field>
        )}
        <Field label="Required value">
          <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Label shown to users" className="sm:col-span-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Sort order">
          <Input value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <Checkbox checked={active} onChange={setActive} label="Active" />
        </div>
      </div>
      <div className="mt-3">
        <InlineError message={save.error ? (save.error as Error).message : null} />
      </div>
    </Modal>
  );
}

export default function AdminPromotionsPage() {
  const qc = useQueryClient();
  const ref = useReference();
  const reqs = useQuery({ queryKey: ['admin', 'requirements'], queryFn: adminListRequirements });
  const [editing, setEditing] = useState<{ req: PromotionRequirement | null; levelId: number } | null>(null);
  const remove = useMutation({
    mutationFn: adminDeleteRequirement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'requirements'] });
      qc.invalidateQueries({ queryKey: ['promotion'] });
      toast('Requirement removed');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (reqs.isPending || ref.isPending) return <PageSkeleton />;
  if (reqs.isError) return <ErrorState error={reqs.error} onRetry={() => reqs.refetch()} />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ref.data?.careerLevels.slice(1).map((l) => {
        const list = reqs.data.filter((r) => r.target_level_id === l.id);
        return (
          <Card key={l.id}>
            <CardHeader
              title={`→ ${l.name}`}
              subtitle={`Promotion into level ${l.rank}`}
              action={
                <Button size="xs" variant="outline" onClick={() => setEditing({ req: null, levelId: l.id })}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              }
            />
            <CardContent className="space-y-1.5">
              {!list.length && <p className="text-sm text-fg-muted">No requirements — promotion would be blocked.</p>}
              {list.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className={r.is_active ? '' : 'text-fg-subtle line-through'}>{r.label}</div>
                    <code className="font-mono text-[0.7rem] text-fg-subtle">
                      {r.requirement_type} {JSON.stringify(r.params)}
                    </code>
                  </div>
                  {!r.is_active && <Badge tone="warn">off</Badge>}
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ req: r, levelId: l.id })} aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {editing && <Editor req={editing.req} levelId={editing.levelId} onClose={() => setEditing(null)} />}
    </div>
  );
}

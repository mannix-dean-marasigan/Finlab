import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FilePlus2, FileSearch, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { createResearch, deleteResearch, duplicateResearch, listMyResearch } from '@/services/api/work';
import { PageHeader, RatingBadge, ScorePill } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { Modal, Tabs } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { fmtDate, timeAgo } from '@/lib/format';
import type { ResearchProject } from '@/types/domain';

function RowMenu({ project }: { project: ResearchProject }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const dup = useMutation({
    mutationFn: () => duplicateResearch(project.id),
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['research'] });
      toast.success('Duplicated as a new draft');
      navigate(`/research/${id}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: () => deleteResearch(project.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['research'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['skills'] });
      toast('Research project deleted');
      setConfirm(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button size="icon" variant="ghost" onClick={() => setOpen((o) => !o)} aria-label="Project actions">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-40 rounded-md border border-border-strong bg-surface py-1 shadow-xl" onMouseLeave={() => setOpen(false)}>
          <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2" onClick={() => dup.mutate()}>
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          {!project.challenge_id && (
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-down hover:bg-surface-2" onClick={() => (setOpen(false), setConfirm(true))}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      )}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="Delete research project?"
        description={
          project.status === 'submitted'
            ? 'This report is submitted. Deleting it removes it from your track record and recalculates your skills.'
            : 'This permanently deletes the draft and its sources.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => del.mutate()} loading={del.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function ResearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const research = useQuery({ queryKey: ['research', user!.id], queryFn: () => listMyResearch(user!.id) });
  const [tab, setTab] = useState<'all' | 'draft' | 'submitted'>('all');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const create = useMutation({
    mutationFn: () => createResearch({ title: title.trim() || 'Untitled research', company: company.trim() }),
    onSuccess: (p) => navigate(`/research/${p.id}`),
  });

  if (research.isPending) return <PageSkeleton />;
  if (research.isError) return <ErrorState error={research.error} onRetry={() => research.refetch()} />;
  const rows = research.data.filter((r) => tab === 'all' || r.status === tab);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Research Studio"
        title="Equity research"
        description="Write a research report the way analysts do: thesis, company and industry, financials, forecast, valuation, catalysts and risks."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <FilePlus2 className="h-4 w-4" /> New report
          </Button>
        }
      />
      <Card>
        <Tabs
          className="px-4 pt-2"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: research.data.length },
            { value: 'draft', label: 'Drafts', count: research.data.filter((r) => r.status === 'draft').length },
            { value: 'submitted', label: 'Completed', count: research.data.filter((r) => r.status === 'submitted').length },
          ]}
        />
        {!rows.length ? (
          <EmptyState
            icon={<FileSearch className="h-5 w-5" />}
            title="No research yet"
            description="Start an initiation report. Drafts save automatically as you write."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                New report
              </Button>
            }
          />
        ) : (
          <ul>
            {rows.map((r) => (
              <li
                key={r.id}
                onClick={() => navigate(`/research/${r.id}`)}
                className="flex cursor-pointer items-center gap-4 border-t border-border/70 px-4 py-3 first:border-t-0 hover:bg-surface-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-3 font-mono text-xs text-fg-muted">
                  {r.ticker || '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.title}</div>
                  <div className="text-xs text-fg-muted">
                    {r.company || 'No company set'} · updated {timeAgo(r.updated_at)}
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  {r.challenge_id && <Badge tone="info">challenge</Badge>}
                  <RatingBadge rating={r.rating} />
                  {r.status === 'submitted' ? <Badge tone="up">Completed {fmtDate(r.submitted_at)}</Badge> : <Badge tone="accent">Draft</Badge>}
                  {r.is_public && <Badge tone="violet">public</Badge>}
                </div>
                <ScorePill score={r.score} />
                <RowMenu project={r} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New research report"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Report title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Jollibee: Global growth is underpriced" maxLength={200} autoFocus />
          </Field>
          <Field label="Company (optional)">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Jollibee Foods Corporation" maxLength={160} />
          </Field>
          <InlineError message={create.error ? (create.error as Error).message : null} />
        </div>
      </Modal>
    </div>
  );
}

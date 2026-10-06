import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sigma, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { deleteFinancialModel, listFinancialModels, saveFinancialModel } from '@/services/api/work';
import { emptyModel } from '@/lib/finance/model';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/misc';
import { EmptyState, ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { timeAgo } from '@/lib/format';

export default function ModelsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const models = useQuery({ queryKey: ['financialModels', user!.id], queryFn: () => listFinancialModels(user!.id) });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [deleting, setDeleting] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => saveFinancialModel({ name: name.trim(), company: company.trim(), ticker: '', currency, unit: 'millions', data: emptyModel(), notes: '' }),
    onSuccess: (m) => navigate(`/models/${m.id}`),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFinancialModel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financialModels'] });
      setDeleting(null);
      toast('Model deleted');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (models.isPending) return <PageSkeleton />;
  if (models.isError) return <ErrorState error={models.error} onRetry={() => models.refetch()} />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Financial Modeling"
        title="Income statement models"
        description="Enter historicals, set growth, margin and tax assumptions, and the forecast builds itself. Deliberately lightweight — not a spreadsheet."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New model
          </Button>
        }
      />
      {!models.data.length ? (
        <Card>
          <EmptyState
            icon={<Sigma className="h-5 w-5" />}
            title="No models yet"
            description="Start with a template (three historical years, three forecast years) and replace the numbers with your company's."
            action={
              <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
                New model
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.data.map((m) => (
            <Card key={m.id} className="group cursor-pointer p-4 hover:border-border-strong" onClick={() => navigate(`/models/${m.id}`)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium group-hover:text-accent">{m.name}</div>
                  <div className="text-sm text-fg-muted">{m.company || '—'}</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(m.id);
                  }}
                  aria-label={`Delete ${m.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 text-xs text-fg-subtle">
                {m.currency} · {m.unit} · updated {timeAgo(m.updated_at)}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New financial model"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Model name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pampanga Foods base case" autoFocus maxLength={160} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={160} />
            </Field>
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>PHP</option>
                <option>USD</option>
              </Select>
            </Field>
          </div>
          <InlineError message={create.error ? (create.error as Error).message : null} />
        </div>
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title="Delete model?"
        description="This permanently deletes the model."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleting && remove.mutate(deleting)} loading={remove.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

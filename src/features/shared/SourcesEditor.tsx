import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Link2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { addSource, deleteSource, listSources } from '@/services/api/work';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { ErrorState } from '@/components/ui/states';

/** Structured citations for a pitch or research project. */
export function SourcesEditor({ parent, readOnly, target }: { parent: { pitchId?: string; projectId?: string }; readOnly?: boolean; target?: number }) {
  const qc = useQueryClient();
  const key = ['sources', parent.pitchId ?? parent.projectId];
  const sources = useQuery({ queryKey: key, queryFn: () => listSources(parent) });
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [publisher, setPublisher] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: () => addSource(parent, { title: title.trim(), url: url.trim() || null, publisher: publisher.trim() || null }),
    onSuccess: () => {
      setTitle('');
      setUrl('');
      setPublisher('');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => setError((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError('Give the source a title.');
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) return setError('Links must start with http:// or https://');
    add.mutate();
  };

  if (sources.isError) return <ErrorState error={sources.error} onRetry={() => sources.refetch()} />;
  const list = sources.data ?? [];

  return (
    <div>
      {target !== undefined && (
        <p className="mb-3 text-xs text-fg-muted">
          {list.length} cited · aim for {target}+ with links (annual reports, exchange disclosures, regulator data).
        </p>
      )}
      {list.length > 0 && (
        <ol className="mb-3 space-y-1.5">
          {list.map((s, i) => (
            <li key={s.id} className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
              <span className="font-mono text-xs text-fg-subtle">[{i + 1}]</span>
              <div className="min-w-0 flex-1">
                <div className="truncate">{s.title}</div>
                <div className="flex items-center gap-2 text-xs text-fg-muted">
                  {s.publisher && <span>{s.publisher}</span>}
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 truncate text-accent hover:underline">
                      <ExternalLink className="h-3 w-3" /> {new URL(s.url).hostname}
                    </a>
                  )}
                </div>
              </div>
              {!readOnly && (
                <button onClick={() => remove.mutate(s.id)} className="rounded p-1 text-fg-subtle hover:bg-surface-3 hover:text-down" aria-label={`Remove source ${s.title}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_auto]">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. FY2025 Annual Report" aria-label="Source title" maxLength={300} />
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-fg-subtle" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="pl-8" aria-label="Source URL" />
          </div>
          <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" aria-label="Publisher" maxLength={160} />
          <Button type="submit" size="md" loading={add.isPending}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      )}
      {error && <p className="mt-2 text-xs text-down">{error}</p>}
      {readOnly && !list.length && <p className="text-sm text-fg-muted">No sources.</p>}
    </div>
  );
}

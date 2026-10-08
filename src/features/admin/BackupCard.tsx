import { useState } from 'react';
import { Archive, Download } from 'lucide-react';
import { toast } from 'sonner';
import { adminBackup } from '@/services/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/** The free Supabase plan has no automatic backups, so admins can download one on demand. */
export function BackupCard() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ rows: number; errors: Record<string, string>; at: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const { data, errors, rows } = await adminBackup((t, i, n) => setProgress(t === 'done' ? 'Preparing file…' : `Reading ${t} (${i + 1}/${n})`));
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const blob = new Blob([JSON.stringify({ ...data, _errors: errors }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `finlab-ph-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      setResult({ rows, errors, at: new Date().toLocaleString() });
      toast.success(`Backup downloaded — ${rows.toLocaleString()} rows`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Data backup"
        subtitle="Supabase's free plan keeps no automatic backups. Download one now and then, and before big changes."
        icon={<Archive className="h-3.5 w-3.5" />}
        action={
          <Button size="sm" variant="outline" onClick={run} loading={busy}>
            <Download className="h-4 w-4" /> Download backup
          </Button>
        }
      />
      <CardContent className="space-y-2 text-xs text-fg-muted">
        <p>
          Saves users (with emails), progress, submissions, pitches, certificates, feedback, invites and settings as one JSON file. It contains personal data — store it
          somewhere private (not in a public folder or repository).
        </p>
        {busy && <p className="font-mono text-accent">{progress}</p>}
        {result && (
          <p>
            Last backup {result.at}: {result.rows.toLocaleString()} rows.
            {Object.keys(result.errors).length > 0 && (
              <span className="text-amber-400"> Skipped (not readable): {Object.keys(result.errors).join(', ')}.</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

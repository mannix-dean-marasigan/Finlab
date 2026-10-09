import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { adminGetAiSettings, adminSetAiSettings, askHelper, HelperError } from '@/services/api/ai';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { tidyMath } from '@/features/chat/tidyMath';

/** Switch for the AI study helper, its limits, and a button that sends one test question end to end. */
export function AiHelperCard() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ['admin', 'ai-settings'], queryFn: adminGetAiSettings });
  const [enabled, setEnabled] = useState(false);
  const [daily, setDaily] = useState('15');
  const [cap, setCap] = useState('300');
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.enabled);
    setDaily(String(settings.data.dailyLimit));
    setCap(String(settings.data.globalCap));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => adminSetAiSettings({ enabled, dailyLimit: Number(daily) || 0, globalCap: Number(cap) || 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'ai-settings'] });
      qc.invalidateQueries({ queryKey: ['ai-status'] });
      toast.success(enabled ? 'AI helper is on' : 'AI helper is off');
    },
  });
  const run = useMutation({
    mutationFn: () => askHelper([{ role: 'user', text: 'In one sentence, what is the accounting equation?' }]),
    onSuccess: (r) => setTest({ ok: true, text: tidyMath(r.reply).replace(/\*\*/g, '') }),
    onError: (e) => {
      const detail = e instanceof HelperError ? e.detail : undefined;
      setTest({ ok: false, text: detail ? `${(e as Error).message} Reason from Gemini: ${detail}` : (e as Error).message });
    },
  });

  return (
    <Card>
      <CardHeader
        title="AI study helper"
        subtitle="A chat button for learners, powered by Gemini. Off until you switch it on."
        icon={<Sparkles className="h-3.5 w-3.5" />}
        action={
          <Button size="sm" variant={enabled ? 'outline' : 'primary'} onClick={() => setEnabled((e) => !e)}>
            {enabled ? 'Turn off' : 'Turn on'}
          </Button>
        }
      />
      <CardContent className="space-y-4 text-xs text-fg-muted">
        <div className={cn('inline-flex items-center gap-1.5 text-sm', enabled ? 'text-up' : 'text-fg-subtle')}>
          <span className={cn('h-2 w-2 rounded-full', enabled ? 'bg-up' : 'bg-fg-subtle')} /> {enabled ? 'On (after you press Save)' : 'Off'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Messages per user per day
            <Input value={daily} onChange={(e) => setDaily(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1" />
          </label>
          <label>
            Messages per day for everyone
            <Input value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1" />
            <span className="mt-1 block text-fg-subtle">Keep this under Gemini's free daily limit.</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => save.mutate()} loading={save.isPending}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => run.mutate()} loading={run.isPending} disabled={!settings.data?.enabled}>
            Send a test question
          </Button>
          <span className="text-fg-subtle">The test uses one message from your allowance. Save first, then test.</span>
        </div>
        <InlineError message={save.error ? (save.error as Error).message : null} />
        {test && (
          <div className={cn('rounded-md border p-3', test.ok ? 'border-up/40 bg-up-muted text-fg' : 'border-down/40 bg-down-muted text-down')}>
            <div className="mb-1 font-semibold">{test.ok ? 'It works. Gemini answered:' : 'Not working yet:'}</div>
            {test.text}
          </div>
        )}
        <p className="text-fg-subtle">
          Messages are sent to Google's Gemini with emails and phone numbers removed. On the free tier Google may use them to improve its products, which the Privacy Notice and the chat window both say. Message text is never stored by FINLAB PH, only a daily count per user.
        </p>
      </CardContent>
    </Card>
  );
}

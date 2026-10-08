import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CHANGELOG, CHANGELOG_SEEN_KEY, LATEST_CHANGELOG_ID } from '@/lib/changelog';
import { fmtDate } from '@/lib/format';

export default function WhatsNewPage() {
  useEffect(() => {
    try {
      localStorage.setItem(CHANGELOG_SEEN_KEY, LATEST_CHANGELOG_ID);
      window.dispatchEvent(new Event('finlab:changelog-seen'));
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="FINLAB PH" title="What's new" description="Everything we've shipped during the beta. Send feedback with the Feedback button — it shapes what comes next." />
      <div className="mx-auto max-w-3xl space-y-4">
        {CHANGELOG.map((e, i) => (
          <Card key={e.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="font-semibold">{e.title}</h2>
              {i === 0 && <Badge tone="accent">Latest</Badge>}
              <span className="ml-auto text-xs text-fg-subtle">{fmtDate(e.id, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
              {e.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

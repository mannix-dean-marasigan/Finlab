import { useQuery } from '@tanstack/react-query';
import { Copy, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminAnalytics } from '@/services/api/engage';
import { adminBetaTesters } from '@/services/api/admin';
import { Button } from '@/components/ui/button';
import { ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';

/** A one-page summary of the last 7 days, styled like paper so it prints and screenshots cleanly. */
export default function AdminReportPage() {
  const a = useQuery({ queryKey: ['admin', 'analytics', 7], queryFn: () => getAdminAnalytics(7) });
  const t = useQuery({ queryKey: ['admin', 'beta-testers'], queryFn: adminBetaTesters });
  if (a.isPending || t.isPending) return <PageSkeleton />;
  if (a.isError) return <ErrorState error={a.error} onRetry={() => a.refetch()} />;
  if (t.isError) return <ErrorState error={t.error} onRetry={() => t.refetch()} />;

  const d = a.data;
  const testers = t.data;
  const signups = d.days.reduce((s, x) => s + Number(x.signups), 0);
  const xp = d.days.reduce((s, x) => s + Number(x.xp), 0);
  const to = new Date();
  const from = new Date(Date.now() - 6 * 864e5);
  const finished = testers.filter((r) => r.done >= 5).length;
  const certs = testers.filter((r) => r.certificate_code).length;
  const topPrograms = [...d.programs].sort((x, y) => Number(y.enrolled) - Number(x.enrolled)).slice(0, 5);
  const hardest = [...d.hardest_questions].sort((x, y) => Number(x.pct_correct) - Number(y.pct_correct))[0];
  const funnel = d.funnel.map((f) => ({ ...f, users: Number(f.users) }));
  const top = funnel[0]?.users || 1;

  const summary = [
    `FINLAB PH beta, ${fmtDate(from, { month: 'short', day: 'numeric' })} to ${fmtDate(to, { month: 'short', day: 'numeric' })}:`,
    `${signups} new sign-up${signups === 1 ? '' : 's'}, ${d.active_7d} active tester${d.active_7d === 1 ? '' : 's'} and ${xp.toLocaleString()} XP earned.`,
    topPrograms[0] ? `Most popular program: ${topPrograms[0].title}.` : '',
    `${finished} tester${finished === 1 ? '' : 's'} finished the beta checklist so far.`,
    'Thank you to everyone testing and sending feedback.',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-sm text-fg-muted">The last 7 days on FINLAB PH. Print it, screenshot it, or copy the summary for a post.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(summary).then(() => toast.success('Summary copied'))}>
            <Copy className="h-4 w-4" /> Copy summary
          </Button>
          <Button size="sm" variant="primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="print-report mx-auto max-w-3xl rounded-lg bg-[#fbf8f1] p-8 text-[#1a1d23] shadow-xl print:max-w-none print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-[#c8922a]/40 pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-[0.3em] text-[#c8922a]">FINLAB PH · BETA REPORT</div>
            <h1 className="mt-1 text-2xl font-bold">
              {fmtDate(from, { month: 'long', day: 'numeric' })} to {fmtDate(to, { month: 'long', day: 'numeric', year: 'numeric' })}
            </h1>
          </div>
          <div className="text-right text-xs text-[#6b6f78]">Generated {fmtDate(to, { month: 'short', day: 'numeric' })}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['New sign-ups', signups],
            ['Active this week', d.active_7d],
            ['XP earned', xp.toLocaleString()],
            ['Finished checklist', `${finished} / ${testers.length}`],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-md border border-[#e6dccb] bg-white/60 p-3">
              <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#6b6f78]">{label}</div>
              <div className="mt-1 font-mono text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6b6f78]">How far people got</h2>
            <ul className="mt-2 space-y-2">
              {funnel.map((f) => (
                <li key={f.step}>
                  <div className="flex justify-between text-sm">
                    <span>{f.step}</span>
                    <span className="font-mono">{f.users}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#ece4d6]">
                    <div className="h-full rounded-full bg-[#c8922a]" style={{ width: `${Math.round((f.users / top) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6b6f78]">Programs</h2>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#6b6f78]">
                  <th className="pb-1 font-medium">Program</th>
                  <th className="pb-1 text-right font-medium">Enrolled</th>
                  <th className="pb-1 text-right font-medium">Done</th>
                </tr>
              </thead>
              <tbody>
                {topPrograms.map((p) => (
                  <tr key={p.title} className="border-t border-[#ece4d6]">
                    <td className="py-1 pr-2">{p.title}</td>
                    <td className="py-1 text-right font-mono">{p.enrolled}</td>
                    <td className="py-1 text-right font-mono">{p.completed}</td>
                  </tr>
                ))}
                {!topPrograms.length && (
                  <tr>
                    <td colSpan={3} className="py-2 text-[#6b6f78]">No enrollments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6b6f78]">Hardest question</h2>
            {hardest ? (
              <p className="mt-2 text-sm">
                <span className="font-semibold">{hardest.lesson}:</span> {hardest.prompt ?? hardest.question}{' '}
                <span className="text-[#6b6f78]">
                  ({Math.round(Number(hardest.pct_correct))}% right over {hardest.attempts} attempts)
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#6b6f78]">Not enough answers yet.</p>
            )}
          </section>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6b6f78]">Beta testers</h2>
            <p className="mt-2 text-sm">
              {testers.length} tester{testers.length === 1 ? '' : 's'}, {finished} finished the checklist, {certs} certificate{certs === 1 ? '' : 's'} issued.{' '}
              {d.pending.feedback ? `${d.pending.feedback} feedback message${Number(d.pending.feedback) === 1 ? '' : 's'} to read.` : ''}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

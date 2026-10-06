import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, CalendarCheck, Filter, GraduationCap, HelpCircle, ListChecks } from 'lucide-react';
import { getAdminAnalytics } from '@/services/api/engage';
import { Stat } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Segmented, Table, Td, Th } from '@/components/ui/misc';
import { ErrorState, PageSkeleton } from '@/components/ui/states';
import { fmtDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const AXIS = { stroke: '#5d6978', fontSize: 11, tickLine: false, axisLine: false } as const;
const TOOLTIP = {
  contentStyle: { background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 },
  labelStyle: { color: '#8b98a8' },
  cursor: { fill: '#ffffff08' },
} as const;

function pctTone(p: number) {
  return p < 50 ? 'text-down' : p < 70 ? 'text-amber-400' : 'text-up';
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<'7' | '30' | '90'>('30');
  const q = useQuery({ queryKey: ['admin', 'analytics', days], queryFn: () => getAdminAnalytics(Number(days)) });

  if (q.isPending) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const a = q.data;
  const series = a.days.map((d) => ({ ...d, label: fmtDate(d.date, { month: 'short', day: 'numeric' }) }));
  const totalXp = a.days.reduce((s, d) => s + Number(d.xp), 0);
  const signups = a.days.reduce((s, d) => s + Number(d.signups), 0);
  const funnelTop = Math.max(1, Number(a.funnel[0]?.users ?? 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Engagement and learning analytics, calculated live from activity. Times in Manila.</p>
        <Segmented
          value={days}
          onChange={setDays}
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Active · 7 days" value={a.active_7d} sub={`${a.active_30d} in 30 days`} />
        <Stat label={`Sign-ups · ${days}d`} value={signups} sub={`${a.funnel[0]?.users ?? 0} total`} />
        <Stat label={`XP earned · ${days}d`} value={totalXp.toLocaleString()} sub="all activity types" />
        <Stat label="Daily challenge today" value={a.daily.answered_today} sub={`${a.daily.correct_today} correct`} />
        <Stat
          label="Waiting on you"
          value={a.pending.submissions + a.pending.capstones + a.pending.feedback}
          sub={
            <span className="flex flex-wrap gap-x-2">
              <Link to="/admin/submissions" className="text-accent hover:underline">{a.pending.submissions} reviews</Link>
              <Link to="/admin/capstones" className="text-accent hover:underline">{a.pending.capstones} capstones</Link>
              <Link to="/admin/feedback" className="text-accent hover:underline">{a.pending.feedback} feedback</Link>
            </span>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Daily active users & sign-ups" icon={<Activity className="h-3.5 w-3.5" />} />
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5a524" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f5a524" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1c2430" vertical={false} />
                <XAxis dataKey="label" {...AXIS} minTickGap={24} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...TOOLTIP} />
                <Area type="monotone" dataKey="active" name="Active users" stroke="#f5a524" fill="url(#gActive)" strokeWidth={2} />
                <Area type="monotone" dataKey="signups" name="Sign-ups" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="XP earned per day" icon={<CalendarCheck className="h-3.5 w-3.5" />} />
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid stroke="#1c2430" vertical={false} />
                <XAxis dataKey="label" {...AXIS} minTickGap={24} />
                <YAxis {...AXIS} allowDecimals={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="xp" name="XP" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Learner funnel (all time)" icon={<Filter className="h-3.5 w-3.5" />} subtitle="Where people drop off" />
          <CardContent className="space-y-2.5">
            {a.funnel.map((f, i) => {
              const pct = (Number(f.users) / funnelTop) * 100;
              const prev = i ? Number(a.funnel[i - 1].users) : null;
              const conv = prev ? (Number(f.users) / prev) * 100 : null;
              return (
                <div key={f.step}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{f.step}</span>
                    <span className="font-mono text-xs text-fg-muted">
                      {f.users}
                      {conv !== null && <span className="ml-2 text-fg-subtle">{conv.toFixed(0)}% of previous</span>}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded bg-surface-3">
                    <div className="h-full rounded bg-accent/80" style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Programs" icon={<GraduationCap className="h-3.5 w-3.5" />} />
          <Table>
            <thead>
              <tr>
                <Th>Program</Th>
                <Th align="right">Enrolled</Th>
                <Th align="right">Completed</Th>
                <Th align="right">Rate</Th>
              </tr>
            </thead>
            <tbody>
              {a.programs.map((p) => (
                <tr key={p.title}>
                  <Td>
                    {p.title} <Badge tone={p.kind === 'certification' ? 'accent' : 'info'}>{p.kind}</Badge>
                  </Td>
                  <Td align="right" mono>{p.enrolled}</Td>
                  <Td align="right" mono>{p.completed}</Td>
                  <Td align="right" mono>{p.enrolled ? `${Math.round((p.completed / p.enrolled) * 100)}%` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Hardest knowledge-check questions"
          subtitle="Lowest % correct (questions with 3+ attempts in the period). Low scores often mean a confusing question or a gap in the lesson."
          icon={<HelpCircle className="h-3.5 w-3.5" />}
        />
        {!a.hardest_questions.length ? (
          <CardContent>
            <p className="text-sm text-fg-muted">Not enough attempts yet — each question needs at least 3 attempts in this period.</p>
          </CardContent>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lesson</Th>
                <Th>Question</Th>
                <Th align="right">Attempts</Th>
                <Th align="right">Correct</Th>
              </tr>
            </thead>
            <tbody>
              {a.hardest_questions.map((h) => (
                <tr key={`${h.lesson_slug}-${h.question}`}>
                  <Td className="whitespace-nowrap">
                    <Link to={`/learn/${h.lesson_slug}`} className="hover:text-accent">
                      {h.lesson}
                    </Link>
                  </Td>
                  <Td className="text-fg-muted">
                    <span className="font-mono text-xs text-fg-subtle">{h.question}</span> {h.prompt}
                  </Td>
                  <Td align="right" mono>{h.attempts}</Td>
                  <Td align="right" mono className={pctTone(Number(h.pct_correct))}>
                    {Number(h.pct_correct).toFixed(0)}%
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Hardest challenge tasks" subtitle="Lowest average % of points (final scores, 3+ attempts)" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
          {!a.hardest_tasks.length ? (
            <CardContent>
              <p className="text-sm text-fg-muted">Not enough scored attempts yet.</p>
            </CardContent>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Challenge · task</Th>
                  <Th align="right">Attempts</Th>
                  <Th align="right">Avg</Th>
                </tr>
              </thead>
              <tbody>
                {a.hardest_tasks.map((t) => (
                  <tr key={`${t.challenge}-${t.task}`}>
                    <Td>
                      {t.challenge}
                      <div className="text-xs text-fg-subtle">{t.task}</div>
                    </Td>
                    <Td align="right" mono>{t.attempts}</Td>
                    <Td align="right" mono className={pctTone(Number(t.avg_pct))}>
                      {Number(t.avg_pct).toFixed(0)}%
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader title="Practice activities" subtitle="Attempts and average score in the period" icon={<ListChecks className="h-3.5 w-3.5" />} />
          <div className="max-h-[28rem] overflow-y-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Activity</Th>
                  <Th align="right">Attempts</Th>
                  <Th align="right">Avg</Th>
                </tr>
              </thead>
              <tbody>
                {a.activities.map((x) => (
                  <tr key={`${x.lesson}-${x.title}`}>
                    <Td>
                      {x.title}
                      <div className="text-xs text-fg-subtle">
                        {x.lesson} · {x.kind.replace('_', ' ')}
                      </div>
                    </Td>
                    <Td align="right" mono>{x.attempts}</Td>
                    <Td align="right" mono className={cn(x.avg_score !== null && pctTone(Number(x.avg_score)))}>
                      {x.avg_score === null ? '—' : `${Number(x.avg_score).toFixed(0)}`}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

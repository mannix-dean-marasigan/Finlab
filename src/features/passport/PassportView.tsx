import { Link } from 'react-router';
import {
  Award, BarChart3, Building2, Calculator, FileText, Globe2, GraduationCap, MapPin, Presentation, Swords, Target, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import type { Passport } from '@/types/domain';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon, RatingBadge, ScorePill, ScoreRing } from '@/components/common';
import { SkillBars, SkillRadar } from '@/components/SkillChart';
import { fmtDate, fmtMoney, fmtNumber } from '@/lib/format';
import { upsidePct } from '@/lib/finance/valuation';
import { Delta } from '@/components/common';
import { cn, initials } from '@/lib/utils';

const TIER = { bronze: 'text-amber-600 border-amber-700/40 bg-amber-700/10', silver: 'text-slate-300 border-slate-400/30 bg-slate-400/10', gold: 'text-accent border-accent/40 bg-accent-muted', platinum: 'text-violet border-violet/40 bg-violet/10' } as const;

const COUNTRY: Record<string, string> = { PH: 'Philippines', SG: 'Singapore', US: 'United States', MY: 'Malaysia', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam', HK: 'Hong Kong', JP: 'Japan', IN: 'India', AU: 'Australia', GB: 'United Kingdom', CA: 'Canada', AE: 'UAE' };

function rankText(r: { rank: number | null; total: number } | null | undefined) {
  if (!r?.rank) return { main: 'Unranked', sub: 'No scored work yet' };
  const pct = (r.rank / r.total) * 100;
  return { main: `#${r.rank}`, sub: `of ${r.total}${r.total >= 10 ? ` · top ${Math.max(1, Math.ceil(pct))}%` : ''}` };
}

/** Recruiter-facing proof-of-work profile. Used for /passport and /p/:handle. */
export function PassportView({ passport, publicLinks }: { passport: Passport; publicLinks?: boolean }) {
  const { profile, stats, ranks, counts } = passport;
  const g = rankText(ranks.global);
  const c = rankText(ranks.country);
  const workBase = `/p/${profile.handle}`;
  const pitchHref = (id: string) => (publicLinks ? `${workBase}/pitch/${id}` : `/pitches/${id}`);
  const researchHref = (id: string) => (publicLinks ? `${workBase}/research/${id}` : `/research/${id}`);
  const activity: [string, number, React.ComponentType<{ className?: string }>][] = [
    ['Stock pitches', counts.stock_pitches, Presentation],
    ['Research reports', counts.research_reports, FileText],
    ['Valuation models', counts.valuation_models, Calculator],
    ['Challenges', counts.challenges, Target],
    ['Portfolio decisions', counts.portfolio_trades, TrendingUp],
    ['Competitions', counts.competitions, Swords],
    ['Financial models', counts.financial_models, BarChart3],
    ['Market-event calls', counts.market_decisions, Zap],
  ];

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent-muted font-mono text-2xl font-semibold text-accent">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-accent">Finance Passport</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{profile.full_name}</h1>
              {profile.headline && <p className="mt-1 text-fg-muted">{profile.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {stats.career_level}
                </span>
                {passport.specialization && (
                  <span className="inline-flex items-center gap-1.5">
                    <DynamicIcon name={passport.specialization.icon} className="h-4 w-4" /> {passport.specialization.name}
                  </span>
                )}
                {profile.university && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> {profile.university}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {COUNTRY[profile.country_code] ?? profile.country_code}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ScoreRing value={Number(stats.finlab_score)} size={116} sub="FINLAB" />
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-fg-subtle">
                  <Globe2 className="h-3 w-3" /> Global
                </div>
                <div className="font-mono text-xl font-semibold">{g.main}</div>
                <div className="text-xs text-fg-muted">{g.sub}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-fg-subtle">
                  <MapPin className="h-3 w-3" /> {COUNTRY[profile.country_code] ?? profile.country_code}
                </div>
                <div className="font-mono text-xl font-semibold">{c.main}</div>
                <div className="text-xs text-fg-muted">{c.sub}</div>
              </div>
            </div>
          </div>
        </div>
        {profile.bio && <div className="relative border-t border-border px-6 py-4 text-sm text-fg-muted sm:px-8">{profile.bio}</div>}
      </Card>

      {/* Activity counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {activity.map(([label, n, Icon]) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-4">
            <Icon className="h-4 w-4 text-fg-subtle" />
            <div className="mt-2 font-mono text-2xl font-semibold tabular">{fmtNumber(n, 0)}</div>
            <div className="text-xs text-fg-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Skill profile" subtitle={`${stats.scored_activity_count} scored activities`} />
          <CardContent className="grid items-center gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <SkillRadar data={passport.skills.map((s) => ({ ...s, weight: Number(s.weight), score: Number(s.score) }))} height={240} />
            <SkillBars data={passport.skills.map((s) => ({ ...s, weight: Number(s.weight), score: Number(s.score) }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title={`Achievements (${passport.achievements.length})`} icon={<Award className="h-3.5 w-3.5" />} />
          <CardContent>
            {!passport.achievements.length ? (
              <p className="text-sm text-fg-muted">No achievements yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {passport.achievements.map((a) => (
                  <div key={a.id} className={cn('flex items-center gap-3 rounded-md border p-3', TIER[a.tier])}>
                    <DynamicIcon name={a.icon} className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-fg">{a.name}</div>
                      <div className="text-xs text-fg-muted">{fmtDate(a.awarded_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Public stock pitches" icon={<Presentation className="h-3.5 w-3.5" />} />
          <CardContent className="space-y-2">
            {!passport.public_pitches.length ? (
              <p className="text-sm text-fg-muted">No public pitches.</p>
            ) : (
              passport.public_pitches.map((p) => (
                <Link key={p.id} to={pitchHref(p.id)} className="flex items-center gap-3 rounded-md border border-border p-3 hover:border-border-strong">
                  <span className="w-14 font-mono font-semibold">{p.ticker}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{p.company}</span>
                  <RatingBadge rating={p.rating} />
                  <span className="hidden font-mono text-xs sm:inline">{fmtMoney(p.target_price, p.currency)}</span>
                  <Delta value={upsidePct(Number(p.target_price), Number(p.current_price))} className="hidden text-xs sm:inline-flex" />
                  <ScorePill score={p.score} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Public research" icon={<FileText className="h-3.5 w-3.5" />} />
          <CardContent className="space-y-2">
            {!passport.public_research.length ? (
              <p className="text-sm text-fg-muted">No public research.</p>
            ) : (
              passport.public_research.map((r) => (
                <Link key={r.id} to={researchHref(r.id)} className="flex items-center gap-3 rounded-md border border-border p-3 hover:border-border-strong">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="text-xs text-fg-muted">
                      {r.company} {r.ticker && `(${r.ticker})`} · {fmtDate(r.submitted_at)}
                    </span>
                  </span>
                  <RatingBadge rating={r.rating} />
                  <ScorePill score={r.score} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Competition record" icon={<Trophy className="h-3.5 w-3.5" />} />
        <CardContent>
          {!passport.competition_record.length ? (
            <p className="text-sm text-fg-muted">No finalized competition results yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {passport.competition_record.map((r) => (
                <div key={r.competition_id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-fg-muted">{fmtDate(r.ended_at)} · {fmtNumber(r.score, 1)} pts</div>
                  </div>
                  <Badge tone={r.rank === 1 ? 'accent' : r.rank <= 3 ? 'up' : 'neutral'} className="font-mono">
                    #{r.rank}/{r.participants}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-fg-subtle">
        Every number on this passport is calculated by FINLAB from submitted, scored work. Users cannot edit scores, ranks or achievements. Member since {fmtDate(profile.member_since)}.
      </p>
    </div>
  );
}

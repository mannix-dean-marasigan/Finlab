import { supabase, unwrap } from '@/lib/supabase';
import type { Profile, UserPreferences, UserSkill, UserStats, UserAchievement } from '@/types/domain';

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()) as Profile | null;
}

export async function fetchIsAdmin(userId: string): Promise<boolean> {
  const rows = unwrap(await supabase.from('user_roles').select('role').eq('user_id', userId)) as { role: string }[];
  return rows.some((r) => r.role === 'admin');
}

export async function fetchMyStats(userId: string): Promise<UserStats> {
  const row = unwrap(await supabase.from('user_stats').select('*').eq('user_id', userId).single()) as UserStats;
  return { ...row, finlab_score: Number(row.finlab_score) };
}

export async function fetchMySkills(userId: string): Promise<UserSkill[]> {
  const rows = unwrap(await supabase.from('user_skills').select('*').eq('user_id', userId)) as UserSkill[];
  return rows.map((r) => ({ ...r, score: Number(r.score), evidence_weight: Number(r.evidence_weight) }));
}

export async function fetchMyPreferences(userId: string): Promise<UserPreferences | null> {
  return unwrap(await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle()) as UserPreferences | null;
}

export async function fetchMyAchievements(userId: string): Promise<UserAchievement[]> {
  return unwrap(
    await supabase.from('user_achievements').select('*').eq('user_id', userId).order('awarded_at', { ascending: false }),
  ) as UserAchievement[];
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'handle' | 'full_name' | 'headline' | 'bio' | 'country_code' | 'university' | 'primary_specialization_id' | 'is_public' | 'onboarded_at'>
>;

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<void> {
  const res = await supabase.from('profiles').update(patch).eq('id', userId);
  if (res.error?.code === '23505') throw new Error('That handle is already taken.');
  if (res.error?.code === '23514') throw new Error('Handle must be 3–30 characters: lowercase letters, numbers or underscores.');
  unwrap(res);
}

export async function updatePreferences(
  userId: string,
  patch: Partial<Pick<UserPreferences, 'interests' | 'experience_level' | 'goal'>>,
): Promise<void> {
  unwrap(await supabase.from('user_preferences').update(patch).eq('user_id', userId));
}

/** Re-runs server-side progress evaluation (e.g. percentile achievements). */
export async function refreshMyProgress(): Promise<string[]> {
  return (unwrap(await supabase.rpc('refresh_my_progress')) as string[]) ?? [];
}

export interface ActivityItem {
  id: string;
  kind: 'challenge' | 'pitch' | 'research' | 'trade' | 'achievement' | 'promotion';
  title: string;
  detail: string;
  score: number | null;
  at: string;
  link: string;
}

/** Recent activity across the user's own work (small, bounded queries). */
export async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const [subs, pitches, reports, trades, promos] = await Promise.all([
    supabase
      .from('challenge_submissions')
      .select('id, challenge_id, status, final_score, submitted_at, challenges(title)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(6),
    supabase.from('stock_pitches').select('id, ticker, company, score, submitted_at').eq('user_id', userId).eq('status', 'submitted').is('challenge_id', null).order('submitted_at', { ascending: false }).limit(4),
    supabase.from('research_projects').select('id, title, score, submitted_at').eq('user_id', userId).eq('status', 'submitted').order('submitted_at', { ascending: false }).limit(4),
    supabase.from('portfolio_transactions').select('id, security_id, side, shares, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(4),
    supabase.from('promotion_attempts').select('id, passed, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
  ]);
  const items: ActivityItem[] = [];
  for (const s of (unwrap(subs) ?? []) as unknown as {
    id: string; challenge_id: string; status: string; final_score: number | null; submitted_at: string; challenges: { title: string } | null;
  }[]) {
    items.push({
      id: `s-${s.id}`,
      kind: 'challenge',
      title: s.challenges?.title ?? 'Challenge',
      detail: s.status === 'pending_review' ? 'Submitted — awaiting review' : 'Challenge scored',
      score: s.final_score !== null ? Number(s.final_score) : null,
      at: s.submitted_at,
      link: `/challenges/${s.challenge_id}?submission=${s.id}`,
    });
  }
  for (const p of (unwrap(pitches) ?? []) as { id: string; ticker: string; company: string; score: number | null; submitted_at: string }[]) {
    items.push({ id: `p-${p.id}`, kind: 'pitch', title: `${p.ticker} stock pitch`, detail: p.company, score: p.score !== null ? Number(p.score) : null, at: p.submitted_at, link: `/pitches/${p.id}` });
  }
  for (const r of (unwrap(reports) ?? []) as { id: string; title: string; score: number | null; submitted_at: string }[]) {
    items.push({ id: `r-${r.id}`, kind: 'research', title: r.title, detail: 'Research report submitted', score: r.score !== null ? Number(r.score) : null, at: r.submitted_at, link: `/research/${r.id}` });
  }
  for (const t of (unwrap(trades) ?? []) as { id: string; security_id: string; side: string; shares: number; created_at: string }[]) {
    items.push({ id: `t-${t.id}`, kind: 'trade', title: `${t.side === 'buy' ? 'Bought' : 'Sold'} ${Number(t.shares).toLocaleString()} ${t.security_id.split(':')[1]}`, detail: 'Simulated trade', score: null, at: t.created_at, link: '/portfolio' });
  }
  for (const p of (unwrap(promos) ?? []) as { id: string; passed: boolean; created_at: string }[]) {
    items.push({ id: `pr-${p.id}`, kind: 'promotion', title: p.passed ? 'Promotion passed' : 'Promotion attempt — not yet', detail: 'Career review', score: null, at: p.created_at, link: '/career' });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

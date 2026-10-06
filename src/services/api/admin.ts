// Admin data access. Every write here is authorised server-side by RLS
// (is_admin()) or by admin_* RPCs that assert admin — the UI guard is UX only.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  Achievement,
  Challenge,
  ChallengeScore,
  ChallengeSubmission,
  Competition,
  CriterionScore,
  MarketEvent,
  PromotionRequirement,
} from '@/types/domain';

export interface AdminOverview {
  users: number;
  onboarded: number;
  challenges_published: number;
  challenges_total: number;
  submissions: number;
  pending_reviews: number;
  pitches: number;
  reports: number;
  competitions: number;
  open_events: number;
}
export async function fetchAdminOverview(): Promise<AdminOverview> {
  return unwrap(await supabase.rpc('admin_overview')) as AdminOverview;
}

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  handle: string;
  country_code: string;
  university: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  finlab_score: number;
  career_level: string;
  is_admin: boolean;
  submissions: number;
  onboarded: boolean;
}
export async function adminListUsers(search: string): Promise<AdminUserRow[]> {
  return unwrap(await supabase.rpc('admin_list_users', { p_search: search || null, p_limit: 500 })) as AdminUserRow[];
}
export async function adminSetAdmin(userId: string, isAdmin: boolean) {
  unwrap(await supabase.rpc('admin_set_admin', { p_user: userId, p_is_admin: isAdmin }));
}
export async function adminRecalculateAll(): Promise<number> {
  return unwrap(await supabase.rpc('admin_recalculate_all')) as number;
}

// ------------------------------------------------------------ Challenges
export async function adminListChallenges(): Promise<Challenge[]> {
  return unwrap(await supabase.from('challenges').select('*').order('created_at', { ascending: false })) as Challenge[];
}
export async function adminGetAnswerKey(challengeId: string): Promise<Record<string, unknown>> {
  const row = unwrap(
    await supabase.from('challenge_answer_keys').select('answers').eq('challenge_id', challengeId).maybeSingle(),
  ) as { answers: Record<string, unknown> } | null;
  return row?.answers ?? {};
}
export type ChallengeInput = Omit<Challenge, 'id' | 'created_at' | 'updated_at' | 'published_at'>;
export async function adminSaveChallenge(input: ChallengeInput, answerKey: Record<string, unknown>, id?: string): Promise<string> {
  const payload = { ...input, published_at: input.is_published ? new Date().toISOString() : null };
  const res = id
    ? await supabase.from('challenges').update(payload).eq('id', id).select('id').single()
    : await supabase.from('challenges').insert(payload).select('id').single();
  if (res.error?.code === '23505') throw new Error('A challenge with this slug already exists.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('challenge_answer_keys').upsert({ challenge_id: saved.id, answers: answerKey }));
  return saved.id;
}
export async function adminSetPublished(id: string, published: boolean) {
  unwrap(
    await supabase
      .from('challenges')
      .update({ is_published: published, published_at: published ? new Date().toISOString() : null })
      .eq('id', id),
  );
}
export async function adminDeleteChallenge(id: string) {
  unwrap(await supabase.from('challenges').delete().eq('id', id));
}

// ------------------------------------------------------------ Submissions review
export interface AdminSubmission extends ChallengeSubmission {
  challenge: Pick<Challenge, 'id' | 'title' | 'kind' | 'content' | 'scoring_method' | 'category_id'> | null;
  profile: { full_name: string; handle: string } | null;
  scores: ChallengeScore[];
}
export async function adminListSubmissions(status: 'pending_review' | 'scored' | 'all'): Promise<AdminSubmission[]> {
  let q = supabase
    .from('challenge_submissions')
    .select('*, challenge:challenges(id, title, kind, content, scoring_method, category_id), profile:profiles(full_name, handle), scores:challenge_scores(*)')
    .order('submitted_at', { ascending: false })
    .limit(200);
  if (status !== 'all') q = q.eq('status', status);
  const rows = unwrap(await q) as AdminSubmission[];
  return rows.map((r) => ({
    ...r,
    final_score: r.final_score === null ? null : Number(r.final_score),
    scores: (r.scores ?? []).map((s) => ({ ...s, total_score: Number(s.total_score) })).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }));
}
export async function adminScoreSubmission(submissionId: string, criteria: CriterionScore[], feedback: string) {
  return unwrap(
    await supabase.rpc('admin_score_submission', { p_submission: submissionId, p_criteria: criteria, p_feedback: feedback }),
  ) as { score: number };
}

// ------------------------------------------------------------ Competitions
export async function adminListCompetitions(): Promise<Competition[]> {
  return unwrap(await supabase.from('competitions').select('*').order('starts_at', { ascending: false })) as Competition[];
}
export type CompetitionInput = Pick<
  Competition,
  'slug' | 'name' | 'description' | 'rules' | 'starts_at' | 'ends_at' | 'registration_deadline' | 'participant_limit' | 'scoring_method' | 'is_published'
>;
export async function adminSaveCompetition(input: CompetitionInput, challengeIds: string[], id?: string): Promise<string> {
  const res = id
    ? await supabase.from('competitions').update(input).eq('id', id).select('id').single()
    : await supabase.from('competitions').insert(input).select('id').single();
  if (res.error?.code === '23505') throw new Error('A competition with this slug already exists.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('competition_challenges').delete().eq('competition_id', saved.id));
  if (challengeIds.length) {
    unwrap(
      await supabase
        .from('competition_challenges')
        .insert(challengeIds.map((cid, i) => ({ competition_id: saved.id, challenge_id: cid, position: i + 1, weight: 1 }))),
    );
  }
  return saved.id;
}
export async function adminCompetitionChallengeIds(id: string): Promise<string[]> {
  const rows = unwrap(await supabase.from('competition_challenges').select('challenge_id').eq('competition_id', id).order('position')) as {
    challenge_id: string;
  }[];
  return rows.map((r) => r.challenge_id);
}
export async function adminFinalizeCompetition(id: string): Promise<number> {
  return unwrap(await supabase.rpc('admin_finalize_competition', { p_competition: id })) as number;
}
export async function adminDeleteCompetition(id: string) {
  unwrap(await supabase.from('competitions').delete().eq('id', id));
}

// ------------------------------------------------------------ Achievements
export async function adminSaveAchievement(a: Achievement, isNew: boolean) {
  const res = isNew ? await supabase.from('achievements').insert(a) : await supabase.from('achievements').update(a).eq('id', a.id);
  if (res.error?.code === '23505') throw new Error('An achievement with this id already exists.');
  unwrap(res);
}
export async function adminAwardAchievement(userId: string, achievementId: string, note: string) {
  unwrap(await supabase.rpc('admin_award_achievement', { p_user: userId, p_achievement: achievementId, p_note: note || null }));
}
export async function adminAchievementCounts(): Promise<Record<string, number>> {
  const rows = unwrap(await supabase.from('user_achievements').select('achievement_id')) as { achievement_id: string }[];
  return rows.reduce<Record<string, number>>((acc, r) => ((acc[r.achievement_id] = (acc[r.achievement_id] ?? 0) + 1), acc), {});
}

// ------------------------------------------------------------ Promotion requirements
export async function adminListRequirements(): Promise<PromotionRequirement[]> {
  return unwrap(
    await supabase.from('promotion_requirements').select('*').order('target_level_id').order('sort_order'),
  ) as PromotionRequirement[];
}
export async function adminSaveRequirement(r: Omit<PromotionRequirement, 'id'>, id?: string) {
  unwrap(id ? await supabase.from('promotion_requirements').update(r).eq('id', id) : await supabase.from('promotion_requirements').insert(r));
}
export async function adminDeleteRequirement(id: string) {
  unwrap(await supabase.from('promotion_requirements').delete().eq('id', id));
}

// ------------------------------------------------------------ Market events
export interface EventKey {
  best_actions: string[];
  acceptable_actions: string[];
  keywords: string[];
}
export async function adminListEvents(): Promise<(MarketEvent & { key: EventKey | null; decisions: number })[]> {
  const rows = unwrap(
    await supabase
      .from('market_events')
      .select('*, key:market_event_keys(best_actions, acceptable_actions, keywords), decisions:market_event_decisions(count)')
      .order('created_at', { ascending: false }),
  ) as (MarketEvent & { key: EventKey | EventKey[] | null; decisions: { count: number }[] })[];
  return rows.map((r) => ({
    ...r,
    key: Array.isArray(r.key) ? (r.key[0] ?? null) : r.key,
    decisions: r.decisions?.[0]?.count ?? 0,
  }));
}
export type EventInput = Pick<
  MarketEvent,
  'title' | 'description' | 'category' | 'region' | 'affected_securities' | 'price_impacts' | 'status' | 'closes_at'
>;
export async function adminSaveEvent(input: EventInput, key: EventKey, id?: string): Promise<string> {
  const res = id
    ? await supabase.from('market_events').update(input).eq('id', id).select('id').single()
    : await supabase.from('market_events').insert(input).select('id').single();
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('market_event_keys').upsert({ event_id: saved.id, ...key }));
  return saved.id;
}
export async function adminResolveEvent(id: string, summary: string): Promise<number> {
  return unwrap(await supabase.rpc('admin_resolve_market_event', { p_event: id, p_summary: summary })) as number;
}

// ------------------------------------------------------------ Market data (sample)
export async function adminUpdateSecurityPrice(id: string, price: number, prevClose: number | null) {
  unwrap(
    await supabase
      .from('market_securities')
      .update({ price, prev_close: prevClose, data_as_of: new Date().toISOString().slice(0, 10), data_source: 'manual' })
      .eq('id', id),
  );
}

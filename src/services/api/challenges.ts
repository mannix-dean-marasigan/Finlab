import { supabase, unwrap } from '@/lib/supabase';
import type { Challenge, ChallengeAttempt, ChallengeScore, ChallengeSubmission, SubmitResult } from '@/types/domain';

const CHALLENGE_LIST_COLUMNS =
  'id, slug, title, summary, category_id, kind, pitch_format, difficulty, estimated_minutes, time_limit_minutes, duration_days, points, passing_score, scoring_method, skill_impact, tags, is_published, max_attempts, created_at, updated_at, published_at';

export async function listChallenges(): Promise<Challenge[]> {
  return unwrap(
    await supabase.from('challenges').select(CHALLENGE_LIST_COLUMNS).eq('is_published', true).order('created_at'),
  ) as unknown as Challenge[];
}

export async function getChallenge(idOrSlug: string): Promise<Challenge | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const q = supabase.from('challenges').select('*');
  return unwrap(await (isUuid ? q.eq('id', idOrSlug) : q.eq('slug', idOrSlug)).maybeSingle()) as Challenge | null;
}

export interface MyChallengeState {
  challenge_id: string;
  best_score: number | null;
  submissions: number;
  pending: number;
  in_progress: boolean;
}

/** Per-challenge status for the signed-in user (best score, in progress, pending). */
export async function fetchMyChallengeStates(userId: string): Promise<Record<string, MyChallengeState>> {
  const [subs, attempts] = await Promise.all([
    supabase.from('challenge_submissions').select('challenge_id, status, final_score').eq('user_id', userId),
    supabase.from('challenge_attempts').select('challenge_id, status').eq('user_id', userId).eq('status', 'in_progress'),
  ]);
  const map: Record<string, MyChallengeState> = {};
  const get = (id: string) => (map[id] ??= { challenge_id: id, best_score: null, submissions: 0, pending: 0, in_progress: false });
  for (const s of unwrap(subs) as { challenge_id: string; status: string; final_score: number | null }[]) {
    const st = get(s.challenge_id);
    st.submissions++;
    if (s.status === 'pending_review') st.pending++;
    if (s.final_score !== null) st.best_score = Math.max(st.best_score ?? 0, Number(s.final_score));
  }
  for (const a of unwrap(attempts) as { challenge_id: string }[]) get(a.challenge_id).in_progress = true;
  return map;
}

export async function getOpenAttempt(userId: string, challengeId: string, competitionId: string | null): Promise<ChallengeAttempt | null> {
  let q = supabase.from('challenge_attempts').select('*').eq('user_id', userId).eq('challenge_id', challengeId).eq('status', 'in_progress');
  q = competitionId ? q.eq('competition_id', competitionId) : q.is('competition_id', null);
  return unwrap(await q.maybeSingle()) as ChallengeAttempt | null;
}

/** The challenge attempt (if any) that owns a pitch or research project. */
export async function getAttemptForWork(work: { pitchId?: string; projectId?: string }): Promise<ChallengeAttempt | null> {
  const q = supabase.from('challenge_attempts').select('*');
  const rows = unwrap(
    await (work.pitchId ? q.eq('stock_pitch_id', work.pitchId) : q.eq('research_project_id', work.projectId!))
      .order('started_at', { ascending: false })
      .limit(1),
  ) as ChallengeAttempt[];
  return rows[0] ?? null;
}

export async function startChallenge(challengeId: string, competitionId: string | null): Promise<string> {
  return unwrap(await supabase.rpc('start_challenge', { p_challenge: challengeId, p_competition: competitionId })) as string;
}

export async function saveChallengeDraft(attemptId: string, responses: Record<string, string>): Promise<string> {
  return unwrap(await supabase.rpc('save_challenge_draft', { p_attempt: attemptId, p_responses: responses })) as string;
}

export async function abandonAttempt(attemptId: string): Promise<void> {
  unwrap(await supabase.rpc('abandon_challenge_attempt', { p_attempt: attemptId }));
}

export async function submitChallenge(attemptId: string, responses: Record<string, string> | null): Promise<SubmitResult> {
  return unwrap(await supabase.rpc('submit_challenge', { p_attempt: attemptId, p_responses: responses })) as SubmitResult;
}

export interface SubmissionWithScore extends ChallengeSubmission {
  scores: ChallengeScore[];
}

export async function listMySubmissions(userId: string, challengeId: string): Promise<SubmissionWithScore[]> {
  const rows = unwrap(
    await supabase
      .from('challenge_submissions')
      .select('*, scores:challenge_scores(*)')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .order('submitted_at', { ascending: false }),
  ) as SubmissionWithScore[];
  return rows.map((r) => ({
    ...r,
    final_score: r.final_score !== null ? Number(r.final_score) : null,
    scores: (r.scores ?? []).map((s) => ({ ...s, total_score: Number(s.total_score) })).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  }));
}

/** The next published challenge the user hasn't passed, matched to interests. */
export async function fetchRecommendedChallenge(
  userId: string,
  interests: string[],
): Promise<Challenge | null> {
  const [challenges, states] = await Promise.all([listChallenges(), fetchMyChallengeStates(userId)]);
  const interestCategory: Record<string, string[]> = {
    equity_research: ['equity_research', 'stock_pitch', 'valuation'],
    asset_management: ['portfolio_management', 'financial_analysis'],
    portfolio_management: ['portfolio_management'],
    investment_banking: ['investment_banking', 'valuation'],
    corporate_finance: ['financial_analysis', 'case_competition', 'accounting'],
    venture_capital: ['valuation', 'case_competition'],
  };
  const preferred = new Set(interests.flatMap((i) => interestCategory[i] ?? []));
  const order = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 } as const;
  const open = challenges.filter((c) => {
    const s = states[c.id];
    return !s || s.best_score === null || s.best_score < c.passing_score;
  });
  open.sort((a, b) => {
    const ip = Number(states[b.id]?.in_progress ?? false) - Number(states[a.id]?.in_progress ?? false);
    if (ip) return ip;
    const pref = Number(preferred.has(b.category_id)) - Number(preferred.has(a.category_id));
    if (pref) return pref;
    return order[a.difficulty] - order[b.difficulty];
  });
  return open[0] ?? null;
}

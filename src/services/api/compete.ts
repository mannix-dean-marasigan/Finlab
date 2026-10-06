// Competitions, leaderboards, ranks, passport and career promotion.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  Challenge,
  Competition,
  CompetitionStatus,
  LeaderboardBoard,
  LeaderboardRow,
  MyRanks,
  Passport,
  PromotionAttempt,
  PromotionRequirement,
  PromotionStatus,
  StandingRow,
} from '@/types/domain';

export function competitionStatus(c: Pick<Competition, 'starts_at' | 'ends_at'>, now = Date.now()): CompetitionStatus {
  if (now < new Date(c.starts_at).getTime()) return 'upcoming';
  if (now <= new Date(c.ends_at).getTime()) return 'active';
  return 'completed';
}

export async function listCompetitions(): Promise<(Competition & { participant_count: number })[]> {
  const rows = unwrap(
    await supabase.from('competitions').select('*, participants:competition_participants(count)').order('starts_at', { ascending: false }),
  ) as (Competition & { participants: { count: number }[] })[];
  return rows.map(({ participants, ...c }) => ({ ...c, participant_count: participants?.[0]?.count ?? 0 }));
}

export async function getCompetition(id: string): Promise<{
  competition: Competition;
  challenges: (Pick<Challenge, 'id' | 'title' | 'summary' | 'category_id' | 'difficulty' | 'estimated_minutes' | 'kind'> & { weight: number })[];
  participantCount: number;
} | null> {
  const comp = unwrap(await supabase.from('competitions').select('*').eq('id', id).maybeSingle()) as Competition | null;
  if (!comp) return null;
  const [cc, count] = await Promise.all([
    supabase
      .from('competition_challenges')
      .select('weight, position, challenge:challenges(id, title, summary, category_id, difficulty, estimated_minutes, kind)')
      .eq('competition_id', id)
      .order('position'),
    supabase.from('competition_participants').select('*', { count: 'exact', head: true }).eq('competition_id', id),
  ]);
  if (count.error) throw new Error(count.error.message);
  const rows = unwrap(cc) as unknown as { weight: number; challenge: Challenge }[];
  return {
    competition: comp,
    challenges: rows.filter((r) => r.challenge).map((r) => ({ ...r.challenge, weight: Number(r.weight) })),
    participantCount: count.count ?? 0,
  };
}

export async function isRegistered(competitionId: string, userId: string): Promise<boolean> {
  const rows = unwrap(
    await supabase.from('competition_participants').select('user_id').eq('competition_id', competitionId).eq('user_id', userId),
  ) as unknown[];
  return rows.length > 0;
}

export async function myCompetitionIds(userId: string): Promise<string[]> {
  const rows = unwrap(await supabase.from('competition_participants').select('competition_id').eq('user_id', userId)) as {
    competition_id: string;
  }[];
  return rows.map((r) => r.competition_id);
}

export async function registerForCompetition(id: string) {
  unwrap(await supabase.rpc('register_for_competition', { p_competition: id }));
}
export async function withdrawFromCompetition(id: string) {
  unwrap(await supabase.rpc('withdraw_from_competition', { p_competition: id }));
}

export async function fetchStandings(id: string): Promise<StandingRow[]> {
  const rows = unwrap(await supabase.rpc('get_competition_standings', { p_competition: id })) as StandingRow[];
  return rows.map((r) => ({ ...r, rank: Number(r.rank), score: Number(r.score), challenges_completed: Number(r.challenges_completed) }));
}

// ------------------------------------------------------------ Leaderboards
export async function fetchLeaderboard(board: LeaderboardBoard, filter?: string | null, limit = 100): Promise<LeaderboardRow[]> {
  const rows = unwrap(
    await supabase.rpc('get_leaderboard', { p_board: board, p_filter: filter ?? null, p_limit: limit }),
  ) as LeaderboardRow[];
  return rows.map((r) => ({ ...r, rank: Number(r.rank), value: Number(r.value) }));
}

export async function fetchUniversities(): Promise<{ university: string; members: number }[]> {
  return unwrap(await supabase.rpc('list_universities')) as { university: string; members: number }[];
}

export async function fetchMyRanks(): Promise<MyRanks> {
  return unwrap(await supabase.rpc('get_my_ranks')) as MyRanks;
}

export async function fetchPassport(handle: string): Promise<Passport | null> {
  return unwrap(await supabase.rpc('get_passport', { p_handle: handle })) as Passport | null;
}

// ------------------------------------------------------------ Career
export async function fetchPromotionStatus(): Promise<PromotionStatus> {
  return unwrap(await supabase.rpc('get_promotion_status', { p_user: null })) as PromotionStatus;
}

export async function attemptPromotion(): Promise<{ result: 'PASS' | 'NOT_YET'; status: PromotionStatus }> {
  return unwrap(await supabase.rpc('attempt_promotion')) as { result: 'PASS' | 'NOT_YET'; status: PromotionStatus };
}

export async function fetchPromotionHistory(userId: string): Promise<PromotionAttempt[]> {
  return unwrap(
    await supabase.from('promotion_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ) as PromotionAttempt[];
}

export async function fetchAllPromotionRequirements(): Promise<PromotionRequirement[]> {
  return unwrap(
    await supabase.from('promotion_requirements').select('*').eq('is_active', true).order('target_level_id').order('sort_order'),
  ) as PromotionRequirement[];
}

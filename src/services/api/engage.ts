// Engagement: flashcards, peer review, capstones, daily challenge, XP/streaks, analytics.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  AdminAnalytics, AdminCapstoneRow, CapstoneRubricItem, DailyChallenge, FlashcardItem, FlashcardStats, MyActivity, PeerReview,
  PeerReviewCriterion, ProgramLeaderRow, ReviewQueueItem, TodayItem, XpLeaderRow,
} from '@/types/domain';

// ------------------------------------------------------------ Flashcards
export async function getFlashcardQueue(lessonId: string | null, limit = 20): Promise<FlashcardItem[]> {
  const rows = unwrap(await supabase.rpc('get_flashcard_queue', { p_lesson: lessonId, p_limit: limit })) as FlashcardItem[];
  return rows.map((r) => ({ ...r, interval_days: Number(r.interval_days) }));
}

export async function getFlashcardStats(): Promise<FlashcardStats> {
  return unwrap(await supabase.rpc('flashcard_stats')) as FlashcardStats;
}

/** grade: 0 again · 1 hard · 2 good · 3 easy */
export async function reviewFlashcard(cardId: string, grade: 0 | 1 | 2 | 3): Promise<{ interval_days: number; due_at: string }> {
  return unwrap(await supabase.rpc('review_flashcard', { p_card: cardId, p_grade: grade })) as { interval_days: number; due_at: string };
}

export async function flashcardCountsByLesson(): Promise<Record<string, number>> {
  const rows = unwrap(await supabase.from('flashcards').select('lesson_id')) as { lesson_id: string }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.lesson_id] = (out[r.lesson_id] ?? 0) + 1;
  return out;
}

// ------------------------------------------------------------ Peer review
export const PEER_CRITERIA: { key: PeerReviewCriterion; label: string; hint: string }[] = [
  { key: 'thesis', label: 'Thesis', hint: 'Clear, specific, differentiated from consensus' },
  { key: 'financial_analysis', label: 'Financial analysis', hint: 'Uses the numbers correctly and meaningfully' },
  { key: 'valuation', label: 'Valuation', hint: 'Method fits the business; target price is justified' },
  { key: 'risk', label: 'Risks', hint: 'Real risks, with what would make the thesis wrong' },
  { key: 'catalysts', label: 'Catalysts', hint: 'Specific, dated events' },
  { key: 'communication', label: 'Communication', hint: 'Concise, structured, persuasive' },
  { key: 'sources', label: 'Sources', hint: 'Credible primary sources cited' },
];

export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  const rows = unwrap(await supabase.rpc('get_review_queue', { p_limit: 30 })) as ReviewQueueItem[];
  return rows.map((r) => ({ ...r, reviews: Number(r.reviews) }));
}

export interface PitchForReview {
  id: string;
  format: 'quick' | 'professional';
  company: string | null;
  ticker: string | null;
  exchange: string | null;
  currency: string | null;
  rating: string | null;
  current_price: number | null;
  target_price: number | null;
  valuation_method: string | null;
  thesis: string | null;
  catalysts: string | null;
  risks: string | null;
  company_analysis: string | null;
  financial_analysis: string | null;
  forecast: string | null;
  valuation: string | null;
  variant_perception: string | null;
  submitted_at: string;
  sources: { title: string; url: string | null; publisher: string | null }[];
  already_reviewed: boolean;
}

export async function getPitchForReview(pitchId: string): Promise<PitchForReview | null> {
  return unwrap(await supabase.rpc('get_pitch_for_review', { p_pitch: pitchId })) as PitchForReview | null;
}

export async function submitPeerReview(pitchId: string, scores: Record<PeerReviewCriterion, number>, strengths: string, improvements: string): Promise<string> {
  return unwrap(
    await supabase.rpc('submit_peer_review', { p_pitch: pitchId, p_scores: scores, p_strengths: strengths, p_improvements: improvements }),
  ) as string;
}

export async function getPitchReviews(pitchId: string): Promise<PeerReview[]> {
  const rows = unwrap(await supabase.rpc('get_pitch_reviews', { p_pitch: pitchId })) as PeerReview[];
  return rows.map((r) => ({ ...r, overall: Number(r.overall) }));
}

export async function ratePeerReview(reviewId: string, rating: number): Promise<void> {
  unwrap(await supabase.rpc('rate_peer_review', { p_review: reviewId, p_rating: rating }));
}

export async function setPeerReviewOpen(pitchId: string, open: boolean): Promise<void> {
  unwrap(await supabase.from('stock_pitches').update({ peer_review_open: open }).eq('id', pitchId));
}

/** Reviews the signed-in user has written (RLS: own rows only). */
export async function myGivenReviews(userId: string): Promise<{ id: string; pitch_id: string; overall: number; helpful_rating: number | null; created_at: string }[]> {
  const rows = unwrap(
    await supabase.from('peer_reviews').select('id, pitch_id, overall, helpful_rating, created_at').eq('reviewer_id', userId).order('created_at', { ascending: false }),
  ) as { id: string; pitch_id: string; overall: number; helpful_rating: number | null; created_at: string }[];
  return rows.map((r) => ({ ...r, overall: Number(r.overall) }));
}

// ------------------------------------------------------------ Capstones
export async function submitCapstone(moduleId: string, videoUrl: string, slidesUrl: string, summary: string): Promise<string> {
  return unwrap(
    await supabase.rpc('submit_capstone', { p_module: moduleId, p_video_url: videoUrl.trim(), p_slides_url: slidesUrl.trim() || null, p_summary: summary }),
  ) as string;
}

export async function adminListCapstones(status: 'submitted' | 'scored' | 'returned' | 'all'): Promise<AdminCapstoneRow[]> {
  const rows = unwrap(await supabase.rpc('admin_list_capstones', { p_status: status })) as AdminCapstoneRow[];
  return rows.map((r) => ({ ...r, score: r.score === null ? null : Number(r.score) }));
}

export async function adminScoreCapstone(
  submissionId: string,
  criteria: (CapstoneRubricItem & { score: number })[],
  feedback: string,
  returnForRevision: boolean,
): Promise<{ status: string; score?: number }> {
  return unwrap(
    await supabase.rpc('admin_score_capstone', { p_submission: submissionId, p_criteria: criteria, p_feedback: feedback, p_return: returnForRevision }),
  ) as { status: string; score?: number };
}

// ------------------------------------------------------------ Daily challenge & today plan
export async function getDailyChallenge(): Promise<DailyChallenge | null> {
  return unwrap(await supabase.rpc('get_daily_challenge')) as DailyChallenge | null;
}

export async function submitDailyAnswer(response: string): Promise<DailyChallenge> {
  return unwrap(await supabase.rpc('submit_daily_answer', { p_response: response })) as DailyChallenge;
}

export async function getTodayPlan(): Promise<TodayItem[]> {
  return unwrap(await supabase.rpc('get_today_plan')) as TodayItem[];
}

// ------------------------------------------------------------ XP, streaks, leaderboards
export async function getMyActivity(): Promise<MyActivity> {
  return unwrap(await supabase.rpc('get_my_activity')) as MyActivity;
}

export async function getXpLeaderboard(days: number | null): Promise<XpLeaderRow[]> {
  const rows = unwrap(await supabase.rpc('get_xp_leaderboard', { p_days: days, p_limit: 100 })) as XpLeaderRow[];
  return rows.map((r) => ({ ...r, rank: Number(r.rank), xp: Number(r.xp) }));
}

export async function getProgramLeaderboard(programId: string): Promise<ProgramLeaderRow[]> {
  const rows = unwrap(await supabase.rpc('get_program_leaderboard', { p_program: programId })) as ProgramLeaderRow[];
  return rows.map((r) => ({
    ...r,
    rank: Number(r.rank),
    completed: Number(r.completed),
    total: Number(r.total),
    avg_score: r.avg_score === null ? null : Number(r.avg_score),
  }));
}

// ------------------------------------------------------------ Admin analytics
export async function getAdminAnalytics(days: number): Promise<AdminAnalytics> {
  return unwrap(await supabase.rpc('admin_analytics', { p_days: days })) as AdminAnalytics;
}

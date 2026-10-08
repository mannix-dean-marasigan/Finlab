// Admin data access. Every write here is authorised server-side by RLS
// (is_admin()) or by admin_* RPCs that assert admin — the UI guard is UX only.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  Achievement,
  AdminBetaTester,
  AdminCohort,
  Challenge,
  ChallengeScore,
  ChallengeSubmission,
  Competition,
  CriterionScore,
  FeedbackItem,
  Lesson,
  LessonActivity,
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

// ------------------------------------------------------------ Lessons
export interface AdminLesson extends Lesson {
  created_at: string;
  updated_at: string;
}
export async function adminListLessons(): Promise<AdminLesson[]> {
  return unwrap(await supabase.from('lessons').select('*').order('category_id').order('sort_order')) as AdminLesson[];
}
export async function adminGetLessonKey(lessonId: string): Promise<Record<string, unknown>> {
  const row = unwrap(await supabase.from('lesson_check_keys').select('answers').eq('lesson_id', lessonId).maybeSingle()) as { answers: Record<string, unknown> } | null;
  return row?.answers ?? {};
}
export type LessonInput = Pick<Lesson, 'slug' | 'title' | 'summary' | 'category_id' | 'difficulty' | 'estimated_minutes' | 'body' | 'related_challenge_slugs' | 'sort_order' | 'is_published' | 'check_questions' | 'video_urls'>;
export async function adminSaveLesson(input: LessonInput, answers: Record<string, unknown>, id?: string): Promise<string> {
  const res = id
    ? await supabase.from('lessons').update(input).eq('id', id).select('id').single()
    : await supabase.from('lessons').insert(input).select('id').single();
  if (res.error?.code === '23505') throw new Error('A lesson with this slug already exists.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('lesson_check_keys').upsert({ lesson_id: saved.id, answers }));
  return saved.id;
}

// ------------------------------------------------------------ Lesson practice activities
export interface AdminActivity extends LessonActivity {
  key: Record<string, unknown>;
}
export async function adminListActivities(lessonId: string): Promise<AdminActivity[]> {
  const rows = unwrap(
    await supabase.from('lesson_activities').select('*, keyrow:lesson_activity_keys(key)').eq('lesson_id', lessonId).order('position'),
  ) as (LessonActivity & { keyrow: { key: Record<string, unknown> } | { key: Record<string, unknown> }[] | null })[];
  return rows.map(({ keyrow, ...a }) => ({ ...a, key: (Array.isArray(keyrow) ? keyrow[0]?.key : keyrow?.key) ?? {} }));
}
export async function adminSaveActivity(
  input: Pick<LessonActivity, 'lesson_id' | 'slug' | 'position' | 'kind' | 'title' | 'instructions' | 'content' | 'is_required'>,
  key: Record<string, unknown>,
  id?: string,
): Promise<string> {
  const res = id
    ? await supabase.from('lesson_activities').update(input).eq('id', id).select('id').single()
    : await supabase.from('lesson_activities').insert(input).select('id').single();
  if (res.error?.code === '23505') throw new Error('An activity with this slug already exists in this lesson.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('lesson_activity_keys').upsert({ activity_id: saved.id, key }));
  return saved.id;
}
export async function adminDeleteActivity(id: string) {
  unwrap(await supabase.from('lesson_activities').delete().eq('id', id));
}

// ------------------------------------------------------------ Programs
export interface AdminProgram {
  id: string;
  slug: string;
  kind: 'certification' | 'track';
  title: string;
  subtitle: string;
  description: string;
  category_id: string | null;
  level: Lesson['difficulty'];
  estimated_hours: number;
  certificate_title: string;
  is_published: boolean;
  sort_order: number;
  modules: {
    id: string;
    position: number;
    kind: 'lesson' | 'challenge' | 'exam' | 'capstone';
    lesson_id: string | null;
    challenge_id: string | null;
    min_score: number | null;
    config: Record<string, unknown>;
  }[];
}
export async function adminListPrograms(): Promise<AdminProgram[]> {
  const rows = unwrap(
    await supabase.from('certification_programs').select('*, modules:program_modules(*)').order('kind').order('sort_order'),
  ) as AdminProgram[];
  return rows.map((p) => ({ ...p, estimated_hours: Number(p.estimated_hours), modules: [...(p.modules ?? [])].sort((a, b) => a.position - b.position) }));
}
export type ProgramInput = Omit<AdminProgram, 'id' | 'modules'>;
/** Modules keep their ids (when given) so learner capstone submissions survive edits. */
export async function adminSaveProgram(
  input: ProgramInput,
  modules: (Omit<AdminProgram['modules'][number], 'id' | 'position'> & { id?: string })[],
  id?: string,
): Promise<string> {
  const res = id
    ? await supabase.from('certification_programs').update(input).eq('id', id).select('id').single()
    : await supabase.from('certification_programs').insert(input).select('id').single();
  if (res.error?.code === '23505') throw new Error('A program with this slug already exists.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.rpc('admin_save_program_modules', { p_program: saved.id, p_modules: modules }));
  return saved.id;
}
export async function adminProgramEnrollmentCounts(): Promise<Record<string, { enrolled: number; completed: number }>> {
  const rows = unwrap(await supabase.from('program_enrollments').select('program_id, completed_at')) as { program_id: string; completed_at: string | null }[];
  const out: Record<string, { enrolled: number; completed: number }> = {};
  for (const r of rows) {
    out[r.program_id] ??= { enrolled: 0, completed: 0 };
    out[r.program_id].enrolled++;
    if (r.completed_at) out[r.program_id].completed++;
  }
  return out;
}

// ------------------------------------------------------------ Certificates
export interface AdminCertificate {
  id: string;
  code: string;
  kind: string;
  recipient_name: string;
  title: string;
  subtitle: string;
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  issue_type: 'earned' | 'admin_award' | 'test' | 'recognition';
  award_reason: string | null;
}
export async function adminListCertificates(): Promise<AdminCertificate[]> {
  return unwrap(await supabase.from('certificates').select('*').order('issued_at', { ascending: false }).limit(500)) as AdminCertificate[];
}
export async function adminRevokeCertificate(code: string, reason: string) {
  unwrap(await supabase.rpc('admin_revoke_certificate', { p_code: code, p_reason: reason }));
}
/** Award a program certificate (programId) or a custom-titled one (title), with a public reason. */
export async function adminAwardCertificate(userId: string, programId: string | null, title: string | null, reason: string): Promise<string> {
  return unwrap(await supabase.rpc('admin_award_certificate', { p_user: userId, p_program: programId, p_title: title, p_reason: reason })) as string;
}
/** A clearly-marked test certificate for the signed-in admin. */
export async function adminCreateTestCertificate(programId: string): Promise<string> {
  return unwrap(await supabase.rpc('admin_create_test_certificate', { p_program: programId })) as string;
}
export async function adminDeleteTestCertificate(code: string) {
  unwrap(await supabase.rpc('admin_delete_test_certificate', { p_code: code }));
}

// ------------------------------------------------------------ Feedback
export interface AdminFeedback extends FeedbackItem {
  profile: { full_name: string; handle: string } | null;
}
export async function adminListFeedback(status: FeedbackItem['status'] | 'all'): Promise<AdminFeedback[]> {
  let q = supabase.from('feedback').select('*, profile:profiles(full_name, handle)').order('created_at', { ascending: false }).limit(300);
  if (status !== 'all') q = q.eq('status', status);
  return unwrap(await q) as AdminFeedback[];
}
export async function adminUpdateFeedback(id: string, status: FeedbackItem['status'], note: string) {
  unwrap(
    await supabase
      .from('feedback')
      .update({ status, admin_note: note || null, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
      .eq('id', id),
  );
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

// ------------------------------------------------------------ Invite codes (closed beta)
export interface AdminInvite {
  code: string;
  label: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  cohort_id?: string | null;
  cohort_name?: string | null;
  /** 'ok' or the reason the code can't be used right now. */
  status: string;
  redeemed_by: { full_name: string | null; handle: string | null; redeemed_at: string }[];
}
export async function adminListInvites(): Promise<AdminInvite[]> {
  return unwrap(await supabase.rpc('admin_list_invites')) as AdminInvite[];
}
export async function adminCreateInvite(input: { code: string; label: string; max_uses: number | null; expires_at: string | null; cohort_id?: string | null }) {
  const res = await supabase.from('invite_codes').insert(input);
  if (res.error?.code === '23505') throw new Error('That code already exists — pick another.');
  if (res.error?.code === '23514') throw new Error('Codes use 4–40 capital letters, numbers or hyphens.');
  unwrap(res);
}
export async function adminSetInviteActive(code: string, active: boolean) {
  unwrap(await supabase.from('invite_codes').update({ is_active: active }).eq('code', code));
}
export async function adminDeleteInvite(code: string) {
  unwrap(await supabase.from('invite_codes').delete().eq('code', code));
}
export async function fetchInviteRequired(): Promise<boolean> {
  const rows = unwrap(await supabase.from('app_settings').select('value').eq('key', 'require_invite_code')) as { value: unknown }[];
  return Number(rows[0]?.value ?? 0) >= 1;
}
export async function adminSetInviteRequired(required: boolean) {
  unwrap(await supabase.from('app_settings').update({ value: required ? 1 : 0 }).eq('key', 'require_invite_code'));
}

// ------------------------------------------------------------ Beta testers
export async function adminBetaTesters(): Promise<AdminBetaTester[]> {
  const rows = unwrap(await supabase.rpc('admin_beta_testers')) as AdminBetaTester[];
  return rows.map((r) => ({ ...r, done: Number(r.done), feedback_count: Number(r.feedback_count) }));
}
export async function fetchBetaOpen(): Promise<boolean> {
  const rows = unwrap(await supabase.from('app_settings').select('value').eq('key', 'beta_program_open')) as { value: unknown }[];
  return Number(rows[0]?.value ?? 0) >= 1;
}
export async function adminSetBetaOpen(open: boolean) {
  unwrap(await supabase.from('app_settings').update({ value: open ? 1 : 0 }).eq('key', 'beta_program_open'));
}

// ------------------------------------------------------------ Flashcards (admin)
export interface AdminFlashcard {
  id: string;
  lesson_id: string;
  position: number;
  front: string;
  back: string;
}
export async function adminListFlashcards(lessonId: string): Promise<AdminFlashcard[]> {
  return unwrap(await supabase.from('flashcards').select('id, lesson_id, position, front, back').eq('lesson_id', lessonId).order('position')) as AdminFlashcard[];
}
export async function adminFlashcardCounts(): Promise<Record<string, number>> {
  const rows = unwrap(await supabase.from('flashcards').select('lesson_id')) as { lesson_id: string }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.lesson_id] = (out[r.lesson_id] ?? 0) + 1;
  return out;
}
export async function adminSaveFlashcard(input: { id?: string; lesson_id: string; front: string; back: string }, nextPosition: number) {
  const front = input.front.trim();
  const back = input.back.trim();
  if (front.length < 2 || front.length > 500) throw new Error('The front needs 2–500 characters.');
  if (back.length < 1 || back.length > 1500) throw new Error('The back needs 1–1500 characters.');
  if (input.id) unwrap(await supabase.from('flashcards').update({ front, back }).eq('id', input.id));
  else unwrap(await supabase.from('flashcards').insert({ lesson_id: input.lesson_id, position: nextPosition, front, back }));
}
export async function adminDeleteFlashcard(id: string) {
  unwrap(await supabase.from('flashcards').delete().eq('id', id));
}

// ------------------------------------------------------------ Daily questions (admin)
export interface AdminDailyQuestion {
  id: string;
  slug: string;
  category_id: string | null;
  type: 'mcq' | 'numeric';
  prompt: string;
  options: { id: string; label: string }[] | null;
  unit: string | null;
  explanation: string;
  is_active: boolean;
}
export type DailyAnswerKey = { answer: string | number; tolerance_pct?: number; tolerance_abs?: number };
export async function adminListDailyQuestions(): Promise<AdminDailyQuestion[]> {
  return unwrap(await supabase.from('daily_questions').select('*').order('slug')) as AdminDailyQuestion[];
}
export async function adminGetDailyKey(questionId: string): Promise<DailyAnswerKey | null> {
  const row = unwrap(await supabase.from('daily_question_keys').select('answer').eq('question_id', questionId).maybeSingle()) as { answer: DailyAnswerKey } | null;
  return row?.answer ?? null;
}
export async function adminSaveDailyQuestion(q: Omit<AdminDailyQuestion, 'id'> & { id?: string }, key: DailyAnswerKey): Promise<void> {
  const { id, ...fields } = q;
  const res = id
    ? await supabase.from('daily_questions').update(fields).eq('id', id).select('id').single()
    : await supabase.from('daily_questions').insert(fields).select('id').single();
  if (res.error?.code === '23505') throw new Error('A question with this slug already exists.');
  const saved = unwrap(res) as { id: string };
  unwrap(await supabase.from('daily_question_keys').upsert({ question_id: saved.id, answer: key }));
}
export async function adminSetDailyActive(id: string, active: boolean) {
  unwrap(await supabase.from('daily_questions').update({ is_active: active }).eq('id', id));
}
export async function adminDeleteDailyQuestion(id: string) {
  unwrap(await supabase.from('daily_questions').delete().eq('id', id));
}

// ------------------------------------------------------------ Data backup (admin)
const BACKUP_TABLES = [
  'profiles', 'user_preferences', 'user_stats', 'user_skills', 'skill_evidence', 'user_achievements', 'lesson_progress', 'lesson_attempts', 'lesson_video_views',
  'activity_attempts', 'challenge_attempts', 'challenge_submissions', 'challenge_scores', 'stock_pitches', 'research_projects', 'research_sections', 'sources',
  'valuation_models', 'financial_models', 'portfolios', 'portfolio_positions', 'portfolio_transactions', 'market_event_decisions', 'competition_participants',
  'competition_results', 'program_enrollments', 'certificates', 'flashcard_state', 'flashcard_review_log', 'daily_answers', 'peer_reviews', 'capstone_submissions',
  'invite_codes', 'invite_redemptions', 'feedback', 'user_roles', 'app_settings',
] as const;

/** Downloads every table the admin can read as one JSON object. Tables that cannot be read are listed under `errors`. */
export async function adminBackup(onProgress?: (table: string, done: number, total: number) => void): Promise<{ data: Record<string, unknown>; errors: Record<string, string>; rows: number }> {
  const data: Record<string, unknown> = { _meta: { exported_at: new Date().toISOString(), app: 'FINLAB PH' } };
  const errors: Record<string, string> = {};
  let rows = 0;
  try {
    data.users_with_email = await adminListUsers('');
  } catch (e) {
    errors.users_with_email = (e as Error).message;
  }
  for (const [i, table] of BACKUP_TABLES.entries()) {
    onProgress?.(table, i, BACKUP_TABLES.length);
    const all: unknown[] = [];
    for (let from = 0; from < 50000; from += 1000) {
      const res = await supabase.from(table).select('*').range(from, from + 999);
      if (res.error) {
        errors[table] = res.error.message;
        break;
      }
      all.push(...(res.data ?? []));
      if ((res.data ?? []).length < 1000) break;
    }
    if (!errors[table]) {
      data[table] = all;
      rows += all.length;
    }
  }
  onProgress?.('done', BACKUP_TABLES.length, BACKUP_TABLES.length);
  return { data, errors, rows };
}

// ------------------------------------------------------------ Classes (admin)
export async function adminListCohorts(): Promise<AdminCohort[]> {
  const rows = unwrap(await supabase.rpc('admin_list_cohorts')) as AdminCohort[];
  return rows.map((c) => ({ ...c, members: Number(c.members) }));
}
export async function adminCreateCohort(input: { name: string; description: string; join_code: string }, createdBy: string) {
  const res = await supabase.from('cohorts').insert({ ...input, join_code: input.join_code.trim().toUpperCase(), created_by: createdBy });
  if (res.error?.code === '23505') throw new Error('That join code is already used by another class.');
  if (res.error?.code === '23514') throw new Error('Name: 3–80 characters. Join code: 4–30 capital letters, numbers or hyphens.');
  unwrap(res);
}
export async function adminSetCohortOpen(id: string, open: boolean) {
  unwrap(await supabase.from('cohorts').update({ is_open: open }).eq('id', id));
}
export async function adminDeleteCohort(id: string) {
  unwrap(await supabase.from('cohorts').delete().eq('id', id));
}
export async function adminSetCohortManager(cohortId: string, email: string, add: boolean) {
  unwrap(await supabase.rpc('admin_set_cohort_manager', { p_cohort: cohortId, p_email: email, p_add: add }));
}

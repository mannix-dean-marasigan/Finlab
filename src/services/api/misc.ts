// Learn, certifications, certificates, feedback, account.
import { supabase, unwrap } from '@/lib/supabase';
import type {
  AppNotification, CertificateSummary, CertificateView, FeedbackItem, Lesson, LessonActivity, LessonCheckResult, ProgramDetail, ProgramSummary,
} from '@/types/domain';

// ------------------------------------------------------------ Lessons
export async function listLessons(): Promise<Lesson[]> {
  return unwrap(
    await supabase
      .from('lessons')
      .select('id, slug, title, summary, category_id, difficulty, estimated_minutes, related_challenge_slugs, sort_order, is_published, check_questions')
      .eq('is_published', true)
      .order('sort_order'),
  ) as Lesson[];
}

export async function getLesson(slug: string): Promise<Lesson | null> {
  return unwrap(await supabase.from('lessons').select('*').eq('slug', slug).maybeSingle()) as Lesson | null;
}

export async function fetchLessonProgress(userId: string): Promise<Set<string>> {
  const rows = unwrap(await supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId)) as { lesson_id: string }[];
  return new Set(rows.map((r) => r.lesson_id));
}

export async function fetchLessonAttempts(userId: string, lessonId: string): Promise<{ score: number; passed: boolean; created_at: string }[]> {
  const rows = unwrap(
    await supabase.from('lesson_attempts').select('score, passed, created_at').eq('user_id', userId).eq('lesson_id', lessonId).order('created_at', { ascending: false }).limit(10),
  ) as { score: number; passed: boolean; created_at: string }[];
  return rows.map((r) => ({ ...r, score: Number(r.score) }));
}

export async function fetchVideoWatched(userId: string, lessonId: string): Promise<boolean> {
  const rows = unwrap(
    await supabase.from('lesson_video_views').select('lesson_id').eq('user_id', userId).eq('lesson_id', lessonId),
  ) as unknown[];
  return rows.length > 0;
}

/** Records that the lesson video was finished ('ended') or marked watched ('manual'). */
export async function markVideoWatched(lessonId: string, method: 'ended' | 'manual'): Promise<void> {
  unwrap(await supabase.rpc('mark_lesson_video_watched', { p_lesson: lessonId, p_method: method }));
}

// ------------------------------------------------------------ Practice activities
export async function listLessonActivities(lessonId: string): Promise<LessonActivity[]> {
  return unwrap(
    await supabase.from('lesson_activities').select('id, lesson_id, slug, position, kind, title, instructions, is_required, content').eq('lesson_id', lessonId).order('position'),
  ) as LessonActivity[];
}

/** Best score per activity for the signed-in user (only activities they attempted). */
export async function fetchActivityBest(userId: string, activityIds: string[]): Promise<Record<string, number>> {
  if (!activityIds.length) return {};
  const rows = unwrap(
    await supabase.from('activity_attempts').select('activity_id, score').eq('user_id', userId).in('activity_id', activityIds),
  ) as { activity_id: string; score: number }[];
  const best: Record<string, number> = {};
  for (const r of rows) best[r.activity_id] = Math.max(best[r.activity_id] ?? 0, Number(r.score));
  return best;
}

export async function submitActivity(activityId: string, response: Record<string, unknown>): Promise<Record<string, unknown> & { score: number }> {
  return unwrap(await supabase.rpc('submit_activity', { p_activity: activityId, p_response: response })) as Record<string, unknown> & { score: number };
}

export async function workedCheck(activityId: string, step: string, answer: string): Promise<{ correct: boolean; explanation?: string | null; completed?: boolean; score?: number; already?: boolean }> {
  return unwrap(await supabase.rpc('worked_check', { p_activity: activityId, p_step: step, p_answer: answer })) as {
    correct: boolean; explanation?: string | null; completed?: boolean; score?: number; already?: boolean;
  };
}

export async function workedHint(activityId: string, step: string): Promise<string | null> {
  return unwrap(await supabase.rpc('worked_hint', { p_activity: activityId, p_step: step })) as string | null;
}

export async function workedState(activityId: string): Promise<{ state: { solved: string[]; hints: string[]; wrong: number }; explanations: Record<string, string>; hints: Record<string, string> }> {
  return unwrap(await supabase.rpc('worked_state', { p_activity: activityId })) as {
    state: { solved: string[]; hints: string[]; wrong: number }; explanations: Record<string, string>; hints: Record<string, string>;
  };
}

/** Graded server-side against hidden keys; completion is recorded only on a pass. */
export async function submitLessonCheck(lessonId: string, responses: Record<string, string>): Promise<LessonCheckResult> {
  return unwrap(await supabase.rpc('submit_lesson_check', { p_lesson: lessonId, p_responses: responses })) as LessonCheckResult;
}

// ------------------------------------------------------------ Programs & certificates
export async function listPrograms(): Promise<ProgramSummary[]> {
  const rows = unwrap(await supabase.rpc('list_programs')) as ProgramSummary[];
  return rows.map((r) => ({ ...r, estimated_hours: Number(r.estimated_hours), modules: Number(r.modules), completed_modules: Number(r.completed_modules) }));
}

export async function getProgram(slug: string): Promise<ProgramDetail | null> {
  return unwrap(await supabase.rpc('get_program', { p_slug: slug })) as ProgramDetail | null;
}

export async function enrollProgram(programId: string): Promise<{ enrolled: boolean; certificates: string[] }> {
  return unwrap(await supabase.rpc('enroll_program', { p_program: programId })) as { enrolled: boolean; certificates: string[] };
}

export async function verifyCertificate(code: string): Promise<CertificateView | null> {
  return unwrap(await supabase.rpc('verify_certificate', { p_code: code })) as CertificateView | null;
}

export async function getUserCertificates(handle: string): Promise<CertificateSummary[]> {
  return unwrap(await supabase.rpc('get_user_certificates', { p_handle: handle })) as CertificateSummary[];
}

// ------------------------------------------------------------ Feedback
export async function submitFeedback(input: { category: FeedbackItem['category']; message: string; page: string }): Promise<void> {
  unwrap(
    await supabase.from('feedback').insert({
      category: input.category,
      message: input.message.trim(),
      page: input.page.slice(0, 500),
      user_agent: navigator.userAgent.slice(0, 500),
    }),
  );
}

// ------------------------------------------------------------ Account
export async function deleteMyAccount(): Promise<void> {
  unwrap(await supabase.rpc('delete_my_account', { p_confirm: 'DELETE' }));
}

// ------------------------------------------------------------ Notifications
export async function listNotifications(userId: string): Promise<AppNotification[]> {
  return unwrap(
    await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
  ) as AppNotification[];
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  if (ids?.length) q = q.in('id', ids);
  unwrap(await q);
}

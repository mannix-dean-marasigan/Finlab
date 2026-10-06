// Learn + notifications.
import { supabase, unwrap } from '@/lib/supabase';
import type { AppNotification, Lesson } from '@/types/domain';

export async function listLessons(): Promise<Lesson[]> {
  return unwrap(
    await supabase
      .from('lessons')
      .select('id, slug, title, summary, category_id, difficulty, estimated_minutes, related_challenge_slugs, sort_order, is_published')
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

export async function setLessonComplete(userId: string, lessonId: string, complete: boolean): Promise<void> {
  if (complete) {
    const res = await supabase.from('lesson_progress').insert({ user_id: userId, lesson_id: lessonId });
    if (res.error && res.error.code !== '23505') unwrap(res);
  } else {
    unwrap(await supabase.from('lesson_progress').delete().eq('user_id', userId).eq('lesson_id', lessonId));
  }
}

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

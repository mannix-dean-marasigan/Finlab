// AI study helper. The chat runs in the Supabase Edge Function "chat" (the Gemini key lives there, never in the browser).
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase, unwrap } from '@/lib/supabase';

export interface AiStatus {
  enabled: boolean;
  limit: number;
  remaining: number;
}
export interface HelperMessage {
  role: 'user' | 'assistant';
  text: string;
  /** The server's signature on its own replies; sent back so the server can tell real replies from fake ones. */
  sig?: string;
}

/** An error from the helper. `detail` is Gemini's own reason (no key), shown only on the admin test. */
export class HelperError extends Error {
  detail?: string;
}

export async function getAiStatus(): Promise<AiStatus> {
  const s = unwrap(await supabase.rpc('ai_status')) as AiStatus;
  return { enabled: !!s.enabled, limit: Number(s.limit), remaining: Number(s.remaining) };
}

/** Sends the recent conversation (and the lesson being read) and returns the helper's reply. */
export async function askHelper(messages: HelperMessage[], lessonSlug?: string): Promise<{ reply: string; sig?: string; model?: string; remaining: number | null }> {
  const { data, error } = await supabase.functions.invoke('chat', { body: { messages: messages.slice(-20), lessonSlug } });
  if (error) {
    let message = 'The AI helper could not answer. Please try again.';
    let detail: string | undefined;
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { message?: string; detail?: string } | null;
      if (body?.message) message = body.message;
      detail = body?.detail;
    } else if (/Failed to send|NetworkError|fetch/i.test(error.message)) {
      message = 'The AI helper is not reachable. Check your connection, or it may not be set up yet.';
    }
    const err = new HelperError(message);
    err.detail = detail;
    throw err;
  }
  return data as { reply: string; sig?: string; model?: string; remaining: number | null };
}

// ------------------------------------------------------------ admin settings
export interface AiSettings {
  enabled: boolean;
  dailyLimit: number;
  globalCap: number;
}
const KEYS = ['ai_helper_enabled', 'ai_helper_daily_limit', 'ai_helper_global_daily_cap'] as const;

export async function adminGetAiSettings(): Promise<AiSettings> {
  const rows = unwrap(await supabase.from('app_settings').select('key, value').in('key', [...KEYS])) as { key: string; value: unknown }[];
  const v = (k: string, d: number) => Number(rows.find((r) => r.key === k)?.value ?? d);
  return { enabled: v('ai_helper_enabled', 0) >= 1, dailyLimit: v('ai_helper_daily_limit', 15), globalCap: v('ai_helper_global_daily_cap', 300) };
}
export async function adminSetAiSettings(s: AiSettings) {
  const writes: [string, number][] = [
    ['ai_helper_enabled', s.enabled ? 1 : 0],
    ['ai_helper_daily_limit', Math.max(0, Math.round(s.dailyLimit))],
    ['ai_helper_global_daily_cap', Math.max(0, Math.round(s.globalCap))],
  ];
  for (const [key, value] of writes) unwrap(await supabase.from('app_settings').update({ value }).eq('key', key));
}

// ------------------------------------------------------------ reports (Play Store requires a way to flag AI replies)
export type ReportReason = 'wrong' | 'gave_answer' | 'off_topic' | 'harmful' | 'other';
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'wrong', label: 'Wrong or confusing' },
  { value: 'gave_answer', label: 'Gave away a graded answer' },
  { value: 'off_topic', label: 'Off topic' },
  { value: 'harmful', label: 'Rude or harmful' },
  { value: 'other', label: 'Something else' },
];

/** Sends one reply (and the question before it) to the FINLAB team. Only reported replies are stored. */
export async function reportAnswer(r: { reason: ReportReason; question: string; reply: string; note?: string; model?: string }) {
  unwrap(await supabase.rpc('ai_report', { p_reason: r.reason, p_question: r.question, p_reply: r.reply, p_note: r.note ?? '', p_model: r.model ?? '' }));
}

export interface AiReport {
  id: string;
  reason: ReportReason;
  question: string;
  reply: string;
  note: string;
  model: string;
  status: 'open' | 'reviewed';
  created_at: string;
  handle: string;
  name: string;
}
export async function adminAiReports(): Promise<AiReport[]> {
  return unwrap(await supabase.rpc('admin_ai_reports', { p_limit: 50 })) as AiReport[];
}
export async function adminSetReportStatus(id: string, status: 'open' | 'reviewed') {
  unwrap(await supabase.rpc('admin_ai_report_set', { p_id: id, p_status: status }));
}

export interface AiUsage {
  today: number;
  users: { handle: string; name: string; messages: number; guarded: number }[];
}
export async function adminAiUsage(): Promise<AiUsage> {
  return unwrap(await supabase.rpc('admin_ai_usage')) as AiUsage;
}

// ------------------------------------------------------------ prompt guard (AI trick detector)
export interface GuardSettings {
  enabled: boolean;
  threshold: number;
}
export async function adminGetGuard(): Promise<GuardSettings> {
  const rows = unwrap(await supabase.from('app_settings').select('key, value').in('key', ['ai_prompt_guard', 'ai_prompt_guard_threshold'])) as { key: string; value: unknown }[];
  const v = (k: string, d: number) => Number(rows.find((r) => r.key === k)?.value ?? d);
  return { enabled: v('ai_prompt_guard', 0) >= 1, threshold: v('ai_prompt_guard_threshold', 0.9) };
}
export async function adminSetGuard(g: GuardSettings) {
  unwrap(await supabase.from('app_settings').update({ value: g.enabled ? 1 : 0 }).eq('key', 'ai_prompt_guard'));
  unwrap(await supabase.from('app_settings').update({ value: Math.min(0.99, Math.max(0.5, g.threshold)) }).eq('key', 'ai_prompt_guard_threshold'));
}

export interface GuardResult {
  text: string;
  trick: boolean;
  score: number | null;
  raw: string;
}
/** Runs fixed sample messages through the trick detector (admins only; uses no AI messages). */
export async function runGuardTest(): Promise<GuardResult[]> {
  const { data, error } = await supabase.functions.invoke('chat', { body: { mode: 'guard_test' } });
  if (error) {
    let message = 'The test could not run.';
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => null)) as { message?: string } | null;
      if (body?.message) message = body.message;
    }
    throw new Error(message);
  }
  return (data as { results: GuardResult[] }).results;
}

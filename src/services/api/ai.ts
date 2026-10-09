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

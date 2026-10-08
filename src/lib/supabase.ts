import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Open the connection to the database early, while the page is still loading.
if (url && typeof document !== 'undefined') {
  for (const rel of ['preconnect', 'dns-prefetch']) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = new URL(url).origin;
    if (rel === 'preconnect') link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the public Supabase credentials are present. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project-ref'));

/**
 * Browser Supabase client. Uses ONLY the public anon key — every privileged
 * operation is enforced server-side by RLS and SECURITY DEFINER functions.
 */
export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Normalises Supabase/PostgREST errors into readable messages. */
export function toErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  const e = error as { message?: string; details?: string; hint?: string; code?: string };
  let msg = e.message ?? 'Something went wrong';
  if (e.code === '42501' || /permission denied/i.test(msg)) msg = 'You do not have permission to do that.';
  if (/Failed to fetch|NetworkError/i.test(msg)) msg = 'Network error. Check your connection and try again.';
  if (/JWT expired/i.test(msg)) msg = 'Your session expired. Please sign in again.';
  return msg;
}

/** Throws a proper Error for a Supabase response with an error. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw new Error(toErrorMessage(res.error));
  return res.data;
}

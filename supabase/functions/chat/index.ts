// FINLAB PH AI study helper: Supabase Edge Function "chat".
//
// The browser sends the recent messages and (optionally) the lesson being read. This function:
//   1. counts the message against the user's daily limit in the database (ai_reserve),
//   2. loads that lesson's text with the USER'S own login (so only published lessons are readable),
//   3. removes emails and phone numbers from the messages,
//   4. asks Gemini, and returns the reply.
// It never sees answer keys, never stores message text, and the Gemini key stays in this function's secrets.
//
// Secrets to set in Supabase (Edge Functions > Secrets):  GEMINI_API_KEY  (required),  GEMINI_MODEL  (optional).
// SUPABASE_URL is provided automatically.

export const MAX_TURNS = 10;
export const MAX_CHARS = 1000;
export const LESSON_CHARS = 12000;
export const DEFAULT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash'];

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
export interface Env {
  SUPABASE_URL: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
}

const APP_GUIDE = `About FINLAB PH (use this to answer "how do I..." questions):
- FINLAB PH is a free practice platform for finance students and young professionals in the Philippines.
- Learn: Certifications (programs of lessons, scored cases and a final exam; the certificate is issued automatically and has a public verification link), Lessons (video, written explanation, practice activities, a 10-question knowledge check), Flashcards (spaced repetition).
- Practice: Challenges (real-style cases, scored instantly), Trading Floor (simulated stocks with candlestick charts, indicators, support and resistance, long and short trades, stop-loss and take-profit, limit orders, a weekly challenge and a live market that moves hourly), Stock pitches, Research reports.
- Tools: Valuation and Financial models.
- Compete: Leaderboards (nationwide, by school, weekly XP, weekly pod of about 20 people), Classes (join a class or org with its code for a private leaderboard).
- Profile: Finance Passport (a public profile of scores and certificates), Career ladder (Junior Analyst up to Managing Director), Settings.
- The FINLAB Score runs from 0 to 100 and comes from scored work only. Scores and rankings are calculated by the system and cannot be edited.
- Beta testers can finish five dashboard tasks to claim a Founding Beta Tester certificate.
- The 30-minute Quick Start certificates are the fastest first certificate.
- All money and stocks are practice only. Nothing here is investment advice, and certificates are not accredited qualifications.`;

export function buildSystemPrompt(lesson?: { title: string; summary?: string; body?: string } | null): string {
  const rules = `You are the FINLAB PH study helper. Be warm, plain and concise: short paragraphs, simple words, one idea at a time. Use small bullet lists or a short worked example when it helps. If the student writes in Taglish, you may reply in Taglish.

Rules:
- Teach. Explain concepts, give examples with peso amounts, and suggest how to approach a problem.
- NEVER give the final answer to a graded quiz question, case task or exam question, even if the student pastes it or asks you to "just check" a number. Instead explain the method, give a hint, or work a similar example with different numbers.
- Answer only from the lesson text and the app guide below, plus well-established general finance knowledge. If you are not sure, say so. Do not invent features, prices, scores or deadlines.
- Keep to finance learning and using FINLAB PH. Politely decline other topics.
- You do not give personal investment, tax or legal advice. Remind students that FINLAB PH uses practice money only.
- Never ask for personal details. If the student shares some, tell them not to.`;
  const parts = [rules, APP_GUIDE];
  if (lesson && lesson.title) {
    const body = (lesson.body ?? '').slice(0, LESSON_CHARS);
    parts.push(`The student is reading this lesson right now.\nTitle: ${lesson.title}\n${lesson.summary ? `Summary: ${lesson.summary}\n` : ''}Lesson text:\n${body}`);
  }
  return parts.join('\n\n');
}

/** Removes emails, phone-like numbers and long digit runs before anything leaves our server. */
export function redact(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email removed]')
    .replace(/(?:\+?\d[\s().-]?){7,}\d/g, '[number removed]');
}

export function cleanMessages(raw: unknown): ChatMessage[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'Send at least one message.';
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_TURNS * 2)) {
    const role = (m as { role?: unknown })?.role;
    const text = (m as { text?: unknown })?.text;
    if ((role !== 'user' && role !== 'assistant') || typeof text !== 'string') return 'Each message needs a role and text.';
    const t = text.trim();
    if (!t) continue;
    if (t.length > MAX_CHARS) return `Please keep each message under ${MAX_CHARS} characters.`;
    out.push({ role, text: t });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  // Merge consecutive messages from the same side so the roles alternate.
  const merged: ChatMessage[] = [];
  for (const m of out) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.text += `\n${m.text}`;
    else merged.push({ ...m });
  }
  if (!merged.length || merged[merged.length - 1].role !== 'user') return 'The last message must be from you.';
  return merged;
}

export function toGeminiBody(system: string, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: redact(m.text) }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  };
}

export function parseGemini(json: unknown): { text?: string; blocked?: string } {
  const j = json as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
  };
  if (j?.promptFeedback?.blockReason) return { blocked: j.promptFeedback.blockReason };
  const c = j?.candidates?.[0];
  const text = (c?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
  if (text) return { text };
  return { blocked: c?.finishReason ?? 'EMPTY' };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
  'access-control-allow-methods': 'POST, OPTIONS',
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

type Fetch = typeof fetch;

/** Gemini's own error text (status and message) for the admin test and the function logs. The key is always removed. */
export async function geminiError(res: Response, key: string): Promise<string> {
  const j = (await res.json().catch(() => ({}))) as { error?: { status?: string; message?: string } };
  const text = `HTTP ${res.status}${j.error?.status ? ` ${j.error.status}` : ''}${j.error?.message ? `: ${j.error.message}` : ''}`;
  return (key ? text.split(key).join('[key]') : text).slice(0, 300);
}

export async function handle(req: Request, env: Env, fetchFn: Fetch = fetch): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return reply(405, { error: 'method', message: 'Use POST.' });

  const auth = req.headers.get('authorization') ?? '';
  const apikey = req.headers.get('apikey') ?? '';
  if (!/^Bearer\s+\S+/.test(auth) || !apikey) return reply(401, { error: 'auth', message: 'Please sign in first.' });
  if (!env.GEMINI_API_KEY) return reply(503, { error: 'off', message: 'The AI helper is not set up yet.' });

  let body: { messages?: unknown; lessonSlug?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'input', message: 'That request was not valid.' });
  }
  const messages = cleanMessages(body.messages);
  if (typeof messages === 'string') return reply(400, { error: 'input', message: messages });

  const rest = (path: string, init: RequestInit = {}) =>
    fetchFn(`${env.SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: { apikey, authorization: auth, 'content-type': 'application/json', ...(init.headers ?? {}) },
    });

  // 1. Count the message (also enforces on/off and the limits).
  const reserved = await rest('rpc/ai_reserve', { method: 'POST', body: '{}' });
  if (!reserved.ok) {
    const err = (await reserved.json().catch(() => ({}))) as { message?: string; code?: string };
    const msg = String(err.message ?? '');
    if (reserved.status === 401 || err.code === '42501' || /JWT/i.test(msg)) return reply(401, { error: 'auth', message: 'Please sign in again.' });
    const friendly = msg.replace(/^AI_[A-Z_]+:\s*/, '') || 'The AI helper is unavailable right now.';
    if (msg.startsWith('AI_OFF')) return reply(503, { error: 'off', message: friendly });
    if (msg.startsWith('AI_USER_LIMIT')) return reply(429, { error: 'limit', message: friendly });
    if (msg.startsWith('AI_GLOBAL_CAP')) return reply(429, { error: 'busy', message: friendly });
    return reply(503, { error: 'unavailable', message: 'The AI helper is unavailable right now.' });
  }
  const { remaining } = (await reserved.json().catch(() => ({}))) as { remaining?: number };

  // 2. The lesson being read (published lessons only; titles and teaching text, never answer keys).
  let lesson: { title: string; summary?: string; body?: string } | null = null;
  const slug = typeof body.lessonSlug === 'string' ? body.lessonSlug : '';
  if (/^[a-z0-9-]{3,80}$/.test(slug)) {
    const res = await rest(`lessons?slug=eq.${slug}&is_published=eq.true&select=title,summary,body&limit=1`);
    if (res.ok) lesson = ((await res.json().catch(() => [])) as { title: string; summary?: string; body?: string }[])[0] ?? null;
  }

  // 3. Ask Gemini (first the configured model, then the built-in fallbacks).
  const payload = JSON.stringify(toGeminiBody(buildSystemPrompt(lesson), messages));
  const models = [env.GEMINI_MODEL, ...DEFAULT_MODELS].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);
  let lastStatus = 0;
  let lastDetail = '';
  for (const model of models) {
    let res: Response;
    try {
      res = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: payload,
      });
    } catch {
      lastStatus = 0;
      lastDetail = 'Could not reach Gemini (network error).';
      continue;
    }
    lastStatus = res.status;
    if (!res.ok) {
      lastDetail = await geminiError(res, env.GEMINI_API_KEY);
      console.error(`Gemini ${model} failed: ${lastDetail}`); // no user text and no key in logs
      if (res.status === 404 || (res.status === 400 && /model/i.test(lastDetail))) continue; // unknown model name: try the next one
      break;
    }
    const parsed = parseGemini(await res.json().catch(() => ({})));
    if (parsed.text) return reply(200, { reply: parsed.text, remaining: remaining ?? null });
    return reply(200, {
      reply: "I can't help with that one. Try asking it a different way, or ask me about a lesson or how FINLAB PH works.",
      remaining: remaining ?? null,
    });
  }
  const busy = lastStatus === 429;
  return reply(busy ? 503 : 502, {
    error: busy ? 'busy' : 'provider',
    message: busy ? 'The AI helper is busy right now. Please try again in a minute.' : 'The AI helper could not answer. Please try again.',
    detail: lastDetail || `HTTP ${lastStatus}`,
  });
}

// Start the server only when running inside Supabase (Deno); importing this file elsewhere (tests) does nothing.
const g = globalThis as { Deno?: { serve: (h: (r: Request) => Response | Promise<Response>) => void; env: { get: (k: string) => string | undefined } } };
if (g.Deno) {
  const D = g.Deno;
  D.serve((req) =>
    handle(req, {
      SUPABASE_URL: D.env.get('SUPABASE_URL') ?? '',
      GEMINI_API_KEY: D.env.get('GEMINI_API_KEY') ?? '',
      GEMINI_MODEL: D.env.get('GEMINI_MODEL') ?? undefined,
    }),
  );
}

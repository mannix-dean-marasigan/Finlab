# AI study helper (Edge Function `chat`)

Powered by Google Gemini. The browser never sees the Gemini key.

## Set up (about 10 minutes)

1. **Run the database file** in the Supabase SQL Editor: `supabase/migrations/20261015000018_ai_helper.sql`.
2. **Get a Gemini key** at https://aistudio.google.com (Get API key). Keep it on the free tier: do NOT link a billing account to the key's project, because that makes usage paid.
3. **Create the function:** Supabase dashboard > Edge Functions > Deploy a new function > name it exactly `chat` > paste the whole of `supabase/functions/chat/index.ts` > Deploy.
4. **Add the secret:** Edge Functions > Secrets > add `GEMINI_API_KEY` with your key. Optional: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, then `gemini-3.5-flash`, then `gemini-2.5-flash`). Check AI Studio for the current free model names.
5. If browsers get a 401 before the function even runs, open the function's settings and turn **off** "Verify JWT". This is safe: the function checks the user's login itself through the database.
6. **Switch it on:** FINLAB > Admin > Overview > AI study helper > Turn on > Save > **Send a test question**.

## Limits and privacy

- Per-user and everyone-per-day limits are set on the same admin card. Keep the everyone limit under Gemini's free daily quota.
- Only a daily message COUNT is stored. Message text is never stored.
- Emails and phone numbers are removed before a message is sent to Google. On the free tier Google may use messages to improve its products, which the Privacy Notice, FAQ and chat window all say.
- The helper only receives the lesson's teaching text and a short guide to the app. It never receives answer keys or scores, and its instructions forbid giving answers to graded questions. A language model can still slip, so watch Admin > Feedback early on.
- To go paid later (no data use by Google): link billing to the Gemini project and update the Privacy Notice.

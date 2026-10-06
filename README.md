# FINLAB — The flight simulator for finance

> **Learn finance. Do the work. Compete. Prove it.**

FINLAB is a finance career simulation and competition platform. Instead of quizzes, users do the actual work of finance careers — analyze companies, build models, value businesses, write research, pitch stocks, make portfolio decisions under market events, compete, and earn promotions from **Junior Analyst** to **Managing Director**. Everything they do builds a recruiter-facing proof-of-work profile: the **Finance Passport**.

Core loop: **Learn → Analyze → Build → Decide → Pitch → Defend → Get evaluated → Improve → Compete → Rank up**

This repository is the **Phase 1 beta** (10–20 users, free-tier infrastructure, no AI, no paid data).

---

## Contents

1. [What's in Phase 1](#whats-in-phase-1)
2. [Architecture](#architecture)
3. [Setup](#setup) — prerequisites, Supabase, environment variables, migrations
4. [Local development](#local-development)
5. [Admin setup](#admin-setup)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Scoring, progression & security model](#scoring-progression--security-model)
9. [Extending FINLAB](#extending-finlab) — market data, AI, more content
10. [Known limitations (beta)](#known-limitations-beta)

---

## What's in Phase 1

| Area | What works |
|---|---|
| **Auth** | Sign in, create account (name, email, password, confirm), forgot/reset password, sign out, persistent sessions, protected routes, separately protected admin routes |
| **Onboarding** | Interests, experience, goal, specialization, country, university → saved to Supabase |
| **Dashboard** | Greeting, career level, FINLAB Score, global & country rank, promotion progress, skill radar, recommended challenge, recent activity, achievements, competition status — all from the database |
| **Learn** | Practical briefings linked to the challenges where you apply them; completion tracking |
| **Challenges** | 15 seeded challenges across 8 categories (case-based numeric/MCQ/written tasks, quick & professional pitches, research report, IC case, promotion assessment). Start → autosaved drafts → submit → instant score → results with criterion breakdown. Time limits and multi-day windows enforced server-side |
| **Stock Pitch Arena** | Quick pitches (15–30 min) and professional pitches (2–7 day window, countdown, drafts). Deterministic 7-criterion rubric. Public/private toggle |
| **Research Studio** | 10-section structured report + structured sources. Create, edit (autosave), preview, submit (scored), duplicate, delete, publish to Passport |
| **Valuation** | P/E (peer median), P/B (with justified P/B helper), simplified DCF with projection table, value build chart and WACC × g sensitivity grid. Save/load models. Clearly labelled *simplified beta* |
| **Financial models** | Historical revenue/COGS/opex/taxes + forecast assumptions → derived gross profit, EBIT, net income, margins, growth; chart; autosave |
| **Markets** | 10 PSE + 6 US companies with price, change, P/E, P/B, EPS, market cap, revenue — **sample static data, always labelled** — behind a `MarketDataProvider` abstraction |
| **Portfolio simulator** | ₱10,000,000 virtual capital, server-side execution at sample prices (USD converted at sample FX), positions, cost, value, unrealized/realized P/L, return, concentration (HHI / effective positions), allocation chart, decision log. Every trade requires a rationale |
| **Market events** | Admin-configured scenarios (e.g. "BSP announces an unexpected rate hike"). Users choose Buy/Sell/Hold/Rebalance with written reasoning; resolution scores decisions and moves sample prices |
| **Competitions** | Upcoming/active/completed, registration with deadline & limit, competition-scoped attempts, live standings, admin finalization → results, Leadership evidence, Champion achievement |
| **Leaderboards** | Global, Philippines, University, Specialization, Stock Pitch, Equity Research, Portfolio — all computed in SQL |
| **Career** | Database-driven ladder and promotion requirements, PASS / NOT YET with missing requirements, attempt history |
| **Finance Passport** | Recruiter-facing profile (`/passport` and public `/p/:handle`, works signed-out): score, ranks, skills, activity counts, achievements, public pitches & research, competition record |
| **Achievements** | 13 achievements awarded automatically from real conditions |
| **Notifications** | Score, achievement, promotion, competition and event notifications |
| **Admin console** | Challenges (structured task + answer-key builder), publish/unpublish, review & score submissions, competitions (+ finalize), achievements (+ manual award), promotion requirements, market events (+ resolve), sample market data, users & admin roles, scoring weights + recalculate-all |

---

## Architecture

```
┌──────────────────────────── Browser (React SPA) ─────────────────────────────┐
│  features/*  pages (route-level code-split)                                  │
│  components/ reusable UI (shadcn-style primitives, charts)                   │
│  app/        auth context, guards, layout, shared React Query hooks          │
│  services/   ALL data access (api/*, marketData/*, ai/* placeholder)         │
│  lib/        pure logic: finance engines (valuation, model, portfolio), fmt  │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │ supabase-js (anon key + user JWT only)
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ Supabase (free tier)                                                         │
│  Auth ─► trigger on auth.users bootstraps profile/stats/skills/portfolio     │
│  PostgREST ─► tables guarded by RLS + column-level grants                    │
│  RPC ─► SECURITY DEFINER functions = the business engine:                    │
│         scoring, skills, FINLAB Score, achievements, promotions, ranks,      │
│         trades, competitions, admin operations                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Why business logic lives in Postgres:** anything that affects scores, ranks, money, achievements or promotions must be tamper-proof. The browser can only *request* actions (`submit_challenge`, `execute_trade`, `attempt_promotion`…); the database decides the outcome. No custom server is needed, which keeps Phase 1 free.

### Data layers

| Layer | Tables | Who writes |
|---|---|---|
| Reference | `career_levels`, `specializations`, `skills`, `challenge_categories`, `scoring_rubrics`, `app_settings`, `achievements`, `promotion_requirements`, `lessons` | Admins (RLS) |
| User-generated | `profiles`*, `user_preferences`, `stock_pitches`, `research_projects`, `research_sections`, `sources`, `valuation_models`, `financial_models`, `lesson_progress` | Owner (RLS + column grants; drafts only) |
| Calculated | `user_stats`, `user_skills`, `skill_evidence`, `challenge_attempts`, `challenge_submissions`, `challenge_scores`, `user_achievements`, `promotion_attempts`, `competition_results`, `portfolios`, `portfolio_positions`, `portfolio_transactions`, `market_event_decisions`, `notifications` | **Only** SECURITY DEFINER functions |
| Market | `market_securities`, `market_price_history`, `market_fx_rates` | Admins / future data job |
| Admin | `user_roles`, `challenge_answer_keys`, `market_event_keys`, `competitions`, `competition_challenges`, `market_events` | Admins |

\* users can edit only display fields of their profile.

### Folder structure

```
supabase/
  migrations/                 # run in order
    20261006000001_core_schema.sql
    20261006000002_functions.sql
    20261006000003_security.sql
    20261006000004_integrity.sql
  seed.sql                    # reference data, content, sample market data
scripts/db-test/run.mjs       # database integration test (PGlite)
src/
  app/                        # AuthProvider, guards, AppLayout, query hooks
  components/                 # ui/ primitives + domain components
  features/<area>/            # pages per product area (+ admin/)
  hooks/                      # reusable hooks (autosave)
  lib/finance/                # valuation, financial model, portfolio math (+ tests)
  services/api/               # Supabase data access per domain
  services/marketData/        # MarketDataProvider + sample implementation
  services/ai/                # documented seams for future AI modules (no calls)
  types/domain.ts             # domain types mirroring the schema
```

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Recharts, Lucide, Supabase (Postgres, Auth, RLS). No paid services.

---

## Setup

### Prerequisites

- Node.js 20+ (developed on Node 24 LTS) and npm
- A free [Supabase](https://supabase.com) account

### 1. Create the Supabase project

1. Create a new project (free tier). Choose a region near your users (e.g. Singapore for the Philippines).
2. Wait for it to provision.

### 2. Run the database migrations and seed

**Option A — SQL Editor (no tools needed).** In *Supabase Dashboard → SQL Editor*, open each file, paste the contents, and run them **in this order**:

1. `supabase/migrations/20261006000001_core_schema.sql`
2. `supabase/migrations/20261006000002_functions.sql`
3. `supabase/migrations/20261006000003_security.sql`
4. `supabase/migrations/20261006000004_integrity.sql`
5. `supabase/migrations/20261007000005_certifications_integrity.sql`
6. `supabase/migrations/20261007000006_lesson_videos.sql`
7. `supabase/migrations/20261007000007_video_gate.sql`
8. `supabase/migrations/20261007000008_lesson_activities.sql`
9. `supabase/seed.sql`
10. `supabase/seed_002_certifications.sql` (new lessons, knowledge checks, challenges, exams, certifications — safe to re-run)
11. `supabase/seed_003_lesson_videos.sql` (one embedded YouTube video per lesson — safe to re-run)
12. `supabase/seed_004_quiz_expansion.sql` (10-question knowledge checks — safe to re-run)
13. `supabase/seed_005_lesson_activities.sql` (interactive practice: calculators, spot-the-error, drag & drop, branching cases, worked examples — safe to re-run)

Upgrading an existing database: run only the files you haven't run yet, in the same order (migration 0005 must run before `seed_002`).

**Option B — Supabase CLI.**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push            # applies supabase/migrations
psql "<your-connection-string>" -f supabase/seed.sql
```

> The seed creates a 2-week competition starting at seed time and two open market events. Re-running the seed on a populated database will fail on duplicate keys — it is meant for a fresh database.

### 3. Configure Auth

*Dashboard → Authentication → URL Configuration*

- **Site URL:** `http://localhost:5173` (change to your production URL when deploying)
- **Redirect URLs:** add `http://localhost:5173/**` and your production `https://your-domain/**`

*Dashboard → Authentication → Providers → Email*

- Email + password is enabled by default.
- **Confirm email:** the app supports both modes. If ON, users get a confirmation link that lands them on onboarding. Supabase's built-in email sender is rate-limited (a few emails per hour). For a 10–20 person beta either turn confirmation **off**, or configure a free SMTP provider (Resend/Brevo free tiers) under *Authentication → SMTP*.

### 4. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to find it | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL | Public |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` / publishable key | Public — protected by RLS |

**Never** put the `service_role` / secret key in any `VITE_` variable or anywhere in this repo — `VITE_` variables are bundled into the browser. FINLAB does not need it. `.env*` files are git-ignored (except `.env.example`).

If the variables are missing, the app shows a setup screen instead of a blank page.

---

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript only |
| `npm test` | Unit tests for finance engines (Vitest) |
| `npm run test:db` | Database integration test (migrations + seed + full flow in PGlite) |

---

## Admin setup

No user can make themselves an admin — there is no policy that lets a client write `user_roles`. Bootstrap the **first** admin once, from the SQL Editor (which runs with owner privileges):

1. Register normally in the app and complete onboarding.
2. In *SQL Editor*, run:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com';
```

3. Refresh the app. An **Admin console** link appears in the sidebar (`/admin`).

After that, admins can grant or revoke admin for others in *Admin → Users* (the last admin cannot be removed).

**Admin workflows**

- *Challenges* → New challenge → fill the brief, tasks and answer key → set skill impact (which skills the result counts toward) → Publish.
- *Review* → submissions for `manual` challenges wait here; `hybrid` ones can be re-scored. Saving a score updates the user's skills, FINLAB Score and achievements immediately.
- *Competitions* → create, attach challenges, publish. After the end date, **Finalize results** to write rankings and award Leadership evidence.
- *Market events* → create (draft → open), set the scoring key, then **Resolve** to score decisions and apply price impacts.
- *Overview* → change skill weights / engine settings, then everything is recalculated.

---

## Testing

### Automated

```bash
npm test         # 9 unit tests: P/E, P/B, DCF, sensitivity, model, portfolio math
npm run test:db  # 116 database assertions
```

`test:db` runs the **real migrations and seed** inside [PGlite](https://pglite.dev) (Postgres compiled to WASM — no Docker) with a minimal stub of Supabase's `auth` schema, then exercises everything as the `authenticated` role so RLS and grants are enforced exactly as in Supabase:

register → profile bootstrap → onboarding → **tamper attempts** (edit score, self-promote, self-grant admin/achievements, forge submissions, mint cash, read answer keys — all rejected) → start/save/submit challenge → score → skill & FINLAB Score updates → First Challenge achievement → stock pitch (sources required, rubric scoring, locking, visibility, 2–7 day window) → challenge-linked pitch → research (sections, duplicate, delete, submit, lock) → valuation & financial models → trades (FX, oversell, cash, rationale guards) → market event decision → competition registration/standings → all leaderboards → passport (public/private) → promotion NOT YET → complete curriculum → promotion PASS → admin: list users, create/publish challenge, manual review scoring, edit requirements, award/revoke achievement, finalize competition, resolve event, delete challenge cleanup, recalculate → data persisted.

### Manual end-to-end checklist (against your Supabase project)

1. Register → 2. Onboard → 3. Sign out → 4. Sign in → 5. Dashboard shows Junior Analyst, score 0, unranked → 6. Open *Three Statements: Luzon Roastery* → 7. Answer tasks (drafts autosave; reload to confirm) → 8. Submit → 9. Score + breakdown → 10. Dashboard skills/score updated, *First Challenge* unlocked → 11. Create a quick stock pitch, add 3 sources, submit → 12. Create and save a research project → 13. View Finance Passport → 14. Appear on *Leaderboards → Global* → 15. Achievements visible → 16. *Career → Apply for promotion* → NOT YET with missing items → 17. Sign out → 18. Sign in → 19. Everything persists.

---

## Deployment

FINLAB deploys to **GitHub Pages** automatically via `.github/workflows/deploy.yml`. Every push to `main`:

1. installs dependencies, runs the unit tests **and** the database integration tests (a failing test blocks the deploy),
2. builds with `VITE_BASE=/<repo-name>/` so assets and routes live under `https://<user>.github.io/<repo-name>/`,
3. copies `index.html` to `404.html` so deep links like `/p/handle` work,
4. publishes to Pages.

**One-time setup**

1. Push the repo to GitHub (public repo — free Pages requires public).
2. *Repo → Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
3. Supabase values: the workflow has the current project's **public** URL and publishable key as defaults. To point at a different project, add repository **variables** (*Settings → Secrets and variables → Actions → Variables*) `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never add the service-role key.
4. Supabase *Authentication → URL Configuration*: set **Site URL** to `https://<user>.github.io/<repo-name>/` and add `https://<user>.github.io/<repo-name>/**` to **Redirect URLs**.

The app uses Vite's `BASE_URL` for the router basename and all generated links (`appUrl()` in `src/lib/utils.ts`), so it works both at `/` locally and under a sub-path. Any other static host (Vercel, Netlify, Cloudflare Pages) also works: build with `npm run build` (no `VITE_BASE`), publish `dist/`, and configure an SPA fallback to `index.html`.

**Free-tier notes:** Supabase free projects pause after a week of inactivity — keep beta activity regular or upgrade later. Daily backups are not included on free tier; export data periodically via `pg_dump` if needed.

---

## Scoring, progression & security model

### FINLAB Score

```
evidence      = scored work → (skill, score 0–100, weight)
skill score   = weighted mean(evidence) × min(1, Σweight / confidence_threshold)
FINLAB Score  = Σ(skill weight × skill score) / Σ(skill weights)
```

- Initial weights: Technical Knowledge 20 · Financial Analysis 20 · Valuation 15 · Investment Judgment 20 · Communication 10 · Decision-Making 10 · Leadership 5 (table `skills`, editable in *Admin → Overview*).
- Evidence sources: **best** score per challenge (retries can't farm weight) × the challenge's `skill_impact`; rubric-scored pitches/reports (each criterion maps to a skill); market-event decisions; competition placements (Leadership).
- `confidence_threshold` (default 2) prevents one lucky result from maxing a skill.

### Deterministic scoring (no AI)

- **Tasks:** MCQ exact match; numeric within tolerance (half credit within 3×); written answers = 40% length vs target + 60% coverage of key concepts (synonym lists in the admin-only answer key).
- **Stock pitch rubric** (`scoring_rubrics.stock_pitch_v1`): Thesis 20 · Financial Analysis 20 · Valuation 20 · Risk 15 · Catalysts 10 · Communication 10 · Sources 5. Measures completeness, quantification, rating/target consistency (BUY ≥ +10%, SELL ≤ −10%), plausibility, structure and sourcing. It is explicitly **not** a judgment of whether the call is right — that is what admin review (and later the AI Judge) is for.
- **Research rubric** (`research_report_v1`): Thesis 20 · Business & Industry 15 · Financial Analysis & Forecast 20 · Valuation 15 · Catalysts & Risks 15 · Communication 10 · Sources 5.
- Challenges have `scoring_method`: `auto`, `hybrid` (auto now, reviewer may override) or `manual` (reviewer). Every score is stored in `challenge_scores` with `scorer_type` `auto` | `admin` | `ai` and exactly one final row.

### Promotions & achievements

Requirements are rows in `promotion_requirements` (`min_finlab_score`, `challenges_passed`, `category_passed`, `tag_passed`, `metric_gte`, `skill_min`). `attempt_promotion()` evaluates them server-side, records the attempt, and returns **PASS** or **NOT YET** with each requirement's current vs required value. Achievements are JSON criteria (`metric`, `percentile`, `all`) evaluated by `evaluate_achievements()` after every scored action.

### Security

- RLS enabled on every table; Supabase's default grants are revoked and replaced with minimal grants (column-level where it matters, e.g. users can update `profiles.full_name` but not `id`; `notifications.read_at` only).
- Calculated tables have **no client write grants**. Internal functions (`recalculate_user_scores`, `evaluate_achievements`, scoring) are not executable by clients.
- Submitted pitches/reports are locked by trigger (only visibility can change). Professional pitch deadlines are validated (2–7 days) and immutable.
- Answer keys and market-event keys live in admin-only tables and are never sent to users.
- Admin pages are guarded in the UI **and** every admin write is enforced by RLS (`is_admin()`) or by `admin_*` RPCs that assert admin.
- Only the anon key is used in the browser.

---

## Extending FINLAB

### Live market data

`src/services/marketData/types.ts` defines `MarketDataProvider`. Phase 1 uses `SupabaseSampleProvider`. To go live:

1. Write a scheduled Supabase Edge Function (server-side, with the data vendor key stored as a Supabase secret) that upserts `market_securities` / `market_price_history` with `data_source = 'live'`.
2. Keep trades executing in SQL against `market_securities` so prices remain tamper-proof.
3. Optionally add a client provider for intraday quotes and swap it in `services/marketData/index.ts`.

### AI modules (later phase)

Seams are documented in `src/services/ai/index.ts`. All AI must run server-side (Edge Functions), never in the browser:

- **AI Judge** → insert `challenge_scores` with `scorer_type = 'ai'`, then call `finalize_submission_score(score_id)`; the UI already renders any scorer type.
- **AI Research Coach / Mentor** → read drafts and return feedback next to the editors.
- **AI Investment Committee** → generate Q&A for professional pitches (the 10-minute presentation + Q&A format).
- **AI Market Event Generator** → insert `market_events` as `draft` for admin approval.

### Content

Challenges, lessons, achievements, promotion requirements, competitions and market events are all data. Add them via the admin console (or SQL for lessons).

---

## Known limitations (beta)

- Market data is curated **sample** data — illustrative, static, not real quotes. Price history is a synthetic illustrative series.
- Deterministic rubrics reward structure, completeness and quantitative support; they cannot judge insight. Use `hybrid`/`manual` scoring and admin review for high-stakes challenges.
- Professional pitch presentation + live Q&A is not yet implemented (submission structure and scoring are).
- No real-time updates (pages refetch on actions and on an interval for standings/notifications).
- Lessons are edited via SQL (no admin UI yet).

// FINLAB database integration test.
// Runs the real migrations + seed inside PGlite (Postgres compiled to WASM)
// with a minimal stub of Supabase's `auth` schema and roles, then exercises
// the critical user + admin flows as the `authenticated` role so RLS and
// column grants are enforced exactly as in Supabase.
//
//   npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const migrationsDir = join(root, 'supabase', 'migrations');

let passed = 0;
let failed = 0;
const failures = [];

function ok(cond, name, detail) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
  }
}
const section = (t) => console.log(`\n▶ ${t}`);

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text unique,
    raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    last_sign_in_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Mimic Supabase's permissive defaults so our explicit revokes are tested.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

const db = new PGlite();

async function asUser(uid, fn) {
  return db.transaction(async (tx) => {
    await tx.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    return fn(tx);
  });
}
async function q(uid, sql, params = []) {
  return asUser(uid, (tx) => tx.query(sql, params));
}
async function rpc(uid, fn, args = []) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  const res = await q(uid, `select public.${fn}(${placeholders}) as r`, args);
  return res.rows[0]?.r;
}
async function expectError(uid, sql, params, name, pattern) {
  try {
    await q(uid, sql, params);
    ok(false, name, 'expected an error but the statement succeeded');
  } catch (e) {
    const matched = pattern ? new RegExp(pattern, 'i').test(e.message) : true;
    ok(matched, name, matched ? undefined : e.message);
  }
}
async function createUser(email, name) {
  const id = randomUUID();
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id,
    email,
    JSON.stringify({ full_name: name }),
  ]);
  return id;
}

// Build a response that satisfies a challenge's answer key (used to drive
// a user to promotion-level scores without hand-writing every answer).
async function perfectResponses(slug) {
  const { rows } = await db.query(
    `select c.content->'tasks' as tasks, k.answers from challenges c
     join challenge_answer_keys k on k.challenge_id = c.id where c.slug = $1`,
    [slug],
  );
  const { tasks, answers } = rows[0];
  const out = {};
  for (const t of tasks) {
    const key = answers[t.id] ?? {};
    if (t.type === 'mcq' || t.type === 'numeric') out[t.id] = String(key.answer);
    else {
      const kws = (key.keywords ?? []).map((k) => k.split('|')[0]);
      const filler = 'This analysis considers the evidence carefully and explains the reasoning clearly.';
      let text = kws.join(', ') + '. ';
      while (text.split(/\s+/).length < (t.min_words ?? 40) + 5) text += filler + ' ';
      out[t.id] = text;
    }
  }
  return out;
}

// Completes every graded practice activity of a lesson with correct answers.
async function completeActivities(uid, slug) {
  const acts = (await db.query(
    `select a.id, a.kind, a.content, k.key from lesson_activities a join lessons l on l.id = a.lesson_id
     left join lesson_activity_keys k on k.activity_id = a.id where l.slug = $1 order by a.position`, [slug])).rows;
  for (const a of acts) {
    if (a.kind === 'matching') await rpc(uid, 'submit_activity', [a.id, JSON.stringify({ placements: a.key })]);
    else if (a.kind === 'spot_error') await rpc(uid, 'submit_activity', [a.id, JSON.stringify({ selected: a.key.errors })]);
    else if (a.kind === 'branching') await rpc(uid, 'submit_activity', [a.id, JSON.stringify({ path: bestPath(a.content, a.key) })]);
    else if (a.kind === 'worked_example') {
      for (const s of a.content.steps) await rpc(uid, 'worked_check', [a.id, s.id, String(a.key[s.id].answer)]);
    }
  }
  return acts;
}
function bestPath(content, key) {
  const path = [];
  let node = content.start;
  while (node && !content.nodes[node].end) {
    const choices = content.nodes[node].choices;
    const best = choices.reduce((b, c) => ((key.points[`${node}.${c.id}`] ?? 0) > (key.points[`${node}.${b.id}`] ?? 0) ? c : b), choices[0]);
    path.push({ node, choice: best.id });
    node = best.next;
  }
  return path;
}

// Correct answers for a lesson's knowledge check (read from the admin-only key).
async function lessonAnswers(slug) {
  const key = (await db.query(`select k.answers from lesson_check_keys k join lessons l on l.id = k.lesson_id where l.slug = $1`, [slug])).rows[0].answers;
  return Object.fromEntries(Object.entries(key).map(([k, v]) => [k, String(v.answer)]));
}

const longText = (topic, words) => {
  const sentence = `${topic} drives revenue growth of 12% and margin expansion of 150bp in 2026, supported by 3 key factors.`;
  let s = '';
  while (s.split(/\s+/).length < words) s += sentence + ' ';
  return s.trim();
};

async function main() {
  section('Bootstrapping Postgres + Supabase auth stub');
  await db.exec(SUPABASE_STUB);
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    await db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
    ok(true, `migration ${f}`);
  }
  for (const f of readdirSync(join(root, 'supabase')).filter((x) => /^seed.*\.sql$/.test(x)).sort()) {
    await db.exec(readFileSync(join(root, 'supabase', f), 'utf8'));
    ok(true, f);
  }
  const quizSizes = (await db.query(`select min(jsonb_array_length(l.check_questions))::int mn,
      min((select count(*) from jsonb_object_keys(k.answers)))::int keys
      from lessons l join lesson_check_keys k on k.lesson_id = l.id`)).rows[0];
  ok(quizSizes.mn >= 10 && quizSizes.keys >= 10, 'every lesson has 10+ questions with answer keys', quizSizes);
  // Re-running the content seed must be harmless (idempotent).
  await db.exec(readFileSync(join(root, 'supabase', 'seed_002_certifications.sql'), 'utf8'));
  ok(true, 'seed_002 is idempotent');
  await db.exec(readFileSync(join(root, 'supabase', 'seed_006_engagement.sql'), 'utf8'));
  const eng = (await db.query(`select (select count(*) from flashcards)::int cards,
      (select count(*) from program_modules where kind = 'capstone')::int capstones,
      (select count(*) from daily_questions)::int dq, (select count(*) from daily_question_keys)::int dk,
      (select min(n)::int from (select count(*) n from flashcards group by lesson_id) t) min_per_lesson`)).rows[0];
  ok(eng.cards === 120 && eng.min_per_lesson === 10 && eng.capstones === 3 && eng.dq === 40 && eng.dk === 40,
    'seed_006 is idempotent: 10 flashcards per lesson, 3 capstones, 40 daily questions with keys', eng);

  const counts = (await db.query(`select
      (select count(*) from challenges where is_published)::int as challenges,
      (select count(*) from achievements)::int as achievements,
      (select count(*) from market_securities)::int as securities,
      (select count(*) from challenge_answer_keys)::int as keys,
      (select count(*) from challenges where kind = 'tasks')::int as task_challenges,
      (select count(*) from lessons where jsonb_array_length(check_questions) > 0)::int as lessons_with_checks,
      (select count(*) from lessons)::int as lessons,
      (select count(*) from lesson_check_keys)::int as lesson_keys,
      (select count(*) from certification_programs where is_published)::int as programs,
      (select count(*) from program_modules where lesson_id is null and challenge_id is null and kind <> 'capstone')::int as broken_modules`)).rows[0];
  ok(counts.challenges >= 28 && counts.achievements === 22 && counts.securities === 16, 'seed counts', counts);
  ok(counts.keys === counts.task_challenges, 'answer keys for every task challenge', counts);
  ok(counts.lessons === 12 && counts.lessons_with_checks === 12 && counts.lesson_keys === 12, 'every lesson has a knowledge check + key', counts);
  ok(counts.programs === 7 && counts.broken_modules === 0, '7 programs, all modules resolved', counts);

  // The main flow below submits many times in quick succession; relax the
  // anti-gaming limits here and test them explicitly later.
  await db.exec(`update app_settings set value = '0' where key in ('retry_cooldown_minutes', 'lesson_retry_seconds', 'activity_retry_seconds');
                 update app_settings set value = '1000' where key = 'max_daily_submissions';`);

  // ------------------------------------------------------------------
  section('1. Register → profile bootstrap');
  const alice = await createUser('alice@example.com', 'Alice Santos');
  const bob = await createUser('bob@example.com', 'Bob Reyes');
  const prof = (await q(alice, `select p.*, s.finlab_score, s.career_level_id, cl.name as level
                                from profiles p join user_stats s on s.user_id = p.id
                                join career_levels cl on cl.id = s.career_level_id where p.id = $1`, [alice])).rows[0];
  ok(prof && prof.full_name === 'Alice Santos', 'profile created with name');
  ok(prof.level === 'Junior Analyst' && Number(prof.finlab_score) === 0, 'starts as Junior Analyst with score 0', prof);
  const skills = (await q(alice, `select count(*)::int n from user_skills where user_id = $1`, [alice])).rows[0].n;
  ok(skills === 7, '7 skill rows created');
  const pf = (await q(alice, `select cash from portfolios where user_id = $1`, [alice])).rows[0];
  ok(Number(pf.cash) === 10000000, 'portfolio seeded with ₱10,000,000');

  // ------------------------------------------------------------------
  section('2. Onboarding');
  await q(alice, `update profiles set onboarded_at = now(), university = 'University of the Philippines',
                  primary_specialization_id = 'equity_research', country_code = 'PH' where id = $1`, [alice]);
  await q(alice, `update user_preferences set interests = '{equity_research,portfolio_management}',
                  experience_level = 'finance_student', goal = 'career_prep' where user_id = $1`, [alice]);
  const pref = (await q(alice, `select * from user_preferences where user_id = $1`, [alice])).rows[0];
  ok(pref.experience_level === 'finance_student' && pref.interests.length === 2, 'preferences saved');
  await q(bob, `update profiles set onboarded_at = now(), university = 'Ateneo de Manila University', primary_specialization_id = 'investment_banking' where id = $1`, [bob]);

  // ------------------------------------------------------------------
  section('Security: users cannot tamper with calculated or admin data');
  await expectError(alice, `update user_stats set finlab_score = 99 where user_id = $1`, [alice], 'cannot edit FINLAB Score', 'permission denied');
  await expectError(alice, `update user_stats set career_level_id = 6 where user_id = $1`, [alice], 'cannot self-promote', 'permission denied');
  await expectError(alice, `update user_skills set score = 100 where user_id = $1`, [alice], 'cannot edit skill scores', 'permission denied');
  await expectError(alice, `insert into user_roles (user_id, role) values ($1, 'admin')`, [alice], 'cannot grant self admin', 'permission denied');
  await expectError(alice, `insert into user_achievements (user_id, achievement_id) values ($1, 'top_1_percent')`, [alice], 'cannot grant self achievements', 'permission denied');
  await expectError(alice, `insert into promotion_attempts (user_id, from_level_id, target_level_id, passed) values ($1, 1, 2, true)`, [alice], 'cannot forge promotion results', 'permission denied');
  await expectError(alice, `insert into challenge_submissions (attempt_id, user_id, challenge_id) values (gen_random_uuid(), $1, gen_random_uuid())`, [alice], 'cannot forge submissions', 'permission denied');
  await expectError(alice, `update portfolios set cash = 999999999 where user_id = $1`, [alice], 'cannot mint simulated cash', 'permission denied');
  const chUpd = await q(alice, `update challenges set is_published = false`);
  ok(chUpd.affectedRows === 0, 'cannot edit challenges (RLS: 0 rows affected)', chUpd.affectedRows);
  await expectError(alice, `select public.recalculate_user_scores($1)`, [alice], 'internal scoring functions not executable', 'permission denied');
  await expectError(alice, `select public.admin_list_users(null, 10)`, [], 'admin RPC rejects non-admin', 'Admin access required');
  const keys = (await q(alice, `select count(*)::int n from challenge_answer_keys`)).rows[0].n;
  ok(keys === 0, 'answer keys invisible to users', keys);
  const upd = await q(alice, `update profiles set full_name = 'Hacked' where id = $1`, [bob]);
  ok(upd.affectedRows === 0, "cannot edit another user's profile");
  const bobPrefs = (await q(alice, `select count(*)::int n from user_preferences where user_id = $1`, [bob])).rows[0].n;
  ok(bobPrefs === 0, "cannot read another user's preferences");

  // ------------------------------------------------------------------
  section('6–10. Challenge: open → start → save draft → submit → score → skills');
  const ch = (await q(alice, `select id, title from challenges where slug = 'accounting-three-statements'`)).rows[0];
  ok(!!ch, 'published challenge visible');
  const attempt = await rpc(alice, 'start_challenge', [ch.id, null]);
  ok(!!attempt, 'attempt started');
  const sameAttempt = await rpc(alice, 'start_challenge', [ch.id, null]);
  ok(sameAttempt === attempt, 'resuming returns the same open attempt');
  await rpc(alice, 'save_challenge_draft', [attempt, JSON.stringify({ gp: '48' })]);
  const draft = (await q(alice, `select responses from challenge_attempts where id = $1`, [attempt])).rows[0];
  ok(draft.responses.gp === '48', 'draft saved');
  const responses = await perfectResponses('accounting-three-statements');
  const result = await rpc(alice, 'submit_challenge', [attempt, JSON.stringify(responses)]);
  ok(result.status === 'scored' && Number(result.score) >= 95, 'submission auto-scored', result.score);
  ok(result.new_achievements.includes('first_challenge'), 'First Challenge achievement awarded', result.new_achievements);
  await expectError(alice, `select public.submit_challenge($1, '{}'::jsonb)`, [attempt], 'cannot resubmit same attempt', 'already been submitted');
  const tk = (await q(alice, `select score from user_skills where user_id = $1 and skill_id = 'technical_knowledge'`, [alice])).rows[0];
  ok(Number(tk.score) > 0, 'Technical Knowledge skill increased', tk.score);
  const s1 = Number((await q(alice, `select finlab_score from user_stats where user_id = $1`, [alice])).rows[0].finlab_score);
  ok(s1 > 0, 'FINLAB Score increased from activity', s1);

  // Wrong answers score low
  const bobCh = await rpc(bob, 'start_challenge', [ch.id, null]);
  const bobRes = await rpc(bob, 'submit_challenge', [bobCh, JSON.stringify({ gp: '10', gm: '5', capex: 'a', ocf: 'no idea' })]);
  ok(Number(bobRes.score) < 20 && bobRes.passed === false, 'wrong answers score low and fail', bobRes.score);

  // ------------------------------------------------------------------
  section('11. Stock pitch (standalone quick + professional window rules)');
  const pitchId = (await q(alice, `insert into stock_pitches (format, company, ticker, exchange, currency, rating, current_price, target_price, valuation_method, thesis, catalysts, risks)
     values ('quick', 'BDO Unibank', 'BDO', 'PSE', 'PHP', 'BUY', 142.5, 170, 'P/B',
       $1, $2, $3) returning id`, [
    longText('Loan growth', 140) + '\nSecond thesis point on deposits at 45% CASA ratio.',
    'Q4 2026 earnings beat on NIM\nBSP rate decision next quarter\nDigital bank rollout by end-2026',
    'Asset quality deterioration — monitor NPL ratio above 3%\nMargin compression if rates fall\nRegulatory changes on fees, mitigated by scale',
  ])).rows[0].id;
  await expectError(alice, `select public.submit_stock_pitch($1)`, [pitchId], 'pitch without sources is rejected', 'at least one source');
  for (const [title, url] of [['BDO 2025 Annual Report', 'https://www.bdo.com.ph'], ['PSE Disclosure', 'https://edge.pse.com.ph'], ['BSP Banking Statistics', 'https://www.bsp.gov.ph']]) {
    await q(alice, `insert into sources (stock_pitch_id, title, url) values ($1, $2, $3)`, [pitchId, title, url]);
  }
  const pitchRes = await rpc(alice, 'submit_stock_pitch', [pitchId]);
  ok(pitchRes.status === 'scored' && Number(pitchRes.score) > 50, 'quick pitch scored by rubric', pitchRes.score);
  ok(pitchRes.criteria.length === 7, 'rubric has 7 weighted criteria');
  ok(pitchRes.new_achievements.includes('first_stock_pitch'), 'First Stock Pitch achievement');
  await expectError(alice, `update stock_pitches set thesis = 'changed' where id = $1`, [pitchId], 'submitted pitch content is locked', 'locked');
  await q(alice, `update stock_pitches set is_public = true where id = $1`, [pitchId]);
  ok((await q(alice, `select is_public from stock_pitches where id = $1`, [pitchId])).rows[0].is_public, 'visibility can still change after submit');
  await expectError(alice, `update stock_pitches set score = 100 where id = $1`, [pitchId], 'cannot edit pitch score', 'permission denied');
  await expectError(alice, `insert into stock_pitches (format, deadline_at) values ('professional', now() + interval '30 days')`, [], 'professional deadline > 7 days rejected', '2 and 7 days');
  const proId = (await q(alice, `insert into stock_pitches (format, deadline_at) values ('professional', now() + interval '5 days') returning id`)).rows[0].id;
  ok(!!proId, 'professional pitch with 5-day window created');
  await expectError(alice, `select public.submit_stock_pitch($1)`, [proId], 'incomplete professional pitch rejected', 'variant perception');
  ok((await q(bob, `select count(*)::int n from stock_pitches where id = $1`, [proId])).rows[0].n === 0, "other users can't read private drafts");
  ok((await q(bob, `select count(*)::int n from stock_pitches where id = $1`, [pitchId])).rows[0].n === 1, 'other users can read public submitted pitch');
  ok((await q(null, `select count(*)::int n from stock_pitches where id = $1`, [pitchId])).rows[0].n === 1, 'anon can read public pitch (recruiter view)');

  // Challenge-linked pitch
  const qpCh = (await q(alice, `select id from challenges where slug = 'stock-pitch-quick-bdo'`)).rows[0].id;
  const qpAttempt = await rpc(alice, 'start_challenge', [qpCh, null]);
  const linked = (await q(alice, `select stock_pitch_id from challenge_attempts where id = $1`, [qpAttempt])).rows[0].stock_pitch_id;
  const prefilled = (await q(alice, `select ticker, current_price from stock_pitches where id = $1`, [linked])).rows[0];
  ok(prefilled.ticker === 'BDO' && Number(prefilled.current_price) === 142.5, 'challenge pitch prefilled from case');
  await q(alice, `update stock_pitches set rating = 'BUY', target_price = 165, valuation_method = 'P/E', thesis = $2, catalysts = $3, risks = $4 where id = $1`, [
    linked, longText('NIM expansion', 130), 'Q1 2027 results\nRate cuts in H2 2026\nDividend hike next year', 'NPL spike — monitor\nCompetition\nRegulation',
  ]);
  for (const t of ['Annual report', 'Analyst briefing', 'BSP data']) await q(alice, `insert into sources (stock_pitch_id, title) values ($1, $2)`, [linked, t]);
  const linkedRes = await rpc(alice, 'submit_stock_pitch', [linked]);
  ok(linkedRes.status === 'scored' && !!linkedRes.submission_id, 'challenge-linked pitch submitted through challenge pipeline');

  // ------------------------------------------------------------------
  section('12. Research Studio');
  const rp = (await q(alice, `insert into research_projects (title, company, ticker, rating, current_price, target_price) values ('Jollibee initiation', 'Jollibee Foods', 'JFC', 'BUY', 238, 290) returning id`)).rows[0].id;
  const nSections = (await q(alice, `select count(*)::int n from research_sections where project_id = $1`, [rp])).rows[0].n;
  ok(nSections === 10, '10 report sections created automatically');
  const dup = await rpc(alice, 'duplicate_research_project', [rp]);
  ok(!!dup, 'research project duplicated');
  await q(alice, `delete from research_projects where id = $1`, [dup]);
  ok((await q(alice, `select count(*)::int n from research_projects where id = $1`, [dup])).rows[0].n === 0, 'research project deleted');
  await q(alice, `update research_sections set content = $2 where project_id = $1 and section_key in ('investment_thesis','company_overview','industry_overview','competitive_analysis','financial_analysis','forecast','valuation','conclusion')`, [rp, longText('Store expansion', 220) + ' DCF with WACC 9%.']);
  await q(alice, `update research_sections set content = $2 where project_id = $1 and section_key in ('catalysts','risks')`, [rp, 'Item one in Q1 2027\nItem two next year\nItem three by 2028']);
  for (let i = 1; i <= 5; i++) await q(alice, `insert into sources (research_project_id, title, url) values ($1, $2, 'https://example.com')`, [rp, `Source ${i}`]);
  const rRes = await rpc(alice, 'submit_research_project', [rp]);
  ok(rRes.status === 'scored' && Number(rRes.score) > 70, 'research report scored', rRes.score);
  const locked = await q(alice, `update research_sections set content = 'edit' where project_id = $1`, [rp]).catch(() => ({ affectedRows: 0 }));
  ok(locked.affectedRows === 0, 'submitted report sections cannot be edited');

  // ------------------------------------------------------------------
  section('Valuation, financial models, portfolio, market events');
  await q(alice, `insert into valuation_models (name, ticker, method, inputs, outputs) values ('BDO P/B', 'BDO', 'pb', '{"bvps":106,"targetMultiple":1.6}', '{"targetPrice":169.6}')`);
  await q(alice, `insert into financial_models (name, data) values ('JFC model', '{"years":[]}')`);
  ok((await q(alice, `select count(*)::int n from valuation_models where user_id = $1`, [alice])).rows[0].n === 1, 'valuation model saved');
  const buy = await rpc(alice, 'execute_trade', ['PSE:BDO', 'buy', 10000, 'Rate hike supports net interest margins.', null]);
  ok(Number(buy.amount_base) === 1425000, 'buy executed at server-side price', buy.amount_base);
  await rpc(alice, 'execute_trade', ['NASDAQ:AAPL', 'buy', 100, 'Diversify into US tech with services growth.', null]);
  const cash = Number((await q(alice, `select cash from portfolios where user_id = $1`, [alice])).rows[0].cash);
  ok(cash === 10000000 - 1425000 - 100 * 228 * 57.5, 'cash reduced incl. FX conversion', cash);
  await rpc(alice, 'execute_trade', ['PSE:BDO', 'sell', 4000, 'Trim position to manage concentration.', null]);
  const pos = (await q(alice, `select shares from portfolio_positions pp join portfolios p on p.id = pp.portfolio_id where p.user_id = $1 and security_id = 'PSE:BDO'`, [alice])).rows[0];
  ok(Number(pos.shares) === 6000, 'position reduced after sell');
  await expectError(alice, `select public.execute_trade('PSE:BDO', 'sell', 999999, 'Selling more than held here', null)`, [], 'cannot oversell', 'more shares');
  await expectError(alice, `select public.execute_trade('PSE:BDO', 'buy', 10, 'short', null)`, [], 'trade requires rationale', 'at least 15');
  await expectError(alice, `select public.execute_trade('PSE:SM', 'buy', 100000, 'Buying far more than cash allows', null)`, [], 'cannot exceed cash', 'Insufficient');

  const ev = (await q(alice, `select id from market_events where status = 'open' order by title limit 1`)).rows[0].id;
  await rpc(alice, 'submit_market_event_decision', [ev, 'rebalance', 'Rotate from property developers into banks: higher rates lift net interest margin while raising the discount rate for real estate valuation multiples.', 'PSE:BDO', 4]);
  ok((await q(alice, `select count(*)::int n from market_event_decisions where user_id = $1`, [alice])).rows[0].n === 1, 'market event decision recorded');
  const res0 = await rpc(alice, 'get_market_event_resolution', [ev]);
  ok(res0 === null, 'event answer key hidden until resolved');

  // ------------------------------------------------------------------
  section('Competitions');
  const comp = (await q(alice, `select id from competitions where slug = 'finlab-beta-cup-s1'`)).rows[0].id;
  const compCh = (await q(alice, `select id from challenges where slug = 'valuation-multiples-pe-pb'`)).rows[0].id;
  await expectError(alice, `select public.start_challenge($1, $2)`, [compCh, comp], 'must register before competing', 'not registered');
  await rpc(alice, 'register_for_competition', [comp]);
  await rpc(bob, 'register_for_competition', [comp]);
  const ca = await rpc(alice, 'start_challenge', [compCh, comp]);
  const cres = await rpc(alice, 'submit_challenge', [ca, JSON.stringify(await perfectResponses('valuation-multiples-pe-pb'))]);
  ok(cres.status === 'scored', 'competition challenge submitted');
  const cb = await rpc(bob, 'start_challenge', [compCh, comp]);
  await rpc(bob, 'submit_challenge', [cb, JSON.stringify({ pe_tp: '50.4', pb_tp: '40' })]);
  const standings = (await q(alice, `select * from get_competition_standings($1)`, [comp])).rows;
  ok(standings.length === 2 && standings[0].user_id === alice, 'standings ranked by score', standings.map((s) => [s.display_name, s.score]));

  // ------------------------------------------------------------------
  section('14. Leaderboards & ranks');
  const lb = (await q(bob, `select * from get_leaderboard('global', null, 50)`)).rows;
  ok(lb.length === 2 && lb[0].user_id === alice, 'global leaderboard calculated from results', lb.map((r) => [r.display_name, r.value]));
  const ph = (await q(alice, `select * from get_leaderboard('philippines', null, 50)`)).rows;
  ok(ph.length === 2, 'Philippines leaderboard');
  const uni = (await q(alice, `select * from get_leaderboard('university', 'university of the philippines', 50)`)).rows;
  ok(uni.length === 1 && uni[0].is_me, 'university leaderboard filters by school');
  const sp = (await q(alice, `select * from get_leaderboard('stock_pitch', null, 50)`)).rows;
  ok(sp.length === 1 && Number(sp[0].value) > 0, 'stock pitch leaderboard');
  const er = (await q(alice, `select * from get_leaderboard('equity_research', null, 50)`)).rows;
  ok(er.length === 1, 'equity research leaderboard');
  const pfl = (await q(alice, `select * from get_leaderboard('portfolio', null, 50)`)).rows;
  ok(pfl.length === 1, 'portfolio leaderboard');
  const ranks = await rpc(alice, 'get_my_ranks');
  ok(ranks.global.rank === 1 && ranks.country.rank === 1, 'my ranks', ranks);
  await q(bob, `update profiles set is_public = false where id = $1`, [bob]);
  const lb2 = (await q(alice, `select * from get_leaderboard('global', null, 50)`)).rows;
  ok(lb2.length === 1, 'private profiles hidden from other users on leaderboards');
  await q(bob, `update profiles set is_public = true where id = $1`, [bob]);

  // ------------------------------------------------------------------
  section('13. Finance Passport');
  const handle = (await q(alice, `select handle from profiles where id = $1`, [alice])).rows[0].handle;
  const passport = await rpc(null, 'get_passport', [handle]);
  ok(passport && passport.profile.full_name === 'Alice Santos', 'public passport readable by anon (recruiter link)');
  await expectError(null, `select public.worked_state('00000000-0000-0000-0000-000000000000')`, [], 'anon cannot call signed-in RPCs', 'permission denied');
  await expectError(null, `select public.list_programs()`, [], 'anon cannot list programs', 'permission denied');
  ok(Number(passport.counts.stock_pitches) === 2 && Number(passport.counts.research_reports) === 1, 'passport activity counts', passport.counts);
  ok(passport.public_pitches.length === 1, 'passport lists public pitches only');
  ok(passport.achievements.length >= 3, 'passport lists achievements', passport.achievements.map((a) => a.id));
  await q(alice, `update profiles set is_public = false where id = $1`, [alice]);
  ok((await rpc(null, 'get_passport', [handle])) === null, 'private passport hidden from anon');
  ok((await rpc(alice, 'get_passport', [handle])) !== null, 'owner still sees private passport');
  await q(alice, `update profiles set is_public = true where id = $1`, [alice]);

  // ------------------------------------------------------------------
  section('16. Promotion: NOT YET, then complete the work and PASS');
  const p1 = await rpc(alice, 'attempt_promotion');
  ok(p1.result === 'NOT_YET', 'promotion NOT YET with missing requirements', p1.status.requirements.filter((r) => !r.met).map((r) => r.label));
  ok((await q(alice, `select career_level_id from user_stats where user_id = $1`, [alice])).rows[0].career_level_id === 1, 'level unchanged after failed attempt');

  const taskSlugs = (await q(alice, `select slug from challenges where kind = 'tasks' and is_published and not ('certification_exam' = any(tags)) order by slug`)).rows.map((r) => r.slug);
  for (const slug of taskSlugs) {
    const id = (await q(alice, `select id from challenges where slug = $1`, [slug])).rows[0].id;
    const a = await rpc(alice, 'start_challenge', [id, null]);
    await rpc(alice, 'submit_challenge', [a, JSON.stringify(await perfectResponses(slug))]);
  }
  const statusBefore = await rpc(alice, 'get_promotion_status');
  const score2 = Number((await q(alice, `select finlab_score from user_stats where user_id = $1`, [alice])).rows[0].finlab_score);
  console.log(`    FINLAB Score after full curriculum: ${score2}`);
  ok(statusBefore.eligible === true, 'eligible after completing required work', statusBefore.requirements.map((r) => [r.label, r.current, r.met]));
  const p2 = await rpc(alice, 'attempt_promotion');
  ok(p2.result === 'PASS', 'promotion PASS');
  const lvl = (await q(alice, `select cl.name from user_stats s join career_levels cl on cl.id = s.career_level_id where s.user_id = $1`, [alice])).rows[0].name;
  ok(lvl === 'Analyst', 'promoted to Analyst', lvl);
  const attempts = (await q(alice, `select passed from promotion_attempts where user_id = $1 order by created_at`, [alice])).rows;
  ok(attempts.length === 2 && attempts[0].passed === false && attempts[1].passed === true, 'promotion attempts recorded');
  const valSpec = (await q(alice, `select 1 from user_achievements where user_id = $1 and achievement_id = 'valuation_specialist'`, [alice])).rows.length;
  ok(valSpec === 1, 'Valuation Specialist awarded from real conditions');

  // ------------------------------------------------------------------
  section('Admin flows');
  await db.query(`insert into user_roles (user_id, role) values ($1, 'admin')`, [bob]); // bootstrap first admin (SQL editor / service role)
  const users = (await q(bob, `select * from admin_list_users(null, 50)`)).rows;
  ok(users.length === 2 && users.some((u) => u.email === 'alice@example.com'), 'admin can list users with email');
  ok((await q(bob, `select count(*)::int n from challenge_answer_keys`)).rows[0].n === counts.keys, 'admin can read answer keys');
  const newCh = (await q(bob, `insert into challenges (slug, title, category_id, kind, difficulty, estimated_minutes, scoring_method, skill_impact, content, is_published)
     values ('admin-written-case', 'Admin written case', 'case_competition', 'tasks', 'intermediate', 20, 'manual', '{"communication":1}',
     '{"tasks":[{"id":"essay","type":"long_text","label":"Essay","prompt":"Discuss.","min_words":20,"points":100}]}', false) returning id`)).rows[0].id;
  ok(!!newCh, 'admin creates challenge');
  ok((await q(alice, `select count(*)::int n from challenges where id = $1`, [newCh])).rows[0].n === 0, 'unpublished challenge hidden from users');
  await q(bob, `update challenges set is_published = true, published_at = now() where id = $1`, [newCh]);
  ok((await q(alice, `select count(*)::int n from challenges where id = $1`, [newCh])).rows[0].n === 1, 'published challenge visible');
  const ma = await rpc(alice, 'start_challenge', [newCh, null]);
  const mres = await rpc(alice, 'submit_challenge', [ma, JSON.stringify({ essay: longText('Leadership', 40) })]);
  ok(mres.status === 'pending_review' && mres.score === null, 'manual challenge awaits review');
  const commBefore = Number((await q(alice, `select score from user_skills where user_id = $1 and skill_id = 'communication'`, [alice])).rows[0].score);
  const scored = await rpc(bob, 'admin_score_submission', [mres.submission_id, JSON.stringify([{ key: 'essay', label: 'Essay', score: 90, max: 100, feedback: 'Strong.' }]), 'Well argued.']);
  ok(Number(scored.score) === 90, 'admin scores submission');
  const sub = (await q(alice, `select status, final_score from challenge_submissions where id = $1`, [mres.submission_id])).rows[0];
  ok(sub.status === 'scored' && Number(sub.final_score) === 90, 'user sees admin score');
  const commAfter = Number((await q(alice, `select score from user_skills where user_id = $1 and skill_id = 'communication'`, [alice])).rows[0].score);
  ok(commAfter !== commBefore, 'admin score propagates to skills', [commBefore, commAfter]);

  await q(bob, `update promotion_requirements set params = '{"value":71}' where target_level_id = 2 and requirement_type = 'min_finlab_score'`);
  ok((await q(bob, `select params->>'value' v from promotion_requirements where target_level_id = 2 and requirement_type = 'min_finlab_score'`)).rows[0].v === '71', 'admin edits promotion requirement');
  const prUpd = await q(alice, `update promotion_requirements set params = '{"value":0}'`);
  ok(prUpd.affectedRows === 0, 'user cannot edit promotion requirements (RLS: 0 rows affected)', prUpd.affectedRows);
  await q(bob, `update achievements set description = 'Updated' where id = 'first_challenge'`);
  await rpc(bob, 'admin_award_achievement', [alice, 'competition_champion', 'Manual test award']);
  ok((await q(alice, `select award_source from user_achievements where user_id = $1 and achievement_id = 'competition_champion'`, [alice])).rows[0].award_source === 'admin', 'admin awards achievement');
  await rpc(bob, 'admin_revoke_achievement', [alice, 'competition_champion']);

  await expectError(bob, `select public.admin_finalize_competition($1)`, [comp], 'cannot finalize before end', 'not ended');
  await db.query(`update competitions set ends_at = now() - interval '1 minute', registration_deadline = now() - interval '2 minutes' where id = $1`, [comp]);
  const nRes = await rpc(bob, 'admin_finalize_competition', [comp]);
  ok(nRes === 2, 'competition finalized', nRes);
  const won = (await q(alice, `select rank from competition_results where competition_id = $1 and user_id = $2`, [comp, alice])).rows[0];
  ok(won.rank === 1, 'winner recorded');
  ok((await q(alice, `select 1 from user_achievements where user_id = $1 and achievement_id = 'competition_champion'`, [alice])).rows.length === 1, 'Competition Champion awarded from real result');
  ok(Number((await q(alice, `select score from user_skills where user_id = $1 and skill_id = 'leadership'`, [alice])).rows[0].score) > 0, 'competition result adds Leadership evidence');

  const priceBefore = Number((await db.query(`select price from market_securities where id = 'PSE:ALI'`)).rows[0].price);
  const resolved = await rpc(bob, 'admin_resolve_market_event', [ev, 'Banks rallied while developers sold off.']);
  ok(resolved === 1, 'market event resolved and decisions scored');
  const dec = (await q(alice, `select score from market_event_decisions where user_id = $1`, [alice])).rows[0];
  ok(Number(dec.score) >= 80, 'good reasoning + best action scores well', dec.score);
  const priceAfter = Number((await db.query(`select price from market_securities where id = 'PSE:ALI'`)).rows[0].price);
  ok(priceAfter < priceBefore, 'event price impacts applied to sample data', [priceBefore, priceAfter]);
  ok((await rpc(alice, 'get_market_event_resolution', [ev])) !== null, 'resolution revealed after resolve');

  // Deleting a challenge removes its skill evidence and recalculates affected users.
  const evBefore = (await q(alice, `select count(*)::int n from skill_evidence where user_id = $1 and source_id = $2`, [alice, newCh])).rows[0].n;
  await q(bob, `delete from challenges where id = $1`, [newCh]);
  const evAfter = (await q(alice, `select count(*)::int n from skill_evidence where user_id = $1 and source_id = $2`, [alice, newCh])).rows[0].n;
  ok(evBefore > 0 && evAfter === 0, 'deleting a challenge cleans up its skill evidence', [evBefore, evAfter]);

  const n = await rpc(bob, 'admin_recalculate_all');
  ok(n === 2, 'admin recalculation across users');
  await expectError(bob, `select public.admin_set_admin($1, false)`, [bob], 'cannot remove last admin', 'last administrator');
  const ov = await rpc(bob, 'admin_overview');
  ok(ov.users === 2, 'admin overview');

  // ------------------------------------------------------------------
  section('Competition certificates');
  const compCert = (await q(alice, `select code, title, subtitle, kind from certificates where user_id = $1 and competition_id = $2`, [alice, comp])).rows[0];
  ok(compCert && compCert.kind === 'competition' && /Champion/.test(compCert.subtitle), 'winner receives Champion certificate', compCert);
  const bobCert = (await q(bob, `select subtitle from certificates where user_id = $1 and competition_id = $2`, [bob, comp])).rows[0];
  ok(bobCert && /2nd Place/.test(bobCert.subtitle), 'runner-up receives 2nd Place certificate', bobCert);
  const verified = await rpc(null, 'verify_certificate', [compCert.code.toLowerCase()]);
  ok(verified && verified.recipient_name === 'Alice Santos' && verified.competition?.name, 'anyone can verify a certificate by code (case-insensitive)');
  ok((await rpc(null, 'verify_certificate', ['FLB-ZZZZ-ZZZZ'])) === null, 'unknown code does not verify');
  await expectError(alice, `insert into certificates (code, user_id, kind, recipient_name, title) values ('FLB-AAAA-AAAA', $1, 'certification', 'x', 'Fake')`, [alice], 'users cannot forge certificates', 'permission denied');
  await expectError(alice, `update certificates set revoked_at = null`, [], 'users cannot edit certificates', 'permission denied');

  // ------------------------------------------------------------------
  section('Lesson knowledge checks');
  const carol = await createUser('carol@example.com', 'Carol Lim');
  await q(carol, `update profiles set onboarded_at = now() where id = $1`, [carol]);
  const lessonRow = (await q(carol, `select id, check_questions from lessons where slug = 'three-statements'`)).rows[0];
  ok(lessonRow.check_questions.length === 10, 'lesson has a 10-question check', lessonRow.check_questions.length);
  ok(lessonRow.check_questions.every((x) => x.points === 10), 'every question weighted equally');
  ok(!JSON.stringify(lessonRow.check_questions).includes('"answer"'), 'questions do not leak answers');
  ok((await q(carol, `select count(*)::int n from lesson_check_keys`)).rows[0].n === 0, 'lesson answer keys hidden from users');
  await expectError(carol, `insert into lesson_progress (user_id, lesson_id) values ($1, $2)`, [carol, lessonRow.id], 'cannot mark a lesson complete directly', 'permission denied');
  await expectError(carol, `select public.submit_lesson_check($1, '{}'::jsonb)`, [lessonRow.id], 'check locked until the video is watched', 'Watch the lesson video first');
  await expectError(carol, `insert into lesson_video_views (user_id, lesson_id, method) values ($1, $2, 'ended')`, [carol, lessonRow.id], 'cannot write video views directly', 'permission denied');
  await rpc(carol, 'mark_lesson_video_watched', [lessonRow.id, 'manual']);
  await expectError(carol, `select public.submit_lesson_check($1, '{}'::jsonb)`, [lessonRow.id], 'check locked until practice activities are attempted', 'Complete the practice activities first');

  section('Interactive practice activities');
  ok((await q(carol, `select count(*)::int n from lesson_activity_keys`)).rows[0].n === 0, 'activity answer keys hidden from users');
  const actCounts = (await db.query(`select count(*)::int n, count(distinct lesson_id)::int lessons,
      count(*) filter (where kind = 'calculator')::int calc from lesson_activities`)).rows[0];
  ok(actCounts.n === 24 && actCounts.lessons === 12 && actCounts.calc === 7, 'every lesson has practice (24 activities, 7 calculators)', actCounts);
  const acts = (await db.query(`select a.id, a.kind, a.slug, a.content, k.key from lesson_activities a join lessons l on l.id = a.lesson_id
      join lesson_activity_keys k on k.activity_id = a.id where l.slug in ('three-statements','cash-flow-statement','credit-analysis')`)).rows;
  const matching = acts.find((a) => a.slug === 'which-statement');
  const allWrong = Object.fromEntries(Object.keys(matching.key).map((k) => [k, 'zzz']));
  const m0 = await rpc(carol, 'submit_activity', [matching.id, JSON.stringify({ placements: allWrong })]);
  ok(Number(m0.score) === 0 && m0.correct === 0, 'matching: all wrong scores 0', m0.score);
  ok(!JSON.stringify(m0).includes('"bs"') && !JSON.stringify(m0).includes('"cfs"'), 'matching feedback does not reveal correct categories');
  await db.exec(`update app_settings set value = '60' where key = 'activity_retry_seconds'`);
  await expectError(carol, `select public.submit_activity($1, '{}'::jsonb)`, [matching.id], 'activity retry cooldown', 'Slow down');
  await db.exec(`update app_settings set value = '0' where key = 'activity_retry_seconds'`);
  const m1 = await rpc(carol, 'submit_activity', [matching.id, JSON.stringify({ placements: matching.key })]);
  ok(Number(m1.score) === 100, 'matching: all correct scores 100');
  const spot = acts.find((a) => a.slug === 'income-statement-errors');
  const spot0 = await rpc(carol, 'submit_activity', [spot.id, JSON.stringify({ selected: ['r5', 'r1'] })]);
  ok(Number(spot0.score) === 0 && spot0.found === 1 && spot0.false_flags === 1, 'spot-the-error: false flags cancel hits', spot0);
  const spot1 = await rpc(carol, 'submit_activity', [spot.id, JSON.stringify({ selected: spot.key.errors })]);
  ok(Number(spot1.score) === 100 && spot1.explanations.r5, 'spot-the-error: all found scores 100 with explanations');
  const branch = acts.find((a) => a.slug === 'loan-request');
  await expectError(carol, `select public.submit_activity($1, $2::jsonb)`, [branch.id, JSON.stringify({ path: [{ node: 'n2b', choice: 'b' }] })], 'branching: invalid path rejected', 'Invalid path');
  await expectError(carol, `select public.submit_activity($1, $2::jsonb)`, [branch.id, JSON.stringify({ path: [{ node: 'n1', choice: 'b' }] })], 'branching: unfinished scenario rejected', 'Finish the scenario');
  const b0 = await rpc(carol, 'submit_activity', [branch.id, JSON.stringify({ path: [{ node: 'n1', choice: 'a' }, { node: 'n2a', choice: 'a' }] })]);
  ok(Number(b0.score) === 0 && b0.ending === 'end_bad', 'branching: bad path scores 0 with its ending', b0.score);
  const b1 = await rpc(carol, 'submit_activity', [branch.id, JSON.stringify({ path: bestPath(branch.content, branch.key) })]);
  ok(Number(b1.score) === 100 && b1.debrief.length === 2, 'branching: best path scores 100 with debrief');
  const worked = acts.find((a) => a.slug === 'build-cfo-fcf');
  await expectError(carol, `select public.worked_check($1, 's2', '-30')`, [worked.id], 'worked example: steps unlock in order', 'previous step');
  const w0 = await rpc(carol, 'worked_check', [worked.id, 's1', '999']);
  ok(w0.correct === false && !w0.explanation, 'worked example: wrong answer, no explanation leaked');
  const hint = await rpc(carol, 'worked_hint', [worked.id, 's1']);
  ok(typeof hint === 'string' && hint.length > 5, 'worked example: hint available');
  for (const s of worked.content.steps) var wLast = await rpc(carol, 'worked_check', [worked.id, s.id, String(worked.key[s.id].answer)]);
  ok(wLast.completed === true && Number(wLast.score) === 87, 'worked example: score 100 − 10 (hint) − 3 (wrong) = 87', wLast);
  await expectError(carol, `insert into activity_attempts (user_id, activity_id, score) values ($1, $2, 100)`, [carol, worked.id], 'cannot forge activity attempts', 'permission denied');
  const wrong = await rpc(carol, 'submit_lesson_check', [lessonRow.id, JSON.stringify({ q1: 'a', q2: 'a', q3: '1', q4: 'a' })]);
  ok(wrong.passed === false && Number(wrong.score) === 0, 'wrong answers fail the check', wrong);
  ok(!JSON.stringify(wrong).includes('"answer"'), 'check feedback never reveals answers');
  ok((await q(carol, `select count(*)::int n from lesson_progress where user_id = $1`, [carol])).rows[0].n === 0, 'failed check records no completion');
  await db.exec(`update app_settings set value = '60' where key = 'lesson_retry_seconds'`);
  await expectError(carol, `select public.submit_lesson_check($1, '{}'::jsonb)`, [lessonRow.id], 'retry cooldown on lesson checks', 'try again in');
  await db.exec(`update app_settings set value = '0' where key = 'lesson_retry_seconds'`);
  const tsAnswers = await lessonAnswers('three-statements');
  const sevenRight = await rpc(carol, 'submit_lesson_check', [lessonRow.id, JSON.stringify({ ...tsAnswers, q8: '1', q9: 'a', q10: 'a' })]);
  ok(sevenRight.passed === false && Number(sevenRight.score) === 70, '7 of 10 does not pass (80% needed)', sevenRight.score);
  const eightRight = await rpc(carol, 'submit_lesson_check', [lessonRow.id, JSON.stringify({ ...tsAnswers, q9: 'a', q10: 'a' })]);
  ok(eightRight.passed === true && Number(eightRight.score) === 80, '8 of 10 passes', eightRight.score);
  ok((await q(carol, `select count(*)::int n from lesson_progress where user_id = $1`, [carol])).rows[0].n === 1, 'passing records the completion');

  // ------------------------------------------------------------------
  const vids = (await db.query(`select min(cardinality(video_urls))::int mn, max(cardinality(video_urls))::int mx from lessons`)).rows[0];
  ok(vids.mn === 1 && vids.mx === 1, 'every lesson has exactly one video', vids);
  let twoVideos = false;
  try { await db.query(`update lessons set video_urls = '{https://youtu.be/dQw4w9WgXcQ,https://youtu.be/abcdefghijk}' where slug = 'three-statements'`); } catch { twoVideos = true; }
  ok(twoVideos, 'more than one video per lesson rejected');
  let badVideo = false;
  try { await db.query(`update lessons set video_urls = '{https://evil.example.com/x}' where slug = 'three-statements'`); } catch { badVideo = true; }
  ok(badVideo, 'non-YouTube video URLs rejected');

  section('Certification programs & tracks');
  const track = (await q(carol, `select id from certification_programs where slug = 'track-accounting-foundations'`)).rows[0].id;
  const progs = await rpc(carol, 'list_programs');
  ok(progs.length === 7 && progs.some((p) => p.slug === 'track-accounting-foundations' && Number(p.completed_modules) === 1), 'programs list shows progress', progs.map((p) => [p.slug, p.completed_modules, p.modules]));
  await rpc(carol, 'enroll_program', [track]);
  const cfsLesson = (await q(carol, `select id from lessons where slug = 'cash-flow-statement'`)).rows[0].id;
  await rpc(carol, 'mark_lesson_video_watched', [cfsLesson, 'ended']);
  await completeActivities(carol, 'cash-flow-statement');
  await rpc(carol, 'submit_lesson_check', [cfsLesson, JSON.stringify(await lessonAnswers('cash-flow-statement'))]);
  for (const slug of ['accounting-three-statements', 'accounting-cash-flow-build']) {
    const id = (await q(carol, `select id from challenges where slug = $1`, [slug])).rows[0].id;
    const a = await rpc(carol, 'start_challenge', [id, null]);
    await rpc(carol, 'submit_challenge', [a, JSON.stringify(await perfectResponses(slug))]);
  }
  const trackDetail = await rpc(carol, 'get_program', ['track-accounting-foundations']);
  ok(trackDetail.modules.every((m) => m.complete) && trackDetail.enrollment.completed_at, 'all track modules complete', trackDetail.modules.map((m) => [m.title, m.complete]));
  ok(/^FLB-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(trackDetail.certificate_code ?? ''), 'track certificate issued automatically', trackDetail.certificate_code);
  const carolHandle = (await q(carol, `select handle from profiles where id = $1`, [carol])).rows[0].handle;
  const carolCerts = await rpc(null, 'get_user_certificates', [carolHandle]);
  ok(carolCerts.length === 1, 'public certificate list for passport');

  const exam = (await q(carol, `select id from challenges where slug = 'exam-financial-statements'`)).rows[0].id;
  await expectError(carol, `select public.start_challenge($1, null)`, [exam], 'exam locked without enrollment', 'Final exam locked');
  const cert = (await q(carol, `select id from certification_programs where slug = 'financial-statement-analyst'`)).rows[0].id;
  await rpc(carol, 'enroll_program', [cert]);
  await expectError(carol, `select public.start_challenge($1, null)`, [exam], 'exam locked until earlier modules are complete', 'Final exam locked');
  const fsaDetail = await rpc(carol, 'get_program', ['financial-statement-analyst']);
  ok(fsaDetail.modules.find((m) => m.kind === 'exam').locked === true, 'program detail shows exam as locked');
  // Complete every earlier module, then the exam unlocks and passing issues the certificate.
  for (const m of fsaDetail.modules.filter((x) => (x.kind === 'lesson' || x.kind === 'challenge') && !x.complete)) {
    if (m.kind === 'lesson') {
      const lid = (await q(carol, `select id from lessons where slug = $1`, [m.lesson_slug])).rows[0].id;
      await rpc(carol, 'mark_lesson_video_watched', [lid, 'ended']);
      await completeActivities(carol, m.lesson_slug);
      await rpc(carol, 'submit_lesson_check', [lid, JSON.stringify(await lessonAnswers(m.lesson_slug))]);
    } else {
      const slug = (await q(carol, `select slug from challenges where id = $1`, [m.challenge_id])).rows[0].slug;
      const a = await rpc(carol, 'start_challenge', [m.challenge_id, null]);
      await rpc(carol, 'submit_challenge', [a, JSON.stringify(await perfectResponses(slug))]);
    }
  }
  const examAttempt = await rpc(carol, 'start_challenge', [exam, null]);
  ok(!!examAttempt, 'exam unlocks after all modules are complete');
  const examRes = await rpc(carol, 'submit_challenge', [examAttempt, JSON.stringify(await perfectResponses('exam-financial-statements'))]);
  ok(Number(examRes.score) >= 90, 'exam scored', examRes.score);
  ok((await q(carol, `select count(*)::int n from certificates where user_id = $1 and program_id = $2`, [carol, cert])).rows[0].n === 0,
    'no certificate yet: the capstone is still outstanding');

  section('Capstone presentation');
  const fsaAfterExam = await rpc(carol, 'get_program', ['financial-statement-analyst']);
  const capMod = fsaAfterExam.modules.find((m) => m.kind === 'capstone');
  ok(capMod && capMod.locked === false && capMod.complete === false && capMod.position === fsaAfterExam.modules.length,
    'capstone is the last module and unlocks after the exam', capMod && [capMod.position, capMod.locked]);
  ok(capMod.config.rubric.length === 4 && capMod.config.rubric.reduce((s, r) => s + r.max, 0) === 100, 'capstone rubric totals 100');
  const summary = longText('The company converts profit into cash', 160);
  await expectError(carol, `select public.submit_capstone($1, 'https://evil.example.com/video', null, $2)`, [capMod.id, summary], 'capstone rejects unknown video hosts', 'YouTube');
  await expectError(carol, `select public.submit_capstone($1, 'https://youtu.be/abc', null, 'Too short')`, [capMod.id], 'capstone requires a 150-word summary', '150 words');
  const capSub = await rpc(carol, 'submit_capstone', [capMod.id, 'https://youtu.be/abcdefghijk', 'https://docs.google.com/presentation/d/x', summary]);
  ok(!!capSub, 'capstone submitted');
  await expectError(carol, `select public.submit_capstone($1, 'https://youtu.be/abc', null, $2)`, [capMod.id, summary], 'cannot resubmit while awaiting review', 'awaiting review');
  await expectError(carol, `select public.admin_score_capstone($1, '[]'::jsonb, 'x', false)`, [capSub], 'learner cannot score capstones', 'Admin access required');
  await expectError(carol, `update capstone_submissions set score = 100`, [], 'learner cannot edit capstone score', 'permission denied');
  const rubric = (pct) => JSON.stringify(capMod.config.rubric.map((r) => ({ key: r.key, label: r.label, max: r.max, score: Math.round(r.max * pct) })));
  const ret = await rpc(bob, 'admin_score_capstone', [capSub, rubric(0), 'Please add the cash conversion section.', true]);
  ok(ret.status === 'returned', 'admin returns capstone for revision');
  await rpc(carol, 'submit_capstone', [capMod.id, 'https://www.loom.com/share/abc', null, summary]);
  const low = await rpc(bob, 'admin_score_capstone', [capSub, rubric(0.6), 'Below the bar.', false]);
  ok(Number(low.score) === 60, 'capstone scored 60', low);
  ok((await q(carol, `select count(*)::int n from certificates where user_id = $1 and program_id = $2`, [carol, cert])).rows[0].n === 0, 'a failing capstone does not issue the certificate');
  await rpc(carol, 'submit_capstone', [capMod.id, 'https://vimeo.com/123', null, summary]);
  const high = await rpc(bob, 'admin_score_capstone', [capSub, rubric(0.9), 'Excellent delivery.', false]);
  ok(Number(high.score) >= 89, 'capstone resubmitted and scored 90', high);
  const certRow = (await q(carol, `select code, title from certificates where user_id = $1 and program_id = $2`, [carol, cert])).rows[0];
  ok(certRow?.title === 'Certified Financial Statement Analyst', 'certification issued on passing the capstone', certRow);
  const capEv = (await q(carol, `select count(*)::int n from skill_evidence where user_id = $1 and source_type = 'capstone'`, [carol])).rows[0].n;
  ok(capEv === 3, 'capstone adds communication, leadership and judgment evidence', capEv);
  const carolAch = (await q(carol, `select achievement_id from user_achievements where user_id = $1`, [carol])).rows.map((r) => r.achievement_id);
  ok(carolAch.includes('capstone_passed') && carolAch.includes('first_certificate'), 'capstone + certificate achievements', carolAch);
  await expectError(carol, `select public.submit_capstone($1, 'https://youtu.be/abc', null, $2)`, [capMod.id, summary], 'passed capstone cannot be resubmitted', 'already passed');

  // ------------------------------------------------------------------
  section('Anti-gaming rules');
  await db.exec(`update app_settings set value = '10' where key = 'retry_cooldown_minutes'`);
  const cool = (await q(carol, `select id from challenges where slug = 'accounting-working-capital'`)).rows[0].id;
  await expectError(carol, `select public.start_challenge($1, null)`, [cool], 'retry cooldown after a submission', 'Cooldown');
  await db.exec(`update app_settings set value = '0' where key = 'retry_cooldown_minutes'`);
  const retry = await rpc(carol, 'start_challenge', [cool, null]);
  const retryRes = await rpc(carol, 'submit_challenge', [retry, JSON.stringify(await perfectResponses('accounting-working-capital'))]);
  ok(retryRes.attempt_number === 2 && Number(retryRes.skill_weight_factor) === 0.9, 'second attempt counts at 90% toward skills', [retryRes.attempt_number, retryRes.skill_weight_factor]);
  const retryEv = (await q(carol, `select max(score) s from skill_evidence where user_id = $1 and source_id = $2`, [carol, cool])).rows[0].s;
  ok(Number(retryEv) === 100, 'best attempt (first, 100%) still counts in full', retryEv);
  const used = (await db.query(`select count(*)::int n from challenge_submissions where user_id = $1`, [carol])).rows[0].n;
  await db.exec(`update app_settings set value = '${used}' where key = 'max_daily_submissions'`);
  const capCh = await rpc(carol, 'start_challenge', [(await q(carol, `select id from challenges where slug = 'valuation-wacc-build'`)).rows[0].id, null]);
  await expectError(carol, `select public.submit_challenge($1, '{}'::jsonb)`, [capCh], 'daily submission cap', 'Daily limit');
  await db.exec(`update app_settings set value = '1000' where key = 'max_daily_submissions'`);
  const thesis = (await q(alice, `select thesis from stock_pitches where user_id = $1 and status = 'submitted' and challenge_id is null limit 1`, [alice])).rows[0].thesis;
  const dupPitch = (await q(alice, `insert into stock_pitches (format, company, ticker, rating, current_price, target_price, thesis, catalysts, risks) values ('quick','BDO','BDO','BUY',100,120,$1,'a','b') returning id`, [thesis])).rows[0].id;
  await q(alice, `insert into sources (stock_pitch_id, title) values ($1, 'x')`, [dupPitch]);
  await expectError(alice, `select public.submit_stock_pitch($1)`, [dupPitch], 'duplicate pitch thesis rejected', 'identical');

  // ------------------------------------------------------------------
  section('Flashcards (spaced repetition)');
  ok((await q(carol, `select count(*)::int n from flashcards`)).rows[0].n === 120, 'learners can read published flashcards');
  await expectError(carol, `insert into flashcards (lesson_id, position, front, back) values ($1, 99, 'Front', 'Back')`, [lessonRow.id], 'learners cannot create flashcards', 'row-level security');
  const fq = (await q(carol, `select * from get_flashcard_queue(null, 50)`)).rows;
  ok(fq.length === 20 && fq.every((c) => c.is_new), 'queue introduces 20 new cards per day', fq.length);
  const card = fq[0].card_id;
  const r1 = await rpc(carol, 'review_flashcard', [card, 2]);
  const r2 = await rpc(carol, 'review_flashcard', [card, 2]);
  const r3 = await rpc(carol, 'review_flashcard', [card, 3]);
  ok(Number(r1.interval_days) === 1 && Number(r2.interval_days) === 3 && Number(r3.interval_days) === 10.5, 'intervals grow 1 → 3 → 10.5 days', [r1, r2, r3].map((r) => r.interval_days));
  const r4 = await rpc(carol, 'review_flashcard', [card, 0]);
  ok(Number(r4.interval_days) === 0, '"Again" resets the interval');
  const fstate = (await q(carol, `select reps, lapses from flashcard_state where user_id = $1 and card_id = $2`, [carol, card])).rows[0];
  ok(fstate.reps === 4 && fstate.lapses === 1, 'reps and lapses tracked', fstate);
  await expectError(carol, `select public.review_flashcard($1, 7)`, [card], 'invalid grade rejected', 'Invalid grade');
  await expectError(carol, `update flashcard_state set interval_days = 180`, [], 'cannot edit scheduling directly', 'permission denied');
  const fq2 = (await q(carol, `select * from get_flashcard_queue(null, 50)`)).rows;
  ok(fq2.length === 19 && !fq2.some((c) => c.card_id === card), 'reviewed card leaves the queue; it counts toward today\'s new cards', fq2.length);
  const fstats = await rpc(carol, 'flashcard_stats');
  ok(Number(fstats.learned) === 1 && Number(fstats.reviewed_today) === 4 && Number(fstats.total) === 120, 'flashcard stats', fstats);
  const deck = (await q(carol, `select * from get_flashcard_queue($1, 50)`, [fq[0].lesson_id])).rows;
  ok(deck.length === 9 && deck.every((c) => c.lesson_id === fq[0].lesson_id), 'per-lesson deck', deck.length);

  // ------------------------------------------------------------------
  section('Peer review');
  await expectError(alice, `update stock_pitches set peer_review_open = true where id = $1`, [proId], 'drafts cannot be opened for review', 'Submit the pitch');
  await q(alice, `update stock_pitches set peer_review_open = true where id = $1`, [pitchId]);
  ok((await q(alice, `select peer_review_open from stock_pitches where id = $1`, [pitchId])).rows[0].peer_review_open, 'author opens a submitted pitch for peer review');
  ok(!(await q(alice, `select * from get_review_queue(20)`)).rows.some((r) => r.pitch_id === pitchId), 'own pitch not in own review queue');
  ok((await q(carol, `select * from get_review_queue(20)`)).rows.some((r) => r.pitch_id === pitchId), 'pitch appears in other analysts\' queue');
  const forReview = await rpc(carol, 'get_pitch_for_review', [pitchId]);
  ok(forReview && forReview.ticker === 'BDO' && forReview.sources.length === 3 && !('user_id' in forReview), 'reviewer sees anonymised pitch with sources');
  const fullScores = { thesis: 4, financial_analysis: 3, valuation: 4, risk: 5, catalysts: 3, communication: 4, sources: 5 };
  const strengths = 'Clear thesis with quantified loan growth and a sensible P/B valuation anchored on ROE.';
  const improvements = 'Add a sensitivity on NIM and explain why the market is mispricing asset quality risk.';
  await expectError(carol, `select public.submit_peer_review($1, $2::jsonb, $3, $4)`, [pitchId, JSON.stringify({ thesis: 4 }), strengths, improvements], 'every criterion must be scored', 'Score every criterion');
  await expectError(carol, `select public.submit_peer_review($1, $2::jsonb, 'Nice', 'Good')`, [pitchId, JSON.stringify(fullScores)], 'reviews need substantive comments', '60 characters');
  await expectError(alice, `select public.submit_peer_review($1, $2::jsonb, $3, $4)`, [pitchId, JSON.stringify(fullScores), strengths, improvements], 'cannot review own pitch', 'own pitch');
  const reviewId = await rpc(carol, 'submit_peer_review', [pitchId, JSON.stringify(fullScores), strengths, improvements]);
  ok(!!reviewId, 'peer review submitted');
  ok(Number((await q(carol, `select overall from peer_reviews where id = $1`, [reviewId])).rows[0].overall) === 80, 'overall = 28/35 = 80');
  await expectError(carol, `select public.submit_peer_review($1, $2::jsonb, $3, $4)`, [pitchId, JSON.stringify(fullScores), strengths, improvements], 'one review per pitch per reviewer', 'duplicate|unique');
  await expectError(carol, `insert into peer_reviews (pitch_id, reviewer_id, scores, overall, strengths, improvements) values ($1, $2, '{}', 100, $3, $3)`, [pitchId, carol, strengths], 'cannot insert reviews directly', 'permission denied');
  await db.exec(`update app_settings set value = '1' where key = 'peer_reviews_per_pitch'`);
  await expectError(bob, `select public.submit_peer_review($1, $2::jsonb, $3, $4)`, [pitchId, JSON.stringify(fullScores), strengths, improvements], 'per-pitch review cap', 'enough reviews');
  await db.exec(`update app_settings set value = '5' where key = 'peer_reviews_per_pitch'`);
  const authorView = await rpc(alice, 'get_pitch_reviews', [pitchId]);
  ok(authorView.length === 1 && authorView[0].reviewer_label === 'Peer analyst #1' && !JSON.stringify(authorView).includes(carol), 'author sees anonymised reviews');
  await expectError(carol, `select public.rate_peer_review($1, 5)`, [reviewId], 'only the author can rate a review', 'Only the pitch author');
  await rpc(alice, 'rate_peer_review', [reviewId, 5]);
  await expectError(alice, `select public.rate_peer_review($1, 4)`, [reviewId], 'a review can be rated once', 'already rated');
  const prEv = (await q(carol, `select count(*)::int n, min(score) s from skill_evidence where user_id = $1 and source_type = 'peer_review'`, [carol])).rows[0];
  ok(prEv.n === 2 && Number(prEv.s) === 100, 'helpful review earns communication + leadership evidence', prEv);

  // ------------------------------------------------------------------
  section('Daily challenge');
  await expectError(null, `select public.get_daily_challenge()`, [], 'anon cannot read the daily challenge', 'permission denied');
  const dc = await rpc(carol, 'get_daily_challenge');
  ok(dc && dc.question.prompt && dc.answered === false && dc.answer === null && dc.explanation === null, 'daily question served without answer', dc?.question?.id);
  ok((await q(carol, `select count(*)::int n from daily_question_keys`)).rows[0].n === 0, 'daily answer keys hidden');
  ok((await rpc(bob, 'get_daily_challenge')).question.id === dc.question.id, 'everyone gets the same question today');
  const dkey = (await db.query(`select answer from daily_question_keys where question_id = $1`, [dc.question.id])).rows[0].answer;
  const dres = await rpc(carol, 'submit_daily_answer', [String(dkey.answer)]);
  ok(dres.answered && dres.correct === true && dres.explanation.length > 0 && dres.answer !== null, 'correct answer → explanation revealed', dres.correct);
  await expectError(carol, `select public.submit_daily_answer('x')`, [], 'one daily answer per day', 'already answered');
  const bres = await rpc(bob, 'submit_daily_answer', ['zzz-wrong']);
  ok(bres.correct === false && Number(bres.correct_today) === 1 && Number(bres.solved_today) === 2, 'wrong answer recorded; daily stats', bres);
  await expectError(carol, `insert into daily_answers (user_id, day, question_id, response, correct) values ($1, current_date + 1, $2, 'x', true)`, [carol, dc.question.id], 'cannot forge daily answers', 'permission denied');

  // ------------------------------------------------------------------
  section('XP, streaks and leaderboards');
  await expectError(carol, `select * from public.xp_events(now())`, [], 'raw XP events not callable by clients', 'permission denied');
  for (const back of [1, 2, 3]) {
    await db.query(`insert into daily_answers (user_id, day, question_id, response, correct, answered_at)
                    values ($1, (now() at time zone 'Asia/Manila')::date - $2::int, $3, 'x', true, now() - make_interval(days => $2::int))`, [carol, back, dc.question.id]);
  }
  const act = await rpc(carol, 'get_my_activity');
  ok(act.current_streak === 4 && act.longest_streak >= 4 && act.active_today === true, '4-day streak calculated from activity', [act.current_streak, act.longest_streak]);
  ok(act.days.length === 35 && act.xp_week > 0 && act.xp_total >= act.xp_week, 'activity heatmap + XP totals', [act.days.length, act.xp_week, act.xp_total]);
  const xpl = (await q(carol, `select * from get_xp_leaderboard(30, 50)`)).rows;
  ok(xpl.length === 3 && xpl.some((r) => r.is_me), 'XP leaderboard (30 days)', xpl.map((r) => [r.handle, r.xp]));
  const cohort = (await q(carol, `select * from get_program_leaderboard($1)`, [cert])).rows;
  ok(cohort.length === 1 && cohort[0].is_me && Number(cohort[0].completed) === Number(cohort[0].total), 'cohort leaderboard for a certification', cohort[0]);
  const plan = await rpc(carol, 'get_today_plan');
  ok(Array.isArray(plan) && plan.length >= 1 && !plan.some((i) => i.kind === 'daily'), 'today plan omits an answered daily challenge', plan.map((i) => i.kind));
  const alicePlan = await rpc(alice, 'get_today_plan');
  ok(alicePlan[0].kind === 'daily', 'today plan starts with the daily challenge', alicePlan.map((i) => i.kind));
  await expectError(carol, `select public.user_streak($1)`, [carol], 'streak internals not callable by clients', 'permission denied');

  // ------------------------------------------------------------------
  section('Admin analytics');
  await expectError(carol, `select public.admin_analytics(30)`, [], 'analytics are admin-only', 'Admin access required');
  const an = await rpc(bob, 'admin_analytics', [30]);
  ok(an.funnel.length === 6 && Number(an.funnel[0].users) === 3 && an.days.length >= 30, 'funnel + daily series', an.funnel.map((f) => f.users));
  ok(an.hardest_questions.length > 0 && an.hardest_questions[0].prompt, 'per-question item analysis from stored results', an.hardest_questions[0]);
  ok(Number(an.daily.answered_today) === 2 && Number(an.active_7d) === 3 && an.programs.length === 7, 'activity + programs summary', [an.daily, an.active_7d]);

  // ------------------------------------------------------------------
  section('Feedback & account deletion');
  await q(carol, `insert into feedback (category, message, page) values ('bug', 'The chart overlaps on mobile', '/dashboard')`);
  ok((await q(alice, `select count(*)::int n from feedback`)).rows[0].n === 0, "users can't read others' feedback");
  ok((await q(bob, `select count(*)::int n from feedback`)).rows[0].n === 1, 'admin sees feedback');
  await q(bob, `update feedback set status = 'resolved', resolved_at = now()`);
  ok((await q(carol, `select status from feedback`)).rows[0].status === 'resolved', 'admin resolves feedback; reporter sees status');
  await db.query(`update feedback set status = 'open'`);
  const fbUpd = await q(carol, `update feedback set status = 'resolved'`);
  ok(fbUpd.affectedRows === 0, 'reporter cannot change status (RLS: 0 rows)', fbUpd.affectedRows);
  await expectError(carol, `select public.delete_my_account('nope')`, [], 'account deletion requires typed confirmation', 'Type DELETE');
  await rpc(carol, 'delete_my_account', ['DELETE']);
  ok((await db.query(`select count(*)::int n from auth.users where id = $1`, [carol])).rows[0].n === 0, 'account deleted');
  ok((await db.query(`select (select count(*) from profiles where id = $1) + (select count(*) from certificates where user_id = $1) + (select count(*) from challenge_submissions where user_id = $1) as n`, [carol])).rows[0].n == 0, 'all personal data removed by cascade');
  await expectError(bob, `select public.delete_my_account('DELETE')`, [], 'last admin cannot delete their account', 'only administrator');

  // ------------------------------------------------------------------
  section('19. Data persists (fresh session reads)');
  const persisted = (await q(alice, `select (select count(*) from challenge_submissions where user_id = $1)::int subs,
                                        (select count(*) from stock_pitches where user_id = $1)::int pitches,
                                        (select count(*) from research_projects where user_id = $1)::int reports,
                                        (select count(*) from user_achievements where user_id = $1)::int ach,
                                        (select count(*) from notifications where user_id = $1)::int notes`, [alice])).rows[0];
  ok(persisted.subs > 10 && persisted.pitches === 4 && persisted.reports === 1 && persisted.ach >= 5, 'all user work persisted', persisted);
  await q(alice, `update notifications set read_at = now() where user_id = $1`, [alice]);
  await expectError(alice, `update notifications set title = 'x' where user_id = $1`, [alice], 'notifications: only read state editable', 'permission denied');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) {
    console.log('Failures:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\nFATAL:', e.message);
  if (e.position) console.error('position', e.position);
  if (e.where) console.error('where:', e.where);
  process.exit(1);
});

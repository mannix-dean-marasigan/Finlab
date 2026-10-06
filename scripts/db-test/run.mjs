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
  // Re-running the content seed must be harmless (idempotent).
  await db.exec(readFileSync(join(root, 'supabase', 'seed_002_certifications.sql'), 'utf8'));
  ok(true, 'seed_002 is idempotent');

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
      (select count(*) from program_modules where lesson_id is null and challenge_id is null)::int as broken_modules`)).rows[0];
  ok(counts.challenges >= 28 && counts.achievements === 13 && counts.securities === 16, 'seed counts', counts);
  ok(counts.keys === counts.task_challenges, 'answer keys for every task challenge', counts);
  ok(counts.lessons === 12 && counts.lessons_with_checks === 12 && counts.lesson_keys === 12, 'every lesson has a knowledge check + key', counts);
  ok(counts.programs === 7 && counts.broken_modules === 0, '7 programs, all modules resolved', counts);

  // The main flow below submits many times in quick succession; relax the
  // anti-gaming limits here and test them explicitly later.
  await db.exec(`update app_settings set value = '0' where key in ('retry_cooldown_minutes', 'lesson_retry_seconds');
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
  ok(lessonRow.check_questions.length === 4, 'lesson exposes its questions');
  ok(!JSON.stringify(lessonRow.check_questions).includes('"answer"'), 'questions do not leak answers');
  ok((await q(carol, `select count(*)::int n from lesson_check_keys`)).rows[0].n === 0, 'lesson answer keys hidden from users');
  await expectError(carol, `insert into lesson_progress (user_id, lesson_id) values ($1, $2)`, [carol, lessonRow.id], 'cannot mark a lesson complete directly', 'permission denied');
  const wrong = await rpc(carol, 'submit_lesson_check', [lessonRow.id, JSON.stringify({ q1: 'a', q2: 'a', q3: '1', q4: 'a' })]);
  ok(wrong.passed === false && Number(wrong.score) === 0, 'wrong answers fail the check', wrong);
  ok(!JSON.stringify(wrong).includes('"answer"'), 'check feedback never reveals answers');
  ok((await q(carol, `select count(*)::int n from lesson_progress where user_id = $1`, [carol])).rows[0].n === 0, 'failed check records no completion');
  await db.exec(`update app_settings set value = '60' where key = 'lesson_retry_seconds'`);
  await expectError(carol, `select public.submit_lesson_check($1, '{}'::jsonb)`, [lessonRow.id], 'retry cooldown on lesson checks', 'try again in');
  await db.exec(`update app_settings set value = '0' where key = 'lesson_retry_seconds'`);
  const threeOfFour = await rpc(carol, 'submit_lesson_check', [lessonRow.id, JSON.stringify({ q1: 'b', q2: 'c', q3: '80', q4: 'a' })]);
  ok(threeOfFour.passed === true && Number(threeOfFour.score) === 75, '3 of 4 correct passes at 75%', threeOfFour);
  ok((await q(carol, `select count(*)::int n from lesson_progress where user_id = $1`, [carol])).rows[0].n === 1, 'passing records the completion');

  // ------------------------------------------------------------------
  await db.query(`update lessons set video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' where slug = 'three-statements'`);
  ok((await q(carol, `select video_url from lessons where slug = 'three-statements'`)).rows[0].video_url.includes('youtube'), 'lesson video URL stored');
  let badVideo = false;
  try { await db.query(`update lessons set video_url = 'https://evil.example.com/x' where slug = 'three-statements'`); } catch { badVideo = true; }
  ok(badVideo, 'non-YouTube video URLs rejected');

  section('Certification programs & tracks');
  const track = (await q(carol, `select id from certification_programs where slug = 'track-accounting-foundations'`)).rows[0].id;
  const progs = await rpc(carol, 'list_programs');
  ok(progs.length === 7 && progs.some((p) => p.slug === 'track-accounting-foundations' && Number(p.completed_modules) === 1), 'programs list shows progress', progs.map((p) => [p.slug, p.completed_modules, p.modules]));
  await rpc(carol, 'enroll_program', [track]);
  const cfsLesson = (await q(carol, `select id from lessons where slug = 'cash-flow-statement'`)).rows[0].id;
  await rpc(carol, 'submit_lesson_check', [cfsLesson, JSON.stringify({ q1: '105', q2: 'b', q3: '65', q4: 'c' })]);
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
  for (const m of fsaDetail.modules.filter((x) => x.kind !== 'exam' && !x.complete)) {
    if (m.kind === 'lesson') {
      const key = (await db.query(`select k.answers from lesson_check_keys k join lessons l on l.id = k.lesson_id where l.slug = $1`, [m.lesson_slug])).rows[0].answers;
      const resp = Object.fromEntries(Object.entries(key).map(([k, v]) => [k, String(v.answer)]));
      await rpc(carol, 'submit_lesson_check', [(await q(carol, `select id from lessons where slug = $1`, [m.lesson_slug])).rows[0].id, JSON.stringify(resp)]);
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
  const certRow = (await q(carol, `select code, title from certificates where user_id = $1 and program_id = $2`, [carol, cert])).rows[0];
  ok(certRow?.title === 'Certified Financial Statement Analyst', 'certification issued on passing the exam', certRow);

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

// Proves the admin "Install content" button: starting from the live database's state
// (all migrations + seeds 001–008), run the real installer as a signed-in admin under RLS,
// then check the result matches what the SQL seeds 009–012 produce, and that a second run changes nothing.
//
//   node scripts/db-test/install-bundle.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { installContentBundle } from '../../src/features/admin/installContent.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const NEW_SEEDS = /^seed_(009|010|011|012)/;
const bundle = JSON.parse(readFileSync(join(root, 'src', 'features', 'admin', 'contentBundle.json'), 'utf8'));

const STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz default now(), last_sign_in_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

async function boot(includeNew) {
  const db = new PGlite();
  await db.exec(STUB);
  for (const f of readdirSync(join(root, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(root, 'supabase', 'migrations', f), 'utf8'));
  }
  for (const f of readdirSync(join(root, 'supabase')).filter((x) => /^seed.*\.sql$/.test(x)).sort()) {
    if (includeNew || !NEW_SEEDS.test(f)) await db.exec(readFileSync(join(root, 'supabase', f), 'utf8'));
  }
  return db;
}

/** PostgREST-like upsert/select, executed as the signed-in admin (RLS on). */
function adapter(db, uid) {
  const as = (fn) =>
    db.transaction(async (tx) => {
      await tx.query(`set local role authenticated`);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
      return fn(tx);
    });
  const ident = (s) => `"${s.replace(/"/g, '""')}"`;
  return {
    async upsert(table, rows, onConflict, returning) {
      if (!rows.length) return [];
      const cols = Object.keys(rows[0]);
      const conflict = onConflict.split(',');
      const updates = cols.filter((c) => !conflict.includes(c));
      const sql = `insert into public.${ident(table)} (${cols.map(ident).join(', ')})
        select ${cols.map(ident).join(', ')} from jsonb_populate_recordset(null::public.${ident(table)}, $1)
        on conflict (${conflict.map(ident).join(', ')}) do ${updates.length ? `update set ${updates.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(', ')}` : 'nothing'}
        returning ${returning.split(',').map(ident).join(', ')}`;
      return (await as((tx) => tx.query(sql, [JSON.stringify(rows)]))).rows;
    },
    async selectIn(table, columns, column, values) {
      const sql = `select ${columns.split(',').map(ident).join(', ')} from public.${ident(table)} where ${ident(column)} = any($1)`;
      return (await as((tx) => tx.query(sql, [values]))).rows;
    },
  };
}

// A slug-based picture of the new content, comparable across databases.
const FINGERPRINT = `
  with ls as (select * from lessons where slug = any($1)),
       cs as (select * from challenges where slug = any($2)),
       ps as (select * from certification_programs where slug = any($3))
  select jsonb_build_object(
    'lessons', (select jsonb_agg(to_jsonb(l) - 'id' - 'created_at' - 'updated_at' order by slug) from ls l),
    'challenges', (select jsonb_agg(to_jsonb(c) - 'id' - 'created_at' - 'updated_at' - 'published_at' order by slug) from cs c),
    'programs', (select jsonb_agg(to_jsonb(p) - 'id' - 'created_at' - 'updated_at' order by slug) from ps p),
    'check_keys', (select jsonb_agg(jsonb_build_object('l', l.slug, 'a', k.answers) order by l.slug) from lesson_check_keys k join ls l on l.id = k.lesson_id),
    'activities', (select jsonb_agg(to_jsonb(a) - 'id' - 'lesson_id' - 'created_at' - 'updated_at' || jsonb_build_object('l', l.slug, 'key', ak.key) order by l.slug, a.position)
                   from lesson_activities a join ls l on l.id = a.lesson_id left join lesson_activity_keys ak on ak.activity_id = a.id),
    'flashcards', (select jsonb_agg(jsonb_build_object('l', l.slug, 'p', f.position, 'f', f.front, 'b', f.back) order by l.slug, f.position) from flashcards f join ls l on l.id = f.lesson_id),
    'answer_keys', (select jsonb_agg(jsonb_build_object('c', c.slug, 'a', k.answers) order by c.slug) from challenge_answer_keys k join cs c on c.id = k.challenge_id),
    'modules', (select jsonb_agg(jsonb_build_object('p', p.slug, 'pos', m.position, 'kind', m.kind, 'min', m.min_score, 'cfg', m.config,
                   'l', (select slug from lessons where id = m.lesson_id), 'c', (select slug from challenges where id = m.challenge_id)) order by p.slug, m.position)
                from program_modules m join ps p on p.id = m.program_id),
    'daily', (select jsonb_agg(to_jsonb(d) - 'id' - 'created_at' || jsonb_build_object('key', k.answer) order by d.slug)
              from daily_questions d left join daily_question_keys k on k.question_id = d.id where d.slug = any($4)),
    'categories', (select jsonb_agg(to_jsonb(c) order by id) from challenge_categories c where id = any($5))
  ) as f`;
const args = [
  bundle.lessons.map((l) => l.slug),
  bundle.challenges.map((c) => c.slug),
  bundle.programs.map((p) => p.slug),
  bundle.daily_questions.map((d) => d.slug),
  bundle.categories.map((c) => c.id),
];
const fingerprint = async (db) => (await db.query(FINGERPRINT, args)).rows[0].f;

let failed = 0;
const ok = (cond, name, detail) => {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

const expected = await fingerprint(await boot(true));
const live = await boot(false);

await live.query(`update app_settings set value = '0' where key = 'require_invite_code'`);

// A non-admin is refused by RLS.
const learner = randomUUID();
await live.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'learner@example.com', '{"full_name":"Learner"}')`, [learner]);
let refused = false;
try {
  await installContentBundle(adapter(live, learner), bundle);
} catch {
  refused = true;
}
ok(refused, 'a non-admin cannot install content');

const admin = randomUUID();
await live.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'admin@example.com', '{"full_name":"Admin"}')`, [admin]);
await live.query(`insert into user_roles (user_id, role) values ($1, 'admin')`, [admin]);
const steps = [];
const result = await installContentBundle(adapter(live, admin), bundle, (s) => steps.push(s));
ok(steps.at(-1) === 'Done', 'installer runs every step as admin', steps.join(' → '));
ok(result.lessons === 20 && result.programs === 5, 'installer reports what it added', JSON.stringify(result));

const got = await fingerprint(live);
for (const k of Object.keys(expected)) {
  const same = JSON.stringify(got[k]) === JSON.stringify(expected[k]);
  ok(same, `installed ${k} match the SQL seeds (${(expected[k] ?? []).length} rows)`, same ? '' : JSON.stringify(got[k])?.slice(0, 300));
}

const countSql = `select (select count(*) from lessons) l, (select count(*) from lesson_activities) a, (select count(*) from flashcards) f,
  (select count(*) from program_modules) m, (select count(*) from daily_questions) d, (select count(*) from challenges) c`;
const before2 = JSON.stringify((await live.query(countSql)).rows[0]);
await installContentBundle(adapter(live, admin), bundle);
ok(JSON.stringify((await live.query(countSql)).rows[0]) === before2, 'running the installer twice adds nothing');
ok(JSON.stringify(await fingerprint(live)) === JSON.stringify(expected), 'content is unchanged after the second run');

console.log(failed ? `\n${failed} FAILED` : '\nall install checks passed');
process.exit(failed ? 1 : 0);

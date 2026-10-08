// Builds src/features/admin/contentBundle.json: everything the new content seeds add,
// with foreign keys expressed as slugs so the admin "Install content" button can load it
// through the normal API (no SQL Editor needed).
//
//   node scripts/export-content.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEW_SEEDS = /^seed_(009|010|011|012)/;

const STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb default '{}'::jsonb,
    created_at timestamptz default now(), last_sign_in_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant usage on schema public to anon, authenticated, service_role;
`;

const db = new PGlite();
await db.exec(STUB);
for (const f of readdirSync(join(root, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(root, 'supabase', 'migrations', f), 'utf8'));
}
const seeds = readdirSync(join(root, 'supabase')).filter((x) => /^seed.*\.sql$/.test(x)).sort();
for (const f of seeds.filter((f) => !NEW_SEEDS.test(f))) await db.exec(readFileSync(join(root, 'supabase', f), 'utf8'));

const snapshot = async (sql) => new Set((await db.query(sql)).rows.map((r) => JSON.stringify(r)));
const rows = async (sql) => (await db.query(sql)).rows;

// Rows that exist before the new seeds, per table (natural keys only).
const before = {
  categories: await snapshot(`select id from challenge_categories`),
  lessons: await snapshot(`select slug from lessons`),
  challenges: await snapshot(`select slug from challenges`),
  programs: await snapshot(`select slug from certification_programs`),
  daily: await snapshot(`select id from daily_questions`),
};
for (const f of seeds.filter((f) => NEW_SEEDS.test(f))) await db.exec(readFileSync(join(root, 'supabase', f), 'utf8'));

const isNew = (set, obj) => !set.has(JSON.stringify(obj));
const strip = (r, ...cols) => {
  const o = { ...r };
  for (const c of ['created_at', 'updated_at', ...cols]) delete o[c];
  return o;
};

const categories = (await rows(`select * from challenge_categories order by id`)).filter((r) => isNew(before.categories, { id: r.id }));

const lessonRows = (await rows(`select * from lessons order by slug`)).filter((r) => isNew(before.lessons, { slug: r.slug }));
const lessonIds = new Set(lessonRows.map((r) => r.id));
const lessonSlug = Object.fromEntries((await rows(`select id, slug from lessons`)).map((r) => [r.id, r.slug]));

const challengeRows = (await rows(`select * from challenges order by slug`)).filter((r) => isNew(before.challenges, { slug: r.slug }));
const challengeIds = new Set(challengeRows.map((r) => r.id));
const challengeSlug = Object.fromEntries((await rows(`select id, slug from challenges`)).map((r) => [r.id, r.slug]));

const programRows = (await rows(`select * from certification_programs order by slug`)).filter((r) => isNew(before.programs, { slug: r.slug }));
const programIds = new Set(programRows.map((r) => r.id));
const programSlug = Object.fromEntries(programRows.map((r) => [r.id, r.slug]));

const lessonFk = (r) => {
  const { lesson_id, ...o } = r;
  return { ...o, lesson_slug: lessonSlug[lesson_id] };
};

const checkKeys = (await rows(`select * from lesson_check_keys`)).filter((r) => lessonIds.has(r.lesson_id)).map((r) => lessonFk(strip(r)));
const activities = (await rows(`select * from lesson_activities order by lesson_id, position`)).filter((r) => lessonIds.has(r.lesson_id));
const activityKey = Object.fromEntries(activities.map((a) => [a.id, { lesson_slug: lessonSlug[a.lesson_id], slug: a.slug }]));
const activityKeys = (await rows(`select * from lesson_activity_keys`))
  .filter((r) => activityKey[r.activity_id])
  .map((r) => {
    const { activity_id, ...o } = strip(r);
    return { ...o, activity: activityKey[activity_id] };
  });
const flashcards = (await rows(`select * from flashcards order by lesson_id, position`)).filter((r) => lessonIds.has(r.lesson_id)).map((r) => lessonFk(strip(r, 'id')));

const answerKeys = (await rows(`select * from challenge_answer_keys`))
  .filter((r) => challengeIds.has(r.challenge_id))
  .map((r) => {
    const { challenge_id, ...o } = strip(r, 'id');
    return { ...o, challenge_slug: challengeSlug[challenge_id] };
  });

const modules = (await rows(`select * from program_modules order by program_id, position`))
  .filter((r) => programIds.has(r.program_id))
  .map((r) => {
    const { program_id, lesson_id, challenge_id, ...o } = strip(r, 'id');
    return { ...o, program_slug: programSlug[program_id], lesson_slug: lesson_id ? lessonSlug[lesson_id] : null, challenge_slug: challenge_id ? challengeSlug[challenge_id] : null };
  });

const daily = (await rows(`select * from daily_questions order by id`)).filter((r) => isNew(before.daily, { id: r.id }));
const dailyIds = new Set(daily.map((r) => r.id));
const dailySlug = Object.fromEntries(daily.map((r) => [r.id, r.slug]));
const dailyKeys = (await rows(`select * from daily_question_keys`))
  .filter((r) => dailyIds.has(r.question_id))
  .map((r) => {
    const { question_id, ...o } = strip(r);
    return { ...o, question_slug: dailySlug[question_id] };
  });

const bundle = {
  version: 1,
  categories: categories.map((r) => strip(r)),
  lessons: lessonRows.map((r) => strip(r, 'id')),
  challenges: challengeRows.map((r) => strip(r, 'id')),
  programs: programRows.map((r) => strip(r, 'id')),
  check_keys: checkKeys,
  activities: activities.map((r) => lessonFk(strip(r, 'id'))),
  activity_keys: activityKeys,
  flashcards,
  answer_keys: answerKeys,
  modules,
  daily_questions: daily.map((r) => strip(r, 'id')),
  daily_keys: dailyKeys,
};
const out = join(root, 'src', 'features', 'admin', 'contentBundle.json');
writeFileSync(out, JSON.stringify(bundle));
console.log(Object.fromEntries(Object.entries(bundle).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])));

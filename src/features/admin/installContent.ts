// Installs a content bundle (see scripts/export-content.mjs) through ordinary admin writes.
// Every step is an upsert on a natural key, so running it again is harmless.
// The data layer is passed in so the same code runs against Supabase and the PGlite test DB.

type Row = Record<string, unknown>;

export interface InstallDb {
  /** Insert or update rows on the given unique columns; returns the stored rows (at least `returning` columns). */
  upsert(table: string, rows: Row[], onConflict: string, returning: string): Promise<Row[]>;
  /** Rows of `table` whose `column` is in `values`. */
  selectIn(table: string, columns: string, column: string, values: string[]): Promise<Row[]>;
}

export interface ContentBundle {
  version: number;
  categories: Row[];
  lessons: Row[];
  challenges: Row[];
  programs: Row[];
  check_keys: Row[];
  activities: Row[];
  activity_keys: Row[];
  flashcards: Row[];
  answer_keys: Row[];
  modules: Row[];
  daily_questions: Row[];
  daily_keys: Row[];
}

export interface InstallResult {
  lessons: number;
  challenges: number;
  programs: number;
  flashcards: number;
  daily_questions: number;
}

const CHUNK = 50;
async function upsertAll(db: InstallDb, table: string, rows: Row[], onConflict: string, returning: string) {
  const out: Row[] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(...(await db.upsert(table, rows.slice(i, i + CHUNK), onConflict, returning)));
  return out;
}

function idMap(rows: Row[], key: (r: Row) => string) {
  return new Map(rows.map((r) => [key(r), r.id as string]));
}

function need(map: Map<string, string>, key: string, what: string) {
  const id = map.get(key);
  if (!id) throw new Error(`Missing ${what} "${key}" — install stopped before changing anything that depends on it.`);
  return id;
}

export async function installContentBundle(db: InstallDb, b: ContentBundle, progress: (step: string) => void = () => {}): Promise<InstallResult> {
  progress('Categories');
  if (b.categories.length) await upsertAll(db, 'challenge_categories', b.categories, 'id', 'id');

  progress('Lessons');
  await upsertAll(db, 'lessons', b.lessons, 'slug', 'id,slug');
  const lessonSlugs = [...new Set([...b.lessons.map((l) => l.slug as string), ...b.modules.map((m) => m.lesson_slug as string | null).filter((s): s is string => !!s)])];
  const lessonId = idMap(await db.selectIn('lessons', 'id,slug', 'slug', lessonSlugs), (r) => r.slug as string);

  progress('Challenges and exams');
  await upsertAll(db, 'challenges', b.challenges, 'slug', 'id,slug');
  const challengeSlugs = [...new Set([...b.challenges.map((c) => c.slug as string), ...b.modules.map((m) => m.challenge_slug as string | null).filter((s): s is string => !!s)])];
  const challengeId = idMap(await db.selectIn('challenges', 'id,slug', 'slug', challengeSlugs), (r) => r.slug as string);

  progress('Certification programs');
  const programId = idMap(await upsertAll(db, 'certification_programs', b.programs, 'slug', 'id,slug'), (r) => r.slug as string);

  progress('Knowledge-check answer keys');
  await upsertAll(
    db,
    'lesson_check_keys',
    b.check_keys.map(({ lesson_slug, ...r }) => ({ ...r, lesson_id: need(lessonId, lesson_slug as string, 'lesson') })),
    'lesson_id',
    'lesson_id',
  );

  progress('Practice activities');
  const acts = await upsertAll(
    db,
    'lesson_activities',
    b.activities.map(({ lesson_slug, ...r }) => ({ ...r, lesson_id: need(lessonId, lesson_slug as string, 'lesson') })),
    'lesson_id,slug',
    'id,lesson_id,slug',
  );
  const slugOfLesson = new Map([...lessonId].map(([slug, id]) => [id, slug]));
  const activityId = idMap(acts, (r) => `${slugOfLesson.get(r.lesson_id as string)}/${r.slug}`);
  await upsertAll(
    db,
    'lesson_activity_keys',
    b.activity_keys.map(({ activity, ...r }) => {
      const a = activity as { lesson_slug: string; slug: string };
      return { ...r, activity_id: need(activityId, `${a.lesson_slug}/${a.slug}`, 'activity') };
    }),
    'activity_id',
    'activity_id',
  );

  progress('Flashcards');
  await upsertAll(
    db,
    'flashcards',
    b.flashcards.map(({ lesson_slug, ...r }) => ({ ...r, lesson_id: need(lessonId, lesson_slug as string, 'lesson') })),
    'lesson_id,position',
    'lesson_id',
  );

  progress('Challenge answer keys');
  await upsertAll(
    db,
    'challenge_answer_keys',
    b.answer_keys.map(({ challenge_slug, ...r }) => ({ ...r, challenge_id: need(challengeId, challenge_slug as string, 'challenge') })),
    'challenge_id',
    'challenge_id',
  );

  progress('Program modules');
  await upsertAll(
    db,
    'program_modules',
    b.modules.map(({ program_slug, lesson_slug, challenge_slug, ...r }) => ({
      ...r,
      program_id: need(programId, program_slug as string, 'program'),
      lesson_id: lesson_slug ? need(lessonId, lesson_slug as string, 'lesson') : null,
      challenge_id: challenge_slug ? need(challengeId, challenge_slug as string, 'challenge') : null,
    })),
    'program_id,position',
    'program_id',
  );

  progress('Daily questions');
  const dq = idMap(await upsertAll(db, 'daily_questions', b.daily_questions, 'slug', 'id,slug'), (r) => r.slug as string);
  await upsertAll(
    db,
    'daily_question_keys',
    b.daily_keys.map(({ question_slug, ...r }) => ({ ...r, question_id: need(dq, question_slug as string, 'daily question') })),
    'question_id',
    'question_id',
  );

  progress('Done');
  return {
    lessons: b.lessons.length,
    challenges: b.challenges.length,
    programs: b.programs.length,
    flashcards: b.flashcards.length,
    daily_questions: b.daily_questions.length,
  };
}

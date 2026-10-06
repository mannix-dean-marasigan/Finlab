-- =====================================================================
-- FINLAB — 0010 Engagement layer
--   6. Flashcards with spaced repetition
--   7. Peer review of stock pitches
--   8. XP, daily streaks, weekly and cohort leaderboards
--   9. Certification capstone presentations
--   D. Daily challenge + "Today" plan
--   F. Admin analytics (per-question results)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Shared changes
-- ---------------------------------------------------------------------
alter table public.skill_evidence drop constraint if exists skill_evidence_source_type_check;
alter table public.skill_evidence add constraint skill_evidence_source_type_check
  check (source_type in ('challenge','stock_pitch','research_report','market_event','competition','peer_review','capstone'));

-- Per-question results for item analysis (admin analytics).
alter table public.lesson_attempts add column if not exists results jsonb;

insert into public.app_settings (key, value, description) values
 ('flashcards_new_per_day', '20', 'New flashcards introduced per user per day.'),
 ('peer_reviews_per_pitch', '5', 'Maximum peer reviews a single pitch can receive.'),
 ('peer_reviews_per_day', '10', 'Maximum peer reviews a user can write per day.')
on conflict (key) do nothing;

-- =====================================================================
-- 6. FLASHCARDS (spaced repetition)
-- =====================================================================
create table public.flashcards (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  position    int not null default 0,
  front       text not null check (char_length(front) between 2 and 500),
  back        text not null check (char_length(back) between 1 and 1500),
  created_at  timestamptz not null default now(),
  unique (lesson_id, position)
);
create index idx_flashcards_lesson on public.flashcards(lesson_id);

-- Scheduling state per user per card (calculated; written only by review_flashcard).
create table public.flashcard_state (
  user_id           uuid not null references public.profiles(id) on delete cascade,
  card_id           uuid not null references public.flashcards(id) on delete cascade,
  interval_days     numeric(7,2) not null default 0,
  reps              int not null default 0,
  lapses            int not null default 0,
  due_at            timestamptz not null default now(),
  last_reviewed_at  timestamptz,
  primary key (user_id, card_id)
);
create index idx_flashcard_state_due on public.flashcard_state(user_id, due_at);

create table public.flashcard_review_log (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  card_id      uuid not null references public.flashcards(id) on delete cascade,
  grade        smallint not null check (grade between 0 and 3),
  reviewed_at  timestamptz not null default now()
);
create index idx_flashcard_log_user on public.flashcard_review_log(user_id, reviewed_at desc);

-- grade: 0 again · 1 hard · 2 good · 3 easy  (simplified SM-2)
create or replace function public.review_flashcard(p_card uuid, p_grade int)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  st    flashcard_state%rowtype;
  v_int numeric;
  v_due timestamptz;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_grade not between 0 and 3 then raise exception 'Invalid grade'; end if;
  if not exists (select 1 from flashcards f join lessons l on l.id = f.lesson_id where f.id = p_card and l.is_published) then
    raise exception 'Card not found';
  end if;
  insert into flashcard_state(user_id, card_id) values (v_uid, p_card) on conflict do nothing;
  select * into st from flashcard_state where user_id = v_uid and card_id = p_card for update;

  v_int := case p_grade
    when 0 then 0
    when 1 then greatest(1, round(st.interval_days * 1.2, 2))
    when 2 then case when st.interval_days < 1 then 1 when st.interval_days < 3 then 3 else round(st.interval_days * 2.5, 2) end
    else case when st.interval_days < 1 then 4 else round(st.interval_days * 3.5, 2) end
  end;
  v_int := least(v_int, 180);
  v_due := case when p_grade = 0 then now() + interval '10 minutes' else now() + make_interval(secs => (v_int * 86400)::int) end;

  update flashcard_state
     set interval_days = v_int, reps = reps + 1, lapses = lapses + case when p_grade = 0 then 1 else 0 end,
         due_at = v_due, last_reviewed_at = now()
   where user_id = v_uid and card_id = p_card;
  insert into flashcard_review_log(user_id, card_id, grade) values (v_uid, p_card, p_grade);
  perform public.evaluate_achievements(v_uid);
  return jsonb_build_object('interval_days', v_int, 'due_at', v_due);
end;
$$;

-- Due cards first, then new cards up to the daily new-card limit.
create or replace function public.get_flashcard_queue(p_lesson uuid default null, p_limit int default 20)
returns table(card_id uuid, lesson_id uuid, lesson_title text, front text, back text, is_new boolean, interval_days numeric)
language sql stable security definer set search_path = public
as $$
  with mine as (select * from flashcard_state where user_id = auth.uid()),
  new_today as (
    select count(*) as n from (
      select card_id from flashcard_review_log where user_id = auth.uid() group by card_id
      having (min(reviewed_at) at time zone 'Asia/Manila')::date = (now() at time zone 'Asia/Manila')::date) t
  ),
  due as (
    select f.id, f.lesson_id, l.title, f.front, f.back, false as is_new, m.interval_days, m.due_at as sort_key, 0 as grp, f.position
    from mine m join flashcards f on f.id = m.card_id join lessons l on l.id = f.lesson_id
    where m.due_at <= now() and l.is_published and (p_lesson is null or f.lesson_id = p_lesson)
  ),
  fresh as (
    select f.id, f.lesson_id, l.title, f.front, f.back, true, 0::numeric, null::timestamptz, 1, f.position
    from flashcards f join lessons l on l.id = f.lesson_id
    where l.is_published and (p_lesson is null or f.lesson_id = p_lesson)
      and not exists (select 1 from mine m where m.card_id = f.id)
    order by l.sort_order, f.position
    limit greatest(0, public.setting_num('flashcards_new_per_day', 20)::int - (select n from new_today)::int)
  )
  select id, lesson_id, title, front, back, is_new, interval_days from (
    select * from due union all select * from fresh
  ) q
  order by grp, sort_key nulls last, position
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

create or replace function public.flashcard_stats()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'due', (select count(*) from flashcard_state s join flashcards f on f.id = s.card_id
            join lessons l on l.id = f.lesson_id where s.user_id = auth.uid() and s.due_at <= now() and l.is_published),
    'learned', (select count(*) from flashcard_state where user_id = auth.uid()),
    'mastered', (select count(*) from flashcard_state where user_id = auth.uid() and interval_days >= 21),
    'total', (select count(*) from flashcards f join lessons l on l.id = f.lesson_id where l.is_published),
    'reviewed_today', (select count(*) from flashcard_review_log where user_id = auth.uid()
                       and (reviewed_at at time zone 'Asia/Manila')::date = (now() at time zone 'Asia/Manila')::date));
$$;

-- =====================================================================
-- 7. PEER REVIEW
-- =====================================================================
alter table public.stock_pitches add column if not exists peer_review_open boolean not null default false;
grant update (peer_review_open) on public.stock_pitches to authenticated;

-- Submitted work stays locked; only visibility and peer-review opt-in may change.
create or replace function public.guard_submitted_artifact()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if old.status <> 'draft'
       and (to_jsonb(new) - 'is_public' - 'peer_review_open' - 'updated_at')
           <> (to_jsonb(old) - 'is_public' - 'peer_review_open' - 'updated_at') then
      raise exception 'Submitted work is locked. Only visibility can be changed.';
    end if;
    if old.status = 'draft' and (to_jsonb(new)->>'peer_review_open')::boolean is true then
      raise exception 'Submit the pitch before opening it for peer review';
    end if;
  end if;
  return new;
end;
$$;

create table public.peer_reviews (
  id              uuid primary key default gen_random_uuid(),
  pitch_id        uuid not null references public.stock_pitches(id) on delete cascade,
  reviewer_id     uuid not null references public.profiles(id) on delete cascade,
  scores          jsonb not null,
  overall         numeric(5,2) not null check (overall between 0 and 100),
  strengths       text not null check (char_length(strengths) between 60 and 3000),
  improvements    text not null check (char_length(improvements) between 60 and 3000),
  helpful_rating  smallint check (helpful_rating between 1 and 5),
  rated_at        timestamptz,
  created_at      timestamptz not null default now(),
  unique (pitch_id, reviewer_id)
);
create index idx_peer_reviews_pitch on public.peer_reviews(pitch_id);
create index idx_peer_reviews_reviewer on public.peer_reviews(reviewer_id, created_at desc);

create or replace function public.get_review_queue(p_limit int default 20)
returns table(pitch_id uuid, company text, ticker text, format text, rating text, submitted_at timestamptz, reviews bigint)
language sql stable security definer set search_path = public
as $$
  select p.id, p.company, p.ticker, p.format, p.rating, p.submitted_at,
         (select count(*) from peer_reviews r where r.pitch_id = p.id)
  from stock_pitches p
  where p.status = 'submitted' and p.peer_review_open and p.user_id <> auth.uid()
    and not exists (select 1 from peer_reviews r where r.pitch_id = p.id and r.reviewer_id = auth.uid())
    and (select count(*) from peer_reviews r where r.pitch_id = p.id) < public.setting_num('peer_reviews_per_pitch', 5)
  order by 7 asc, p.submitted_at asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

-- Anonymised pitch content for reviewers (author identity hidden).
create or replace function public.get_pitch_for_review(p_pitch uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'format', p.format, 'company', p.company, 'ticker', p.ticker, 'exchange', p.exchange, 'currency', p.currency,
    'rating', p.rating, 'current_price', p.current_price, 'target_price', p.target_price, 'valuation_method', p.valuation_method,
    'thesis', p.thesis, 'catalysts', p.catalysts, 'risks', p.risks, 'company_analysis', p.company_analysis,
    'financial_analysis', p.financial_analysis, 'forecast', p.forecast, 'valuation', p.valuation,
    'variant_perception', p.variant_perception, 'submitted_at', p.submitted_at,
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('title', s.title, 'url', s.url, 'publisher', s.publisher) order by s.created_at), '[]'::jsonb)
                from sources s where s.stock_pitch_id = p.id),
    'already_reviewed', exists (select 1 from peer_reviews r where r.pitch_id = p.id and r.reviewer_id = auth.uid()))
  from stock_pitches p
  where p.id = p_pitch and p.status = 'submitted' and p.peer_review_open and p.user_id <> auth.uid();
$$;

create or replace function public.submit_peer_review(p_pitch uuid, p_scores jsonb, p_strengths text, p_improvements text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  p       stock_pitches%rowtype;
  v_keys  text[] := array['thesis','financial_analysis','valuation','risk','catalysts','communication','sources'];
  k       text;
  v_sum   numeric := 0;
  v_id    uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into p from stock_pitches where id = p_pitch for update;
  if not found or p.status <> 'submitted' or not p.peer_review_open then raise exception 'This pitch is not open for peer review'; end if;
  if p.user_id = v_uid then raise exception 'You cannot review your own pitch'; end if;
  if (select count(*) from peer_reviews where pitch_id = p.id) >= public.setting_num('peer_reviews_per_pitch', 5) then
    raise exception 'This pitch already has enough reviews';
  end if;
  if (select count(*) from peer_reviews where reviewer_id = v_uid and created_at > now() - interval '24 hours')
     >= public.setting_num('peer_reviews_per_day', 10) then
    raise exception 'Daily peer-review limit reached';
  end if;
  foreach k in array v_keys loop
    if coalesce((p_scores->>k)::int, 0) not between 1 and 5 then
      raise exception 'Score every criterion from 1 to 5 (missing: %)', replace(k, '_', ' ');
    end if;
    v_sum := v_sum + (p_scores->>k)::int;
  end loop;
  if char_length(btrim(coalesce(p_strengths, ''))) < 60 or char_length(btrim(coalesce(p_improvements, ''))) < 60 then
    raise exception 'Write at least 60 characters for both strengths and improvements';
  end if;
  insert into peer_reviews(pitch_id, reviewer_id, scores, overall, strengths, improvements)
  values (p.id, v_uid, (select jsonb_object_agg(x, (p_scores->>x)::int) from unnest(v_keys) x),
          round(v_sum / (cardinality(v_keys) * 5) * 100, 2), btrim(p_strengths), btrim(p_improvements))
  returning id into v_id;
  perform public.notify(p.user_id, 'score', 'New peer review: ' || p.ticker,
    'A fellow analyst reviewed your pitch. Rate how helpful it was.', '/pitches/' || p.id);
  perform public.evaluate_achievements(v_uid);
  return v_id;
end;
$$;

-- Reviews of a pitch: author sees all (reviewer anonymised); reviewers see their own.
create or replace function public.get_pitch_reviews(p_pitch uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', t.id, 'scores', t.scores, 'overall', t.overall, 'strengths', t.strengths, 'improvements', t.improvements,
           'helpful_rating', t.helpful_rating, 'created_at', t.created_at, 'mine', t.reviewer_id = auth.uid(),
           'reviewer_label', 'Peer analyst #' || t.rn)
           order by t.created_at), '[]'::jsonb)
  from (select r.*, row_number() over (order by r.created_at) as rn
        from peer_reviews r join stock_pitches p on p.id = r.pitch_id
        where r.pitch_id = p_pitch and (p.user_id = auth.uid() or r.reviewer_id = auth.uid() or public.is_admin())) t;
$$;

create or replace function public.rate_peer_review(p_review uuid, p_rating int)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  r peer_reviews%rowtype;
begin
  if p_rating not between 1 and 5 then raise exception 'Rating must be 1–5'; end if;
  select * into r from peer_reviews where id = p_review for update;
  if not found or not exists (select 1 from stock_pitches where id = r.pitch_id and user_id = auth.uid()) then
    raise exception 'Only the pitch author can rate this review';
  end if;
  if r.helpful_rating is not null then raise exception 'You already rated this review'; end if;
  update peer_reviews set helpful_rating = p_rating, rated_at = now() where id = r.id;
  -- Reviewer earns Communication + Leadership evidence from how helpful the review was.
  insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight) values
    (r.reviewer_id, 'communication', 'peer_review', r.id, p_rating * 20, 0.25),
    (r.reviewer_id, 'leadership', 'peer_review', r.id, p_rating * 20, 0.25)
  on conflict (user_id, skill_id, source_type, source_id) do update set score = excluded.score;
  perform public.notify(r.reviewer_id, 'score', 'Your peer review was rated',
    format('The author rated your review %s/5 for helpfulness.', p_rating), '/reviews');
  perform public.process_user_progress(r.reviewer_id);
end;
$$;

-- =====================================================================
-- 9. CAPSTONE PRESENTATIONS
-- =====================================================================
alter table public.program_modules drop constraint if exists program_modules_kind_check;
alter table public.program_modules add constraint program_modules_kind_check
  check (kind in ('lesson','challenge','exam','capstone'));
alter table public.program_modules add column if not exists config jsonb not null default '{}'::jsonb;

create table public.capstone_submissions (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references public.program_modules(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  video_url     text not null,
  slides_url    text,
  summary       text not null,
  status        text not null default 'submitted' check (status in ('submitted','scored','returned')),
  score         numeric(5,2),
  criteria      jsonb,
  feedback      text,
  reviewer_id   uuid references public.profiles(id) on delete set null,
  submitted_at  timestamptz not null default now(),
  scored_at     timestamptz,
  unique (module_id, user_id)
);
create index idx_capstones_status on public.capstone_submissions(status, submitted_at);

create or replace function public.valid_presentation_url(p_url text)
returns boolean
language sql immutable
as $$
  select p_url ~* '^https://([a-z0-9-]+\.)*(youtube\.com|youtu\.be|drive\.google\.com|docs\.google\.com|loom\.com|vimeo\.com|canva\.com|onedrive\.live\.com|1drv\.ms|sharepoint\.com)/';
$$;

create or replace function public.module_complete(p_user uuid, p_module uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case m.kind
    when 'lesson' then exists (select 1 from lesson_progress lp where lp.user_id = p_user and lp.lesson_id = m.lesson_id)
    when 'capstone' then exists (select 1 from capstone_submissions c where c.user_id = p_user and c.module_id = m.id
                                 and c.status = 'scored' and c.score >= coalesce(m.min_score, 70))
    else coalesce((select max(s.final_score) from challenge_submissions s
                   where s.user_id = p_user and s.challenge_id = m.challenge_id and s.status = 'scored'), -1)
         >= coalesce(m.min_score, (select c.passing_score from challenges c where c.id = m.challenge_id))
  end
  from program_modules m where m.id = p_module;
$$;

create or replace function public.submit_capstone(p_module uuid, p_video_url text, p_slides_url text, p_summary text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  m     program_modules%rowtype;
  cur   capstone_submissions%rowtype;
  v_id  uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into m from program_modules where id = p_module and kind = 'capstone';
  if not found then raise exception 'Capstone not found'; end if;
  if not exists (select 1 from program_enrollments where user_id = v_uid and program_id = m.program_id) then
    raise exception 'Enroll in the certification first';
  end if;
  if exists (select 1 from program_modules o where o.program_id = m.program_id and o.position < m.position
             and not public.module_complete(v_uid, o.id)) then
    raise exception 'Capstone locked: complete every earlier module (including the final exam) first';
  end if;
  if not public.valid_presentation_url(btrim(coalesce(p_video_url, ''))) then
    raise exception 'Use a YouTube (unlisted is fine), Google Drive, Loom, Vimeo, Canva or OneDrive link for your presentation';
  end if;
  if nullif(btrim(coalesce(p_slides_url, '')), '') is not null and not public.valid_presentation_url(btrim(p_slides_url)) then
    raise exception 'Slides link must be Google Slides/Drive, Canva, OneDrive or similar';
  end if;
  if public.word_count(p_summary) < 150 then raise exception 'Write at least 150 words of executive summary'; end if;

  select * into cur from capstone_submissions where module_id = m.id and user_id = v_uid for update;
  if cur.id is not null and cur.status = 'submitted' then raise exception 'Your capstone is awaiting review'; end if;
  if cur.id is not null and cur.status = 'scored' and cur.score >= coalesce(m.min_score, 70) then raise exception 'Capstone already passed'; end if;

  insert into capstone_submissions(module_id, user_id, video_url, slides_url, summary)
  values (m.id, v_uid, btrim(p_video_url), nullif(btrim(p_slides_url), ''), btrim(p_summary))
  on conflict (module_id, user_id) do update
    set video_url = excluded.video_url, slides_url = excluded.slides_url, summary = excluded.summary,
        status = 'submitted', score = null, criteria = null, submitted_at = now(), scored_at = null
  returning id into v_id;
  return v_id;
end;
$$;

-- criteria: [{key,label,score,max}] ; p_return = send back for revision without a score
create or replace function public.admin_score_capstone(p_submission uuid, p_criteria jsonb, p_feedback text, p_return boolean default false)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  c       capstone_submissions%rowtype;
  v_total numeric;
  v_title text;
begin
  perform public.assert_admin();
  select * into c from capstone_submissions where id = p_submission for update;
  if not found then raise exception 'Submission not found'; end if;
  select p.certificate_title into v_title from program_modules m join certification_programs p on p.id = m.program_id where m.id = c.module_id;
  if p_return then
    update capstone_submissions set status = 'returned', feedback = coalesce(p_feedback, ''), reviewer_id = auth.uid(), scored_at = now()
     where id = c.id;
    perform public.notify(c.user_id, 'score', 'Capstone returned for revision', coalesce(p_feedback, ''), '/certifications');
    return jsonb_build_object('status', 'returned');
  end if;
  select round(sum(least((x->>'score')::numeric, (x->>'max')::numeric)) / nullif(sum((x->>'max')::numeric), 0) * 100, 2)
    into v_total from jsonb_array_elements(p_criteria) x;
  if v_total is null then raise exception 'Provide rubric scores'; end if;
  update capstone_submissions
     set status = 'scored', score = v_total, criteria = p_criteria, feedback = coalesce(p_feedback, ''),
         reviewer_id = auth.uid(), scored_at = now()
   where id = c.id;
  delete from skill_evidence where user_id = c.user_id and source_type = 'capstone' and source_id = c.id;
  insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight) values
    (c.user_id, 'communication', 'capstone', c.id, v_total, 1),
    (c.user_id, 'leadership', 'capstone', c.id, v_total, 0.5),
    (c.user_id, 'investment_judgment', 'capstone', c.id, v_total, 0.5);
  perform public.notify(c.user_id, 'score', 'Capstone scored: ' || coalesce(v_title, ''),
    format('Your capstone presentation scored %s / 100.', v_total), '/certifications');
  perform public.process_user_progress(c.user_id);
  return jsonb_build_object('status', 'scored', 'score', v_total);
end;
$$;

-- Admin: save a program's module list in place. Existing modules keep their
-- ids so learner capstone submissions (which reference the module) survive edits.
-- p_modules: [{id?, kind, lesson_id, challenge_id, min_score, config}]
create or replace function public.admin_save_program_modules(p_program uuid, p_modules jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  x jsonb;
  i int;
  v_id uuid;
begin
  perform public.assert_admin();
  if not exists (select 1 from certification_programs where id = p_program) then raise exception 'Program not found'; end if;
  delete from program_modules
   where program_id = p_program
     and id not in (select (e->>'id')::uuid from jsonb_array_elements(p_modules) e where nullif(e->>'id', '') is not null);
  update program_modules set position = -position where program_id = p_program;
  for x, i in select e, n::int from jsonb_array_elements(p_modules) with ordinality as t(e, n) loop
    v_id := nullif(x->>'id', '')::uuid;
    if v_id is not null and exists (select 1 from program_modules where id = v_id and program_id = p_program) then
      update program_modules
         set position = i, kind = x->>'kind', lesson_id = nullif(x->>'lesson_id', '')::uuid,
             challenge_id = nullif(x->>'challenge_id', '')::uuid, min_score = nullif(x->>'min_score', '')::numeric,
             config = coalesce(x->'config', '{}'::jsonb)
       where id = v_id;
    else
      insert into program_modules(program_id, position, kind, lesson_id, challenge_id, min_score, config)
      values (p_program, i, x->>'kind', nullif(x->>'lesson_id', '')::uuid, nullif(x->>'challenge_id', '')::uuid,
              nullif(x->>'min_score', '')::numeric, coalesce(x->'config', '{}'::jsonb));
    end if;
  end loop;
end;
$$;

-- Admin: capstone review queue with learner + program context.
create or replace function public.admin_list_capstones(p_status text default 'submitted')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'module_id', c.module_id, 'user_id', c.user_id, 'video_url', c.video_url, 'slides_url', c.slides_url,
      'summary', c.summary, 'status', c.status, 'score', c.score, 'criteria', c.criteria, 'feedback', c.feedback,
      'submitted_at', c.submitted_at, 'scored_at', c.scored_at,
      'learner', jsonb_build_object('full_name', pr.full_name, 'handle', pr.handle),
      'module', jsonb_build_object('config', m.config, 'program', jsonb_build_object('title', p.title)))
      order by c.submitted_at), '[]'::jsonb)
    from capstone_submissions c
    join profiles pr on pr.id = c.user_id
    join program_modules m on m.id = c.module_id
    join certification_programs p on p.id = m.program_id
    where p_status = 'all' or c.status = p_status);
end;
$$;

-- get_program now understands capstone modules.
create or replace function public.get_program(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  p     certification_programs%rowtype;
  v_mods jsonb := '[]'::jsonb;
  v_prior_done boolean := true;
  m     record;
  v_done boolean;
  v_best numeric;
  v_cap  jsonb;
begin
  select * into p from certification_programs where slug = p_slug and (is_published or public.is_admin());
  if not found then return null; end if;
  for m in
    select pm.*, l.title as lesson_title, l.slug as lesson_slug, l.estimated_minutes as lesson_minutes,
           c.title as challenge_title, c.estimated_minutes as challenge_minutes, c.passing_score, c.time_limit_minutes
    from program_modules pm
    left join lessons l on l.id = pm.lesson_id
    left join challenges c on c.id = pm.challenge_id
    where pm.program_id = p.id order by pm.position
  loop
    v_done := public.module_complete(v_uid, m.id);
    v_best := null;
    v_cap := null;
    if m.kind in ('challenge','exam') then
      select max(final_score) into v_best from challenge_submissions
        where user_id = v_uid and challenge_id = m.challenge_id and status = 'scored';
    elsif m.kind = 'capstone' then
      select jsonb_build_object('status', cs.status, 'score', cs.score, 'feedback', cs.feedback, 'criteria', cs.criteria,
                                'video_url', cs.video_url, 'slides_url', cs.slides_url, 'summary', cs.summary,
                                'submitted_at', cs.submitted_at, 'scored_at', cs.scored_at)
        into v_cap from capstone_submissions cs where cs.module_id = m.id and cs.user_id = v_uid;
      v_best := (v_cap->>'score')::numeric;
    end if;
    v_mods := v_mods || jsonb_build_object(
      'id', m.id, 'position', m.position, 'kind', m.kind,
      'title', coalesce(m.lesson_title, m.challenge_title, m.config->>'title', 'Capstone presentation'),
      'lesson_slug', m.lesson_slug, 'challenge_id', m.challenge_id,
      'minutes', coalesce(m.lesson_minutes, m.time_limit_minutes, m.challenge_minutes, (m.config->>'minutes')::int),
      'required_score', case when m.kind = 'lesson' then null when m.kind = 'capstone' then coalesce(m.min_score, 70) else coalesce(m.min_score, m.passing_score) end,
      'best_score', v_best, 'complete', v_done,
      'locked', m.kind in ('exam','capstone') and not v_prior_done,
      'config', case when m.kind = 'capstone' then m.config end,
      'capstone', v_cap);
    v_prior_done := v_prior_done and v_done;
  end loop;
  return jsonb_build_object(
    'program', to_jsonb(p),
    'modules', v_mods,
    'enrollment', (select to_jsonb(e) from program_enrollments e where e.user_id = v_uid and e.program_id = p.id),
    'certificate_code', (select code from certificates where user_id = v_uid and program_id = p.id and revoked_at is null));
end;
$$;

-- =====================================================================
-- D. DAILY CHALLENGE
-- =====================================================================
create table public.daily_questions (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  category_id  text references public.challenge_categories(id) on delete set null,
  type         text not null check (type in ('mcq','numeric')),
  prompt       text not null,
  options      jsonb,
  unit         text,
  explanation  text not null default '',
  is_active    boolean not null default true
);
create table public.daily_question_keys (
  question_id  uuid primary key references public.daily_questions(id) on delete cascade,
  answer       jsonb not null
);
create table public.daily_answers (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  day          date not null,
  question_id  uuid not null references public.daily_questions(id) on delete cascade,
  response     text not null,
  correct      boolean not null,
  answered_at  timestamptz not null default now(),
  primary key (user_id, day)
);

create or replace function public.manila_today()
returns date
language sql stable
as $$ select (now() at time zone 'Asia/Manila')::date; $$;

-- Same question for everyone each day; rotates deterministically.
create or replace function public.daily_question_for(p_day date)
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from daily_questions where is_active order by md5(id::text || p_day::text) limit 1;
$$;

create or replace function public.get_daily_challenge()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with q as (select * from daily_questions where id = public.daily_question_for(public.manila_today())),
  a as (select * from daily_answers where user_id = auth.uid() and day = public.manila_today())
  select case when (select id from q) is null then null else jsonb_build_object(
    'day', public.manila_today(),
    'question', (select jsonb_build_object('id', id, 'type', type, 'prompt', prompt, 'options', options, 'unit', unit, 'category_id', category_id) from q),
    'answered', exists (select 1 from a),
    'correct', (select correct from a),
    'response', (select response from a),
    'explanation', case when exists (select 1 from a) then (select explanation from q) end,
    'answer', case when exists (select 1 from a) then (select k.answer->'answer' from daily_question_keys k where k.question_id = (select id from q)) end,
    'solved_today', (select count(*) from daily_answers d where d.day = public.manila_today()),
    'correct_today', (select count(*) from daily_answers d where d.day = public.manila_today() and d.correct)) end;
$$;

create or replace function public.submit_daily_answer(p_response text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  q     daily_questions%rowtype;
  k     jsonb;
  v_ok  boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into q from daily_questions where id = public.daily_question_for(public.manila_today());
  if not found then raise exception 'No daily challenge today'; end if;
  if exists (select 1 from daily_answers where user_id = v_uid and day = public.manila_today()) then
    raise exception 'You already answered today''s challenge — come back tomorrow';
  end if;
  select answer into k from daily_question_keys where question_id = q.id;
  v_ok := case when q.type = 'mcq' then btrim(coalesce(p_response, '')) = k->>'answer' else public.numeric_matches(p_response, k) end;
  insert into daily_answers(user_id, day, question_id, response, correct) values (v_uid, public.manila_today(), q.id, btrim(coalesce(p_response, '')), v_ok);
  perform public.evaluate_achievements(v_uid);
  return public.get_daily_challenge();
end;
$$;

-- =====================================================================
-- 8. XP, STREAKS, WEEKLY & COHORT LEADERBOARDS
-- =====================================================================
-- Every XP-earning event, derived from real activity (nothing is stored or editable).
create or replace function public.xp_events(p_since timestamptz, p_user uuid default null)
returns table(user_id uuid, at timestamptz, xp int, kind text)
language sql stable security definer set search_path = public
as $$
  select lp.user_id, lp.completed_at, 20, 'lesson' from lesson_progress lp
   where lp.completed_at >= p_since and (p_user is null or lp.user_id = p_user)
  union all
  select a.user_id, min(a.created_at), 5, 'practice' from activity_attempts a
   where (p_user is null or a.user_id = p_user) group by a.user_id, a.activity_id having min(a.created_at) >= p_since
  union all
  select s.user_id, min(s.scored_at), greatest(5, max(c.points) / 4), 'challenge' from challenge_submissions s
    join challenges c on c.id = s.challenge_id
   where s.status = 'scored' and (p_user is null or s.user_id = p_user) group by s.user_id, s.challenge_id having min(s.scored_at) >= p_since
  union all
  select sp.user_id, sp.submitted_at, 30, 'pitch' from stock_pitches sp
   where sp.status = 'submitted' and sp.submitted_at >= p_since and (p_user is null or sp.user_id = p_user)
  union all
  select rp.user_id, rp.submitted_at, 30, 'research' from research_projects rp
   where rp.status = 'submitted' and rp.submitted_at >= p_since and (p_user is null or rp.user_id = p_user)
  union all
  select f.user_id, f.reviewed_at, 1, 'flashcard' from flashcard_review_log f
   where f.reviewed_at >= p_since and (p_user is null or f.user_id = p_user)
  union all
  select pr.reviewer_id, pr.created_at, 10, 'peer_review' from peer_reviews pr
   where pr.created_at >= p_since and (p_user is null or pr.reviewer_id = p_user)
  union all
  select d.user_id, d.answered_at, case when d.correct then 10 else 3 end, 'daily' from daily_answers d
   where d.answered_at >= p_since and (p_user is null or d.user_id = p_user)
  union all
  select cs.user_id, cs.submitted_at, 50, 'capstone' from capstone_submissions cs
   where cs.submitted_at >= p_since and (p_user is null or cs.user_id = p_user);
$$;

create or replace function public.user_streak(p_user uuid)
returns table(current_streak int, longest_streak int, active_today boolean)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_days date[];
  v_today date := public.manila_today();
  v_cur int := 0;
  v_long int := 0;
  v_run int := 0;
  v_prev date;
  d date;
begin
  select coalesce(array_agg(x order by x), '{}') into v_days
    from (select distinct (e.at at time zone 'Asia/Manila')::date as x from public.xp_events(now() - interval '400 days', p_user) e) t;
  foreach d in array v_days loop
    if v_prev is not null and d = v_prev + 1 then v_run := v_run + 1; else v_run := 1; end if;
    v_long := greatest(v_long, v_run);
    v_prev := d;
  end loop;
  if v_prev is not null and v_prev >= v_today - 1 then v_cur := v_run; end if;
  return query select v_cur, v_long, (v_prev = v_today);
end;
$$;

create or replace function public.get_my_activity()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with s as (select * from public.user_streak(auth.uid())),
  days as (
    select (e.at at time zone 'Asia/Manila')::date as d, sum(e.xp)::int as xp
    from public.xp_events(now() - interval '40 days', auth.uid()) e group by 1
  )
  select jsonb_build_object(
    'current_streak', (select current_streak from s),
    'longest_streak', (select longest_streak from s),
    'active_today', (select active_today from s),
    'xp_week', (select coalesce(sum(xp), 0) from public.xp_events(date_trunc('week', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila', auth.uid())),
    'xp_total', (select coalesce(sum(xp), 0) from public.xp_events('-infinity'::timestamptz, auth.uid())),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('date', g::date, 'xp', coalesce(days.xp, 0)) order by g), '[]'::jsonb)
             from generate_series(public.manila_today() - 34, public.manila_today(), interval '1 day') g
             left join days on days.d = g::date));
$$;

-- XP leaderboard over the last N days (default: this week, Monday start, Manila time).
create or replace function public.get_xp_leaderboard(p_days int default null, p_limit int default 50)
returns table(rank bigint, user_id uuid, handle text, display_name text, xp bigint, is_me boolean)
language sql stable security definer set search_path = public
as $$
  with since as (
    select case when p_days is null then date_trunc('week', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
                else now() - make_interval(days => p_days) end as t
  ),
  agg as (
    select e.user_id, sum(e.xp)::bigint as xp from public.xp_events((select t from since)) e group by e.user_id
  ),
  ranked as (select rank() over (order by a.xp desc) as rnk, a.* from agg a)
  select r.rnk, r.user_id, p.handle,
         case when p.is_public or r.user_id = auth.uid() then p.full_name else 'Private analyst' end,
         r.xp, r.user_id = auth.uid()
  from ranked r join profiles p on p.id = r.user_id
  where p.is_public or r.user_id = auth.uid() or public.is_admin()
  order by r.rnk, p.handle
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Cohort leaderboard for one certification/track.
create or replace function public.get_program_leaderboard(p_program uuid)
returns table(rank bigint, user_id uuid, handle text, display_name text, completed bigint, total bigint, avg_score numeric, completed_at timestamptz, is_me boolean)
language sql stable security definer set search_path = public
as $$
  with mods as (select id, kind, challenge_id from program_modules where program_id = p_program),
  stats as (
    select e.user_id, e.completed_at,
           (select count(*) from mods m where public.module_complete(e.user_id, m.id)) as completed,
           (select count(*) from mods) as total,
           (select round(avg(b.best), 1) from (
              select max(s.final_score) as best from mods m join challenge_submissions s
                on s.challenge_id = m.challenge_id and s.user_id = e.user_id and s.status = 'scored'
              group by m.id) b) as avg_score
    from program_enrollments e where e.program_id = p_program
  ),
  ranked as (
    select rank() over (order by (st.completed_at is null), st.completed desc, st.avg_score desc nulls last, st.completed_at nulls last) as rnk, st.*
    from stats st
  )
  select r.rnk, r.user_id, p.handle,
         case when p.is_public or r.user_id = auth.uid() then p.full_name else 'Private analyst' end,
         r.completed, r.total, r.avg_score, r.completed_at, r.user_id = auth.uid()
  from ranked r join profiles p on p.id = r.user_id
  where p.is_public or r.user_id = auth.uid() or public.is_admin()
  order by r.rnk
  limit 100;
$$;

-- New metrics for achievements.
create or replace function public.user_metric(p_user uuid, p_metric text, p_arg text default null)
returns numeric
language plpgsql stable security definer set search_path = public
as $$
begin
  case p_metric
    when 'challenges_completed' then
      return (select count(distinct challenge_id) from challenge_submissions where user_id = p_user and status = 'scored');
    when 'challenges_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score);
    when 'category_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score and c.category_id = p_arg);
    when 'tag_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score and p_arg = any(c.tags));
    when 'challenge_submissions' then return (select count(*) from challenge_submissions where user_id = p_user);
    when 'stock_pitches_submitted' then return (select count(*) from stock_pitches where user_id = p_user and status = 'submitted');
    when 'research_reports_submitted' then return (select count(*) from research_projects where user_id = p_user and status = 'submitted');
    when 'valuation_models' then return (select count(*) from valuation_models where user_id = p_user);
    when 'financial_models' then return (select count(*) from financial_models where user_id = p_user);
    when 'portfolio_trades' then return (select count(*) from portfolio_transactions where user_id = p_user);
    when 'market_event_decisions' then return (select count(*) from market_event_decisions where user_id = p_user);
    when 'competitions_joined' then return (select count(*) from competition_participants where user_id = p_user);
    when 'competitions_won' then return (select count(*) from competition_results where user_id = p_user and rank = 1);
    when 'competitions_top3' then return (select count(*) from competition_results where user_id = p_user and rank <= 3);
    when 'lessons_completed' then return (select count(*) from lesson_progress where user_id = p_user);
    when 'finlab_score' then return (select finlab_score from user_stats where user_id = p_user);
    when 'skill_score' then return coalesce((select score from user_skills where user_id = p_user and skill_id = p_arg), 0);
    when 'streak_longest' then return (select longest_streak from public.user_streak(p_user));
    when 'flashcards_reviewed' then return (select count(*) from flashcard_review_log where user_id = p_user);
    when 'flashcards_mastered' then return (select count(*) from flashcard_state where user_id = p_user and interval_days >= 21);
    when 'peer_reviews_given' then return (select count(*) from peer_reviews where reviewer_id = p_user);
    when 'helpful_reviews' then return (select count(*) from peer_reviews where reviewer_id = p_user and helpful_rating >= 4);
    when 'capstones_passed' then return (select count(*) from capstone_submissions where user_id = p_user and status = 'scored' and score >= 70);
    when 'daily_correct' then return (select count(*) from daily_answers where user_id = p_user and correct);
    when 'certificates_earned' then return (select count(*) from certificates where user_id = p_user and revoked_at is null and kind <> 'competition');
    else raise exception 'Unknown metric: %', p_metric;
  end case;
end;
$$;

-- "Today" plan: what the learner should do next.
create or replace function public.get_today_plan()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_items jsonb := '[]'::jsonb;
  v_due int;
  r record;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from daily_answers where user_id = v_uid and day = public.manila_today())
     and public.daily_question_for(public.manila_today()) is not null then
    v_items := v_items || jsonb_build_object('kind', 'daily', 'title', 'Answer today''s daily challenge', 'detail', '1 question · +10 XP', 'link', '/dashboard#daily');
  end if;
  select count(*) into v_due from flashcard_state s join flashcards f on f.id = s.card_id join lessons l on l.id = f.lesson_id
   where s.user_id = v_uid and s.due_at <= now() and l.is_published;
  if v_due > 0 then
    v_items := v_items || jsonb_build_object('kind', 'flashcards', 'title', format('Review %s due flashcard%s', v_due, case when v_due = 1 then '' else 's' end), 'detail', 'Spaced repetition keeps it in long-term memory', 'link', '/flashcards');
  end if;
  for r in
    select a.challenge_id, c.title, a.stock_pitch_id, a.research_project_id, a.deadline_at from challenge_attempts a join challenges c on c.id = a.challenge_id
    where a.user_id = v_uid and a.status = 'in_progress' order by a.started_at desc limit 2
  loop
    v_items := v_items || jsonb_build_object('kind', 'attempt', 'title', 'Finish: ' || r.title,
      'detail', case when r.deadline_at is not null then 'Deadline ' || to_char(r.deadline_at at time zone 'Asia/Manila', 'Mon DD, HH24:MI') else 'In progress' end,
      'link', case when r.stock_pitch_id is not null then '/pitches/' || r.stock_pitch_id when r.research_project_id is not null then '/research/' || r.research_project_id else '/challenges/' || r.challenge_id end);
  end loop;
  for r in
    select p.slug, p.title,
           (select jsonb_build_object('kind', m.kind, 'lesson_slug', l.slug, 'challenge_id', m.challenge_id, 'title', coalesce(l.title, c.title, m.config->>'title', 'Capstone'))
              from program_modules m left join lessons l on l.id = m.lesson_id left join challenges c on c.id = m.challenge_id
             where m.program_id = p.id and not public.module_complete(v_uid, m.id) order by m.position limit 1) as nxt
    from program_enrollments e join certification_programs p on p.id = e.program_id
    where e.user_id = v_uid and e.completed_at is null and p.is_published
    order by e.enrolled_at desc limit 2
  loop
    if r.nxt is not null then
      v_items := v_items || jsonb_build_object('kind', 'program', 'title', 'Next in ' || r.title || ': ' || (r.nxt->>'title'),
        'detail', initcap(r.nxt->>'kind'),
        'link', case r.nxt->>'kind' when 'lesson' then '/learn/' || (r.nxt->>'lesson_slug')
                                     when 'capstone' then '/certifications/' || r.slug
                                     else '/challenges/' || (r.nxt->>'challenge_id') end);
    end if;
  end loop;
  if exists (select 1 from get_review_queue(1)) then
    v_items := v_items || jsonb_build_object('kind', 'review', 'title', 'Review a fellow analyst''s pitch', 'detail', '+10 XP · builds Communication', 'link', '/reviews');
  end if;
  if jsonb_array_length(v_items) = 0 then
    v_items := v_items || jsonb_build_object('kind', 'explore', 'title', 'Start a certification', 'detail', 'Structured path with a verifiable certificate', 'link', '/certifications');
  end if;
  return v_items;
end;
$$;

-- =====================================================================
-- F. ADMIN ANALYTICS
-- =====================================================================
-- Store per-question results on lesson attempts (redefined from 0008 + results).
create or replace function public.submit_lesson_check(p_lesson uuid, p_responses jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  l        lessons%rowtype;
  v_last   timestamptz;
  v_wait   int := public.setting_num('lesson_retry_seconds', 60)::int;
  v_pass   numeric := public.setting_num('lesson_pass_pct', 80);
  v_grade  jsonb;
  v_score  numeric;
  v_passed boolean;
  v_first  boolean;
  v_results jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into l from lessons where id = p_lesson and is_published;
  if not found then raise exception 'Lesson not found'; end if;
  if jsonb_array_length(l.check_questions) = 0 then raise exception 'This lesson has no knowledge check yet'; end if;
  if cardinality(l.video_urls) > 0
     and not exists (select 1 from lesson_video_views where user_id = v_uid and lesson_id = p_lesson) then
    raise exception 'Watch the lesson video first — the knowledge check unlocks after it';
  end if;
  if exists (select 1 from lesson_activities la
             where la.lesson_id = p_lesson and la.is_required and la.kind <> 'calculator'
               and not exists (select 1 from activity_attempts aa where aa.user_id = v_uid and aa.activity_id = la.id)) then
    raise exception 'Complete the practice activities first — the knowledge check unlocks after them';
  end if;
  select max(created_at) into v_last from lesson_attempts where user_id = v_uid and lesson_id = p_lesson;
  if v_last is not null and v_last > now() - make_interval(secs => v_wait) then
    raise exception 'Please review the lesson and try again in % seconds', ceil(extract(epoch from (v_last + make_interval(secs => v_wait) - now())));
  end if;

  v_grade := public.grade_questions(l.check_questions, (select answers from lesson_check_keys where lesson_id = p_lesson), p_responses);
  v_score := (v_grade->>'total')::numeric;
  v_passed := v_score >= v_pass;
  select jsonb_object_agg(q->>'key', (q->>'score')::numeric >= (q->>'max')::numeric) into v_results
    from jsonb_array_elements(v_grade->'criteria') q;
  insert into lesson_attempts(user_id, lesson_id, score, passed, results) values (v_uid, p_lesson, v_score, v_passed, v_results);

  v_first := false;
  if v_passed then
    insert into lesson_progress(user_id, lesson_id) values (v_uid, p_lesson) on conflict do nothing;
    v_first := found;
    perform public.evaluate_achievements(v_uid);
    perform public.evaluate_programs(v_uid);
  end if;
  return jsonb_build_object('score', v_score, 'passed', v_passed, 'pass_pct', v_pass, 'first_completion', v_first,
    'questions', (select jsonb_agg(jsonb_build_object('key', key, 'correct', value::boolean)) from jsonb_each(v_results)),
    'retry_after_seconds', case when v_passed then null else v_wait end);
end;
$$;

create or replace function public.admin_analytics(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'days', (select coalesce(jsonb_agg(jsonb_build_object('date', g::date,
                'signups', (select count(*) from profiles p where (p.created_at at time zone 'Asia/Manila')::date = g::date),
                'active', (select count(distinct e.user_id) from public.xp_events(v_since) e where (e.at at time zone 'Asia/Manila')::date = g::date),
                'xp', (select coalesce(sum(e.xp), 0) from public.xp_events(v_since) e where (e.at at time zone 'Asia/Manila')::date = g::date))
              order by g), '[]'::jsonb)
             from generate_series((v_since at time zone 'Asia/Manila')::date, public.manila_today(), interval '1 day') g),
    'funnel', jsonb_build_array(
       jsonb_build_object('step', 'Registered', 'users', (select count(*) from profiles)),
       jsonb_build_object('step', 'Onboarded', 'users', (select count(*) from profiles where onboarded_at is not null)),
       jsonb_build_object('step', 'Passed a lesson', 'users', (select count(distinct user_id) from lesson_progress)),
       jsonb_build_object('step', 'Scored a challenge', 'users', (select count(distinct user_id) from challenge_submissions where status = 'scored')),
       jsonb_build_object('step', 'Enrolled in a program', 'users', (select count(distinct user_id) from program_enrollments)),
       jsonb_build_object('step', 'Earned a certificate', 'users', (select count(distinct user_id) from certificates where kind <> 'competition' and revoked_at is null))),
    'active_7d', (select count(distinct user_id) from public.xp_events(now() - interval '7 days')),
    'active_30d', (select count(distinct user_id) from public.xp_events(now() - interval '30 days')),
    'programs', (select coalesce(jsonb_agg(jsonb_build_object('title', p.title, 'kind', p.kind,
                    'enrolled', (select count(*) from program_enrollments e where e.program_id = p.id),
                    'completed', (select count(*) from program_enrollments e where e.program_id = p.id and e.completed_at is not null))
                  order by p.sort_order), '[]'::jsonb) from certification_programs p),
    'hardest_questions', (select coalesce(jsonb_agg(x order by (x->>'pct_correct')::numeric), '[]'::jsonb) from (
        select jsonb_build_object('lesson', l.title, 'lesson_slug', l.slug, 'question', r.key,
                 'prompt', (select q->>'prompt' from jsonb_array_elements(l.check_questions) q where q->>'id' = r.key),
                 'attempts', count(*), 'pct_correct', round(avg(case when r.value::boolean then 100 else 0 end), 1)) as x
        from lesson_attempts a join lessons l on l.id = a.lesson_id, jsonb_each(a.results) r
        where a.results is not null and a.created_at >= v_since
        group by l.title, l.slug, l.check_questions, r.key
        having count(*) >= 3
        order by avg(case when r.value::boolean then 1 else 0 end) asc limit 15) t),
    'hardest_tasks', (select coalesce(jsonb_agg(x order by (x->>'avg_pct')::numeric), '[]'::jsonb) from (
        select jsonb_build_object('challenge', c.title, 'task', cr->>'label', 'attempts', count(*),
                 'avg_pct', round(avg((cr->>'score')::numeric / nullif((cr->>'max')::numeric, 0) * 100), 1)) as x
        from challenge_scores s join challenge_submissions sb on sb.id = s.submission_id join challenges c on c.id = sb.challenge_id,
             jsonb_array_elements(s.criteria_scores) cr
        where s.is_final and s.created_at >= v_since and (cr->>'max')::numeric > 0
        group by c.title, cr->>'label'
        having count(*) >= 3
        order by avg((cr->>'score')::numeric / nullif((cr->>'max')::numeric, 0)) asc limit 10) t),
    'activities', (select coalesce(jsonb_agg(jsonb_build_object('title', la.title, 'kind', la.kind, 'lesson', l.title,
                      'attempts', (select count(*) from activity_attempts aa where aa.activity_id = la.id and aa.created_at >= v_since),
                      'avg_score', (select round(avg(score), 1) from activity_attempts aa where aa.activity_id = la.id and aa.created_at >= v_since))
                    order by l.sort_order, la.position), '[]'::jsonb)
                   from lesson_activities la join lessons l on l.id = la.lesson_id where la.kind <> 'calculator'),
    'daily', jsonb_build_object('answered_today', (select count(*) from daily_answers where day = public.manila_today()),
                                'correct_today', (select count(*) from daily_answers where day = public.manila_today() and correct)),
    'pending', jsonb_build_object('submissions', (select count(*) from challenge_submissions where status = 'pending_review'),
                                  'capstones', (select count(*) from capstone_submissions where status = 'submitted'),
                                  'feedback', (select count(*) from feedback where status = 'open')));
end;
$$;

-- =====================================================================
-- Security
-- =====================================================================
alter table public.flashcards enable row level security;
alter table public.flashcard_state enable row level security;
alter table public.flashcard_review_log enable row level security;
alter table public.peer_reviews enable row level security;
alter table public.capstone_submissions enable row level security;
alter table public.daily_questions enable row level security;
alter table public.daily_question_keys enable row level security;
alter table public.daily_answers enable row level security;
revoke all on public.flashcards, public.flashcard_state, public.flashcard_review_log, public.peer_reviews,
              public.capstone_submissions, public.daily_questions, public.daily_question_keys, public.daily_answers
  from anon, authenticated;

grant select, insert, update, delete on public.flashcards to authenticated;
create policy flashcards_read on public.flashcards for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and (l.is_published or public.is_admin())));
create policy flashcards_admin on public.flashcards for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.flashcard_state, public.flashcard_review_log, public.peer_reviews, public.capstone_submissions, public.daily_answers to authenticated;
create policy flashcard_state_read on public.flashcard_state for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy flashcard_log_read on public.flashcard_review_log for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy peer_reviews_read on public.peer_reviews for select to authenticated using (reviewer_id = auth.uid() or public.is_admin());
create policy capstones_read on public.capstone_submissions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy daily_answers_read on public.daily_answers for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.daily_questions, public.daily_question_keys to authenticated;
create policy daily_questions_read on public.daily_questions for select to authenticated using (is_active or public.is_admin());
create policy daily_questions_admin on public.daily_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy daily_keys_admin on public.daily_question_keys for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke execute on function
  public.xp_events(timestamptz, uuid), public.user_streak(uuid), public.daily_question_for(date), public.valid_presentation_url(text)
from public, anon, authenticated;

grant execute on function
  public.review_flashcard(uuid, int), public.get_flashcard_queue(uuid, int), public.flashcard_stats(),
  public.get_review_queue(int), public.get_pitch_for_review(uuid), public.submit_peer_review(uuid, jsonb, text, text),
  public.get_pitch_reviews(uuid), public.rate_peer_review(uuid, int),
  public.submit_capstone(uuid, text, text, text), public.admin_score_capstone(uuid, jsonb, text, boolean),
  public.get_daily_challenge(), public.submit_daily_answer(text), public.manila_today(),
  public.get_my_activity(), public.get_xp_leaderboard(int, int), public.get_program_leaderboard(uuid),
  public.get_today_plan(), public.admin_analytics(int),
  public.admin_save_program_modules(uuid, jsonb), public.admin_list_capstones(text)
to authenticated;
revoke execute on function
  public.review_flashcard(uuid, int), public.get_flashcard_queue(uuid, int), public.flashcard_stats(),
  public.get_review_queue(int), public.get_pitch_for_review(uuid), public.submit_peer_review(uuid, jsonb, text, text),
  public.get_pitch_reviews(uuid), public.rate_peer_review(uuid, int),
  public.submit_capstone(uuid, text, text, text), public.admin_score_capstone(uuid, jsonb, text, boolean),
  public.get_daily_challenge(), public.submit_daily_answer(text), public.manila_today(),
  public.get_my_activity(), public.get_xp_leaderboard(int, int), public.get_program_leaderboard(uuid),
  public.get_today_plan(), public.admin_analytics(int)
from anon;

-- PostgreSQL grants EXECUTE to PUBLIC on every new function, and a per-schema
-- default-privilege revoke (0009) cannot remove that. Re-apply the lockdown so
-- signed-out visitors only keep the public passport/certificate functions.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_admin(),
  public.get_passport(text),
  public.verify_certificate(text),
  public.get_user_certificates(text),
  public.all_youtube_urls(text[])
to anon;
alter default privileges revoke execute on functions from public;

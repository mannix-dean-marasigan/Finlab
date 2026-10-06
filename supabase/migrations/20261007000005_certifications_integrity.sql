-- =====================================================================
-- FINLAB — 0005 Lesson knowledge checks, certification programs,
-- verifiable certificates, anti-gaming rules, feedback, account deletion
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Settings (editable in Admin → Overview)
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
 ('retry_cooldown_minutes', '10', 'Minutes a user must wait after submitting before starting another attempt of the same challenge.'),
 ('retry_penalty_step', '0.1', 'Each re-attempt counts this much less toward skills (attempt 2 = 90%, attempt 3 = 80%…).'),
 ('retry_penalty_floor', '0.7', 'Re-attempts never count less than this fraction toward skills.'),
 ('max_daily_submissions', '25', 'Maximum scored submissions (challenges, pitches, reports) per user per 24 hours.'),
 ('lesson_pass_pct', '75', 'Score needed on a lesson knowledge check for the lesson to count as completed (75 = 3 of 4).'),
 ('lesson_retry_seconds', '60', 'Seconds a user must wait between knowledge-check attempts on the same lesson.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists accepted_terms_at timestamptz;

alter table public.lessons add column if not exists check_questions jsonb not null default '[]'::jsonb;
-- Optional embedded video (YouTube). Watching is not tracked; the knowledge check is the gate.
alter table public.lessons add column if not exists video_url text
  check (video_url is null or video_url ~* '^https://(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)/');

-- ADMIN-ONLY answers for lesson knowledge checks.
create table public.lesson_check_keys (
  lesson_id   uuid primary key references public.lessons(id) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table public.lesson_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  score       numeric(5,2) not null,
  passed      boolean not null,
  created_at  timestamptz not null default now()
);
create index idx_lesson_attempts_user on public.lesson_attempts(user_id, lesson_id, created_at desc);

alter table public.challenge_submissions add column if not exists attempt_number int;
update public.challenge_submissions s set attempt_number = x.n
from (select id, row_number() over (partition by user_id, challenge_id order by submitted_at) as n
      from public.challenge_submissions) x
where x.id = s.id and s.attempt_number is null;

create table public.certification_programs (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  kind               text not null default 'certification' check (kind in ('certification','track')),
  title              text not null,
  subtitle           text not null default '',
  description        text not null default '',
  category_id        text references public.challenge_categories(id) on delete set null,
  level              text not null default 'beginner' check (level in ('beginner','intermediate','advanced','expert')),
  estimated_hours    numeric(4,1) not null default 1,
  certificate_title  text not null,
  is_published       boolean not null default false,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_programs_updated before update on public.certification_programs
  for each row execute function public.set_updated_at();

create table public.program_modules (
  id            uuid primary key default gen_random_uuid(),
  program_id    uuid not null references public.certification_programs(id) on delete cascade,
  position      int not null,
  kind          text not null check (kind in ('lesson','challenge','exam')),
  lesson_id     uuid references public.lessons(id) on delete cascade,
  challenge_id  uuid references public.challenges(id) on delete cascade,
  min_score     numeric(5,2) check (min_score between 0 and 100),
  unique (program_id, position),
  check ((kind = 'lesson') = (lesson_id is not null)),
  check ((kind in ('challenge','exam')) = (challenge_id is not null))
);
create index idx_program_modules_lesson on public.program_modules(lesson_id);
create index idx_program_modules_challenge on public.program_modules(challenge_id);

create table public.program_enrollments (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  program_id    uuid not null references public.certification_programs(id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (user_id, program_id)
);
create index idx_program_enrollments_program on public.program_enrollments(program_id);

-- CALCULATED: issued only by database functions. Publicly verifiable by code.
create table public.certificates (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^FLB-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  kind            text not null check (kind in ('certification','track','competition')),
  program_id      uuid references public.certification_programs(id) on delete set null,
  competition_id  uuid references public.competitions(id) on delete set null,
  recipient_name  text not null,
  title           text not null,
  subtitle        text not null default '',
  details         jsonb not null default '{}'::jsonb,
  issued_at       timestamptz not null default now(),
  revoked_at      timestamptz,
  revoked_reason  text,
  unique (user_id, program_id),
  unique (user_id, competition_id)
);
create index idx_certificates_user on public.certificates(user_id);

create table public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid default auth.uid() references public.profiles(id) on delete set null,
  category     text not null default 'bug' check (category in ('bug','idea','content','other')),
  message      text not null check (char_length(message) between 5 and 4000),
  page         text check (char_length(page) <= 500),
  user_agent   text check (char_length(user_agent) <= 500),
  status       text not null default 'open' check (status in ('open','in_progress','resolved')),
  admin_note   text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index idx_feedback_status on public.feedback(status, created_at desc);

-- ---------------------------------------------------------------------
-- 2. Generic question grading (shared by challenges and lesson checks)
-- ---------------------------------------------------------------------
create or replace function public.grade_questions(p_questions jsonb, p_keys jsonb, p_responses jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  t         jsonb;
  k         jsonb;
  v_idx     int := 0;
  v_pts     numeric;
  v_frac    numeric;
  v_resp    text;
  v_num     numeric;
  v_ans     numeric;
  v_tol     numeric;
  v_words   int;
  v_min     int;
  v_hits    int;
  v_req     int;
  v_total_p numeric := 0;
  v_total_e numeric := 0;
  v_items   jsonb := '[]'::jsonb;
  v_fb      text;
begin
  p_keys := coalesce(p_keys, '{}'::jsonb);
  p_responses := coalesce(p_responses, '{}'::jsonb);
  for t in select * from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) loop
    v_idx  := v_idx + 1;
    v_pts  := coalesce((t->>'points')::numeric, 10);
    k      := coalesce(p_keys->(t->>'id'), '{}'::jsonb);
    v_resp := nullif(btrim(coalesce(p_responses->>(t->>'id'), '')), '');
    v_frac := 0;
    v_fb   := null;

    if t->>'type' = 'mcq' then
      v_frac := case when v_resp is not null and v_resp = k->>'answer' then 1 else 0 end;
      v_fb := case when v_frac = 1 then 'Correct' else 'Incorrect' end;
    elsif t->>'type' = 'numeric' then
      begin
        v_num := nullif(regexp_replace(coalesce(v_resp, ''), '[^0-9.\-]', '', 'g'), '')::numeric;
      exception when others then
        v_num := null;
      end;
      if v_num is not null and k ? 'answer' then
        v_ans := (k->>'answer')::numeric;
        v_tol := greatest(abs(v_ans) * coalesce((k->>'tolerance_pct')::numeric, 1) / 100,
                          coalesce((k->>'tolerance_abs')::numeric, 0.0001));
        if abs(v_num - v_ans) <= v_tol then
          v_frac := 1;
        elsif abs(v_num - v_ans) <= v_tol * 3 then
          v_frac := 0.5;
        end if;
      end if;
      v_fb := case when v_frac = 1 then 'Within tolerance'
                   when v_frac = 0.5 then 'Close — partial credit'
                   when v_num is null then 'No numeric answer'
                   else 'Outside tolerance' end;
    else
      v_words := word_count(v_resp);
      v_min   := coalesce((t->>'min_words')::int, 40);
      if jsonb_typeof(k->'keywords') = 'array' and jsonb_array_length(k->'keywords') > 0 then
        select count(*) into v_hits
        from jsonb_array_elements_text(k->'keywords') kw
        where exists (select 1 from unnest(string_to_array(kw, '|')) syn
                      where lower(coalesce(v_resp, '')) like '%' || lower(btrim(syn)) || '%');
        v_req := least(jsonb_array_length(k->'keywords'),
                       coalesce((k->>'keywords_required')::int, jsonb_array_length(k->'keywords')));
        v_frac := 0.4 * ratio(v_words, v_min) + 0.6 * ratio(v_hits, v_req);
        v_fb := format('%s words (target %s); covered %s of %s key concepts', v_words, v_min, v_hits, v_req);
      else
        v_frac := ratio(v_words, v_min);
        v_fb := format('%s words (target %s)', v_words, v_min);
      end if;
    end if;

    v_total_p := v_total_p + v_pts;
    v_total_e := v_total_e + v_frac * v_pts;
    v_items := v_items || jsonb_build_object(
      'key', t->>'id', 'label', coalesce(t->>'label', 'Question ' || v_idx),
      'score', round(v_frac * v_pts, 2), 'max', v_pts, 'feedback', v_fb);
  end loop;

  return jsonb_build_object(
    'total', case when v_total_p > 0 then round(v_total_e / v_total_p * 100, 2) else 0 end,
    'criteria', v_items);
end;
$$;

create or replace function public.grade_task_responses(p_challenge uuid, p_responses jsonb)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select public.grade_questions(
    (select content->'tasks' from challenges where id = p_challenge),
    (select answers from challenge_answer_keys where challenge_id = p_challenge),
    p_responses);
$$;

-- ---------------------------------------------------------------------
-- 3. Anti-gaming helpers
-- ---------------------------------------------------------------------
create or replace function public.assert_daily_submission_cap(p_user uuid)
returns void
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cap int := public.setting_num('max_daily_submissions', 25)::int;
  v_n   int;
begin
  select (select count(*) from challenge_submissions where user_id = p_user and submitted_at > now() - interval '24 hours')
       + (select count(*) from stock_pitches where user_id = p_user and challenge_id is null and submitted_at > now() - interval '24 hours')
       + (select count(*) from research_projects where user_id = p_user and challenge_id is null and submitted_at > now() - interval '24 hours')
    into v_n;
  if v_n >= v_cap then
    raise exception 'Daily limit reached: % scored submissions in 24 hours. Take a break and come back tomorrow.', v_cap;
  end if;
end;
$$;

create or replace function public.assert_not_duplicate_pitch(p stock_pitches)
returns void
language plpgsql stable security definer set search_path = public
as $$
begin
  if exists (select 1 from stock_pitches o
             where o.user_id = p.user_id and o.id <> p.id and o.status = 'submitted'
               and md5(lower(regexp_replace(o.thesis, '\s+', ' ', 'g'))) = md5(lower(regexp_replace(p.thesis, '\s+', ' ', 'g')))) then
    raise exception 'This thesis is identical to one you already submitted. Write a new pitch.';
  end if;
end;
$$;

-- Evidence from a challenge: the best final score adjusted for retries.
-- Attempt 1 counts 100%, each re-attempt counts less (down to a floor).
create or replace function public.refresh_challenge_evidence(p_user uuid, p_challenge uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_best   numeric;
  v_impact jsonb;
  v_step   numeric := public.setting_num('retry_penalty_step', 0.1);
  v_floor  numeric := public.setting_num('retry_penalty_floor', 0.7);
begin
  delete from skill_evidence
   where user_id = p_user and source_type = 'challenge' and source_id = p_challenge;

  select max(final_score * greatest(v_floor, 1 - v_step * (coalesce(attempt_number, 1) - 1)))
    into v_best
  from challenge_submissions
  where user_id = p_user and challenge_id = p_challenge and status = 'scored';
  if v_best is null then return; end if;

  select skill_impact into v_impact from challenges where id = p_challenge;
  insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight)
  select p_user, j.key, 'challenge', p_challenge, round(v_best, 2), least(1, (j.value)::numeric)
  from jsonb_each_text(coalesce(v_impact, '{}'::jsonb)) as j(key, value)
  where exists (select 1 from skills where id = j.key) and (j.value)::numeric > 0;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Certificates & programs
-- ---------------------------------------------------------------------
create or replace function public.gen_certificate_code()
returns text
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code  text;
begin
  loop
    v_code := 'FLB-';
    for i in 1..8 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from certificates where code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function public.issue_certificate(
  p_user uuid, p_kind text, p_program uuid, p_competition uuid, p_title text, p_subtitle text, p_details jsonb)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_name text;
begin
  select full_name into v_name from profiles where id = p_user;
  if p_competition is not null then
    insert into certificates(code, user_id, kind, competition_id, recipient_name, title, subtitle, details)
    values (public.gen_certificate_code(), p_user, p_kind, p_competition, coalesce(v_name, 'FINLAB Analyst'), p_title, coalesce(p_subtitle, ''), coalesce(p_details, '{}'))
    on conflict (user_id, competition_id) do update
      set title = excluded.title, subtitle = excluded.subtitle, details = excluded.details, revoked_at = null, revoked_reason = null
    returning code into v_code;
  else
    insert into certificates(code, user_id, kind, program_id, recipient_name, title, subtitle, details)
    values (public.gen_certificate_code(), p_user, p_kind, p_program, coalesce(v_name, 'FINLAB Analyst'), p_title, coalesce(p_subtitle, ''), coalesce(p_details, '{}'))
    on conflict (user_id, program_id) do nothing
    returning code into v_code;
  end if;
  if v_code is not null then
    perform public.notify(p_user, 'achievement', 'Certificate issued: ' || p_title,
      'Verification code ' || v_code || '. Find it under Learn → Certifications.', '/verify/' || v_code);
  end if;
  return v_code;
end;
$$;

-- A module is complete when its lesson check is passed, or the challenge's
-- best score reaches the module minimum (default: the challenge pass mark).
create or replace function public.module_complete(p_user uuid, p_module uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case m.kind
    when 'lesson' then exists (select 1 from lesson_progress lp where lp.user_id = p_user and lp.lesson_id = m.lesson_id)
    else coalesce((select max(s.final_score) from challenge_submissions s
                   where s.user_id = p_user and s.challenge_id = m.challenge_id and s.status = 'scored'), -1)
         >= coalesce(m.min_score, (select c.passing_score from challenges c where c.id = m.challenge_id))
  end
  from program_modules m where m.id = p_module;
$$;

create or replace function public.evaluate_programs(p_user uuid)
returns text[]
language plpgsql security definer set search_path = public
as $$
declare
  e      record;
  v_code text;
  v_new  text[] := '{}';
  v_avg  numeric;
begin
  for e in
    select pe.program_id, p.kind, p.certificate_title, p.title, p.estimated_hours
    from program_enrollments pe join certification_programs p on p.id = pe.program_id
    where pe.user_id = p_user and pe.completed_at is null and p.is_published
      and exists (select 1 from program_modules m where m.program_id = p.id)
  loop
    if not exists (select 1 from program_modules m where m.program_id = e.program_id
                   and not public.module_complete(p_user, m.id)) then
      update program_enrollments set completed_at = now() where user_id = p_user and program_id = e.program_id;
      select round(avg(best), 1) into v_avg from (
        select max(s.final_score) as best from program_modules m
        join challenge_submissions s on s.challenge_id = m.challenge_id and s.user_id = p_user and s.status = 'scored'
        where m.program_id = e.program_id group by m.id) x;
      v_code := public.issue_certificate(p_user, e.kind, e.program_id, null, e.certificate_title, e.title,
        jsonb_build_object('average_score', v_avg, 'estimated_hours', e.estimated_hours,
                           'modules', (select count(*) from program_modules where program_id = e.program_id)));
      if v_code is not null then v_new := v_new || v_code; end if;
    end if;
  end loop;
  return v_new;
end;
$$;

-- process_user_progress now also completes programs.
create or replace function public.process_user_progress(p_user uuid)
returns text[]
language plpgsql security definer set search_path = public
as $$
declare
  v_new text[];
begin
  perform public.recalculate_user_scores(p_user);
  v_new := public.evaluate_achievements(p_user);
  perform public.evaluate_programs(p_user);
  return v_new;
end;
$$;

create or replace function public.enroll_program(p_program uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_codes text[];
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from certification_programs where id = p_program and is_published) then
    raise exception 'Program not available';
  end if;
  insert into program_enrollments(user_id, program_id) values (v_uid, p_program) on conflict do nothing;
  v_codes := public.evaluate_programs(v_uid);
  return jsonb_build_object('enrolled', true, 'certificates', to_jsonb(v_codes));
end;
$$;

-- Program detail with per-module status for the signed-in user.
create or replace function public.get_program(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  p     certification_programs%rowtype;
  v_mods jsonb;
  v_prior_done boolean := true;
  m     record;
  v_done boolean;
  v_best numeric;
begin
  select * into p from certification_programs where slug = p_slug and (is_published or public.is_admin());
  if not found then return null; end if;
  v_mods := '[]'::jsonb;
  for m in
    select pm.*, l.title as lesson_title, l.slug as lesson_slug, l.estimated_minutes as lesson_minutes,
           c.title as challenge_title, c.estimated_minutes as challenge_minutes, c.passing_score, c.time_limit_minutes
    from program_modules pm
    left join lessons l on l.id = pm.lesson_id
    left join challenges c on c.id = pm.challenge_id
    where pm.program_id = p.id order by pm.position
  loop
    v_done := public.module_complete(v_uid, m.id);
    select max(final_score) into v_best from challenge_submissions
      where user_id = v_uid and challenge_id = m.challenge_id and status = 'scored';
    v_mods := v_mods || jsonb_build_object(
      'id', m.id, 'position', m.position, 'kind', m.kind,
      'title', coalesce(m.lesson_title, m.challenge_title),
      'lesson_slug', m.lesson_slug, 'challenge_id', m.challenge_id,
      'minutes', coalesce(m.lesson_minutes, m.time_limit_minutes, m.challenge_minutes),
      'required_score', case when m.kind = 'lesson' then null else coalesce(m.min_score, m.passing_score) end,
      'best_score', v_best, 'complete', v_done,
      'locked', m.kind = 'exam' and not v_prior_done);
    if m.kind <> 'exam' then v_prior_done := v_prior_done and v_done; end if;
  end loop;
  return jsonb_build_object(
    'program', to_jsonb(p),
    'modules', v_mods,
    'enrollment', (select to_jsonb(e) from program_enrollments e where e.user_id = v_uid and e.program_id = p.id),
    'certificate_code', (select code from certificates where user_id = v_uid and program_id = p.id and revoked_at is null));
end;
$$;

create or replace function public.list_programs()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'kind', p.kind, 'title', p.title, 'subtitle', p.subtitle, 'level', p.level,
    'category_id', p.category_id, 'estimated_hours', p.estimated_hours, 'certificate_title', p.certificate_title,
    'is_published', p.is_published,
    'modules', (select count(*) from program_modules m where m.program_id = p.id),
    'completed_modules', (select count(*) from program_modules m where m.program_id = p.id and public.module_complete(auth.uid(), m.id)),
    'enrolled', exists (select 1 from program_enrollments e where e.program_id = p.id and e.user_id = auth.uid()),
    'certificate_code', (select code from certificates c where c.program_id = p.id and c.user_id = auth.uid() and c.revoked_at is null))
    order by p.kind, p.sort_order, p.title), '[]'::jsonb)
  from certification_programs p
  where p.is_published or public.is_admin();
$$;

create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'code', c.code, 'kind', c.kind, 'recipient_name', c.recipient_name, 'title', c.title, 'subtitle', c.subtitle,
    'details', c.details, 'issued_at', c.issued_at, 'revoked_at', c.revoked_at, 'revoked_reason', c.revoked_reason,
    'handle', case when pr.is_public then pr.handle end,
    'program', (select jsonb_build_object('title', p.title, 'level', p.level, 'estimated_hours', p.estimated_hours, 'description', p.subtitle)
                from certification_programs p where p.id = c.program_id),
    'competition', (select jsonb_build_object('name', co.name, 'ends_at', co.ends_at) from competitions co where co.id = c.competition_id))
  from certificates c join profiles pr on pr.id = c.user_id
  where c.code = upper(btrim(p_code));
$$;

create or replace function public.get_user_certificates(p_handle text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', c.code, 'kind', c.kind, 'title', c.title, 'subtitle', c.subtitle,
                                               'issued_at', c.issued_at) order by c.issued_at desc), '[]'::jsonb)
  from certificates c join profiles pr on pr.id = c.user_id
  where pr.handle = lower(p_handle) and c.revoked_at is null
    and (pr.is_public or pr.id = auth.uid() or public.is_admin());
$$;

create or replace function public.admin_revoke_certificate(p_code text, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  update certificates set revoked_at = now(), revoked_reason = coalesce(nullif(btrim(p_reason), ''), 'Revoked by administrator')
   where code = p_code;
  if not found then raise exception 'Certificate not found'; end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Lesson knowledge checks
-- ---------------------------------------------------------------------
create or replace function public.submit_lesson_check(p_lesson uuid, p_responses jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  l        lessons%rowtype;
  v_last   timestamptz;
  v_wait   int := public.setting_num('lesson_retry_seconds', 60)::int;
  v_pass   numeric := public.setting_num('lesson_pass_pct', 75);
  v_grade  jsonb;
  v_score  numeric;
  v_passed boolean;
  v_first  boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into l from lessons where id = p_lesson and is_published;
  if not found then raise exception 'Lesson not found'; end if;
  if jsonb_array_length(l.check_questions) = 0 then raise exception 'This lesson has no knowledge check yet'; end if;

  select max(created_at) into v_last from lesson_attempts where user_id = v_uid and lesson_id = p_lesson;
  if v_last is not null and v_last > now() - make_interval(secs => v_wait) then
    raise exception 'Please review the lesson and try again in % seconds', ceil(extract(epoch from (v_last + make_interval(secs => v_wait) - now())));
  end if;

  v_grade := public.grade_questions(l.check_questions,
                                    (select answers from lesson_check_keys where lesson_id = p_lesson), p_responses);
  v_score := (v_grade->>'total')::numeric;
  v_passed := v_score >= v_pass;
  insert into lesson_attempts(user_id, lesson_id, score, passed) values (v_uid, p_lesson, v_score, v_passed);

  v_first := false;
  if v_passed then
    insert into lesson_progress(user_id, lesson_id) values (v_uid, p_lesson) on conflict do nothing;
    v_first := found;
    perform public.evaluate_achievements(v_uid);
    perform public.evaluate_programs(v_uid);
  end if;
  -- Feedback says right/wrong per question but never reveals the answer.
  return jsonb_build_object('score', v_score, 'passed', v_passed, 'pass_pct', v_pass, 'first_completion', v_first,
    'questions', (select jsonb_agg(jsonb_build_object('key', q->>'key', 'correct', (q->>'score')::numeric >= (q->>'max')::numeric))
                  from jsonb_array_elements(v_grade->'criteria') q),
    'retry_after_seconds', case when v_passed then null else v_wait end);
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Challenge lifecycle with anti-gaming rules
-- ---------------------------------------------------------------------
create or replace function public.start_challenge(p_challenge uuid, p_competition uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  c           challenges%rowtype;
  comp        competitions%rowtype;
  v_attempt   uuid;
  v_deadline  timestamptz;
  v_pitch     uuid;
  v_research  uuid;
  v_used      int;
  v_last      timestamptz;
  v_cool      int := public.setting_num('retry_cooldown_minutes', 10)::int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into c from challenges where id = p_challenge;
  if not found or (not c.is_published and not public.is_admin()) then
    raise exception 'Challenge not available';
  end if;

  if p_competition is not null then
    select * into comp from competitions where id = p_competition and is_published;
    if not found then raise exception 'Competition not found'; end if;
    if now() < comp.starts_at or now() > comp.ends_at then raise exception 'Competition is not active'; end if;
    if not exists (select 1 from competition_participants where competition_id = p_competition and user_id = v_uid) then
      raise exception 'You are not registered for this competition';
    end if;
    if not exists (select 1 from competition_challenges where competition_id = p_competition and challenge_id = p_challenge) then
      raise exception 'Challenge is not part of this competition';
    end if;
  end if;

  select id into v_attempt from challenge_attempts
   where user_id = v_uid and challenge_id = p_challenge and status = 'in_progress'
     and competition_id is not distinct from p_competition;
  if v_attempt is not null then return v_attempt; end if;

  -- Certification exams: enrolled + every earlier module complete.
  if exists (select 1 from program_modules where challenge_id = p_challenge and kind = 'exam') then
    if not exists (
      select 1 from program_modules ex
      join program_enrollments e on e.program_id = ex.program_id and e.user_id = v_uid
      where ex.challenge_id = p_challenge and ex.kind = 'exam'
        and not exists (select 1 from program_modules m where m.program_id = ex.program_id
                        and m.position < ex.position and not public.module_complete(v_uid, m.id))) then
      raise exception 'Final exam locked: enroll in the certification and complete every earlier module first';
    end if;
  end if;

  if c.max_attempts is not null then
    select count(*) into v_used from challenge_attempts
     where user_id = v_uid and challenge_id = p_challenge and status = 'submitted';
    if v_used >= c.max_attempts then
      raise exception 'Maximum attempts (%) reached for this challenge', c.max_attempts;
    end if;
  end if;

  select max(submitted_at) into v_last from challenge_attempts
   where user_id = v_uid and challenge_id = p_challenge and status = 'submitted';
  if v_last is not null and v_last > now() - make_interval(mins => v_cool) then
    raise exception 'Cooldown: you can start another attempt in % minute(s). Use the time to review your feedback.',
      ceil(extract(epoch from (v_last + make_interval(mins => v_cool) - now())) / 60);
  end if;

  if c.time_limit_minutes is not null then
    v_deadline := now() + make_interval(mins => c.time_limit_minutes);
  elsif c.duration_days is not null then
    v_deadline := now() + make_interval(days => c.duration_days);
  end if;
  if p_competition is not null and (v_deadline is null or v_deadline > comp.ends_at) then
    v_deadline := comp.ends_at;
  end if;

  if c.kind = 'stock_pitch' then
    insert into stock_pitches(user_id, challenge_id, format, company, ticker, exchange, currency, current_price, deadline_at)
    values (v_uid, c.id, c.pitch_format,
            coalesce(c.content->>'company', ''), coalesce(c.content->>'ticker', ''),
            c.content->>'exchange', coalesce(c.content->>'currency', 'PHP'),
            nullif(c.content->>'current_price', '')::numeric,
            case when c.pitch_format = 'professional' then coalesce(v_deadline, now() + interval '7 days') end)
    returning id into v_pitch;
  elsif c.kind = 'research_report' then
    insert into research_projects(user_id, challenge_id, title, company, ticker, exchange, currency, current_price)
    values (v_uid, c.id, c.title, coalesce(c.content->>'company', ''), coalesce(c.content->>'ticker', ''),
            c.content->>'exchange', coalesce(c.content->>'currency', 'PHP'),
            nullif(c.content->>'current_price', '')::numeric)
    returning id into v_research;
  end if;

  insert into challenge_attempts(user_id, challenge_id, competition_id, deadline_at, stock_pitch_id, research_project_id)
  values (v_uid, c.id, p_competition, v_deadline, v_pitch, v_research)
  returning id into v_attempt;
  return v_attempt;
end;
$$;

create or replace function public.submit_challenge(p_attempt uuid, p_responses jsonb default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  a         challenge_attempts%rowtype;
  c         challenges%rowtype;
  p         stock_pitches%rowtype;
  v_grade   jsonb;
  v_sub     uuid;
  v_score   uuid;
  v_new     text[] := '{}';
  v_grace   interval := make_interval(mins => public.setting_num('submission_grace_minutes', 5)::int);
  v_status  text;
  v_num     int;
  v_factor  numeric;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into a from challenge_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'This attempt has already been submitted'; end if;
  if a.deadline_at is not null and now() > a.deadline_at + v_grace then
    raise exception 'The deadline for this attempt has passed';
  end if;
  perform public.assert_daily_submission_cap(v_uid);
  select * into c from challenges where id = a.challenge_id;

  if c.kind = 'tasks' then
    if p_responses is not null then a.responses := p_responses; end if;
    v_grade := public.grade_task_responses(c.id, a.responses);
  elsif c.kind = 'stock_pitch' then
    select * into p from stock_pitches where id = a.stock_pitch_id for update;
    perform public.assert_pitch_complete(p);
    perform public.assert_not_duplicate_pitch(p);
    v_grade := public.score_stock_pitch(p.id);
    update stock_pitches
       set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
           criteria_scores = v_grade->'criteria', scored_at = now()
     where id = p.id;
    a.responses := jsonb_build_object('stock_pitch_id', p.id);
  else
    perform public.assert_research_complete(a.research_project_id);
    v_grade := public.score_research_project(a.research_project_id);
    update research_projects
       set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
           criteria_scores = v_grade->'criteria', scored_at = now()
     where id = a.research_project_id;
    a.responses := jsonb_build_object('research_project_id', a.research_project_id);
  end if;

  update challenge_attempts set status = 'submitted', submitted_at = now(), responses = a.responses where id = a.id;

  select count(*) + 1 into v_num from challenge_submissions where user_id = v_uid and challenge_id = c.id;
  v_factor := greatest(public.setting_num('retry_penalty_floor', 0.7), 1 - public.setting_num('retry_penalty_step', 0.1) * (v_num - 1));

  insert into challenge_submissions(attempt_id, user_id, challenge_id, competition_id, responses, attempt_number)
  values (a.id, v_uid, c.id, a.competition_id, a.responses, v_num)
  returning id into v_sub;

  insert into challenge_scores(submission_id, user_id, scorer_type, total_score, criteria_scores, feedback)
  values (v_sub, v_uid, 'auto', (v_grade->>'total')::numeric, v_grade->'criteria',
          case when c.scoring_method = 'manual' then 'Provisional automated score — awaiting reviewer.'
               else 'Automated deterministic scoring (beta).' end)
  returning id into v_score;

  if c.scoring_method = 'manual' then
    v_status := 'pending_review';
    perform public.notify(v_uid, 'score', 'Submitted for review: ' || c.title,
      'A reviewer will score your submission.', '/challenges/' || c.id || '?submission=' || v_sub);
  else
    v_status := 'scored';
    v_new := public.finalize_submission_score(v_score);
  end if;

  return jsonb_build_object(
    'submission_id', v_sub, 'status', v_status,
    'score', case when v_status = 'scored' then (v_grade->>'total')::numeric end,
    'passed', case when v_status = 'scored' then (v_grade->>'total')::numeric >= c.passing_score end,
    'criteria', case when v_status = 'scored' then v_grade->'criteria' end,
    'attempt_number', v_num, 'skill_weight_factor', v_factor,
    'new_achievements', to_jsonb(v_new));
end;
$$;

create or replace function public.submit_stock_pitch(p_pitch uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  p         stock_pitches%rowtype;
  v_attempt uuid;
  v_grade   jsonb;
  v_weight  numeric;
  v_new     text[];
begin
  select * into p from stock_pitches where id = p_pitch and user_id = v_uid for update;
  if not found then raise exception 'Pitch not found'; end if;
  if p.status <> 'draft' then raise exception 'Pitch already submitted'; end if;

  if p.challenge_id is not null then
    select id into v_attempt from challenge_attempts where stock_pitch_id = p.id and status = 'in_progress';
    if v_attempt is null then raise exception 'Challenge attempt for this pitch is closed'; end if;
    return public.submit_challenge(v_attempt, null);
  end if;

  if p.deadline_at is not null and now() > p.deadline_at + make_interval(mins => public.setting_num('submission_grace_minutes', 5)::int) then
    raise exception 'The deadline for this pitch has passed';
  end if;
  perform public.assert_daily_submission_cap(v_uid);
  perform public.assert_pitch_complete(p);
  perform public.assert_not_duplicate_pitch(p);
  v_grade := public.score_stock_pitch(p.id);
  update stock_pitches
     set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
         criteria_scores = v_grade->'criteria', scored_at = now()
   where id = p.id;

  select coalesce((config->>('evidence_weight_' || p.format))::numeric, 0.5) into v_weight
  from scoring_rubrics where id = 'stock_pitch_v1';
  perform public.record_rubric_evidence(v_uid, 'stock_pitch', p.id, v_grade->'criteria', v_weight);
  perform public.notify(v_uid, 'score', 'Pitch scored: ' || p.ticker,
    format('Your %s pitch scored %s / 100.', p.format, v_grade->>'total'), '/pitches/' || p.id);
  v_new := public.process_user_progress(v_uid);

  return jsonb_build_object('status', 'scored', 'score', (v_grade->>'total')::numeric,
    'criteria', v_grade->'criteria', 'upside_pct', v_grade->'upside_pct', 'new_achievements', to_jsonb(v_new));
end;
$$;

create or replace function public.submit_research_project(p_project uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  rp        research_projects%rowtype;
  v_attempt uuid;
  v_grade   jsonb;
  v_new     text[];
begin
  select * into rp from research_projects where id = p_project and user_id = v_uid for update;
  if not found then raise exception 'Research project not found'; end if;
  if rp.status <> 'draft' then raise exception 'Report already submitted'; end if;

  if rp.challenge_id is not null then
    select id into v_attempt from challenge_attempts where research_project_id = rp.id and status = 'in_progress';
    if v_attempt is null then raise exception 'Challenge attempt for this report is closed'; end if;
    return public.submit_challenge(v_attempt, null);
  end if;

  perform public.assert_daily_submission_cap(v_uid);
  perform public.assert_research_complete(rp.id);
  v_grade := public.score_research_project(rp.id);
  update research_projects
     set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
         criteria_scores = v_grade->'criteria', scored_at = now()
   where id = rp.id;
  perform public.record_rubric_evidence(v_uid, 'research_report', rp.id, v_grade->'criteria',
    coalesce((select (config->>'evidence_weight')::numeric from scoring_rubrics where id = 'research_report_v1'), 0.75));
  perform public.notify(v_uid, 'score', 'Report scored: ' || rp.title,
    format('Your research report scored %s / 100.', v_grade->>'total'), '/research/' || rp.id);
  v_new := public.process_user_progress(v_uid);
  return jsonb_build_object('status', 'scored', 'score', (v_grade->>'total')::numeric,
    'criteria', v_grade->'criteria', 'new_achievements', to_jsonb(v_new));
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Competition finalization now issues certificates
-- ---------------------------------------------------------------------
create or replace function public.admin_finalize_competition(p_competition uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  c    competitions%rowtype;
  r    record;
  v_n  int;
  v_ls numeric;
  v_place text;
begin
  perform public.assert_admin();
  select * into c from competitions where id = p_competition for update;
  if not found then raise exception 'Competition not found'; end if;
  if now() < c.ends_at then raise exception 'Competition has not ended yet'; end if;

  delete from competition_results where competition_id = c.id;
  insert into competition_results(competition_id, user_id, rank, score, details)
  select c.id, s.user_id, s.rank, s.score, jsonb_build_object('challenges_completed', s.challenges_completed)
  from public.get_competition_standings(c.id) s
  where s.challenges_completed > 0;
  get diagnostics v_n = row_count;
  update competitions set results_finalized_at = now() where id = c.id;

  for r in select * from competition_results where competition_id = c.id loop
    v_ls := round(100 - (r.rank - 1) * (60.0 / greatest(v_n - 1, 1)), 2);
    delete from skill_evidence where user_id = r.user_id and source_type = 'competition' and source_id = c.id;
    insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight)
    values (r.user_id, 'leadership', 'competition', c.id, greatest(0, v_ls), 1);

    v_place := case r.rank when 1 then 'Champion' when 2 then '2nd Place' when 3 then '3rd Place' else 'Finisher' end;
    perform public.issue_certificate(r.user_id, 'competition', null, c.id, c.name,
      format('%s — ranked #%s of %s', v_place, r.rank, v_n),
      jsonb_build_object('rank', r.rank, 'participants', v_n, 'score', r.score, 'placement', v_place));

    perform public.notify(r.user_id, 'competition', 'Results: ' || c.name,
      format('You finished #%s of %s with %s points.', r.rank, v_n, r.score), '/competitions/' || c.id);
    perform public.process_user_progress(r.user_id);
  end loop;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Signup records terms consent
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_name    text;
  v_base    text;
  v_handle  text;
  v_capital numeric := public.setting_num('portfolio_starting_capital', 10000000);
begin
  v_name := coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1), 'Analyst');
  v_base := btrim(left(regexp_replace(lower(v_name), '[^a-z0-9]+', '_', 'g'), 20), '_');
  if char_length(v_base) < 3 then v_base := 'analyst'; end if;
  v_handle := v_base;
  while exists (select 1 from public.profiles where handle = v_handle) loop
    v_handle := v_base || '_' || substr(md5(random()::text), 1, 5);
  end loop;

  insert into public.profiles(id, handle, full_name, accepted_terms_at)
  values (new.id, v_handle, left(v_name, 120),
          case when (new.raw_user_meta_data->>'accepted_terms') = 'true' then now() end);
  insert into public.user_preferences(user_id) values (new.id);
  insert into public.user_stats(user_id, career_level_id)
    values (new.id, (select id from public.career_levels order by rank limit 1));
  insert into public.user_skills(user_id, skill_id) select new.id, s.id from public.skills s;
  insert into public.portfolios(user_id, starting_capital, cash) values (new.id, v_capital, v_capital);
  perform public.notify(new.id, 'system', 'Welcome to FINLAB',
    'You start as a Junior Analyst. Complete challenges to build your track record.', '/dashboard');
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Account deletion (self-service)
-- ---------------------------------------------------------------------
create or replace function public.delete_my_account(p_confirm text)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_confirm is distinct from 'DELETE' then raise exception 'Type DELETE to confirm'; end if;
  if exists (select 1 from user_roles where user_id = v_uid and role = 'admin')
     and (select count(*) from user_roles where role = 'admin') <= 1 then
    raise exception 'You are the only administrator. Make someone else an admin first.';
  end if;
  -- Cascades to every table that references the profile.
  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Security for new objects
-- ---------------------------------------------------------------------
alter table public.lesson_check_keys enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.certification_programs enable row level security;
alter table public.program_modules enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.certificates enable row level security;
alter table public.feedback enable row level security;

revoke all on public.lesson_check_keys, public.lesson_attempts, public.certification_programs, public.program_modules,
              public.program_enrollments, public.certificates, public.feedback from anon, authenticated;

grant select, insert, update, delete on public.lesson_check_keys to authenticated;
create policy lesson_check_keys_admin on public.lesson_check_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.lesson_attempts to authenticated;
create policy lesson_attempts_read on public.lesson_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.certification_programs, public.program_modules to authenticated;
create policy programs_read on public.certification_programs for select to authenticated using (is_published or public.is_admin());
create policy programs_admin on public.certification_programs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy program_modules_read on public.program_modules for select to authenticated
  using (exists (select 1 from public.certification_programs p where p.id = program_id and (p.is_published or public.is_admin())));
create policy program_modules_admin on public.program_modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.program_enrollments to authenticated;
create policy enrollments_read on public.program_enrollments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select on public.certificates to authenticated;
create policy certificates_read on public.certificates for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

grant select, insert on public.feedback to authenticated;
grant update (status, admin_note, resolved_at) on public.feedback to authenticated;
create policy feedback_insert on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy feedback_read on public.feedback for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy feedback_admin_update on public.feedback for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Lesson completion is now earned only through submit_lesson_check.
revoke insert, delete on public.lesson_progress from authenticated;
drop policy if exists lesson_progress_own on public.lesson_progress;
create policy lesson_progress_read on public.lesson_progress for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- Completions recorded via the old "mark as complete" button were never verified.
delete from public.lesson_progress;

-- Functions: internal helpers stay private; RPCs are granted explicitly.
revoke execute on function
  public.grade_questions(jsonb, jsonb, jsonb), public.assert_daily_submission_cap(uuid),
  public.assert_not_duplicate_pitch(public.stock_pitches), public.gen_certificate_code(),
  public.issue_certificate(uuid, text, uuid, uuid, text, text, jsonb), public.module_complete(uuid, uuid),
  public.evaluate_programs(uuid)
from public, anon, authenticated;

grant execute on function
  public.enroll_program(uuid), public.get_program(text), public.list_programs(),
  public.submit_lesson_check(uuid, jsonb), public.delete_my_account(text),
  public.admin_revoke_certificate(text, text)
to authenticated;
grant execute on function public.verify_certificate(text), public.get_user_certificates(text) to authenticated, anon;

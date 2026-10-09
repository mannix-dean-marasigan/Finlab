-- =====================================================================
-- FINLAB 0019 — AI answer reports, tricks counter, prompt guard settings,
--               and the "analyst's answer" for cases you have finished.
-- Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Reports: a student flags a bad AI reply. Only then is any text kept:
--    that one reply and the question before it.
-- ---------------------------------------------------------------------
create table if not exists public.ai_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason      text not null check (reason in ('wrong','harmful','off_topic','gave_answer','other')),
  question    text not null default '' check (char_length(question) <= 1000),
  reply       text not null check (char_length(reply) between 1 and 6000),
  note        text not null default '' check (char_length(note) <= 500),
  model       text not null default '' check (char_length(model) <= 80),
  status      text not null default 'open' check (status in ('open','reviewed')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_ai_reports_created on public.ai_reports(created_at desc);
alter table public.ai_reports enable row level security;
-- No direct access: students report through ai_report(); admins read through admin_ai_reports().

create or replace function public.ai_report(p_reason text, p_question text, p_reply text, p_note text default '', p_model text default '')
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if (select count(*) from ai_reports where user_id = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You have sent many reports today. Thank you! Please try again tomorrow.';
  end if;
  insert into ai_reports(user_id, reason, question, reply, note, model)
  values (v_uid, p_reason, left(coalesce(p_question, ''), 1000), left(coalesce(p_reply, ''), 6000), left(coalesce(p_note, ''), 500), left(coalesce(p_model, ''), 80));
end;
$$;

create or replace function public.admin_ai_reports(p_limit int default 50)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'reason', r.reason, 'question', r.question, 'reply', r.reply, 'note', r.note, 'model', r.model,
      'status', r.status, 'created_at', r.created_at, 'handle', p.handle, 'name', p.full_name) order by r.created_at desc), '[]'::jsonb)
    from (select * from ai_reports order by created_at desc limit greatest(1, least(p_limit, 200))) r
    join profiles p on p.id = r.user_id);
end;
$$;

create or replace function public.admin_ai_report_set(p_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  if p_status not in ('open','reviewed') then raise exception 'Unknown status.'; end if;
  update ai_reports set status = p_status where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Tricks counter: how often each user hit the trick filter. Counts only.
-- ---------------------------------------------------------------------
alter table public.ai_usage add column if not exists guarded int not null default 0 check (guarded >= 0);

create or replace function public.ai_note_guarded()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  insert into ai_usage(user_id, day, count, guarded) values (v_uid, public.ai_today(), 0, 1)
  on conflict (user_id, day) do update set guarded = ai_usage.guarded + 1;
end;
$$;

-- Last 7 days per user: messages and tricks blocked. Busiest first.
create or replace function public.admin_ai_usage()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only.' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'today', (select coalesce(sum(count), 0) from ai_usage where day = public.ai_today()),
      'users', coalesce(jsonb_agg(jsonb_build_object('handle', p.handle, 'name', p.full_name, 'messages', u.messages, 'guarded', u.guarded)
                 order by u.guarded desc, u.messages desc), '[]'::jsonb))
    from (
      select user_id, sum(count)::int as messages, sum(guarded)::int as guarded
      from ai_usage where day > public.ai_today() - 7
      group by user_id
      order by sum(guarded) desc, sum(count) desc
      limit 30
    ) u
    join profiles p on p.id = u.user_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Prompt guard (an AI check for rule-changing messages). Off until tested.
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
  ('ai_prompt_guard', '0', '1 = run the AI trick detector (Groq Prompt Guard) before answering; 0 = off.'),
  ('ai_prompt_guard_threshold', '0.9', 'Block a message when the trick detector is at least this sure (0.5 to 0.99).')
on conflict (key) do nothing;

-- ai_reserve also tells the server function whether the prompt guard is on.
create or replace function public.ai_reserve()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_day    date := public.ai_today();
  v_limit  int  := greatest(0, public.setting_num('ai_helper_daily_limit', 15)::int);
  v_cap    int  := greatest(0, public.setting_num('ai_helper_global_daily_cap', 300)::int);
  v_used   int;
  v_global int;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if public.setting_num('ai_helper_enabled', 0) < 1 then
    raise exception 'AI_OFF: The AI helper is switched off right now.' using errcode = 'P0001';
  end if;
  insert into ai_usage(user_id, day, count) values (v_uid, v_day, 0) on conflict do nothing;
  select count into v_used from ai_usage where user_id = v_uid and day = v_day for update;
  if v_used >= v_limit then
    raise exception 'AI_USER_LIMIT: You have used today''s % AI messages. They reset at midnight (Manila time).', v_limit using errcode = 'P0001';
  end if;
  select coalesce(sum(count), 0) into v_global from ai_usage where day = v_day;
  if v_global >= v_cap then
    raise exception 'AI_GLOBAL_CAP: The AI helper is at its daily limit for everyone. Please try again tomorrow.' using errcode = 'P0001';
  end if;
  update ai_usage set count = count + 1 where user_id = v_uid and day = v_day;
  return jsonb_build_object(
    'remaining', v_limit - v_used - 1,
    'limit', v_limit,
    'guard', public.setting_num('ai_prompt_guard', 0) >= 1,
    'guard_threshold', least(0.99, greatest(0.5, public.setting_num('ai_prompt_guard_threshold', 0.9))));
end;
$$;

-- ---------------------------------------------------------------------
-- 4. The analyst's answer for a case: shown after you pass it or use every attempt.
--    Never for final exams or competition cases, so those stay fair.
-- ---------------------------------------------------------------------
create or replace function public.challenge_model_answer(p_challenge uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  c       challenges;
  k       jsonb;
  t       jsonb;
  ans     jsonb;
  v_items jsonb := '[]'::jsonb;
  v_done  int;
  v_ok    boolean;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into c from challenges where id = p_challenge and is_published;
  if not found then raise exception 'Case not found.'; end if;
  if c.kind <> 'tasks' then raise exception 'This case is reviewed by a person, so there is no single answer to show.'; end if;
  if exists (select 1 from program_modules where challenge_id = p_challenge and kind = 'exam') then
    raise exception 'Final exam answers stay private so the exam stays fair.';
  end if;
  if exists (select 1 from competition_challenges where challenge_id = p_challenge) then
    raise exception 'Competition answers stay private so the competition stays fair.';
  end if;

  select count(*) into v_done from challenge_submissions where user_id = v_uid and challenge_id = p_challenge and status = 'scored';
  select exists (select 1 from challenge_submissions
                 where user_id = v_uid and challenge_id = p_challenge and status = 'scored' and final_score >= c.passing_score)
    into v_ok;
  if not v_ok and not (c.max_attempts is not null and v_done >= c.max_attempts) then
    raise exception 'Pass this case first (or use all your attempts) to see the analyst''s answer.';
  end if;

  select answers into k from challenge_answer_keys where challenge_id = p_challenge;
  k := coalesce(k, '{}'::jsonb);
  for t in select * from jsonb_array_elements(coalesce(c.content->'tasks', '[]'::jsonb)) loop
    ans := coalesce(k->(t->>'id'), '{}'::jsonb);
    v_items := v_items || jsonb_build_object(
      'id', t->>'id',
      'label', coalesce(t->>'label', ''),
      'type', coalesce(t->>'type', 'text'),
      'answer', case
        when t->>'type' = 'numeric' then ans->'answer'
        when t->>'type' = 'mcq' then (select o->'label' from jsonb_array_elements(coalesce(t->'options', '[]'::jsonb)) o where o->>'id' = ans->>'answer' limit 1)
        else null end,
      'tolerance_pct', case when t->>'type' = 'numeric' then coalesce(ans->'tolerance_pct', '1'::jsonb) end,
      -- Option texts, so the student's own choice can be shown as words too.
      'options', case when t->>'type' = 'mcq' then t->'options' end,
      -- For written answers: the first word of each key idea, which a strong answer covers.
      'key_ideas', case when jsonb_typeof(ans->'keywords') = 'array'
        then (select coalesce(jsonb_agg(initcap(btrim(split_part(kw, '|', 1)))), '[]'::jsonb) from jsonb_array_elements_text(ans->'keywords') kw) end,
      'ideas_needed', ans->'keywords_required');
  end loop;
  return jsonb_build_object('passed', v_ok, 'tasks', v_items);
end;
$$;

-- ---------------------------------------------------------------------
-- Permissions: revoke the new functions from everyone, then grant only what is needed.
-- ---------------------------------------------------------------------
revoke execute on function public.ai_report(text, text, text, text, text), public.admin_ai_reports(int), public.admin_ai_report_set(uuid, text),
  public.ai_note_guarded(), public.admin_ai_usage(), public.ai_reserve(), public.challenge_model_answer(uuid)
  from public, anon;
grant execute on function public.ai_report(text, text, text, text, text), public.admin_ai_reports(int), public.admin_ai_report_set(uuid, text),
  public.ai_note_guarded(), public.admin_ai_usage(), public.ai_reserve(), public.challenge_model_answer(uuid)
  to authenticated;

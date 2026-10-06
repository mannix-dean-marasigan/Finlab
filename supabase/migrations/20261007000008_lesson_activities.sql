-- =====================================================================
-- FINLAB — 0008 Interactive lesson practice
--   calculator      : live exploration widget (ungraded)
--   spot_error      : find the planted mistakes in a statement/model
--   matching        : drag items into the right categories
--   branching       : choose-your-path case; each choice has consequences
--   worked_example  : step-by-step problem; each step unlocks the next;
--                     hints cost points
-- Answer keys live in an admin-only table; grading is server-side.
-- The lesson knowledge check unlocks only after every graded activity
-- has been attempted (and the video watched).
-- =====================================================================

insert into public.app_settings (key, value, description) values
 ('activity_retry_seconds', '10', 'Seconds between attempts on the same practice activity.')
on conflict (key) do nothing;

create table public.lesson_activities (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  slug          text not null check (slug ~ '^[a-z0-9-]{3,80}$'),
  position      int not null default 0,
  kind          text not null check (kind in ('calculator','spot_error','matching','branching','worked_example')),
  title         text not null,
  instructions  text not null default '',
  content       jsonb not null default '{}'::jsonb,
  is_required   boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (lesson_id, slug)
);
create index idx_lesson_activities_lesson on public.lesson_activities(lesson_id, position);
create trigger trg_lesson_activities_updated before update on public.lesson_activities
  for each row execute function public.set_updated_at();

create table public.lesson_activity_keys (
  activity_id  uuid primary key references public.lesson_activities(id) on delete cascade,
  key          jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

create table public.activity_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  activity_id  uuid not null references public.lesson_activities(id) on delete cascade,
  score        numeric(5,2) not null check (score between 0 and 100),
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index idx_activity_attempts_user on public.activity_attempts(user_id, activity_id, created_at desc);

-- In-progress state for worked examples (steps solved, hints used, wrong tries).
create table public.activity_progress (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  activity_id  uuid not null references public.lesson_activities(id) on delete cascade,
  state        jsonb not null default '{"solved":[],"hints":[],"wrong":0}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (user_id, activity_id)
);

-- ---------------------------------------------------------------------
-- Grading
-- ---------------------------------------------------------------------
create or replace function public.numeric_matches(p_value text, p_key jsonb)
returns boolean
language plpgsql immutable
as $$
declare
  v_num numeric;
  v_ans numeric := (p_key->>'answer')::numeric;
  v_tol numeric;
begin
  begin
    v_num := nullif(regexp_replace(coalesce(p_value, ''), '[^0-9.\-]', '', 'g'), '')::numeric;
  exception when others then
    return false;
  end;
  if v_num is null then return false; end if;
  v_tol := greatest(abs(v_ans) * coalesce((p_key->>'tolerance_pct')::numeric, 1) / 100,
                    coalesce((p_key->>'tolerance_abs')::numeric, 0.0001));
  return abs(v_num - v_ans) <= v_tol;
end;
$$;

create or replace function public.submit_activity(p_activity uuid, p_response jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  a       lesson_activities%rowtype;
  k       jsonb;
  v_score numeric := 0;
  v_out   jsonb := '{}'::jsonb;
  v_sel   text[];
  v_err   text[];
  v_hit   int;
  v_bad   int;
  v_total int;
  v_ok    int := 0;
  it      jsonb;
  v_node  text;
  v_step  jsonb;
  v_pts   numeric := 0;
  v_max   numeric;
  v_debrief jsonb := '[]'::jsonb;
  v_choice jsonb;
  v_n     int := 0;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into a from lesson_activities where id = p_activity;
  if not found or not exists (select 1 from lessons where id = a.lesson_id and is_published) then
    raise exception 'Activity not found';
  end if;
  if a.kind not in ('spot_error','matching','branching') then
    raise exception 'This activity is not submitted this way';
  end if;
  if exists (select 1 from activity_attempts where user_id = v_uid and activity_id = a.id
             and created_at > now() - make_interval(secs => public.setting_num('activity_retry_seconds', 10)::int)) then
    raise exception 'Slow down — review the feedback and try again in a few seconds';
  end if;
  select key into k from lesson_activity_keys where activity_id = a.id;
  k := coalesce(k, '{}'::jsonb);

  if a.kind = 'spot_error' then
    select coalesce(array_agg(x), '{}') into v_sel from jsonb_array_elements_text(coalesce(p_response->'selected', '[]')) x;
    select coalesce(array_agg(x), '{}') into v_err from jsonb_array_elements_text(coalesce(k->'errors', '[]')) x;
    v_hit := cardinality(array(select unnest(v_sel) intersect select unnest(v_err)));
    v_bad := cardinality(array(select unnest(v_sel) except select unnest(v_err)));
    v_score := greatest(0, (v_hit - v_bad)::numeric) / greatest(cardinality(v_err), 1) * 100;
    v_out := jsonb_build_object('found', v_hit, 'total_errors', cardinality(v_err), 'false_flags', v_bad,
                                'errors', to_jsonb(v_err), 'explanations', coalesce(k->'explanations', '{}'::jsonb));

  elsif a.kind = 'matching' then
    v_total := 0;
    v_out := '{}'::jsonb;
    for it in select * from jsonb_array_elements(coalesce(a.content->'items', '[]')) loop
      v_total := v_total + 1;
      if (p_response->'placements'->>(it->>'id')) = (k->>(it->>'id')) then
        v_ok := v_ok + 1;
        v_out := v_out || jsonb_build_object(it->>'id', true);
      else
        v_out := v_out || jsonb_build_object(it->>'id', false);
      end if;
    end loop;
    v_score := v_ok::numeric / greatest(v_total, 1) * 100;
    v_out := jsonb_build_object('correct', v_ok, 'total', v_total, 'results', v_out);

  else -- branching: validate the path against the tree, sum hidden points
    v_node := a.content->>'start';
    v_max := coalesce((k->>'max')::numeric, 1);
    for v_step in select * from jsonb_array_elements(coalesce(p_response->'path', '[]')) loop
      v_n := v_n + 1;
      if v_n > 20 then raise exception 'Path too long'; end if;
      if v_step->>'node' is distinct from v_node then raise exception 'Invalid path'; end if;
      v_choice := null;
      select c into v_choice from jsonb_array_elements(a.content->'nodes'->v_node->'choices') c where c->>'id' = v_step->>'choice';
      if v_choice is null then raise exception 'Invalid choice'; end if;
      v_pts := v_pts + coalesce((k->'points'->>(v_node || '.' || (v_step->>'choice')))::numeric, 0);
      v_debrief := v_debrief || jsonb_build_object('node', v_node, 'choice', v_step->>'choice',
        'points', coalesce((k->'points'->>(v_node || '.' || (v_step->>'choice')))::numeric, 0),
        'feedback', k->'feedback'->>(v_node || '.' || (v_step->>'choice')));
      v_node := v_choice->>'next';
      exit when v_node is null;
    end loop;
    if v_node is not null and coalesce((a.content->'nodes'->v_node->>'end')::boolean, false) is false then
      raise exception 'Finish the scenario before submitting';
    end if;
    v_score := least(100, greatest(0, v_pts / v_max * 100));
    v_out := jsonb_build_object('points', v_pts, 'max', v_max, 'debrief', v_debrief, 'ending', v_node);
  end if;

  v_score := round(v_score, 2);
  insert into activity_attempts(user_id, activity_id, score, details) values (v_uid, a.id, v_score, v_out);
  return v_out || jsonb_build_object('score', v_score);
end;
$$;

-- Worked examples: check one step at a time; steps unlock in order.
create or replace function public.worked_check(p_activity uuid, p_step text, p_answer text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  a       lesson_activities%rowtype;
  k       jsonb;
  st      jsonb;
  v_steps text[];
  v_idx   int;
  v_ok    boolean;
  v_score numeric;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into a from lesson_activities where id = p_activity and kind = 'worked_example';
  if not found or not exists (select 1 from lessons where id = a.lesson_id and is_published) then
    raise exception 'Activity not found';
  end if;
  select key into k from lesson_activity_keys where activity_id = a.id;
  select array_agg(s->>'id' order by ord) into v_steps
    from jsonb_array_elements(a.content->'steps') with ordinality as t(s, ord);
  v_idx := array_position(v_steps, p_step);
  if v_idx is null then raise exception 'Unknown step'; end if;

  insert into activity_progress(user_id, activity_id) values (v_uid, a.id) on conflict do nothing;
  select state into st from activity_progress where user_id = v_uid and activity_id = a.id for update;
  if st->'solved' ? p_step then
    return jsonb_build_object('correct', true, 'already', true, 'explanation', k->p_step->>'explanation');
  end if;
  if v_idx > 1 and not (st->'solved' ? v_steps[v_idx - 1]) then
    raise exception 'Solve the previous step first';
  end if;

  v_ok := public.numeric_matches(p_answer, k->p_step);
  if v_ok then
    st := jsonb_set(st, '{solved}', (st->'solved') || to_jsonb(p_step));
  else
    st := jsonb_set(st, '{wrong}', to_jsonb(coalesce((st->>'wrong')::int, 0) + 1));
  end if;
  update activity_progress set state = st, updated_at = now() where user_id = v_uid and activity_id = a.id;

  if v_ok and jsonb_array_length(st->'solved') = cardinality(v_steps) then
    v_score := greatest(40, 100 - 10 * jsonb_array_length(st->'hints') - 3 * coalesce((st->>'wrong')::int, 0));
    insert into activity_attempts(user_id, activity_id, score, details)
    values (v_uid, a.id, v_score, jsonb_build_object('hints', st->'hints', 'wrong', st->'wrong'));
    -- Reset so the example can be replayed for practice.
    update activity_progress set state = '{"solved":[],"hints":[],"wrong":0}'::jsonb where user_id = v_uid and activity_id = a.id;
    return jsonb_build_object('correct', true, 'explanation', k->p_step->>'explanation', 'completed', true, 'score', v_score);
  end if;
  return jsonb_build_object('correct', v_ok, 'explanation', case when v_ok then k->p_step->>'explanation' end, 'completed', false);
end;
$$;

create or replace function public.worked_hint(p_activity uuid, p_step text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  st    jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from lesson_activities where id = p_activity and kind = 'worked_example') then
    raise exception 'Activity not found';
  end if;
  insert into activity_progress(user_id, activity_id) values (v_uid, p_activity) on conflict do nothing;
  select state into st from activity_progress where user_id = v_uid and activity_id = p_activity for update;
  if not (st->'hints' ? p_step) then
    update activity_progress set state = jsonb_set(st, '{hints}', (st->'hints') || to_jsonb(p_step)), updated_at = now()
     where user_id = v_uid and activity_id = p_activity;
  end if;
  return (select key->p_step->>'hint' from lesson_activity_keys where activity_id = p_activity);
end;
$$;

-- Reveal explanations for steps already solved (to restore the UI on reload).
create or replace function public.worked_state(p_activity uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'state', coalesce(p.state, '{"solved":[],"hints":[],"wrong":0}'::jsonb),
    'explanations', (select coalesce(jsonb_object_agg(s, k.key->s->>'explanation'), '{}'::jsonb)
                     from jsonb_array_elements_text(coalesce(p.state->'solved', '[]')) s),
    'hints', (select coalesce(jsonb_object_agg(s, k.key->s->>'hint'), '{}'::jsonb)
              from jsonb_array_elements_text(coalesce(p.state->'hints', '[]')) s))
  from lesson_activities a
  left join activity_progress p on p.activity_id = a.id and p.user_id = auth.uid()
  left join lesson_activity_keys k on k.activity_id = a.id
  where a.id = p_activity;
$$;

-- ---------------------------------------------------------------------
-- Quiz gate: video watched AND every required graded activity attempted.
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
  v_pass   numeric := public.setting_num('lesson_pass_pct', 80);
  v_grade  jsonb;
  v_score  numeric;
  v_passed boolean;
  v_first  boolean;
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
  return jsonb_build_object('score', v_score, 'passed', v_passed, 'pass_pct', v_pass, 'first_completion', v_first,
    'questions', (select jsonb_agg(jsonb_build_object('key', q->>'key', 'correct', (q->>'score')::numeric >= (q->>'max')::numeric))
                  from jsonb_array_elements(v_grade->'criteria') q),
    'retry_after_seconds', case when v_passed then null else v_wait end);
end;
$$;

-- ---------------------------------------------------------------------
-- Security
-- ---------------------------------------------------------------------
alter table public.lesson_activities enable row level security;
alter table public.lesson_activity_keys enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.activity_progress enable row level security;
revoke all on public.lesson_activities, public.lesson_activity_keys, public.activity_attempts, public.activity_progress from anon, authenticated;

grant select, insert, update, delete on public.lesson_activities, public.lesson_activity_keys to authenticated;
create policy lesson_activities_read on public.lesson_activities for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and (l.is_published or public.is_admin())));
create policy lesson_activities_admin on public.lesson_activities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy lesson_activity_keys_admin on public.lesson_activity_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.activity_attempts, public.activity_progress to authenticated;
create policy activity_attempts_read on public.activity_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy activity_progress_read on public.activity_progress for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke execute on function public.numeric_matches(text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_activity(uuid, jsonb), public.worked_check(uuid, text, text),
                          public.worked_hint(uuid, text), public.worked_state(uuid) to authenticated;

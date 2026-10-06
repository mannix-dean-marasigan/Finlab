-- =====================================================================
-- FINLAB — 0007 One video per lesson; knowledge check unlocks only after
-- the learner finishes (or marks as watched) the lesson video.
-- =====================================================================

-- One video per lesson.
alter table public.lessons drop constraint if exists lessons_video_urls_check;
update public.lessons set video_urls = video_urls[1:1] where cardinality(video_urls) > 1;
alter table public.lessons add constraint lessons_video_urls_check
  check (cardinality(video_urls) <= 1 and public.all_youtube_urls(video_urls));

-- 10-question checks: 8 of 10 to pass.
update public.app_settings
   set value = '80', description = 'Score needed on a lesson knowledge check for the lesson to count as completed (80 = 8 of 10).'
 where key = 'lesson_pass_pct';

create table public.lesson_video_views (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  method      text not null check (method in ('ended','manual')),
  watched_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.lesson_video_views enable row level security;
revoke all on public.lesson_video_views from anon, authenticated;
grant select on public.lesson_video_views to authenticated;
create policy lesson_video_views_read on public.lesson_video_views for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create or replace function public.mark_lesson_video_watched(p_lesson uuid, p_method text default 'manual')
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from lessons where id = p_lesson and is_published) then raise exception 'Lesson not found'; end if;
  insert into lesson_video_views(user_id, lesson_id, method)
  values (auth.uid(), p_lesson, case when p_method = 'ended' then 'ended' else 'manual' end)
  on conflict (user_id, lesson_id) do update
    set method = case when excluded.method = 'ended' then 'ended' else lesson_video_views.method end;
end;
$$;

-- Same as 0005, plus: lessons with a video require it to be watched first.
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

grant execute on function public.mark_lesson_video_watched(uuid, text) to authenticated;

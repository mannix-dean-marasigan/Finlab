-- =====================================================================
-- FINLAB 0015 — Tutorial: "Tutorial Complete" badge
-- New users get an in-app walkthrough of every section, then a short first
-- mission (open a lesson, try a practice activity, check the leaderboard).
-- Finishing it awards the badge through complete_tutorial(), which checks
-- that a practice activity was really attempted.
-- Safe to re-run.
-- =====================================================================

-- Criteria type 'manual' is never met by evaluate_achievements, so this
-- badge is only granted by complete_tutorial() below.
insert into public.achievements (id, name, description, icon, tier, criteria, sort_order) values
  ('tutorial_complete', 'Tutorial Complete', 'Toured every part of FINLAB PH and finished the first mission.', 'flag', 'bronze', '{"type":"manual"}', 1)
on conflict (id) do nothing;

create or replace function public.complete_tutorial()
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new boolean;
begin
  if v_uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if not exists (select 1 from activity_attempts where user_id = v_uid) then
    raise exception 'Try one practice activity in a lesson to finish the first mission.' using errcode = 'P0001';
  end if;
  insert into user_achievements (user_id, achievement_id)
  values (v_uid, 'tutorial_complete')
  on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new then
    perform public.notify(v_uid, 'achievement', 'Achievement unlocked: Tutorial Complete',
      'Toured every part of FINLAB PH and finished the first mission.', '/passport');
  end if;
  return v_new;
end;
$$;

revoke execute on function public.complete_tutorial() from public, anon;
grant execute on function public.complete_tutorial() to authenticated;

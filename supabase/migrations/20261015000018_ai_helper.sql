-- =====================================================================
-- FINLAB 0018 — AI study helper (usage limits)
-- The chat itself runs in the Supabase Edge Function "chat". The database only keeps
-- per-user daily COUNTS so the helper can be limited and switched off. Message text is
-- never stored.
--   ai_helper_enabled          0 = off (default), 1 = on
--   ai_helper_daily_limit      messages per user per day
--   ai_helper_global_daily_cap messages per day across everyone (protects the free quota)
-- Safe to re-run.
-- =====================================================================

insert into public.app_settings (key, value, description) values
  ('ai_helper_enabled', '0', '1 = the AI study helper is on for signed-in users; 0 = off.'),
  ('ai_helper_daily_limit', '15', 'Messages each user can send to the AI helper per day (Manila time).'),
  ('ai_helper_global_daily_cap', '300', 'Messages per day across all users. Keep below the free AI quota so one busy day cannot use it all up.')
on conflict (key) do nothing;

create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null,
  count   int  not null default 0 check (count >= 0),
  primary key (user_id, day)
);
create index if not exists idx_ai_usage_day on public.ai_usage(day);
alter table public.ai_usage enable row level security;
-- No policies: nobody reads or writes the counters directly.

create or replace function public.ai_today()
returns date
language sql stable set search_path = public
as $$ select (now() at time zone 'Asia/Manila')::date $$;

-- Is the helper on, and how many messages are left today? (used to show the chat button)
create or replace function public.ai_status()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_limit int  := greatest(0, public.setting_num('ai_helper_daily_limit', 15)::int);
  v_used  int;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select coalesce(count, 0) into v_used from ai_usage where user_id = v_uid and day = public.ai_today();
  return jsonb_build_object(
    'enabled', public.setting_num('ai_helper_enabled', 0) >= 1,
    'limit', v_limit,
    'remaining', greatest(0, v_limit - coalesce(v_used, 0))
  );
end;
$$;

-- Counts one message. Raises a readable error if the helper is off or a limit is reached.
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
  return jsonb_build_object('remaining', v_limit - v_used - 1, 'limit', v_limit);
end;
$$;

revoke execute on function public.ai_today(), public.ai_status(), public.ai_reserve() from public, anon;
revoke execute on function public.ai_today() from authenticated;
grant execute on function public.ai_status(), public.ai_reserve() to authenticated;

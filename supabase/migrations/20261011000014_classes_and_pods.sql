-- =====================================================================
-- FINLAB — 0014 Classes (cohorts) and weekly XP pods
--   * An admin creates a class with a join code. Learners join with the code,
--     or automatically through an invite code linked to the class.
--   * Members see a class XP leaderboard. Class managers (a professor or org
--     officer, assigned by an admin) see a progress roster without admin power.
--   * Weekly pods: each week everyone is placed in a group of about 20 and
--     competes on that week's XP.
-- =====================================================================

create table public.cohorts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 3 and 80),
  description  text not null default '' check (char_length(description) <= 500),
  join_code    text not null unique check (join_code ~ '^[A-Z0-9-]{4,30}$'),
  is_open      boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.cohort_members (
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (cohort_id, user_id)
);
create index idx_cohort_members_user on public.cohort_members(user_id);

create table public.cohort_managers (
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (cohort_id, user_id)
);

alter table public.invite_codes add column if not exists cohort_id uuid references public.cohorts(id) on delete set null;

-- Sign-up check: also adds the new user to the invite's class.
create or replace function public.enforce_invite_code()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_code    text := upper(btrim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
  v_problem text;
  v_cohort  uuid;
begin
  if public.setting_num('require_invite_code', 0) < 1 and v_code = '' then
    return new;
  end if;
  if v_code = '' then
    raise exception 'FINLAB is in closed beta: an invite code is required to sign up.';
  end if;
  perform 1 from invite_codes where code = v_code for update;
  v_problem := public.invite_code_problem(v_code);
  if v_problem is not null then
    if public.setting_num('require_invite_code', 0) < 1 then return new; end if;
    raise exception '%', v_problem;
  end if;
  update invite_codes set uses = uses + 1 where code = v_code returning cohort_id into v_cohort;
  insert into invite_redemptions(user_id, code) values (new.id, v_code) on conflict (user_id) do nothing;
  if v_cohort is not null and exists (select 1 from profiles where id = new.id) then
    insert into cohort_members(cohort_id, user_id) values (v_cohort, new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

-- Admin invite list now names the class a code belongs to.
create or replace function public.admin_list_invites()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'code', c.code, 'label', c.label, 'max_uses', c.max_uses, 'uses', c.uses, 'expires_at', c.expires_at,
      'is_active', c.is_active, 'created_at', c.created_at,
      'cohort_id', c.cohort_id, 'cohort_name', (select name from cohorts k where k.id = c.cohort_id),
      'status', coalesce(public.invite_code_problem(c.code), 'ok'),
      'redeemed_by', (select coalesce(jsonb_agg(jsonb_build_object('full_name', p.full_name, 'handle', p.handle, 'redeemed_at', r.redeemed_at)
                                      order by r.redeemed_at desc), '[]'::jsonb)
                      from invite_redemptions r left join profiles p on p.id = r.user_id where r.code = c.code))
      order by c.created_at desc), '[]'::jsonb)
    from invite_codes c);
end;
$$;

-- Access helpers (internal).
create or replace function public.can_view_cohort(p_cohort uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin()
      or exists (select 1 from cohort_members where cohort_id = p_cohort and user_id = auth.uid())
      or exists (select 1 from cohort_managers where cohort_id = p_cohort and user_id = auth.uid());
$$;

create or replace function public.can_manage_cohort(p_cohort uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (select 1 from cohort_managers where cohort_id = p_cohort and user_id = auth.uid());
$$;

create or replace function public.join_cohort(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  c cohorts%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into c from cohorts where join_code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'That class code doesn''t exist. Check it and try again.'; end if;
  if not c.is_open then raise exception 'This class is closed to new members.'; end if;
  insert into cohort_members(cohort_id, user_id) values (c.id, auth.uid()) on conflict do nothing;
  return jsonb_build_object('id', c.id, 'name', c.name);
end;
$$;

create or replace function public.leave_cohort(p_cohort uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from cohort_members where cohort_id = p_cohort and user_id = auth.uid();
$$;

-- My classes, with my weekly XP rank inside each.
create or replace function public.get_my_cohorts()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with wk as (select date_trunc('week', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila' as t),
  xp as (select e.user_id, sum(e.xp)::bigint as x from public.xp_events((select t from wk)) e group by e.user_id),
  mine as (
    select c.* from cohorts c
    where exists (select 1 from cohort_members m where m.cohort_id = c.id and m.user_id = auth.uid())
       or exists (select 1 from cohort_managers g where g.cohort_id = c.id and g.user_id = auth.uid())
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'name', c.name, 'description', c.description, 'join_code', case when public.can_manage_cohort(c.id) then c.join_code end,
    'is_open', c.is_open,
    'members', (select count(*) from cohort_members m where m.cohort_id = c.id),
    'is_manager', public.can_manage_cohort(c.id),
    'is_member', exists (select 1 from cohort_members m where m.cohort_id = c.id and m.user_id = auth.uid()),
    'my_xp_week', coalesce((select x from xp where xp.user_id = auth.uid()), 0),
    'my_rank_week', (select r.rnk from (select m.user_id, rank() over (order by coalesce(xp.x, 0) desc) as rnk
                                          from cohort_members m left join xp on xp.user_id = m.user_id where m.cohort_id = c.id) r
                      where r.user_id = auth.uid()))
    order by c.name), '[]'::jsonb)
  from mine c;
$$;

-- XP leaderboard among a class's members (members, managers and admins only).
create or replace function public.get_cohort_leaderboard(p_cohort uuid, p_days int default null)
returns table(rank bigint, user_id uuid, handle text, display_name text, xp bigint, is_me boolean)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_since timestamptz;
begin
  if not public.can_view_cohort(p_cohort) then raise exception 'You are not a member of this class'; end if;
  v_since := case when p_days is null then date_trunc('week', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
                  when p_days = 0 then '-infinity'::timestamptz
                  else now() - make_interval(days => p_days) end;
  return query
    with agg as (select e.user_id, sum(e.xp)::bigint as x from public.xp_events(v_since) e group by e.user_id),
    ranked as (
      select m.user_id, coalesce(a.x, 0) as x, rank() over (order by coalesce(a.x, 0) desc) as rnk
      from cohort_members m left join agg a on a.user_id = m.user_id where m.cohort_id = p_cohort)
    select r.rnk, r.user_id, p.handle,
           case when p.is_public or r.user_id = auth.uid() or public.can_manage_cohort(p_cohort) then p.full_name else 'Private analyst' end,
           r.x, r.user_id = auth.uid()
    from ranked r join profiles p on p.id = r.user_id
    order by r.rnk, p.handle;
end;
$$;

-- Progress roster for class managers (no emails).
create or replace function public.get_cohort_roster(p_cohort uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.can_manage_cohort(p_cohort) then raise exception 'Only class managers can see the roster'; end if;
  return (select coalesce(jsonb_agg(x order by (x->>'xp_7d')::int desc, x->>'full_name'), '[]'::jsonb) from (
    select jsonb_build_object(
      'user_id', p.id, 'full_name', p.full_name, 'handle', p.handle, 'joined_at', m.joined_at,
      'finlab_score', (select s.finlab_score from user_stats s where s.user_id = p.id),
      'lessons_passed', (select count(*) from lesson_progress lp where lp.user_id = p.id),
      'challenges_scored', (select count(distinct cs.challenge_id) from challenge_submissions cs where cs.user_id = p.id and cs.status = 'scored'),
      'certificates', (select count(*) from certificates c where c.user_id = p.id and c.revoked_at is null and c.issue_type not in ('test')),
      'xp_7d', (select coalesce(sum(e.xp), 0) from public.xp_events(now() - interval '7 days', p.id) e),
      'streak', (select current_streak from public.user_streak(p.id)),
      'last_active', (select max(e.at) from public.xp_events(now() - interval '120 days', p.id) e)) as x
    from cohort_members m join profiles p on p.id = m.user_id where m.cohort_id = p_cohort) t);
end;
$$;

-- Admin: add or remove a class manager by email.
create or replace function public.admin_set_cohort_manager(p_cohort uuid, p_email text, p_add boolean default true)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  perform public.assert_admin();
  select id into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user is null then raise exception 'No account with that email'; end if;
  if p_add then
    insert into cohort_managers(cohort_id, user_id) values (p_cohort, v_user) on conflict do nothing;
  else
    delete from cohort_managers where cohort_id = p_cohort and user_id = v_user;
  end if;
end;
$$;

create or replace function public.admin_list_cohorts()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'description', c.description, 'join_code', c.join_code, 'is_open', c.is_open, 'created_at', c.created_at,
      'members', (select count(*) from cohort_members m where m.cohort_id = c.id),
      'managers', (select coalesce(jsonb_agg(jsonb_build_object('user_id', p.id, 'full_name', p.full_name, 'email', u.email)), '[]'::jsonb)
                   from cohort_managers g join profiles p on p.id = g.user_id join auth.users u on u.id = g.user_id where g.cohort_id = c.id))
      order by c.created_at desc), '[]'::jsonb)
    from cohorts c);
end;
$$;

-- Weekly pods: everyone is hashed into a group of about 20 each week (Monday–Sunday, Manila time).
create or replace function public.get_weekly_pod()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_week  timestamptz := date_trunc('week', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila';
  v_pods  int;
  v_mine  int;
  v_rows  jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select greatest(1, ceil(count(*) / 20.0))::int into v_pods
    from profiles p where p.onboarded_at is not null and not exists (select 1 from user_roles r where r.user_id = p.id and r.role = 'admin');
  v_mine := (abs(hashtextextended(v_week::text || v_uid::text, 0)) % v_pods)::int;
  with agg as (select e.user_id, sum(e.xp)::bigint as x from public.xp_events(v_week) e group by e.user_id),
  members as (
    select p.id, p.handle, p.full_name, p.is_public, coalesce(a.x, 0) as x
    from profiles p left join agg a on a.user_id = p.id
    where p.onboarded_at is not null
      and not exists (select 1 from user_roles r where r.user_id = p.id and r.role = 'admin')
      and (abs(hashtextextended(v_week::text || p.id::text, 0)) % v_pods)::int = v_mine),
  ranked as (select m.*, rank() over (order by m.x desc) as rnk from members m)
  select coalesce(jsonb_agg(jsonb_build_object(
      'rank', r.rnk, 'user_id', r.id, 'handle', r.handle, 'is_me', r.id = v_uid, 'xp', r.x,
      'display_name', case when r.is_public or r.id = v_uid then r.full_name else 'Private analyst' end) order by r.rnk, r.handle), '[]'::jsonb)
    into v_rows from ranked r;
  return jsonb_build_object('week_start', v_week, 'week_end', v_week + interval '7 days', 'pod_size', jsonb_array_length(v_rows),
                            'in_pod', exists (select 1 from jsonb_array_elements(v_rows) x where (x->>'is_me')::boolean), 'rows', v_rows);
end;
$$;

-- Security --------------------------------------------------------------
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_managers enable row level security;
revoke all on public.cohorts, public.cohort_members, public.cohort_managers from anon, authenticated;
grant select, insert, update, delete on public.cohorts, public.cohort_members, public.cohort_managers to authenticated;
create policy cohorts_admin on public.cohorts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cohort_members_admin on public.cohort_members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cohort_managers_admin on public.cohort_managers for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke execute on function public.can_view_cohort(uuid), public.can_manage_cohort(uuid) from public, anon, authenticated;
revoke execute on function public.join_cohort(text), public.leave_cohort(uuid), public.get_my_cohorts(), public.get_cohort_leaderboard(uuid, int),
  public.get_cohort_roster(uuid), public.admin_set_cohort_manager(uuid, text, boolean), public.admin_list_cohorts(), public.get_weekly_pod(),
  public.admin_list_invites() from public, anon;
grant execute on function public.join_cohort(text), public.leave_cohort(uuid), public.get_my_cohorts(), public.get_cohort_leaderboard(uuid, int),
  public.get_cohort_roster(uuid), public.admin_set_cohort_manager(uuid, text, boolean), public.admin_list_cohorts(), public.get_weekly_pod(),
  public.admin_list_invites() to authenticated;

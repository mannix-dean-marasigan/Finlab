-- =====================================================================
-- FINLAB — 0011 Invite codes for the closed beta
--   * Admins create codes (optional usage limit and expiry).
--   * When require_invite_code = 1, every new sign-up must carry a valid
--     code in its metadata; the check runs inside the auth.users insert,
--     so it cannot be bypassed from the client.
--   * Existing accounts are unaffected.
-- =====================================================================

insert into public.app_settings (key, value, description) values
 ('require_invite_code', '1', '1 = new sign-ups need a valid invite code (closed beta); 0 = open sign-up.')
on conflict (key) do nothing;

create table public.invite_codes (
  code        text primary key check (code ~ '^[A-Z0-9-]{4,40}$'),
  label       text not null default '',
  max_uses    int check (max_uses is null or max_uses > 0),
  uses        int not null default 0 check (uses >= 0),
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.invite_redemptions (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  code         text not null references public.invite_codes(code) on delete cascade,
  redeemed_at  timestamptz not null default now()
);
create index idx_invite_redemptions_code on public.invite_redemptions(code);

-- Why a code can't be used right now (null = usable).
create or replace function public.invite_code_problem(p_code text)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when c.code is null then 'That invite code doesn''t exist. Check it and try again.'
    when not c.is_active then 'That invite code has been switched off.'
    when c.expires_at is not null and c.expires_at <= now() then 'That invite code has expired.'
    when c.max_uses is not null and c.uses >= c.max_uses then 'That invite code has already been used the maximum number of times.'
  end
  from (select 1) x
  left join invite_codes c on c.code = upper(btrim(coalesce(p_code, '')));
$$;

-- Public (anon) check used by the sign-up form for a friendly message.
create or replace function public.check_invite_code(p_code text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'required', public.setting_num('require_invite_code', 0) >= 1,
    'valid', nullif(btrim(coalesce(p_code, '')), '') is not null and public.invite_code_problem(p_code) is null,
    'message', case when nullif(btrim(coalesce(p_code, '')), '') is null then null else public.invite_code_problem(p_code) end);
$$;

-- Enforced on every new auth user. Raising here aborts the sign-up.
create or replace function public.enforce_invite_code()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_code    text := upper(btrim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
  v_problem text;
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
    -- With sign-up open, a bad optional code is simply ignored.
    if public.setting_num('require_invite_code', 0) < 1 then return new; end if;
    raise exception '%', v_problem;
  end if;
  update invite_codes set uses = uses + 1 where code = v_code;
  insert into invite_redemptions(user_id, code) values (new.id, v_code) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_invite_check
  after insert on auth.users
  for each row execute function public.enforce_invite_code();

-- Admin: codes with usage and who joined with each.
create or replace function public.admin_list_invites()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'code', c.code, 'label', c.label, 'max_uses', c.max_uses, 'uses', c.uses, 'expires_at', c.expires_at,
      'is_active', c.is_active, 'created_at', c.created_at,
      'status', coalesce(public.invite_code_problem(c.code), 'ok'),
      'redeemed_by', (select coalesce(jsonb_agg(jsonb_build_object('full_name', p.full_name, 'handle', p.handle, 'redeemed_at', r.redeemed_at)
                                      order by r.redeemed_at desc), '[]'::jsonb)
                      from invite_redemptions r left join profiles p on p.id = r.user_id where r.code = c.code))
      order by c.created_at desc), '[]'::jsonb)
    from invite_codes c);
end;
$$;

-- Security --------------------------------------------------------------
alter table public.invite_codes enable row level security;
alter table public.invite_redemptions enable row level security;
revoke all on public.invite_codes, public.invite_redemptions from anon, authenticated;
grant select, insert, update, delete on public.invite_codes to authenticated;
grant select on public.invite_redemptions to authenticated;
create policy invite_codes_admin on public.invite_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy invite_redemptions_read on public.invite_redemptions for select to authenticated using (user_id = auth.uid() or public.is_admin());

revoke execute on function public.invite_code_problem(text), public.enforce_invite_code() from public, anon, authenticated;
revoke execute on function public.check_invite_code(text), public.admin_list_invites() from public, anon, authenticated;
grant execute on function public.check_invite_code(text) to anon, authenticated;
grant execute on function public.admin_list_invites() to authenticated;

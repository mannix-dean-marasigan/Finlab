-- =====================================================================
-- FINLAB 0016 — Trading Floor
-- A virtual trading game on simulated markets (fictional tickers):
--   * Fast rounds: a 260-candle chart, 120 shown up front, the rest revealed
--     candle by candle. Practice rounds are unlimited; the weekly challenge is
--     the same chart for everyone, one attempt, ranked by risk-adjusted return.
--   * Live market: a ₱1,000,000 account on six simulated stocks that keep
--     moving one candle per hour, forever.
-- Prices come from a deterministic formula (seeded hashing), so the database
-- can always rebuild any candle; no scheduled jobs. Future candles are never
-- returned to the browser, and every order is filled here at the current price.
-- Long, short, stop-loss and take-profit; no leverage (gross exposure ≤ equity);
-- 0.1% fee per trade. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Price engine
-- ---------------------------------------------------------------------
-- Uniform (0,1) from a seed, an index and a channel.
create or replace function public.tf_u(p_seed text, p_i int, p_k int)
returns double precision
language sql immutable parallel safe set search_path = public
as $$
  select ((hashtextextended(p_seed || ':' || p_i || ':' || p_k, 0) & 2147483647)::double precision + 0.5) / 2147483648.0
$$;

-- Standard normal (Box–Muller).
create or replace function public.tf_n(p_seed text, p_i int, p_k int)
returns double precision
language sql immutable parallel safe set search_path = public
as $$
  select sqrt(-2 * ln(public.tf_u(p_seed, p_i, p_k))) * cos(2 * pi() * public.tf_u(p_seed, p_i, p_k + 1))
$$;

create or replace function public.tf_round_price(p numeric)
returns numeric
language sql immutable parallel safe set search_path = public
as $$ select case when p < 10 then round(p, 3) else round(p, 2) end $$;

-- One candle. Markets move in 36-candle regimes: up-trends, down-trends, ranges
-- (prices are pulled back toward the range's level, so support and resistance
-- hold until they break) and volatile stretches, plus occasional news gaps.
-- p_scale shrinks moves for hourly candles.
create or replace function public.tf_step(p_seed text, p_i int, p_prev numeric, p_anchor numeric, p_scale double precision default 1,
  out o numeric, out h numeric, out l numeric, out c numeric, out v bigint)
language plpgsql immutable set search_path = public
as $$
declare
  b      int := floor(p_i / 36.0);
  r      double precision := public.tf_u(p_seed, b, 1);
  mu     double precision;
  sigma  double precision;
  revert double precision := 0;
  ret    double precision;
  gap    double precision := 0;
  op     double precision;
  cl     double precision;
begin
  if r < 0.28 then        -- up-trend
    mu := 0.0025 + 0.0035 * public.tf_u(p_seed, b, 2); sigma := 0.012 + 0.008 * public.tf_u(p_seed, b, 3);
  elsif r < 0.52 then     -- down-trend
    mu := -(0.0025 + 0.0035 * public.tf_u(p_seed, b, 2)); sigma := 0.012 + 0.008 * public.tf_u(p_seed, b, 3);
  elsif r < 0.86 then     -- range
    mu := 0; sigma := 0.010 + 0.006 * public.tf_u(p_seed, b, 3); revert := 0.09;
  else                    -- volatile
    mu := 0; sigma := 0.028 + 0.012 * public.tf_u(p_seed, b, 3);
  end if;
  mu := mu * p_scale; sigma := sigma * greatest(p_scale, 0.3);

  if public.tf_u(p_seed, p_i, 10) < 0.015 * p_scale then   -- news gap
    gap := (case when public.tf_u(p_seed, p_i, 11) < 0.5 then -1 else 1 end) * (0.03 + 0.05 * public.tf_u(p_seed, p_i, 12));
  end if;
  op := p_prev::double precision * (1 + gap);
  ret := mu + sigma * public.tf_n(p_seed, p_i, 20) - revert * ln(op / greatest(p_anchor::double precision, 0.01));
  cl := greatest(0.5, op * exp(ret));
  o := public.tf_round_price(op::numeric);
  c := public.tf_round_price(cl::numeric);
  h := public.tf_round_price((greatest(op, cl) * (1 + abs(public.tf_n(p_seed, p_i, 30)) * sigma * 0.55))::numeric);
  l := public.tf_round_price((least(op, cl) * (1 - abs(public.tf_n(p_seed, p_i, 40)) * sigma * 0.55))::numeric);
  v := round(100000 * (0.6 + public.tf_u(p_seed, p_i, 50)) * (1 + abs(ret) * 40))::bigint;
end;
$$;

-- A whole path from candle 0 (used by fast rounds).
create or replace function public.tf_path(p_seed text, p_n int)
returns jsonb
language plpgsql immutable set search_path = public
as $$
declare
  prev   numeric := public.tf_round_price((20 + 180 * public.tf_u(p_seed, -1, 1))::numeric);
  anchor numeric := prev;
  st     record;
  v_out  jsonb := '[]'::jsonb;
begin
  for i in 0 .. p_n - 1 loop
    if i % 36 = 0 then anchor := prev; end if;
    st := public.tf_step(p_seed, i, prev, anchor, 1);
    v_out := v_out || jsonb_build_array(jsonb_build_array(st.o, st.h, st.l, st.c, st.v));
    prev := st.c;
  end loop;
  return v_out;
end;
$$;

-- Fictional ticker for a round's seed.
create or replace function public.tf_symbol(p_seed text)
returns text
language sql immutable set search_path = public
as $$
  select (array['MNLX','BAYR','PSTL','KAWI','LUZN','VSYA','TALA','ARAW','BITU','HIMO','LAKO','DAGT'])
         [1 + floor(public.tf_u(p_seed, -2, 1) * 12)::int]
$$;

-- ---------------------------------------------------------------------
-- 2. Fast rounds
-- ---------------------------------------------------------------------
create table if not exists public.tf_rounds (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          text not null check (kind in ('practice','weekly')),
  week_start    date,
  seed          text not null,
  symbol        text not null,
  series        jsonb not null,           -- full path; only candles up to "cursor" are ever returned
  cursor        int not null,
  last_index    int not null,
  start_cash    numeric not null default 100000,
  cash          numeric not null default 100000,
  qty           numeric not null default 0,
  avg_price     numeric not null default 0,
  stop_price    numeric,
  take_price    numeric,
  fees          numeric not null default 0,
  realized      numeric not null default 0,
  trades        int not null default 0,
  wins          int not null default 0,
  peak_equity   numeric not null default 100000,
  max_drawdown  numeric not null default 0,  -- percent
  status        text not null default 'active' check (status in ('active','finished')),
  final_equity  numeric,
  return_pct    numeric,
  score         numeric,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create unique index if not exists uq_tf_weekly_once on public.tf_rounds(user_id, week_start) where kind = 'weekly';
create index if not exists idx_tf_rounds_user on public.tf_rounds(user_id, created_at desc);
create index if not exists idx_tf_rounds_week on public.tf_rounds(week_start, score desc) where kind = 'weekly' and status = 'finished';

create table if not exists public.tf_fills (
  id        bigint generated always as identity primary key,
  round_id  uuid not null references public.tf_rounds(id) on delete cascade,
  i         int not null,
  side      text not null check (side in ('buy','sell')),
  qty       numeric not null,
  price     numeric not null,
  reason    text not null check (reason in ('market','stop','take','close')),
  pnl       numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_tf_fills_round on public.tf_fills(round_id, id);

alter table public.tf_rounds enable row level security;
alter table public.tf_fills enable row level security;
-- No policies: players only reach these through the functions below.

create or replace function public.tf_week_start()
returns date
language sql stable set search_path = public
as $$ select date_trunc('week', now() at time zone 'Asia/Manila')::date $$;

-- Candle k of a round as numbers.
create or replace function public.tf_c(p_series jsonb, p_k int, p_field int)
returns numeric
language sql immutable set search_path = public
as $$ select (p_series -> p_k ->> p_field)::numeric $$;

-- Applies a fill to a round row (in memory) and logs it. Returns the updated row.
create or replace function public.tf_fill(r public.tf_rounds, p_side text, p_qty numeric, p_price numeric, p_reason text)
returns public.tf_rounds
language plpgsql set search_path = public
as $$
declare
  delta   numeric := case when p_side = 'buy' then p_qty else -p_qty end;
  closing numeric := 0;
  pnl     numeric := 0;
  newq    numeric;
  fee     numeric := round(abs(delta) * p_price * 0.001, 2);
begin
  if r.qty <> 0 and sign(delta) <> sign(r.qty) then
    closing := least(abs(delta), abs(r.qty));
    pnl := round((p_price - r.avg_price) * closing * sign(r.qty), 2);
    r.realized := r.realized + pnl;
    r.trades := r.trades + 1;
    if pnl > 0 then r.wins := r.wins + 1; end if;
  end if;
  newq := r.qty + delta;
  if newq = 0 then
    r.avg_price := 0;
  elsif r.qty = 0 or sign(newq) <> sign(r.qty) then
    r.avg_price := p_price;                            -- opened or flipped
  elsif sign(delta) = sign(r.qty) then
    r.avg_price := round((r.avg_price * abs(r.qty) + p_price * abs(delta)) / abs(newq), 4);
  end if;
  if newq = 0 or (r.qty <> 0 and sign(newq) <> sign(r.qty)) then
    r.stop_price := null; r.take_price := null;
  end if;
  r.qty := newq;
  r.cash := r.cash - delta * p_price - fee;
  r.fees := r.fees + fee;
  insert into tf_fills(round_id, i, side, qty, price, reason, pnl) values (r.id, r.cursor, p_side, p_qty, p_price, p_reason, pnl);
  return r;
end;
$$;

-- Marks equity at the cursor candle's close and tracks the drawdown.
create or replace function public.tf_mark(r public.tf_rounds)
returns public.tf_rounds
language plpgsql set search_path = public
as $$
declare
  eq numeric := r.cash + r.qty * public.tf_c(r.series, r.cursor, 3);
begin
  r.peak_equity := greatest(r.peak_equity, eq);
  r.max_drawdown := greatest(r.max_drawdown, round((r.peak_equity - eq) / r.peak_equity * 100, 2));
  return r;
end;
$$;

-- Closes any position at the cursor candle's close and scores the round.
create or replace function public.tf_finish_row(r public.tf_rounds)
returns public.tf_rounds
language plpgsql set search_path = public
as $$
declare
  px numeric := public.tf_c(r.series, r.cursor, 3);
begin
  if r.qty > 0 then r := public.tf_fill(r, 'sell', r.qty, px, 'close');
  elsif r.qty < 0 then r := public.tf_fill(r, 'buy', -r.qty, px, 'close');
  end if;
  r := public.tf_mark(r);
  r.status := 'finished';
  r.finished_at := now();
  r.final_equity := round(r.cash, 2);
  r.return_pct := round((r.cash - r.start_cash) / r.start_cash * 100, 2);
  -- Risk-adjusted: drawdowns cost half their size, so steady beats reckless.
  r.score := round(r.return_pct - 0.5 * r.max_drawdown, 2);
  return r;
end;
$$;

-- What the player may see: everything up to the cursor, never beyond.
create or replace function public.tf_round_view(r public.tf_rounds, p_from int default 0)
returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'symbol', r.symbol, 'week_start', r.week_start, 'status', r.status,
    'cursor', r.cursor, 'last_index', r.last_index, 'start_cash', r.start_cash,
    'cash', round(r.cash, 2), 'qty', r.qty, 'avg_price', r.avg_price,
    'stop_price', r.stop_price, 'take_price', r.take_price, 'fees', r.fees, 'realized', r.realized,
    'trades', r.trades, 'wins', r.wins, 'max_drawdown', r.max_drawdown,
    'price', public.tf_c(r.series, r.cursor, 3),
    'equity', round(r.cash + r.qty * public.tf_c(r.series, r.cursor, 3), 2),
    'final_equity', r.final_equity, 'return_pct', r.return_pct, 'score', r.score,
    'from', greatest(p_from, 0),
    'candles', (select coalesce(jsonb_agg(r.series -> k order by k), '[]'::jsonb) from generate_series(greatest(p_from, 0), r.cursor) k),
    'fills', (select coalesce(jsonb_agg(jsonb_build_object('i', f.i, 'side', f.side, 'qty', f.qty, 'price', f.price, 'reason', f.reason, 'pnl', f.pnl) order by f.id), '[]'::jsonb)
              from tf_fills f where f.round_id = r.id)
  )
$$;

create or replace function public.tf_my_round(p_round uuid)
returns public.tf_rounds
language plpgsql set search_path = public
as $$
declare r tf_rounds;
begin
  select * into r from tf_rounds where id = p_round and user_id = auth.uid() for update;
  if not found then raise exception 'Round not found.' using errcode = 'P0002'; end if;
  return r;
end;
$$;

-- Start (or resume) a round. Weekly: one per person per week, same chart for everyone.
create or replace function public.tf_start_round(p_kind text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_week date := public.tf_week_start();
  v_seed text;
  r      tf_rounds;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_kind not in ('practice','weekly') then raise exception 'Unknown round type.'; end if;
  if p_kind = 'weekly' then
    select * into r from tf_rounds where user_id = v_uid and kind = 'weekly' and week_start = v_week;
    if found then return public.tf_round_view(r); end if;
    v_seed := 'tf-weekly-' || v_week;
  else
    -- Resume an unfinished practice round instead of piling them up.
    select * into r from tf_rounds where user_id = v_uid and kind = 'practice' and status = 'active' order by created_at desc limit 1;
    if found then return public.tf_round_view(r); end if;
    v_seed := 'tf-practice-' || gen_random_uuid();
  end if;
  insert into tf_rounds(user_id, kind, week_start, seed, symbol, series, cursor, last_index)
  values (v_uid, p_kind, case when p_kind = 'weekly' then v_week end, v_seed, public.tf_symbol(v_seed), public.tf_path(v_seed, 260), 119, 259)
  returning * into r;
  return public.tf_round_view(r);
end;
$$;

create or replace function public.tf_get_round(p_round uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return public.tf_round_view(public.tf_my_round(p_round));
end;
$$;

-- Reveal the next candle(s), triggering stops/targets inside each candle.
create or replace function public.tf_advance(p_round uuid, p_steps int default 1)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r      tf_rounds := public.tf_my_round(p_round);
  v_from int := r.cursor + 1;
  k      int;
  op numeric; hi numeric; lo numeric;
begin
  if r.status <> 'active' then return public.tf_round_view(r, r.cursor + 1); end if;
  for k in 1 .. greatest(1, least(coalesce(p_steps, 1), 20)) loop
    exit when r.cursor >= r.last_index;
    r.cursor := r.cursor + 1;
    op := public.tf_c(r.series, r.cursor, 0); hi := public.tf_c(r.series, r.cursor, 1); lo := public.tf_c(r.series, r.cursor, 2);
    -- The stop is checked first (the cautious assumption when both are hit in one candle). Gaps fill at the open.
    if r.qty > 0 then
      if r.stop_price is not null and lo <= r.stop_price then r := public.tf_fill(r, 'sell', r.qty, least(op, r.stop_price), 'stop');
      elsif r.take_price is not null and hi >= r.take_price then r := public.tf_fill(r, 'sell', r.qty, greatest(op, r.take_price), 'take');
      end if;
    elsif r.qty < 0 then
      if r.stop_price is not null and hi >= r.stop_price then r := public.tf_fill(r, 'buy', -r.qty, greatest(op, r.stop_price), 'stop');
      elsif r.take_price is not null and lo <= r.take_price then r := public.tf_fill(r, 'buy', -r.qty, least(op, r.take_price), 'take');
      end if;
    end if;
    r := public.tf_mark(r);
  end loop;
  if r.cursor >= r.last_index then r := public.tf_finish_row(r); end if;
  update tf_rounds set cursor = r.cursor, cash = r.cash, qty = r.qty, avg_price = r.avg_price, stop_price = r.stop_price,
    take_price = r.take_price, fees = r.fees, realized = r.realized, trades = r.trades, wins = r.wins,
    peak_equity = r.peak_equity, max_drawdown = r.max_drawdown, status = r.status, final_equity = r.final_equity,
    return_pct = r.return_pct, score = r.score, finished_at = r.finished_at
  where id = r.id;
  return public.tf_round_view(r, v_from);
end;
$$;

-- Market order at the current close. side: 'buy' or 'sell' (selling with no position goes short).
create or replace function public.tf_order(p_round uuid, p_side text, p_qty numeric)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r  tf_rounds := public.tf_my_round(p_round);
  px numeric;
  eq numeric;
begin
  if r.status <> 'active' then raise exception 'This round is over.'; end if;
  if p_side not in ('buy','sell') then raise exception 'Unknown order side.'; end if;
  if p_qty is null or p_qty < 1 or p_qty <> trunc(p_qty) then raise exception 'Quantity must be a whole number of shares.'; end if;
  px := public.tf_c(r.series, r.cursor, 3);
  r := public.tf_fill(r, p_side, p_qty, px, 'market');
  eq := r.cash + r.qty * px;
  if abs(r.qty) * px > eq * 1.0001 then
    raise exception 'Not enough buying power: positions can be at most 100%% of your equity (no leverage).' using errcode = 'P0001';
  end if;
  r := public.tf_mark(r);
  update tf_rounds set cash = r.cash, qty = r.qty, avg_price = r.avg_price, stop_price = r.stop_price, take_price = r.take_price,
    fees = r.fees, realized = r.realized, trades = r.trades, wins = r.wins, peak_equity = r.peak_equity, max_drawdown = r.max_drawdown
  where id = r.id;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

-- Stop-loss / take-profit for the open position (null clears).
create or replace function public.tf_set_exits(p_round uuid, p_stop numeric, p_take numeric)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r  tf_rounds := public.tf_my_round(p_round);
  px numeric;
begin
  if r.status <> 'active' then raise exception 'This round is over.'; end if;
  if r.qty = 0 then raise exception 'Open a position first.'; end if;
  px := public.tf_c(r.series, r.cursor, 3);
  if r.qty > 0 and ((p_stop is not null and p_stop >= px) or (p_take is not null and p_take <= px)) then
    raise exception 'For a long position the stop goes below the price and the target above it.';
  end if;
  if r.qty < 0 and ((p_stop is not null and p_stop <= px) or (p_take is not null and p_take >= px)) then
    raise exception 'For a short position the stop goes above the price and the target below it.';
  end if;
  update tf_rounds set stop_price = p_stop, take_price = p_take where id = r.id returning * into r;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

-- End now: closes the position at the current price and scores the round.
create or replace function public.tf_finish(p_round uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r tf_rounds := public.tf_my_round(p_round);
begin
  if r.status = 'active' then
    r := public.tf_finish_row(r);
    update tf_rounds set cash = r.cash, qty = 0, avg_price = 0, stop_price = null, take_price = null, fees = r.fees,
      realized = r.realized, trades = r.trades, wins = r.wins, peak_equity = r.peak_equity, max_drawdown = r.max_drawdown,
      status = r.status, final_equity = r.final_equity, return_pct = r.return_pct, score = r.score, finished_at = r.finished_at
    where id = r.id;
  end if;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

create or replace function public.tf_my_rounds(p_limit int default 20)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select id, kind, symbol, week_start, status, return_pct, max_drawdown, score, trades, wins, created_at, finished_at
    from tf_rounds where user_id = auth.uid()
    order by created_at desc limit greatest(1, least(coalesce(p_limit, 20), 100))
  ) x
$$;

create or replace function public.tf_weekly_leaderboard(p_limit int default 50)
returns table(rank bigint, user_id uuid, handle text, display_name text, return_pct numeric, max_drawdown numeric, score numeric, trades int, is_me boolean)
language sql stable security definer set search_path = public
as $$
  with ranked as (
    select rank() over (order by r.score desc, r.max_drawdown asc) as rnk, r.*
    from tf_rounds r
    where r.kind = 'weekly' and r.status = 'finished' and r.week_start = public.tf_week_start()
  )
  select x.rnk, x.user_id, p.handle,
         case when p.is_public or x.user_id = auth.uid() then p.full_name else 'Private analyst' end,
         x.return_pct, x.max_drawdown, x.score, x.trades, x.user_id = auth.uid()
  from ranked x join profiles p on p.id = x.user_id
  where p.is_public or x.user_id = auth.uid() or public.is_admin()
  order by x.rnk, p.handle
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- ---------------------------------------------------------------------
-- 3. Live market (hourly candles since the launch epoch)
-- ---------------------------------------------------------------------
create table if not exists public.tf_tickers (
  symbol      text primary key,
  name        text not null,
  sector      text not null,
  seed        text not null,
  start_price numeric not null,
  sort_order  int not null default 0
);
create table if not exists public.tf_candles (
  symbol text not null references public.tf_tickers(symbol) on delete cascade,
  i      int not null,
  o numeric not null, h numeric not null, l numeric not null, c numeric not null, v bigint not null,
  primary key (symbol, i)
);
create table if not exists public.tf_accounts (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  cash       numeric not null default 1000000,
  start_cash numeric not null default 1000000,
  fees       numeric not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.tf_positions (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null references public.tf_tickers(symbol) on delete cascade,
  qty        numeric not null,
  avg_price  numeric not null,
  stop_price numeric,
  take_price numeric,
  checked_i  int not null,
  primary key (user_id, symbol)
);
create table if not exists public.tf_trades (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  side       text not null check (side in ('buy','sell')),
  qty        numeric not null,
  price      numeric not null,
  reason     text not null check (reason in ('market','stop','take')),
  pnl        numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_tf_trades_user on public.tf_trades(user_id, id desc);
alter table public.tf_tickers enable row level security;
alter table public.tf_candles enable row level security;
alter table public.tf_accounts enable row level security;
alter table public.tf_positions enable row level security;
alter table public.tf_trades enable row level security;

insert into public.tf_tickers(symbol, name, sector, seed, start_price, sort_order) values
  ('MNLX', 'Manila Exchange Holdings', 'Financials', 'live-MNLX', 84.50, 1),
  ('BAYR', 'Bayanihan Retail Corp.',   'Consumer',   'live-BAYR', 32.10, 2),
  ('ARAW', 'Araw Solar Energy',        'Energy',     'live-ARAW', 12.40, 3),
  ('KAWI', 'Kawing Telecom',           'Telecoms',   'live-KAWI', 148.00, 4),
  ('LUZN', 'Luzon Property Group',     'Property',   'live-LUZN', 56.75, 5),
  ('TALA', 'Tala Digital Bank',        'Banks',      'live-TALA', 23.90, 6)
on conflict (symbol) do nothing;

-- Candle 0 opens at this moment; one candle per hour after that.
create or replace function public.tf_epoch()
returns timestamptz
language sql immutable set search_path = public
as $$ select '2026-09-10 00:00:00+08'::timestamptz $$;

create or replace function public.tf_now_index()
returns int
language sql stable set search_path = public
as $$ select greatest(0, floor(extract(epoch from now() - public.tf_epoch()) / 3600)::int) $$;

-- Generates and stores any missing candles up to p_upto (deterministic, so storing is only a cache).
create or replace function public.tf_ensure_candles(p_symbol text, p_upto int)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t      tf_tickers;
  last_i int;
  prev   numeric;
  anchor numeric;
  st     record;
begin
  select * into t from tf_tickers where symbol = p_symbol;
  if not found then raise exception 'Unknown ticker.'; end if;
  select max(i) into last_i from tf_candles where symbol = p_symbol;
  if last_i is not null and last_i >= p_upto then return; end if;
  perform pg_advisory_xact_lock(hashtext('tf-' || p_symbol));
  select max(i) into last_i from tf_candles where symbol = p_symbol;
  if last_i is not null and last_i >= p_upto then return; end if;
  if last_i is null then
    last_i := -1; prev := t.start_price;
  else
    select c into prev from tf_candles where symbol = p_symbol and i = last_i;
  end if;
  for k in last_i + 1 .. p_upto loop
    if k % 36 = 0 then anchor := prev;
    elsif anchor is null then
      select c into anchor from tf_candles where symbol = p_symbol and i = (k / 36) * 36 - 1;
      anchor := coalesce(anchor, t.start_price);
    end if;
    st := public.tf_step(t.seed, k, prev, anchor, 0.35);
    insert into tf_candles(symbol, i, o, h, l, c, v) values (p_symbol, k, st.o, st.h, st.l, st.c, st.v) on conflict do nothing;
    prev := st.c;
  end loop;
end;
$$;

create or replace function public.tf_live_price(p_symbol text)
returns numeric
language plpgsql security definer set search_path = public
as $$
declare n int := public.tf_now_index();
begin
  perform public.tf_ensure_candles(p_symbol, n);
  return (select c from tf_candles where symbol = p_symbol and i = n);
end;
$$;

create or replace function public.tf_live_tickers()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  n int := public.tf_now_index();
  t record;
begin
  for t in select symbol from tf_tickers loop perform public.tf_ensure_candles(t.symbol, n); end loop;
  return (
    select coalesce(jsonb_agg(jsonb_build_object('symbol', tk.symbol, 'name', tk.name, 'sector', tk.sector,
      'price', cur.c, 'change_pct', round((cur.c - prev.c) / prev.c * 100, 2)) order by tk.sort_order), '[]'::jsonb)
    from tf_tickers tk
    join tf_candles cur on cur.symbol = tk.symbol and cur.i = n
    join tf_candles prev on prev.symbol = tk.symbol and prev.i = greatest(0, n - 24)
  );
end;
$$;

create or replace function public.tf_live_candles(p_symbol text, p_limit int default 400)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare n int := public.tf_now_index();
begin
  perform public.tf_ensure_candles(p_symbol, n);
  return jsonb_build_object(
    'symbol', p_symbol,
    'epoch', extract(epoch from public.tf_epoch())::bigint,
    'next_candle_at', public.tf_epoch() + make_interval(hours => n + 1),
    'candles', (select coalesce(jsonb_agg(jsonb_build_array(x.i, x.o, x.h, x.l, x.c, x.v) order by x.i), '[]'::jsonb)
                from (select * from tf_candles where symbol = p_symbol and i <= n order by i desc limit greatest(50, least(coalesce(p_limit, 400), 1500))) x)
  );
end;
$$;

-- Fills stop/target orders that triggered since the last check (gaps fill at the open).
create or replace function public.tf_live_settle(p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  n   int := public.tf_now_index();
  p   tf_positions;
  cd  tf_candles;
  px  numeric;
  why text;
  pnl numeric;
  fee numeric;
begin
  for p in select * from tf_positions where user_id = p_user and (stop_price is not null or take_price is not null) for update loop
    perform public.tf_ensure_candles(p.symbol, n);
    why := null;
    for cd in select * from tf_candles where symbol = p.symbol and i > p.checked_i and i <= n order by i loop
      if p.qty > 0 then
        if p.stop_price is not null and cd.l <= p.stop_price then px := least(cd.o, p.stop_price); why := 'stop';
        elsif p.take_price is not null and cd.h >= p.take_price then px := greatest(cd.o, p.take_price); why := 'take'; end if;
      else
        if p.stop_price is not null and cd.h >= p.stop_price then px := greatest(cd.o, p.stop_price); why := 'stop';
        elsif p.take_price is not null and cd.l <= p.take_price then px := least(cd.o, p.take_price); why := 'take'; end if;
      end if;
      exit when why is not null;
    end loop;
    if why is not null then
      pnl := round((px - p.avg_price) * p.qty, 2);
      fee := round(abs(p.qty) * px * 0.001, 2);
      update tf_accounts a set cash = a.cash + p.qty * px - fee, fees = a.fees + fee where a.user_id = p_user;
      insert into tf_trades(user_id, symbol, side, qty, price, reason, pnl)
      values (p_user, p.symbol, case when p.qty > 0 then 'sell' else 'buy' end, abs(p.qty), px, why, pnl);
      delete from tf_positions where user_id = p_user and symbol = p.symbol;
    else
      update tf_positions set checked_i = n where user_id = p_user and symbol = p.symbol;
    end if;
  end loop;
end;
$$;

create or replace function public.tf_live_account()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  n     int := public.tf_now_index();
  a     tf_accounts;
  pos   jsonb;
  mv    numeric;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  insert into tf_accounts(user_id) values (v_uid) on conflict do nothing;
  perform public.tf_live_settle(v_uid);
  select * into a from tf_accounts where user_id = v_uid;
  select coalesce(jsonb_agg(jsonb_build_object('symbol', p.symbol, 'qty', p.qty, 'avg_price', p.avg_price,
           'price', public.tf_live_price(p.symbol), 'stop_price', p.stop_price, 'take_price', p.take_price,
           'unrealized', round((public.tf_live_price(p.symbol) - p.avg_price) * p.qty, 2)) order by p.symbol), '[]'::jsonb),
         coalesce(sum(p.qty * public.tf_live_price(p.symbol)), 0)
    into pos, mv
  from tf_positions p where p.user_id = v_uid;
  return jsonb_build_object(
    'cash', round(a.cash, 2), 'start_cash', a.start_cash, 'fees', a.fees, 'equity', round(a.cash + mv, 2),
    'return_pct', round((a.cash + mv - a.start_cash) / a.start_cash * 100, 2),
    'positions', pos,
    'trades', (select coalesce(jsonb_agg(jsonb_build_object('symbol', t.symbol, 'side', t.side, 'qty', t.qty, 'price', t.price,
                 'reason', t.reason, 'pnl', t.pnl, 'created_at', t.created_at) order by t.id desc), '[]'::jsonb)
               from (select * from tf_trades where user_id = v_uid order by id desc limit 30) t),
    'now_index', n
  );
end;
$$;

create or replace function public.tf_live_trade(p_symbol text, p_side text, p_qty numeric)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  n     int := public.tf_now_index();
  px    numeric;
  p     tf_positions;
  delta numeric := case when p_side = 'buy' then p_qty else -p_qty end;
  newq  numeric;
  pnl   numeric := 0;
  fee   numeric;
  v_eq  numeric;
  gross numeric;
begin
  if v_uid is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if p_side not in ('buy','sell') then raise exception 'Unknown order side.'; end if;
  if p_qty is null or p_qty < 1 or p_qty <> trunc(p_qty) then raise exception 'Quantity must be a whole number of shares.'; end if;
  insert into tf_accounts(user_id) values (v_uid) on conflict do nothing;
  perform public.tf_live_settle(v_uid);
  px := public.tf_live_price(p_symbol);
  if px is null then raise exception 'Unknown ticker.'; end if;
  perform 1 from tf_accounts where user_id = v_uid for update;
  select * into p from tf_positions where user_id = v_uid and symbol = p_symbol for update;
  fee := round(p_qty * px * 0.001, 2);
  if found then
    if sign(delta) <> sign(p.qty) then pnl := round((px - p.avg_price) * least(abs(delta), abs(p.qty)) * sign(p.qty), 2); end if;
    newq := p.qty + delta;
    if newq = 0 then
      delete from tf_positions where user_id = v_uid and symbol = p_symbol;
    elsif sign(newq) <> sign(p.qty) then
      update tf_positions set qty = newq, avg_price = px, stop_price = null, take_price = null, checked_i = n where user_id = v_uid and symbol = p_symbol;
    elsif sign(delta) = sign(p.qty) then
      update tf_positions set qty = newq, avg_price = round((p.avg_price * abs(p.qty) + px * abs(delta)) / abs(newq), 4), checked_i = n
      where user_id = v_uid and symbol = p_symbol;
    else
      update tf_positions set qty = newq, checked_i = n where user_id = v_uid and symbol = p_symbol;
    end if;
  else
    insert into tf_positions(user_id, symbol, qty, avg_price, checked_i) values (v_uid, p_symbol, delta, px, n);
  end if;
  update tf_accounts a set cash = a.cash - delta * px - fee, fees = a.fees + fee where a.user_id = v_uid returning a.cash into v_eq;
  select coalesce(sum(abs(x.qty) * public.tf_live_price(x.symbol)), 0), v_eq + coalesce(sum(x.qty * public.tf_live_price(x.symbol)), 0)
    into gross, v_eq from tf_positions x where x.user_id = v_uid;
  if gross > v_eq * 1.0001 then
    raise exception 'Not enough buying power: positions can be at most 100%% of your equity (no leverage).' using errcode = 'P0001';
  end if;
  insert into tf_trades(user_id, symbol, side, qty, price, reason, pnl) values (v_uid, p_symbol, p_side, p_qty, px, 'market', pnl);
  return public.tf_live_account();
end;
$$;

create or replace function public.tf_live_set_exits(p_symbol text, p_stop numeric, p_take numeric)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  p     tf_positions;
  px    numeric;
begin
  select * into p from tf_positions where user_id = v_uid and symbol = p_symbol for update;
  if not found then raise exception 'Open a position first.'; end if;
  px := public.tf_live_price(p_symbol);
  if p.qty > 0 and ((p_stop is not null and p_stop >= px) or (p_take is not null and p_take <= px)) then
    raise exception 'For a long position the stop goes below the price and the target above it.';
  end if;
  if p.qty < 0 and ((p_stop is not null and p_stop <= px) or (p_take is not null and p_take >= px)) then
    raise exception 'For a short position the stop goes above the price and the target below it.';
  end if;
  update tf_positions set stop_price = p_stop, take_price = p_take, checked_i = public.tf_now_index()
  where user_id = v_uid and symbol = p_symbol;
  return public.tf_live_account();
end;
$$;

-- ---------------------------------------------------------------------
-- 4. Access: players use the functions only
-- ---------------------------------------------------------------------
revoke execute on function
  public.tf_u(text, int, int), public.tf_n(text, int, int), public.tf_round_price(numeric),
  public.tf_step(text, int, numeric, numeric, double precision), public.tf_path(text, int), public.tf_symbol(text),
  public.tf_week_start(), public.tf_c(jsonb, int, int), public.tf_fill(public.tf_rounds, text, numeric, numeric, text),
  public.tf_mark(public.tf_rounds), public.tf_finish_row(public.tf_rounds), public.tf_round_view(public.tf_rounds, int),
  public.tf_my_round(uuid), public.tf_epoch(), public.tf_now_index(), public.tf_ensure_candles(text, int),
  public.tf_live_price(text), public.tf_live_settle(uuid),
  public.tf_start_round(text), public.tf_get_round(uuid), public.tf_advance(uuid, int), public.tf_order(uuid, text, numeric),
  public.tf_set_exits(uuid, numeric, numeric), public.tf_finish(uuid), public.tf_my_rounds(int), public.tf_weekly_leaderboard(int),
  public.tf_live_tickers(), public.tf_live_candles(text, int), public.tf_live_account(), public.tf_live_trade(text, text, numeric),
  public.tf_live_set_exits(text, numeric, numeric)
from public, anon, authenticated;
grant execute on function
  public.tf_start_round(text), public.tf_get_round(uuid), public.tf_advance(uuid, int), public.tf_order(uuid, text, numeric),
  public.tf_set_exits(uuid, numeric, numeric), public.tf_finish(uuid), public.tf_my_rounds(int), public.tf_weekly_leaderboard(int),
  public.tf_live_tickers(), public.tf_live_candles(text, int), public.tf_live_account(), public.tf_live_trade(text, text, numeric),
  public.tf_live_set_exits(text, numeric, numeric)
to authenticated;

-- =====================================================================
-- FINLAB 0017 — Trading Floor extras
--   * Limit orders in rounds: "buy if it drops to X" / "sell if it rises to X".
--     They fill inside a later candle when the price reaches them (gaps fill
--     at the open), and are cancelled if they would break the no-leverage rule.
--   * Trade journal: an optional note on each order (rounds and live market).
--   * Trading badges: First Profit, Risk Manager, Weekly Challenger.
-- Safe to re-run.
-- =====================================================================

alter table public.tf_rounds add column if not exists limit_side text check (limit_side in ('buy','sell'));
alter table public.tf_rounds add column if not exists limit_qty numeric;
alter table public.tf_rounds add column if not exists limit_price numeric;
alter table public.tf_fills add column if not exists note text check (note is null or char_length(note) <= 500);
alter table public.tf_trades add column if not exists note text check (note is null or char_length(note) <= 500);
alter table public.tf_fills drop constraint if exists tf_fills_reason_check;
alter table public.tf_fills add constraint tf_fills_reason_check check (reason in ('market','stop','take','close','limit'));

insert into public.achievements (id, name, description, icon, tier, criteria, sort_order) values
  ('tf_first_profit', 'First Profit', 'Finished a Trading Floor round in profit.', 'trending-up', 'bronze', '{"type":"manual"}', 40),
  ('tf_risk_manager', 'Risk Manager', 'Finished a profitable round with at least 3 trades and a drawdown under 5%.', 'target', 'silver', '{"type":"manual"}', 41),
  ('tf_weekly', 'Weekly Challenger', 'Completed a Trading Floor weekly challenge.', 'swords', 'bronze', '{"type":"manual"}', 42)
on conflict (id) do nothing;

-- Awards trading badges for a finished round (idempotent).
create or replace function public.tf_award_badges(r public.tf_rounds)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  a record;
begin
  for a in
    select id, name, description from achievements
    where (id = 'tf_first_profit' and r.return_pct > 0)
       or (id = 'tf_risk_manager' and r.return_pct > 0 and r.trades >= 3 and r.max_drawdown < 5)
       or (id = 'tf_weekly' and r.kind = 'weekly')
  loop
    insert into user_achievements (user_id, achievement_id) values (r.user_id, a.id) on conflict do nothing;
    if found then
      perform public.notify(r.user_id, 'achievement', 'Achievement unlocked: ' || a.name, a.description, '/passport');
    end if;
  end loop;
end;
$$;

-- What the player may see (adds the pending limit order and journal notes).
create or replace function public.tf_round_view(r public.tf_rounds, p_from int default 0)
returns jsonb
language sql stable set search_path = public
as $$
  select jsonb_build_object(
    'id', r.id, 'kind', r.kind, 'symbol', r.symbol, 'week_start', r.week_start, 'status', r.status,
    'cursor', r.cursor, 'last_index', r.last_index, 'start_cash', r.start_cash,
    'cash', round(r.cash, 2), 'qty', r.qty, 'avg_price', r.avg_price,
    'stop_price', r.stop_price, 'take_price', r.take_price, 'fees', r.fees, 'realized', r.realized,
    'limit_side', r.limit_side, 'limit_qty', r.limit_qty, 'limit_price', r.limit_price,
    'trades', r.trades, 'wins', r.wins, 'max_drawdown', r.max_drawdown,
    'price', public.tf_c(r.series, r.cursor, 3),
    'equity', round(r.cash + r.qty * public.tf_c(r.series, r.cursor, 3), 2),
    'final_equity', r.final_equity, 'return_pct', r.return_pct, 'score', r.score,
    'from', greatest(p_from, 0),
    'candles', (select coalesce(jsonb_agg(r.series -> k order by k), '[]'::jsonb) from generate_series(greatest(p_from, 0), r.cursor) k),
    'fills', (select coalesce(jsonb_agg(jsonb_build_object('i', f.i, 'side', f.side, 'qty', f.qty, 'price', f.price, 'reason', f.reason, 'pnl', f.pnl, 'note', f.note) order by f.id), '[]'::jsonb)
              from tf_fills f where f.round_id = r.id)
  )
$$;

-- Advance: pending limit orders fill first, then stops/targets on the open position.
create or replace function public.tf_advance(p_round uuid, p_steps int default 1)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r      tf_rounds := public.tf_my_round(p_round);
  v_from int := r.cursor + 1;
  k      int;
  op numeric; hi numeric; lo numeric; px numeric;
  newq numeric; fee numeric;
begin
  if r.status <> 'active' then return public.tf_round_view(r, r.cursor + 1); end if;
  for k in 1 .. greatest(1, least(coalesce(p_steps, 1), 20)) loop
    exit when r.cursor >= r.last_index;
    r.cursor := r.cursor + 1;
    op := public.tf_c(r.series, r.cursor, 0); hi := public.tf_c(r.series, r.cursor, 1); lo := public.tf_c(r.series, r.cursor, 2);
    if r.limit_side is not null and ((r.limit_side = 'buy' and lo <= r.limit_price) or (r.limit_side = 'sell' and hi >= r.limit_price)) then
      px := case when r.limit_side = 'buy' then least(op, r.limit_price) else greatest(op, r.limit_price) end;
      newq := r.qty + case when r.limit_side = 'buy' then r.limit_qty else -r.limit_qty end;
      fee := round(r.limit_qty * px * 0.001, 2);
      -- Same no-leverage rule as market orders; if it would break it, the order is cancelled instead.
      if abs(newq) * px <= (r.cash + r.qty * px - fee) * 1.0001 then
        r := public.tf_fill(r, r.limit_side, r.limit_qty, px, 'limit');
      end if;
      r.limit_side := null; r.limit_qty := null; r.limit_price := null;
    end if;
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
  if r.cursor >= r.last_index then
    r := public.tf_finish_row(r);
    r.limit_side := null; r.limit_qty := null; r.limit_price := null;
  end if;
  update tf_rounds set cursor = r.cursor, cash = r.cash, qty = r.qty, avg_price = r.avg_price, stop_price = r.stop_price,
    take_price = r.take_price, fees = r.fees, realized = r.realized, trades = r.trades, wins = r.wins,
    peak_equity = r.peak_equity, max_drawdown = r.max_drawdown, status = r.status, final_equity = r.final_equity,
    return_pct = r.return_pct, score = r.score, finished_at = r.finished_at,
    limit_side = r.limit_side, limit_qty = r.limit_qty, limit_price = r.limit_price
  where id = r.id;
  if r.status = 'finished' then perform public.tf_award_badges(r); end if;
  return public.tf_round_view(r, v_from);
end;
$$;

-- Market order with an optional journal note. (Replaces the 3-argument version.)
drop function if exists public.tf_order(uuid, text, numeric);
create or replace function public.tf_order(p_round uuid, p_side text, p_qty numeric, p_note text default null)
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
  if nullif(trim(p_note), '') is not null then
    update tf_fills set note = left(trim(p_note), 500) where id = (select max(id) from tf_fills where round_id = r.id);
  end if;
  r := public.tf_mark(r);
  update tf_rounds set cash = r.cash, qty = r.qty, avg_price = r.avg_price, stop_price = r.stop_price, take_price = r.take_price,
    fees = r.fees, realized = r.realized, trades = r.trades, wins = r.wins, peak_equity = r.peak_equity, max_drawdown = r.max_drawdown
  where id = r.id;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

-- Limit order (one pending at a time; placing a new one replaces it). Buy limits go below the price, sell limits above.
create or replace function public.tf_place_limit(p_round uuid, p_side text, p_qty numeric, p_price numeric)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r  tf_rounds := public.tf_my_round(p_round);
  px numeric;
begin
  if r.status <> 'active' then raise exception 'This round is over.'; end if;
  if p_side not in ('buy','sell') then raise exception 'Unknown order side.'; end if;
  if p_qty is null or p_qty < 1 or p_qty <> trunc(p_qty) then raise exception 'Quantity must be a whole number of shares.'; end if;
  px := public.tf_c(r.series, r.cursor, 3);
  if p_price is null or p_price <= 0 then raise exception 'Enter a limit price.'; end if;
  if p_side = 'buy' and p_price >= px then raise exception 'A buy limit goes below the current price. To buy now, use a market order.'; end if;
  if p_side = 'sell' and p_price <= px then raise exception 'A sell limit goes above the current price. To sell now, use a market order.'; end if;
  update tf_rounds set limit_side = p_side, limit_qty = p_qty, limit_price = p_price where id = r.id returning * into r;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

create or replace function public.tf_cancel_limit(p_round uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r tf_rounds := public.tf_my_round(p_round);
begin
  update tf_rounds set limit_side = null, limit_qty = null, limit_price = null where id = r.id returning * into r;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

-- Ending a round early also awards badges.
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
      status = r.status, final_equity = r.final_equity, return_pct = r.return_pct, score = r.score, finished_at = r.finished_at,
      limit_side = null, limit_qty = null, limit_price = null
    where id = r.id;
    perform public.tf_award_badges(r);
  end if;
  return public.tf_round_view(r, r.cursor + 1);
end;
$$;

-- Live market: optional journal note on trades.
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
                 'reason', t.reason, 'pnl', t.pnl, 'note', t.note, 'created_at', t.created_at) order by t.id desc), '[]'::jsonb)
               from (select * from tf_trades where user_id = v_uid order by id desc limit 30) t),
    'now_index', n
  );
end;
$$;

drop function if exists public.tf_live_trade(text, text, numeric);
create or replace function public.tf_live_trade(p_symbol text, p_side text, p_qty numeric, p_note text default null)
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
  insert into tf_trades(user_id, symbol, side, qty, price, reason, pnl, note)
  values (v_uid, p_symbol, p_side, p_qty, px, 'market', pnl, left(nullif(trim(p_note), ''), 500));
  return public.tf_live_account();
end;
$$;

revoke execute on function
  public.tf_award_badges(public.tf_rounds), public.tf_round_view(public.tf_rounds, int),
  public.tf_advance(uuid, int), public.tf_order(uuid, text, numeric, text), public.tf_place_limit(uuid, text, numeric, numeric),
  public.tf_cancel_limit(uuid), public.tf_finish(uuid), public.tf_live_account(), public.tf_live_trade(text, text, numeric, text)
from public, anon, authenticated;
grant execute on function
  public.tf_advance(uuid, int), public.tf_order(uuid, text, numeric, text), public.tf_place_limit(uuid, text, numeric, numeric),
  public.tf_cancel_limit(uuid), public.tf_finish(uuid), public.tf_live_account(), public.tf_live_trade(text, text, numeric, text)
to authenticated;

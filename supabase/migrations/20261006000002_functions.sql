-- =====================================================================
-- FINLAB — 0002 Business logic (scoring engine, progression, RPCs)
-- ---------------------------------------------------------------------
-- All calculated data (skills, FINLAB Score, achievements, promotions,
-- rankings, portfolio cash/positions) is written exclusively by the
-- SECURITY DEFINER functions in this file. Clients call the public RPCs;
-- internal helpers have EXECUTE revoked in 0003_security.sql.
-- =====================================================================

-- =====================================================================
-- 1. GENERIC HELPERS
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.setting_num(p_key text, p_default numeric)
returns numeric
language sql stable security definer set search_path = public
as $$
  select coalesce((select (value #>> '{}')::numeric from public.app_settings where key = p_key), p_default);
$$;

create or replace function public.word_count(p_text text)
returns int
language sql immutable
as $$
  select case when p_text is null or btrim(p_text) = '' then 0
              else coalesce(array_length(regexp_split_to_array(btrim(p_text), '\s+'), 1), 0) end;
$$;

-- Count of numeric figures (e.g. "12", "4.5%", "1,200") — a proxy for quantitative support.
create or replace function public.number_count(p_text text)
returns int
language sql immutable
as $$
  select count(*)::int from regexp_matches(coalesce(p_text, ''), '[0-9]+(?:[.,][0-9]+)*', 'g');
$$;

-- Count of non-empty lines (one item per line: risks, catalysts, ...).
create or replace function public.item_count(p_text text)
returns int
language sql immutable
as $$
  select count(*)::int from regexp_split_to_table(coalesce(p_text, ''), E'\n') as l(line)
  where btrim(l.line, E' \t\r-*•') <> '';
$$;

-- min(1, a/b) with protection against b <= 0
create or replace function public.ratio(p_a numeric, p_b numeric)
returns numeric
language sql immutable
as $$
  select case when p_b is null or p_b <= 0 then 0 else least(1, greatest(0, coalesce(p_a, 0) / p_b)) end;
$$;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text)
returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications(user_id, kind, title, body, link)
  values (p_user, p_kind, p_title, coalesce(p_body, ''), p_link);
$$;

-- =====================================================================
-- 2. NEW USER BOOTSTRAP (trigger on auth.users)
-- =====================================================================
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

  insert into public.profiles(id, handle, full_name) values (new.id, v_handle, left(v_name, 120));
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3. METRICS & RANKS
-- =====================================================================
create or replace function public.user_metric(p_user uuid, p_metric text, p_arg text default null)
returns numeric
language plpgsql stable security definer set search_path = public
as $$
begin
  case p_metric
    when 'challenges_completed' then
      return (select count(distinct challenge_id) from challenge_submissions
              where user_id = p_user and status = 'scored');
    when 'challenges_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s
              join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score);
    when 'category_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s
              join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score
                and c.category_id = p_arg);
    when 'tag_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s
              join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score
                and p_arg = any(c.tags));
    when 'challenge_submissions' then
      return (select count(*) from challenge_submissions where user_id = p_user);
    when 'stock_pitches_submitted' then
      return (select count(*) from stock_pitches where user_id = p_user and status = 'submitted');
    when 'research_reports_submitted' then
      return (select count(*) from research_projects where user_id = p_user and status = 'submitted');
    when 'valuation_models' then
      return (select count(*) from valuation_models where user_id = p_user);
    when 'financial_models' then
      return (select count(*) from financial_models where user_id = p_user);
    when 'portfolio_trades' then
      return (select count(*) from portfolio_transactions where user_id = p_user);
    when 'market_event_decisions' then
      return (select count(*) from market_event_decisions where user_id = p_user);
    when 'competitions_joined' then
      return (select count(*) from competition_participants where user_id = p_user);
    when 'competitions_won' then
      return (select count(*) from competition_results where user_id = p_user and rank = 1);
    when 'competitions_top3' then
      return (select count(*) from competition_results where user_id = p_user and rank <= 3);
    when 'lessons_completed' then
      return (select count(*) from lesson_progress where user_id = p_user);
    when 'finlab_score' then
      return (select finlab_score from user_stats where user_id = p_user);
    when 'skill_score' then
      return coalesce((select score from user_skills where user_id = p_user and skill_id = p_arg), 0);
    else
      raise exception 'Unknown metric: %', p_metric;
  end case;
end;
$$;

-- Rank of a user on the FINLAB Score among ranked users (≥1 scored activity).
-- scope: 'global' | 'country' (user's own country)
create or replace function public.user_score_rank(p_user uuid, p_scope text default 'global')
returns table(rank int, total int)
language sql stable security definer set search_path = public
as $$
  with me as (
    select s.finlab_score, s.scored_activity_count, p.country_code
    from user_stats s join profiles p on p.id = s.user_id where s.user_id = p_user
  ), pool as (
    select s.user_id, s.finlab_score
    from user_stats s join profiles p on p.id = s.user_id, me
    where s.scored_activity_count > 0
      and (p_scope = 'global' or p.country_code = me.country_code)
  )
  select case when (select scored_activity_count from me) > 0
              then (select count(*)::int + 1 from pool where pool.finlab_score > (select finlab_score from me))
         end as rank,
         (select count(*)::int from pool) as total;
$$;

-- =====================================================================
-- 4. SKILLS & FINLAB SCORE
-- =====================================================================
-- skill score = weighted mean of evidence × confidence
-- confidence  = min(1, total evidence weight / skill_confidence_threshold)
-- FINLAB Score = Σ(skill.weight × skill score) / Σ(skill.weight)
create or replace function public.recalculate_user_scores(p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_threshold numeric := public.setting_num('skill_confidence_threshold', 2);
begin
  insert into user_skills(user_id, skill_id)
    select p_user, s.id from skills s on conflict do nothing;

  update user_skills us
     set score = x.score, evidence_weight = x.w, evidence_count = x.n, updated_at = now()
    from (
      select s.id as skill_id,
             coalesce(round((sum(e.score * e.weight) / nullif(sum(e.weight), 0))
                            * least(1, coalesce(sum(e.weight), 0) / v_threshold), 2), 0) as score,
             coalesce(sum(e.weight), 0) as w,
             count(e.skill_id)::int as n
      from skills s
      left join skill_evidence e on e.skill_id = s.id and e.user_id = p_user
      group by s.id
    ) x
   where us.user_id = p_user and us.skill_id = x.skill_id;

  update user_stats
     set finlab_score = coalesce((
           select round(sum(us.score * s.weight) / nullif(sum(s.weight), 0), 2)
           from user_skills us join skills s on s.id = us.skill_id
           where us.user_id = p_user), 0),
         scored_activity_count = (
           select count(*)::int from (select distinct source_type, source_id
                                      from skill_evidence where user_id = p_user) d),
         last_scored_at = now(),
         updated_at = now()
   where user_id = p_user;
end;
$$;

-- Evidence from a challenge = the user's BEST final score on it, applied to
-- each skill in the challenge's skill_impact map (so retries can't farm weight).
create or replace function public.refresh_challenge_evidence(p_user uuid, p_challenge uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_best   numeric;
  v_impact jsonb;
begin
  delete from skill_evidence
   where user_id = p_user and source_type = 'challenge' and source_id = p_challenge;

  select max(final_score) into v_best from challenge_submissions
   where user_id = p_user and challenge_id = p_challenge and status = 'scored';
  if v_best is null then return; end if;

  select skill_impact into v_impact from challenges where id = p_challenge;

  insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight)
  select p_user, j.key, 'challenge', p_challenge, v_best, least(1, (j.value)::numeric)
  from jsonb_each_text(coalesce(v_impact, '{}'::jsonb)) as j(key, value)
  where exists (select 1 from skills where id = j.key)
    and (j.value)::numeric > 0;
end;
$$;

-- Evidence from a rubric-scored artefact (pitch / research report):
-- each criterion maps to one skill; skill evidence = mean of its criteria.
create or replace function public.record_rubric_evidence(
  p_user uuid, p_source_type text, p_source_id uuid, p_criteria jsonb, p_weight numeric)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from skill_evidence
   where user_id = p_user and source_type = p_source_type and source_id = p_source_id;

  insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight)
  select p_user, c->>'skill_id', p_source_type, p_source_id,
         round(avg((c->>'score')::numeric), 2), p_weight
  from jsonb_array_elements(p_criteria) c
  where c->>'skill_id' is not null and exists (select 1 from skills where id = c->>'skill_id')
  group by c->>'skill_id';
end;
$$;

-- =====================================================================
-- 5. ACHIEVEMENTS
-- =====================================================================
create or replace function public.achievement_criteria_met(p_user uuid, p_criteria jsonb)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_type  text := p_criteria->>'type';
  v_item  jsonb;
  v_rank  int;
  v_total int;
begin
  if v_type = 'all' then
    for v_item in select * from jsonb_array_elements(coalesce(p_criteria->'conditions', '[]'::jsonb)) loop
      if not public.achievement_criteria_met(p_user, v_item) then return false; end if;
    end loop;
    return true;
  elsif v_type = 'metric' then
    return public.user_metric(p_user, p_criteria->>'metric', p_criteria->>'arg')
           >= (p_criteria->>'gte')::numeric;
  elsif v_type = 'percentile' then
    select r.rank, r.total into v_rank, v_total from public.user_score_rank(p_user, 'global') r;
    if v_rank is null or v_total < coalesce((p_criteria->>'min_population')::int, 1) then
      return false;
    end if;
    return (v_rank::numeric / v_total) * 100 <= (p_criteria->>'max_pct')::numeric;
  end if;
  return false;
end;
$$;

create or replace function public.evaluate_achievements(p_user uuid)
returns text[]
language plpgsql security definer set search_path = public
as $$
declare
  a        record;
  v_new    text[] := '{}';
begin
  for a in
    select * from achievements ach
    where ach.is_active
      and not exists (select 1 from user_achievements ua where ua.user_id = p_user and ua.achievement_id = ach.id)
    order by ach.sort_order
  loop
    if public.achievement_criteria_met(p_user, a.criteria) then
      insert into user_achievements(user_id, achievement_id) values (p_user, a.id) on conflict do nothing;
      perform public.notify(p_user, 'achievement', 'Achievement unlocked: ' || a.name, a.description, '/passport');
      v_new := v_new || a.id;
    end if;
  end loop;
  return v_new;
end;
$$;

-- Recalculate everything derived for a user, then award achievements.
create or replace function public.process_user_progress(p_user uuid)
returns text[]
language plpgsql security definer set search_path = public
as $$
begin
  perform public.recalculate_user_scores(p_user);
  return public.evaluate_achievements(p_user);
end;
$$;

-- Client-callable refresh (e.g. percentile achievements after others move).
create or replace function public.refresh_my_progress()
returns text[]
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  return public.process_user_progress(auth.uid());
end;
$$;

-- =====================================================================
-- 6. DETERMINISTIC SCORING ENGINE
-- ---------------------------------------------------------------------
-- These functions are the "judge" interface. A future AI Judge would write
-- challenge_scores rows with scorer_type = 'ai' through the same pipeline
-- (finalize_submission_score) without changing callers.
-- =====================================================================

-- Build rubric output: [{key,label,weight,skill_id,score}] + weighted total
create or replace function public.apply_rubric(p_rubric_id text, p_scores jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_criteria jsonb;
  v_out      jsonb := '[]'::jsonb;
  v_total    numeric := 0;
  v_wsum     numeric := 0;
  c          jsonb;
  v_score    numeric;
begin
  select criteria into v_criteria from scoring_rubrics where id = p_rubric_id;
  if v_criteria is null then raise exception 'Rubric % not found', p_rubric_id; end if;
  for c in select * from jsonb_array_elements(v_criteria) loop
    v_score := round(least(100, greatest(0, coalesce((p_scores->>(c->>'key'))::numeric, 0))), 2);
    v_out := v_out || jsonb_build_object(
      'key', c->>'key', 'label', c->>'label', 'weight', (c->>'weight')::numeric,
      'skill_id', c->>'skill_id', 'score', v_score, 'max', 100);
    v_total := v_total + v_score * (c->>'weight')::numeric;
    v_wsum  := v_wsum + (c->>'weight')::numeric;
  end loop;
  return jsonb_build_object('total', round(v_total / nullif(v_wsum, 0), 2), 'criteria', v_out);
end;
$$;

-- ---------- Stock pitch rubric --------------------------------------
create or replace function public.score_stock_pitch(p_pitch_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  p          stock_pitches%rowtype;
  v_cfg      jsonb;
  v_quick    boolean;
  v_thr      numeric;
  v_max_up   numeric;
  v_upside   numeric;
  v_scores   jsonb := '{}'::jsonb;
  v_n_src    int;
  v_n_url    int;
  v_all      text;
  v_words    int;
  v_sent     int;
  v_s        numeric;
  v_timing   text := '(q[1-4]|h[12]|fy|20[0-9]{2}|month|week|quarter|year|january|february|march|april|may|june|july|august|september|october|november|december|next|upcoming|within|by end)';
  v_method   text := '(dcf|discounted cash|p/e|pe ratio|price.to.earnings|p/b|price.to.book|multiple|ev/ebitda|wacc|dividend discount|ddm|sum.of.the.parts|sotp|terminal)';
begin
  select * into p from stock_pitches where id = p_pitch_id;
  if not found then raise exception 'Pitch not found'; end if;
  select config into v_cfg from scoring_rubrics where id = 'stock_pitch_v1';
  v_quick  := p.format = 'quick';
  v_thr    := coalesce((v_cfg->>'rating_threshold_pct')::numeric, 10);
  v_max_up := coalesce((v_cfg->>'plausible_upside_pct')::numeric, 60);

  if p.current_price > 0 and p.target_price > 0 then
    v_upside := (p.target_price - p.current_price) / p.current_price * 100;
  end if;

  -- Thesis (20)
  if v_quick then
    v_s := 100 * (0.60 * ratio(word_count(p.thesis), 120)
                + 0.25 * ratio(number_count(p.thesis), 3)
                + 0.15 * ratio(item_count(p.thesis), 2));
  else
    v_s := 100 * (0.45 * ratio(word_count(p.thesis), 300)
                + 0.20 * ratio(number_count(p.thesis), 3)
                + 0.15 * ratio(item_count(p.thesis), 2)
                + 0.20 * ratio(word_count(p.variant_perception), 100));
  end if;
  v_scores := v_scores || jsonb_build_object('thesis', v_s);

  -- Financial analysis (20)
  if v_quick then
    v_s := 100 * (0.60 * ratio(number_count(p.thesis || ' ' || p.catalysts || ' ' || p.risks), 6)
                + 0.40 * ratio(word_count(p.thesis), 150));
  else
    v_s := 100 * (0.35 * ratio(word_count(p.financial_analysis), 250)
                + 0.25 * ratio(number_count(p.financial_analysis || ' ' || p.forecast), 8)
                + 0.20 * ratio(word_count(p.forecast), 150)
                + 0.20 * ratio(word_count(p.company_analysis), 150));
  end if;
  v_scores := v_scores || jsonb_build_object('financial_analysis', v_s);

  -- Valuation (20): presence, rating consistency, plausibility, methodology
  v_s := 0;
  if v_upside is not null then
    v_s := 30;
    if (p.rating = 'BUY' and v_upside >= v_thr)
       or (p.rating = 'SELL' and v_upside <= -v_thr)
       or (p.rating = 'HOLD' and abs(v_upside) < v_thr) then
      v_s := v_s + 30;
    elsif (p.rating = 'BUY' and v_upside > 0) or (p.rating = 'SELL' and v_upside < 0) then
      v_s := v_s + 10;
    end if;
    v_s := v_s + case when abs(v_upside) <= v_max_up then 15 else 5 end;
  end if;
  if v_quick then
    v_s := v_s + case when coalesce(btrim(p.valuation_method), '') <> '' then 25 else 0 end;
  else
    v_s := v_s + 25 * (0.6 * ratio(word_count(p.valuation), 200)
                     + 0.4 * (case when (p.valuation || ' ' || coalesce(p.valuation_method, '')) ~* v_method then 1 else 0 end));
  end if;
  v_scores := v_scores || jsonb_build_object('valuation', v_s);

  -- Risks (15)
  v_s := 100 * (0.50 * ratio(item_count(p.risks), 3)
              + 0.30 * ratio(word_count(p.risks), case when v_quick then 60 else 150 end)
              + 0.20 * (case when p.risks ~* '(mitigat|offset|monitor|hedg|downside|probability|sensitiv|scenario)' then 1 else 0 end));
  v_scores := v_scores || jsonb_build_object('risk', v_s);

  -- Catalysts (10)
  v_s := 100 * (0.60 * ratio(item_count(p.catalysts), 3)
              + 0.40 * (case when p.catalysts ~* v_timing then 1 else 0 end));
  v_scores := v_scores || jsonb_build_object('catalysts', v_s);

  -- Communication (10): appropriate length, readable sentences, identification
  v_all := concat_ws(' ', p.thesis, p.catalysts, p.risks, p.company_analysis, p.financial_analysis,
                     p.forecast, p.valuation, p.variant_perception);
  v_words := word_count(v_all);
  v_sent  := greatest(1, (select count(*)::int from regexp_matches(v_all, '[.!?](\s|$)', 'g')));
  if v_quick then
    v_s := case when v_words < 250 then 100 * ratio(v_words, 250)
                when v_words > 1500 then greatest(60, 100 - (v_words - 1500) / 15.0)
                else 100 end;
  else
    v_s := case when v_words < 1000 then 100 * ratio(v_words, 1000)
                when v_words > 6000 then greatest(60, 100 - (v_words - 6000) / 60.0)
                else 100 end;
  end if;
  if v_words > 0 and (v_words::numeric / v_sent < 8 or v_words::numeric / v_sent > 35) then
    v_s := v_s * 0.85;
  end if;
  if btrim(p.company) = '' or btrim(p.ticker) = '' then v_s := v_s * 0.8; end if;
  v_scores := v_scores || jsonb_build_object('communication', v_s);

  -- Sources (5)
  select count(*), count(*) filter (where url is not null) into v_n_src, v_n_url
  from sources where stock_pitch_id = p.id;
  v_s := 100 * (0.7 * ratio(v_n_src, 3) + 0.3 * ratio(v_n_url, greatest(v_n_src, 1)));
  v_scores := v_scores || jsonb_build_object('sources', v_s);

  return public.apply_rubric('stock_pitch_v1', v_scores)
         || jsonb_build_object('upside_pct', round(v_upside, 2));
end;
$$;

-- ---------- Research report rubric ----------------------------------
create or replace function public.score_research_project(p_project_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_sec      jsonb;
  v_scores   jsonb := '{}'::jsonb;
  v_n_src    int;
  v_n_url    int;
  v_words    int;
  v_s        numeric;
  v_rp       research_projects%rowtype;
  v_upside   numeric;
  v_method   text := '(dcf|discounted cash|p/e|price.to.earnings|p/b|price.to.book|multiple|ev/ebitda|wacc|dividend discount|ddm|sum.of.the.parts|sotp|terminal)';
begin
  select * into v_rp from research_projects where id = p_project_id;
  if not found then raise exception 'Research project not found'; end if;
  select coalesce(jsonb_object_agg(section_key, content), '{}'::jsonb) into v_sec
  from research_sections where project_id = p_project_id;

  -- Investment thesis (20)
  v_s := 100 * (0.6 * ratio(word_count(v_sec->>'investment_thesis'), 150)
              + 0.2 * ratio(number_count(v_sec->>'investment_thesis'), 3)
              + 0.2 * ratio(word_count(v_sec->>'conclusion'), 80));
  v_scores := v_scores || jsonb_build_object('thesis', v_s);

  -- Business & industry understanding (15)
  v_s := 100 * (ratio(word_count(v_sec->>'company_overview'), 150)
              + ratio(word_count(v_sec->>'industry_overview'), 150)
              + ratio(word_count(v_sec->>'competitive_analysis'), 150)) / 3;
  v_scores := v_scores || jsonb_build_object('business_understanding', v_s);

  -- Financial analysis & forecast (20)
  v_s := 100 * (0.35 * ratio(word_count(v_sec->>'financial_analysis'), 200)
              + 0.25 * ratio(number_count(v_sec->>'financial_analysis'), 8)
              + 0.20 * ratio(word_count(v_sec->>'forecast'), 120)
              + 0.20 * ratio(number_count(v_sec->>'forecast'), 5));
  v_scores := v_scores || jsonb_build_object('financial_analysis', v_s);

  -- Valuation (15)
  if v_rp.current_price > 0 and v_rp.target_price > 0 then
    v_upside := (v_rp.target_price - v_rp.current_price) / v_rp.current_price * 100;
  end if;
  v_s := 100 * (0.45 * ratio(word_count(v_sec->>'valuation'), 150)
              + 0.25 * (case when coalesce(v_sec->>'valuation', '') ~* v_method then 1 else 0 end)
              + 0.30 * (case when v_upside is null then 0
                             when (v_rp.rating = 'BUY' and v_upside > 0) or (v_rp.rating = 'SELL' and v_upside < 0)
                                  or (v_rp.rating = 'HOLD') then 1 else 0.3 end));
  v_scores := v_scores || jsonb_build_object('valuation', v_s);

  -- Catalysts & risks (15)
  v_s := 100 * (0.5 * ratio(item_count(v_sec->>'catalysts'), 3)
              + 0.5 * ratio(item_count(v_sec->>'risks'), 3));
  v_scores := v_scores || jsonb_build_object('catalysts_risks', v_s);

  -- Communication (10)
  select coalesce(sum(word_count(content)), 0) into v_words from research_sections where project_id = p_project_id;
  v_s := case when v_words < 1200 then 100 * ratio(v_words, 1200)
              when v_words > 10000 then 70 else 100 end;
  if btrim(v_rp.company) = '' or v_rp.rating is null then v_s := v_s * 0.8; end if;
  v_scores := v_scores || jsonb_build_object('communication', v_s);

  -- Sources (5)
  select count(*), count(*) filter (where url is not null) into v_n_src, v_n_url
  from sources where research_project_id = p_project_id;
  v_s := 100 * (0.7 * ratio(v_n_src, 5) + 0.3 * ratio(v_n_url, greatest(v_n_src, 1)));
  v_scores := v_scores || jsonb_build_object('sources', v_s);

  return public.apply_rubric('research_report_v1', v_scores);
end;
$$;

-- ---------- Task-based challenges (MCQ / numeric / written) ----------
create or replace function public.grade_task_responses(p_challenge uuid, p_responses jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_tasks   jsonb;
  v_keys    jsonb;
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
  select content->'tasks' into v_tasks from challenges where id = p_challenge;
  select answers into v_keys from challenge_answer_keys where challenge_id = p_challenge;
  v_keys := coalesce(v_keys, '{}'::jsonb);

  for t in select * from jsonb_array_elements(coalesce(v_tasks, '[]'::jsonb)) loop
    v_idx  := v_idx + 1;
    v_pts  := coalesce((t->>'points')::numeric, 10);
    k      := coalesce(v_keys->(t->>'id'), '{}'::jsonb);
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
          v_frac := 0.5;  -- partial credit: right approach, rounding/assumption drift
        end if;
      end if;
      v_fb := case when v_frac = 1 then 'Within tolerance'
                   when v_frac = 0.5 then 'Close — partial credit'
                   when v_num is null then 'No numeric answer'
                   else 'Outside tolerance' end;

    else -- 'text' / 'long_text'
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
      'key', t->>'id',
      'label', coalesce(t->>'label', 'Task ' || v_idx),
      'score', round(v_frac * v_pts, 2),
      'max', v_pts,
      'feedback', v_fb);
  end loop;

  return jsonb_build_object(
    'total', case when v_total_p > 0 then round(v_total_e / v_total_p * 100, 2) else 0 end,
    'criteria', v_items);
end;
$$;

-- =====================================================================
-- 7. CHALLENGE LIFECYCLE RPCs
-- =====================================================================
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
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into c from challenges where id = p_challenge;
  if not found or (not c.is_published and not public.is_admin()) then
    raise exception 'Challenge not available';
  end if;

  if p_competition is not null then
    select * into comp from competitions where id = p_competition and is_published;
    if not found then raise exception 'Competition not found'; end if;
    if now() < comp.starts_at or now() > comp.ends_at then
      raise exception 'Competition is not active';
    end if;
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

  if c.max_attempts is not null then
    select count(*) into v_used from challenge_attempts
     where user_id = v_uid and challenge_id = p_challenge and status = 'submitted';
    if v_used >= c.max_attempts then
      raise exception 'Maximum attempts (%) reached for this challenge', c.max_attempts;
    end if;
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
            case when c.pitch_format = 'professional'
                 then coalesce(v_deadline, now() + interval '7 days') end)
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

create or replace function public.save_challenge_draft(p_attempt uuid, p_responses jsonb)
returns timestamptz
language plpgsql security definer set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if pg_column_size(p_responses) > 200000 then raise exception 'Draft is too large'; end if;
  update challenge_attempts
     set responses = coalesce(p_responses, '{}'::jsonb), last_saved_at = v_now
   where id = p_attempt and user_id = auth.uid() and status = 'in_progress';
  if not found then raise exception 'Attempt not found or already submitted'; end if;
  return v_now;
end;
$$;

create or replace function public.abandon_challenge_attempt(p_attempt uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update challenge_attempts set status = 'abandoned'
   where id = p_attempt and user_id = auth.uid() and status = 'in_progress';
  if not found then raise exception 'Attempt not found or already closed'; end if;
end;
$$;

-- Makes `p_score_id` the final score for its submission and propagates it
-- to skills, FINLAB Score and achievements. Shared by auto/admin/(future) AI.
create or replace function public.finalize_submission_score(p_score_id uuid)
returns text[]
language plpgsql security definer set search_path = public
as $$
declare
  s  challenge_scores%rowtype;
  sb challenge_submissions%rowtype;
  v_title text;
begin
  select * into s from challenge_scores where id = p_score_id;
  update challenge_scores set is_final = false where submission_id = s.submission_id and id <> s.id and is_final;
  update challenge_scores set is_final = true where id = s.id;
  update challenge_submissions
     set status = 'scored', final_score = s.total_score, scored_at = now()
   where id = s.submission_id
  returning * into sb;

  perform public.refresh_challenge_evidence(sb.user_id, sb.challenge_id);
  select title into v_title from challenges where id = sb.challenge_id;
  perform public.notify(sb.user_id, 'score', 'Scored: ' || v_title,
    format('Your submission scored %s / 100.', s.total_score), '/challenges/' || sb.challenge_id || '?submission=' || sb.id);
  return public.process_user_progress(sb.user_id);
end;
$$;

-- Validates required pitch fields; raises a readable error listing gaps.
create or replace function public.assert_pitch_complete(p stock_pitches)
returns void
language plpgsql stable security definer set search_path = public
as $$
declare
  v_missing text[] := '{}';
begin
  if btrim(p.company) = '' then v_missing := v_missing || 'company'::text; end if;
  if btrim(p.ticker) = '' then v_missing := v_missing || 'ticker'::text; end if;
  if p.rating is null then v_missing := v_missing || 'rating'::text; end if;
  if p.current_price is null then v_missing := v_missing || 'current price'::text; end if;
  if p.target_price is null then v_missing := v_missing || 'target price'::text; end if;
  if btrim(p.thesis) = '' then v_missing := v_missing || 'investment thesis'::text; end if;
  if btrim(p.catalysts) = '' then v_missing := v_missing || 'catalysts'::text; end if;
  if btrim(p.risks) = '' then v_missing := v_missing || 'risks'::text; end if;
  if not exists (select 1 from sources where stock_pitch_id = p.id) then v_missing := v_missing || 'at least one source'::text; end if;
  if p.format = 'professional' then
    if btrim(p.company_analysis) = '' then v_missing := v_missing || 'company analysis'::text; end if;
    if btrim(p.financial_analysis) = '' then v_missing := v_missing || 'financial analysis'::text; end if;
    if btrim(p.forecast) = '' then v_missing := v_missing || 'forecast'::text; end if;
    if btrim(p.valuation) = '' then v_missing := v_missing || 'valuation'::text; end if;
    if btrim(p.variant_perception) = '' then v_missing := v_missing || 'variant perception'::text; end if;
  end if;
  if array_length(v_missing, 1) > 0 then
    raise exception 'Incomplete pitch. Missing: %', array_to_string(v_missing, ', ');
  end if;
end;
$$;

create or replace function public.assert_research_complete(p_project uuid)
returns void
language plpgsql stable security definer set search_path = public
as $$
declare
  v_missing text[];
  rp research_projects%rowtype;
begin
  select * into rp from research_projects where id = p_project;
  select array_agg(replace(section_key, '_', ' ') order by section_key) into v_missing
  from research_sections where project_id = p_project and btrim(content) = '';
  v_missing := coalesce(v_missing, '{}');
  if btrim(rp.company) = '' then v_missing := v_missing || 'company'::text; end if;
  if rp.rating is null then v_missing := v_missing || 'rating'::text; end if;
  if not exists (select 1 from sources where research_project_id = p_project) then
    v_missing := v_missing || 'at least one source'::text;
  end if;
  if array_length(v_missing, 1) > 0 then
    raise exception 'Incomplete report. Missing: %', array_to_string(v_missing, ', ');
  end if;
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
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into a from challenge_attempts where id = p_attempt and user_id = v_uid for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'This attempt has already been submitted'; end if;
  if a.deadline_at is not null and now() > a.deadline_at + v_grace then
    raise exception 'The deadline for this attempt has passed';
  end if;
  select * into c from challenges where id = a.challenge_id;

  if c.kind = 'tasks' then
    if p_responses is not null then a.responses := p_responses; end if;
    v_grade := public.grade_task_responses(c.id, a.responses);
  elsif c.kind = 'stock_pitch' then
    select * into p from stock_pitches where id = a.stock_pitch_id for update;
    perform public.assert_pitch_complete(p);
    v_grade := public.score_stock_pitch(p.id);
    update stock_pitches
       set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
           criteria_scores = v_grade->'criteria', scored_at = now()
     where id = p.id;
    a.responses := jsonb_build_object('stock_pitch_id', p.id);
  else -- research_report
    perform public.assert_research_complete(a.research_project_id);
    v_grade := public.score_research_project(a.research_project_id);
    update research_projects
       set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
           criteria_scores = v_grade->'criteria', scored_at = now()
     where id = a.research_project_id;
    a.responses := jsonb_build_object('research_project_id', a.research_project_id);
  end if;

  update challenge_attempts
     set status = 'submitted', submitted_at = now(), responses = a.responses
   where id = a.id;

  insert into challenge_submissions(attempt_id, user_id, challenge_id, competition_id, responses)
  values (a.id, v_uid, c.id, a.competition_id, a.responses)
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
    'submission_id', v_sub,
    'status', v_status,
    'score', case when v_status = 'scored' then (v_grade->>'total')::numeric end,
    'passed', case when v_status = 'scored' then (v_grade->>'total')::numeric >= c.passing_score end,
    'criteria', case when v_status = 'scored' then v_grade->'criteria' end,
    'new_achievements', to_jsonb(v_new));
end;
$$;

-- =====================================================================
-- 8. STOCK PITCH & RESEARCH RPCs
-- =====================================================================
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

  -- Challenge-linked pitches are submitted through the challenge pipeline.
  if p.challenge_id is not null then
    select id into v_attempt from challenge_attempts
     where stock_pitch_id = p.id and status = 'in_progress';
    if v_attempt is null then raise exception 'Challenge attempt for this pitch is closed'; end if;
    return public.submit_challenge(v_attempt, null);
  end if;

  if p.deadline_at is not null and now() > p.deadline_at + make_interval(mins => public.setting_num('submission_grace_minutes', 5)::int) then
    raise exception 'The deadline for this pitch has passed';
  end if;
  perform public.assert_pitch_complete(p);
  v_grade := public.score_stock_pitch(p.id);
  update stock_pitches
     set status = 'submitted', submitted_at = now(), score = (v_grade->>'total')::numeric,
         criteria_scores = v_grade->'criteria', scored_at = now()
   where id = p.id;

  select coalesce((config->>'evidence_weight_' || p.format)::numeric, 0.5) into v_weight
  from scoring_rubrics where id = 'stock_pitch_v1';
  perform public.record_rubric_evidence(v_uid, 'stock_pitch', p.id, v_grade->'criteria', v_weight);
  perform public.notify(v_uid, 'score', 'Pitch scored: ' || p.ticker,
    format('Your %s pitch scored %s / 100.', p.format, v_grade->>'total'), '/pitches/' || p.id);
  v_new := public.process_user_progress(v_uid);

  return jsonb_build_object('status', 'scored', 'score', (v_grade->>'total')::numeric,
    'criteria', v_grade->'criteria', 'upside_pct', v_grade->'upside_pct', 'new_achievements', to_jsonb(v_new));
end;
$$;

create or replace function public.create_research_sections()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into research_sections(project_id, section_key)
  select new.id, k from unnest(array['investment_thesis','company_overview','industry_overview',
    'competitive_analysis','financial_analysis','forecast','valuation','catalysts','risks','conclusion']) k
  on conflict do nothing;
  return new;
end;
$$;
create trigger trg_research_projects_sections
  after insert on public.research_projects
  for each row execute function public.create_research_sections();

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
    select id into v_attempt from challenge_attempts
     where research_project_id = rp.id and status = 'in_progress';
    if v_attempt is null then raise exception 'Challenge attempt for this report is closed'; end if;
    return public.submit_challenge(v_attempt, null);
  end if;

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

create or replace function public.duplicate_research_project(p_project uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  rp    research_projects%rowtype;
  v_new uuid;
begin
  select * into rp from research_projects where id = p_project and user_id = v_uid;
  if not found then raise exception 'Research project not found'; end if;
  insert into research_projects(user_id, title, company, ticker, exchange, currency, rating, current_price, target_price)
  values (v_uid, left('Copy of ' || rp.title, 200), rp.company, rp.ticker, rp.exchange, rp.currency,
          rp.rating, rp.current_price, rp.target_price)
  returning id into v_new;
  update research_sections ns set content = os.content
    from research_sections os
   where os.project_id = rp.id and ns.project_id = v_new and ns.section_key = os.section_key;
  insert into sources(user_id, research_project_id, title, url, publisher, published_on, note)
  select v_uid, v_new, title, url, publisher, published_on, note from sources where research_project_id = rp.id;
  return v_new;
end;
$$;

-- Removing a submitted artefact removes its evidence; recompute.
create or replace function public.on_scored_artifact_deleted()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status = 'submitted' then
    delete from skill_evidence
     where user_id = old.user_id
       and source_type = case tg_table_name when 'stock_pitches' then 'stock_pitch' else 'research_report' end
       and source_id = old.id;
    perform public.recalculate_user_scores(old.user_id);
  end if;
  return old;
end;
$$;
create trigger trg_stock_pitches_deleted after delete on public.stock_pitches
  for each row execute function public.on_scored_artifact_deleted();
create trigger trg_research_projects_deleted after delete on public.research_projects
  for each row execute function public.on_scored_artifact_deleted();

-- Users may only edit drafts; after submission only visibility may change.
create or replace function public.guard_submitted_artifact()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if old.status <> 'draft'
       and (to_jsonb(new) - 'is_public' - 'updated_at') <> (to_jsonb(old) - 'is_public' - 'updated_at') then
      raise exception 'Submitted work is locked. Only visibility can be changed.';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_stock_pitches_guard before update on public.stock_pitches
  for each row execute function public.guard_submitted_artifact();
create trigger trg_research_projects_guard before update on public.research_projects
  for each row execute function public.guard_submitted_artifact();

-- Professional pitch windows must be 2–7 days (user-created pitches).
create or replace function public.guard_pitch_insert()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.status := 'draft';
    new.starts_at := now();
    if new.format = 'professional' then
      if new.deadline_at is null
         or new.deadline_at < now() + interval '2 days' - interval '5 minutes'
         or new.deadline_at > now() + interval '7 days' + interval '5 minutes' then
        raise exception 'Professional pitches must have a deadline between 2 and 7 days from now';
      end if;
    else
      new.deadline_at := null;
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_stock_pitches_insert_guard before insert on public.stock_pitches
  for each row execute function public.guard_pitch_insert();

-- =====================================================================
-- 9. PORTFOLIO SIMULATOR
-- =====================================================================
create or replace function public.fx_to_base(p_currency text, p_base text default 'PHP')
returns numeric
language plpgsql stable security definer set search_path = public
as $$
declare v_rate numeric;
begin
  if p_currency = p_base then return 1; end if;
  select rate into v_rate from market_fx_rates where pair = p_currency || p_base;
  if v_rate is null then
    select 1 / rate into v_rate from market_fx_rates where pair = p_base || p_currency;
  end if;
  if v_rate is null then raise exception 'No FX rate for % to %', p_currency, p_base; end if;
  return v_rate;
end;
$$;

create or replace function public.portfolio_market_value(p_portfolio uuid)
returns numeric
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(pp.shares * ms.price * public.fx_to_base(ms.currency, pf.base_currency)), 0)
  from portfolio_positions pp
  join market_securities ms on ms.id = pp.security_id
  join portfolios pf on pf.id = pp.portfolio_id
  where pp.portfolio_id = p_portfolio;
$$;

create or replace function public.execute_trade(
  p_security text, p_side text, p_shares numeric, p_rationale text, p_market_event uuid default null)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  pf       portfolios%rowtype;
  sec      market_securities%rowtype;
  pos      portfolio_positions%rowtype;
  v_fx     numeric;
  v_amount numeric;
  v_realized numeric;
  v_cost_out numeric;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_side not in ('buy', 'sell') then raise exception 'Side must be buy or sell'; end if;
  if p_shares is null or p_shares <= 0 or p_shares <> trunc(p_shares) then
    raise exception 'Shares must be a positive whole number';
  end if;
  if char_length(btrim(coalesce(p_rationale, ''))) < 15 then
    raise exception 'Explain your decision (at least 15 characters)';
  end if;

  select * into pf from portfolios where user_id = v_uid for update;
  if not found then raise exception 'Portfolio not found'; end if;
  select * into sec from market_securities where id = p_security and is_active;
  if not found then raise exception 'Security not available'; end if;

  v_fx := public.fx_to_base(sec.currency, pf.base_currency);
  v_amount := round(p_shares * sec.price * v_fx, 2);
  select * into pos from portfolio_positions where portfolio_id = pf.id and security_id = sec.id for update;

  if p_side = 'buy' then
    if v_amount > pf.cash then
      raise exception 'Insufficient simulated cash (need %, have %)', v_amount, pf.cash;
    end if;
    update portfolios set cash = cash - v_amount where id = pf.id;
    if pos.security_id is null then
      insert into portfolio_positions(portfolio_id, security_id, shares, avg_cost_local, cost_basis_base)
      values (pf.id, sec.id, p_shares, sec.price, v_amount);
    else
      update portfolio_positions
         set avg_cost_local = (shares * avg_cost_local + p_shares * sec.price) / (shares + p_shares),
             shares = shares + p_shares,
             cost_basis_base = cost_basis_base + v_amount,
             updated_at = now()
       where portfolio_id = pf.id and security_id = sec.id;
    end if;
  else
    if pos.security_id is null or pos.shares < p_shares then
      raise exception 'You cannot sell more shares than you hold';
    end if;
    v_cost_out := round(pos.cost_basis_base * p_shares / pos.shares, 2);
    v_realized := v_amount - v_cost_out;
    update portfolios set cash = cash + v_amount, realized_pl = realized_pl + v_realized where id = pf.id;
    if pos.shares = p_shares then
      delete from portfolio_positions where portfolio_id = pf.id and security_id = sec.id;
    else
      update portfolio_positions
         set shares = shares - p_shares, cost_basis_base = cost_basis_base - v_cost_out, updated_at = now()
       where portfolio_id = pf.id and security_id = sec.id;
    end if;
  end if;

  insert into portfolio_transactions(portfolio_id, user_id, security_id, side, shares, price_local, fx_rate,
                                     amount_base, realized_pl_base, rationale, market_event_id)
  values (pf.id, v_uid, sec.id, p_side, p_shares, sec.price, v_fx, v_amount, v_realized,
          btrim(p_rationale), p_market_event);

  perform public.evaluate_achievements(v_uid);
  return jsonb_build_object('security_id', sec.id, 'side', p_side, 'shares', p_shares,
    'price', sec.price, 'fx_rate', v_fx, 'amount_base', v_amount, 'realized_pl', v_realized);
end;
$$;

create or replace function public.reset_portfolio()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from portfolio_positions where portfolio_id = (select id from portfolios where user_id = auth.uid());
  update portfolios set cash = starting_capital, realized_pl = 0, reset_at = now() where user_id = auth.uid();
  if not found then raise exception 'Portfolio not found'; end if;
end;
$$;

-- =====================================================================
-- 10. MARKET EVENTS
-- =====================================================================
create or replace function public.submit_market_event_decision(
  p_event uuid, p_action text, p_reasoning text, p_security text default null, p_confidence int default 3)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  e     market_events%rowtype;
  v_id  uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into e from market_events where id = p_event;
  if not found or e.status <> 'open' then raise exception 'This event is not open for decisions'; end if;
  if e.closes_at is not null and now() > e.closes_at then raise exception 'Decision window has closed'; end if;
  if char_length(btrim(coalesce(p_reasoning, ''))) < 40 then
    raise exception 'Reasoning must be at least 40 characters';
  end if;
  insert into market_event_decisions(event_id, user_id, action, security_id, reasoning, confidence)
  values (p_event, v_uid, p_action, p_security, btrim(p_reasoning), coalesce(p_confidence, 3))
  on conflict (event_id, user_id) do update
    set action = excluded.action, security_id = excluded.security_id,
        reasoning = excluded.reasoning, confidence = excluded.confidence, created_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

-- Event resolution summary + key is only revealed once resolved.
create or replace function public.get_market_event_resolution(p_event uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object('best_actions', k.best_actions, 'acceptable_actions', k.acceptable_actions,
                            'keywords', k.keywords, 'summary', e.resolution_summary, 'price_impacts', e.price_impacts)
  from market_events e join market_event_keys k on k.event_id = e.id
  where e.id = p_event and e.status = 'resolved';
$$;

-- =====================================================================
-- 11. COMPETITIONS
-- =====================================================================
create or replace function public.register_for_competition(p_competition uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  c     competitions%rowtype;
  v_n   int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into c from competitions where id = p_competition and is_published for update;
  if not found then raise exception 'Competition not found'; end if;
  if now() > c.registration_deadline then raise exception 'Registration has closed'; end if;
  if c.results_finalized_at is not null then raise exception 'Competition is finalized'; end if;
  if exists (select 1 from competition_participants where competition_id = c.id and user_id = v_uid) then
    return;
  end if;
  select count(*) into v_n from competition_participants where competition_id = c.id;
  if c.participant_limit is not null and v_n >= c.participant_limit then
    raise exception 'Competition is full';
  end if;
  insert into competition_participants(competition_id, user_id) values (c.id, v_uid);
  perform public.notify(v_uid, 'competition', 'Registered: ' || c.name,
    'Good luck. Challenges unlock when the competition starts.', '/competitions/' || c.id);
  perform public.evaluate_achievements(v_uid);
end;
$$;

create or replace function public.withdraw_from_competition(p_competition uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from competitions where id = p_competition and starts_at <= now()) then
    raise exception 'You cannot withdraw after the competition has started';
  end if;
  delete from competition_participants where competition_id = p_competition and user_id = auth.uid();
end;
$$;

create or replace function public.get_competition_standings(p_competition uuid)
returns table(rank bigint, user_id uuid, handle text, display_name text, score numeric,
              challenges_completed bigint, last_submission timestamptz, is_me boolean)
language sql stable security definer set search_path = public
as $$
  with comp as (select * from competitions where id = p_competition),
  best as (
    select s.user_id, s.challenge_id, max(s.final_score) as best, max(s.submitted_at) as last_at
    from challenge_submissions s, comp
    where s.competition_id = comp.id and s.status = 'scored'
      and s.submitted_at between comp.starts_at and comp.ends_at + interval '5 minutes'
    group by s.user_id, s.challenge_id
  ),
  agg as (
    select cp.user_id,
           case comp.scoring_method
             when 'sum' then coalesce(sum(b.best * cc.weight), 0)
             when 'average' then coalesce(sum(b.best * cc.weight), 0)
                                 / nullif((select sum(weight) from competition_challenges where competition_id = comp.id), 0)
             else coalesce(max(b.best), 0) end as score,
           count(b.challenge_id) as n,
           max(b.last_at) as last_at
    from competition_participants cp
    cross join comp
    left join best b on b.user_id = cp.user_id
    left join competition_challenges cc on cc.competition_id = comp.id and cc.challenge_id = b.challenge_id
    where cp.competition_id = comp.id
    group by cp.user_id, comp.scoring_method, comp.id
  )
  select rank() over (order by a.score desc, a.last_at asc nulls last) as rank,
         a.user_id, p.handle,
         case when p.is_public or a.user_id = auth.uid() then p.full_name else 'Private participant' end,
         round(a.score, 2), a.n, a.last_at, a.user_id = auth.uid()
  from agg a join profiles p on p.id = a.user_id
  order by 1, a.user_id;
$$;

-- =====================================================================
-- 12. LEADERBOARDS
-- =====================================================================
create or replace function public.get_leaderboard(p_board text, p_filter text default null, p_limit int default 100)
returns table(rank bigint, user_id uuid, handle text, display_name text, university text, country_code text,
              career_level text, specialization text, value numeric, is_me boolean)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
  with base as (
    select p.id, p.handle, p.full_name, p.university, p.country_code, p.is_public,
           p.primary_specialization_id, cl.name as level_name, sp.name as spec_name,
           st.finlab_score, st.scored_activity_count, st.last_scored_at
    from profiles p
    join user_stats st on st.user_id = p.id
    join career_levels cl on cl.id = st.career_level_id
    left join specializations sp on sp.id = p.primary_specialization_id
  ),
  vals as (
    select b.*, b.finlab_score as v
    from base b
    where p_board in ('global', 'philippines', 'university', 'specialization')
      and b.scored_activity_count > 0
      and (p_board <> 'philippines' or b.country_code = 'PH')
      and (p_board <> 'university' or lower(btrim(b.university)) = lower(btrim(p_filter)))
      and (p_board <> 'specialization' or b.primary_specialization_id = p_filter)
    union all
    select b.*, x.v
    from base b
    join (select sp.user_id, round(avg(sp.score), 2) as v
          from (select user_id, score, row_number() over (partition by user_id order by score desc) rn
                from stock_pitches where status = 'submitted' and score is not null) sp
          where sp.rn <= 3 group by sp.user_id) x on x.user_id = b.id
    where p_board = 'stock_pitch'
    union all
    select b.*, x.v
    from base b
    join (select u.user_id, round(avg(u.score), 2) as v
          from (select user_id, score, row_number() over (partition by user_id order by score desc) rn
                from (select user_id, score from research_projects where status = 'submitted' and score is not null
                      union all
                      select s.user_id, max(s.final_score) from challenge_submissions s
                      join challenges c on c.id = s.challenge_id
                      where s.status = 'scored' and c.category_id = 'equity_research'
                      group by s.user_id, s.challenge_id) r) u
          where u.rn <= 3 group by u.user_id) x on x.user_id = b.id
    where p_board = 'equity_research'
    union all
    select b.*, x.v
    from base b
    join (select pf.user_id,
                 round(((pf.cash + public.portfolio_market_value(pf.id)) / pf.starting_capital - 1) * 100, 2) as v
          from portfolios pf
          where exists (select 1 from portfolio_transactions t where t.portfolio_id = pf.id
                        and (pf.reset_at is null or t.created_at > pf.reset_at))) x on x.user_id = b.id
    where p_board = 'portfolio'
  ),
  ranked as (
    select rank() over (order by vals.v desc, vals.last_scored_at asc nulls last) as r, vals.*
    from vals
  )
  select r.r, r.id, r.handle,
         case when r.is_public or r.id = auth.uid() then r.full_name else 'Private analyst' end,
         case when r.is_public or r.id = auth.uid() then r.university end,
         r.country_code, r.level_name, r.spec_name, r.v, r.id = auth.uid()
  from ranked r
  where r.is_public or r.id = auth.uid() or public.is_admin()
  order by r.r, r.handle
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

create or replace function public.list_universities()
returns table(university text, members bigint)
language sql stable security definer set search_path = public
as $$
  select min(btrim(university)), count(*)
  from profiles where university is not null and btrim(university) <> '' and is_public
  group by lower(btrim(university)) order by 2 desc, 1 limit 200;
$$;

create or replace function public.get_my_ranks()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'global', (select jsonb_build_object('rank', r.rank, 'total', r.total) from public.user_score_rank(auth.uid(), 'global') r),
    'country', (select jsonb_build_object('rank', r.rank, 'total', r.total) from public.user_score_rank(auth.uid(), 'country') r),
    'country_code', (select country_code from profiles where id = auth.uid()));
$$;

-- =====================================================================
-- 13. CAREER PROMOTION
-- =====================================================================
create or replace function public.evaluate_requirement(p_user uuid, p_type text, p_params jsonb)
returns table(current_value numeric, required_value numeric, met boolean)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cur numeric;
  v_req numeric := coalesce((p_params->>'value')::numeric, 0);
begin
  v_cur := case p_type
    when 'min_finlab_score'  then public.user_metric(p_user, 'finlab_score')
    when 'challenges_passed' then public.user_metric(p_user, 'challenges_passed')
    when 'category_passed'   then public.user_metric(p_user, 'category_passed', p_params->>'category')
    when 'tag_passed'        then public.user_metric(p_user, 'tag_passed', p_params->>'tag')
    when 'metric_gte'        then public.user_metric(p_user, p_params->>'metric', p_params->>'arg')
    when 'skill_min'         then public.user_metric(p_user, 'skill_score', p_params->>'skill')
  end;
  return query select coalesce(v_cur, 0), v_req, coalesce(v_cur, 0) >= v_req;
end;
$$;

create or replace function public.get_promotion_status(p_user uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid     uuid := coalesce(p_user, auth.uid());
  v_cur     career_levels%rowtype;
  v_next    career_levels%rowtype;
  v_reqs    jsonb;
begin
  if v_uid <> auth.uid() and not public.is_admin() then raise exception 'Not allowed'; end if;
  select cl.* into v_cur from user_stats s join career_levels cl on cl.id = s.career_level_id where s.user_id = v_uid;
  select * into v_next from career_levels where rank > v_cur.rank order by rank limit 1;
  if v_next.id is null then
    return jsonb_build_object('current_level', to_jsonb(v_cur), 'next_level', null,
                              'eligible', false, 'requirements', '[]'::jsonb);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id, 'label', r.label, 'type', r.requirement_type, 'params', r.params,
           'current', e.current_value, 'required', e.required_value, 'met', e.met) order by r.sort_order), '[]'::jsonb)
    into v_reqs
  from promotion_requirements r
  cross join lateral public.evaluate_requirement(v_uid, r.requirement_type, r.params) e
  where r.target_level_id = v_next.id and r.is_active;

  return jsonb_build_object(
    'current_level', to_jsonb(v_cur),
    'next_level', to_jsonb(v_next),
    'requirements', v_reqs,
    'eligible', jsonb_array_length(v_reqs) > 0
                and not exists (select 1 from jsonb_array_elements(v_reqs) x where not (x->>'met')::boolean));
end;
$$;

create or replace function public.attempt_promotion()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_status jsonb;
  v_passed boolean;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  perform 1 from user_stats where user_id = v_uid for update;
  v_status := public.get_promotion_status(v_uid);
  if v_status->'next_level' = 'null'::jsonb then
    raise exception 'You are already at the highest career level';
  end if;
  v_passed := (v_status->>'eligible')::boolean;

  insert into promotion_attempts(user_id, from_level_id, target_level_id, passed, results)
  values (v_uid, (v_status->'current_level'->>'id')::smallint, (v_status->'next_level'->>'id')::smallint,
          v_passed, v_status->'requirements');

  if v_passed then
    update user_stats set career_level_id = (v_status->'next_level'->>'id')::smallint,
                          promoted_at = now(), updated_at = now()
     where user_id = v_uid;
    perform public.notify(v_uid, 'promotion', 'Promoted to ' || (v_status->'next_level'->>'name'),
      'Your promotion case passed every requirement.', '/career');
    perform public.evaluate_achievements(v_uid);
  end if;
  return jsonb_build_object('result', case when v_passed then 'PASS' else 'NOT_YET' end,
                            'status', v_status);
end;
$$;

-- =====================================================================
-- 14. FINANCE PASSPORT (public, recruiter-facing)
-- =====================================================================
create or replace function public.get_passport(p_handle text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  p      profiles%rowtype;
  v_viewer uuid := auth.uid();
begin
  select * into p from profiles where handle = lower(p_handle);
  if not found then return null; end if;
  if not p.is_public and (v_viewer is null or v_viewer <> p.id) and not public.is_admin() then
    return null;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object('id', p.id, 'handle', p.handle, 'full_name', p.full_name, 'headline', p.headline,
                                  'bio', p.bio, 'university', p.university, 'country_code', p.country_code,
                                  'is_public', p.is_public, 'member_since', p.created_at, 'is_me', p.id = v_viewer),
    'specialization', (select to_jsonb(s) from specializations s where s.id = p.primary_specialization_id),
    'stats', (select jsonb_build_object('finlab_score', st.finlab_score, 'career_level', cl.name,
                                        'career_level_rank', cl.rank, 'scored_activity_count', st.scored_activity_count,
                                        'promoted_at', st.promoted_at)
              from user_stats st join career_levels cl on cl.id = st.career_level_id where st.user_id = p.id),
    'ranks', jsonb_build_object(
       'global', (select to_jsonb(r) from public.user_score_rank(p.id, 'global') r),
       'country', (select to_jsonb(r) from public.user_score_rank(p.id, 'country') r)),
    'skills', (select coalesce(jsonb_agg(jsonb_build_object('skill_id', s.id, 'name', s.name, 'weight', s.weight,
                                         'score', coalesce(us.score, 0), 'evidence_count', coalesce(us.evidence_count, 0))
                                         order by s.sort_order), '[]'::jsonb)
               from skills s left join user_skills us on us.skill_id = s.id and us.user_id = p.id),
    'counts', jsonb_build_object(
       'stock_pitches', public.user_metric(p.id, 'stock_pitches_submitted'),
       'research_reports', public.user_metric(p.id, 'research_reports_submitted'),
       'valuation_models', public.user_metric(p.id, 'valuation_models'),
       'financial_models', public.user_metric(p.id, 'financial_models'),
       'challenges', public.user_metric(p.id, 'challenges_completed'),
       'portfolio_trades', public.user_metric(p.id, 'portfolio_trades'),
       'competitions', public.user_metric(p.id, 'competitions_joined'),
       'market_decisions', public.user_metric(p.id, 'market_event_decisions')),
    'achievements', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'description', a.description,
                                     'icon', a.icon, 'tier', a.tier, 'awarded_at', ua.awarded_at) order by ua.awarded_at desc), '[]'::jsonb)
                     from user_achievements ua join achievements a on a.id = ua.achievement_id where ua.user_id = p.id),
    'public_pitches', (select coalesce(jsonb_agg(jsonb_build_object('id', sp.id, 'company', sp.company, 'ticker', sp.ticker,
                                       'rating', sp.rating, 'format', sp.format, 'score', sp.score,
                                       'current_price', sp.current_price, 'target_price', sp.target_price,
                                       'currency', sp.currency, 'submitted_at', sp.submitted_at) order by sp.submitted_at desc), '[]'::jsonb)
                       from stock_pitches sp where sp.user_id = p.id and sp.status = 'submitted' and sp.is_public),
    'public_research', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'title', r.title, 'company', r.company,
                                        'ticker', r.ticker, 'rating', r.rating, 'score', r.score,
                                        'submitted_at', r.submitted_at) order by r.submitted_at desc), '[]'::jsonb)
                        from research_projects r where r.user_id = p.id and r.status = 'submitted' and r.is_public),
    'competition_record', (select coalesce(jsonb_agg(jsonb_build_object('competition_id', c.id, 'name', c.name,
                                           'rank', cr.rank, 'score', cr.score,
                                           'participants', (select count(*) from competition_results x where x.competition_id = c.id),
                                           'ended_at', c.ends_at) order by c.ends_at desc), '[]'::jsonb)
                           from competition_results cr join competitions c on c.id = cr.competition_id where cr.user_id = p.id)
  );
end;
$$;

-- =====================================================================
-- 15. ADMIN RPCs (each checks is_admin())
-- =====================================================================
create or replace function public.assert_admin()
returns void
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
end;
$$;

create or replace function public.admin_list_users(p_search text default null, p_limit int default 100)
returns table(id uuid, email text, full_name text, handle text, country_code text, university text,
              created_at timestamptz, last_sign_in_at timestamptz, finlab_score numeric, career_level text,
              is_admin boolean, submissions bigint, onboarded boolean)
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select p.id, u.email::text, p.full_name, p.handle, p.country_code, p.university, p.created_at,
         u.last_sign_in_at, st.finlab_score, cl.name,
         exists (select 1 from user_roles r where r.user_id = p.id and r.role = 'admin'),
         (select count(*) from challenge_submissions s where s.user_id = p.id),
         p.onboarded_at is not null
  from profiles p
  join auth.users u on u.id = p.id
  join user_stats st on st.user_id = p.id
  join career_levels cl on cl.id = st.career_level_id
  where p_search is null or p_search = ''
     or p.full_name ilike '%' || p_search || '%' or u.email ilike '%' || p_search || '%'
     or p.handle ilike '%' || p_search || '%'
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 1000));
end;
$$;

create or replace function public.admin_set_admin(p_user uuid, p_is_admin boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  if p_is_admin then
    insert into user_roles(user_id, role, granted_by) values (p_user, 'admin', auth.uid()) on conflict do nothing;
  else
    if (select count(*) from user_roles where role = 'admin') <= 1 then
      raise exception 'Cannot remove the last administrator';
    end if;
    delete from user_roles where user_id = p_user and role = 'admin';
  end if;
end;
$$;

-- criteria: [{key,label,score,max,feedback}] ; total computed as Σscore/Σmax×100
create or replace function public.admin_score_submission(p_submission uuid, p_criteria jsonb, p_feedback text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  sb       challenge_submissions%rowtype;
  v_total  numeric;
  v_score  uuid;
  v_new    text[];
begin
  perform public.assert_admin();
  select * into sb from challenge_submissions where id = p_submission for update;
  if not found then raise exception 'Submission not found'; end if;
  select round(sum(least((c->>'score')::numeric, (c->>'max')::numeric)) / nullif(sum((c->>'max')::numeric), 0) * 100, 2)
    into v_total from jsonb_array_elements(p_criteria) c;
  if v_total is null then raise exception 'Provide at least one criterion with a max > 0'; end if;
  v_total := least(100, greatest(0, v_total));

  insert into challenge_scores(submission_id, user_id, scorer_type, total_score, criteria_scores, feedback, scored_by)
  values (sb.id, sb.user_id, 'admin', v_total, p_criteria, coalesce(p_feedback, ''), auth.uid())
  returning id into v_score;
  v_new := public.finalize_submission_score(v_score);
  return jsonb_build_object('score', v_total, 'new_achievements', to_jsonb(v_new));
end;
$$;

create or replace function public.admin_award_achievement(p_user uuid, p_achievement text, p_note text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_name text;
begin
  perform public.assert_admin();
  select name into v_name from achievements where id = p_achievement;
  if v_name is null then raise exception 'Achievement not found'; end if;
  insert into user_achievements(user_id, achievement_id, award_source, note)
  values (p_user, p_achievement, 'admin', p_note) on conflict do nothing;
  perform public.notify(p_user, 'achievement', 'Achievement unlocked: ' || v_name, coalesce(p_note, ''), '/passport');
end;
$$;

create or replace function public.admin_revoke_achievement(p_user uuid, p_achievement text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  delete from user_achievements where user_id = p_user and achievement_id = p_achievement;
end;
$$;

-- Re-run scoring for everyone (after changing skill weights / thresholds / impacts).
create or replace function public.admin_recalculate_all()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  r   record;
  n   int := 0;
begin
  perform public.assert_admin();
  for r in select distinct user_id, challenge_id from challenge_submissions where status = 'scored' loop
    perform public.refresh_challenge_evidence(r.user_id, r.challenge_id);
  end loop;
  for r in select id from profiles loop
    perform public.process_user_progress(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.admin_finalize_competition(p_competition uuid)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  c    competitions%rowtype;
  r    record;
  v_n  int;
  v_ls numeric;
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

  -- Leadership evidence: winner 100, last place 40, linear in between.
  for r in select * from competition_results where competition_id = c.id loop
    v_ls := round(100 - (r.rank - 1) * (60.0 / greatest(v_n - 1, 1)), 2);
    delete from skill_evidence where user_id = r.user_id and source_type = 'competition' and source_id = c.id;
    insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight)
    values (r.user_id, 'leadership', 'competition', c.id, greatest(0, v_ls), 1);
    perform public.notify(r.user_id, 'competition', 'Results: ' || c.name,
      format('You finished #%s of %s with %s points.', r.rank, v_n, r.score), '/competitions/' || c.id);
    perform public.process_user_progress(r.user_id);
  end loop;
  return v_n;
end;
$$;

-- Scores all decisions, applies price impacts to the sample market data.
create or replace function public.admin_resolve_market_event(p_event uuid, p_summary text)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  e       market_events%rowtype;
  k       market_event_keys%rowtype;
  d       record;
  v_act   numeric;
  v_kw    int;
  v_score numeric;
  v_n     int := 0;
  imp     record;
begin
  perform public.assert_admin();
  select * into e from market_events where id = p_event for update;
  if not found then raise exception 'Event not found'; end if;
  if e.status = 'resolved' then raise exception 'Event already resolved'; end if;
  select * into k from market_event_keys where event_id = e.id;

  for d in select * from market_event_decisions where event_id = e.id loop
    v_act := case when d.action = any(coalesce(k.best_actions, '{}')) then 60
                  when d.action = any(coalesce(k.acceptable_actions, '{}')) then 35
                  else 10 end;
    select count(*) into v_kw from unnest(coalesce(k.keywords, '{}')) kw
     where exists (select 1 from unnest(string_to_array(kw, '|')) syn
                   where lower(d.reasoning) like '%' || lower(btrim(syn)) || '%');
    v_score := round(v_act + 25 * ratio(word_count(d.reasoning), 60)
                     + 15 * ratio(v_kw, least(3, greatest(cardinality(coalesce(k.keywords, '{}')), 1))), 2);
    update market_event_decisions
       set score = v_score, scored_at = now(),
           feedback = format('Action: %s/60 · Reasoning depth: %s words · Key factors identified: %s',
                             v_act, word_count(d.reasoning), v_kw)
     where id = d.id;
    delete from skill_evidence where user_id = d.user_id and source_type = 'market_event' and source_id = e.id;
    insert into skill_evidence(user_id, skill_id, source_type, source_id, score, weight) values
      (d.user_id, 'investment_judgment', 'market_event', e.id, v_score, 0.5),
      (d.user_id, 'decision_making', 'market_event', e.id, v_score, 0.5);
    perform public.notify(d.user_id, 'market_event', 'Event resolved: ' || e.title,
      format('Your decision scored %s / 100.', v_score), '/events');
    perform public.process_user_progress(d.user_id);
    v_n := v_n + 1;
  end loop;

  for imp in select key as sid, value::numeric as pct from jsonb_each_text(e.price_impacts) loop
    update market_securities
       set prev_close = price,
           price = round(price * (1 + imp.pct / 100), 4),
           pe = case when eps > 0 then round(price * (1 + imp.pct / 100) / eps, 2) else pe end,
           pb = case when bvps > 0 then round(price * (1 + imp.pct / 100) / bvps, 2) else pb end,
           market_cap = case when shares_outstanding > 0 then round(price * (1 + imp.pct / 100) * shares_outstanding, 2) else market_cap end,
           data_as_of = current_date
     where id = imp.sid;
    insert into market_price_history(security_id, trade_date, close)
    select id, current_date, price from market_securities where id = imp.sid
    on conflict (security_id, trade_date) do update set close = excluded.close;
  end loop;

  update market_events set status = 'resolved', resolved_at = now(),
         resolution_summary = coalesce(p_summary, '') where id = e.id;
  return v_n;
end;
$$;

create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'users', (select count(*) from profiles),
    'onboarded', (select count(*) from profiles where onboarded_at is not null),
    'challenges_published', (select count(*) from challenges where is_published),
    'challenges_total', (select count(*) from challenges),
    'submissions', (select count(*) from challenge_submissions),
    'pending_reviews', (select count(*) from challenge_submissions where status = 'pending_review'),
    'pitches', (select count(*) from stock_pitches where status = 'submitted'),
    'reports', (select count(*) from research_projects where status = 'submitted'),
    'competitions', (select count(*) from competitions),
    'open_events', (select count(*) from market_events where status = 'open'));
end;
$$;

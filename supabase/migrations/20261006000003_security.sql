-- =====================================================================
-- FINLAB — 0003 Security: grants + Row Level Security
-- ---------------------------------------------------------------------
-- Principles
--   * Start from zero: revoke Supabase's default ALL grants, then grant
--     only what each role needs (column-level where it matters).
--   * Calculated tables have NO write grants for clients at all.
--   * Admin writes are allowed by RLS policies that call is_admin().
--   * Internal SECURITY DEFINER helpers are not executable by clients.
-- =====================================================================

-- Fix plpgsql name resolution for functions with OUT columns.
create or replace function public.get_leaderboard(p_board text, p_filter text default null, p_limit int default 100)
returns table(rank bigint, user_id uuid, handle text, display_name text, university text, country_code text,
              career_level text, specialization text, value numeric, is_me boolean)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
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
    join (select sp2.uid, round(avg(sp2.score), 2) as v
          from (select s.user_id as uid, s.score, row_number() over (partition by s.user_id order by s.score desc) rn
                from stock_pitches s where s.status = 'submitted' and s.score is not null) sp2
          where sp2.rn <= 3 group by sp2.uid) x on x.uid = b.id
    where p_board = 'stock_pitch'
    union all
    select b.*, x.v
    from base b
    join (select u.uid, round(avg(u.score), 2) as v
          from (select r.uid, r.score, row_number() over (partition by r.uid order by r.score desc) rn
                from (select rp.user_id as uid, rp.score from research_projects rp
                      where rp.status = 'submitted' and rp.score is not null
                      union all
                      select s.user_id, max(s.final_score) from challenge_submissions s
                      join challenges c on c.id = s.challenge_id
                      where s.status = 'scored' and c.category_id = 'equity_research'
                      group by s.user_id, s.challenge_id) r) u
          where u.rn <= 3 group by u.uid) x on x.uid = b.id
    where p_board = 'equity_research'
    union all
    select b.*, x.v
    from base b
    join (select pf.user_id as uid,
                 round(((pf.cash + public.portfolio_market_value(pf.id)) / pf.starting_capital - 1) * 100, 2) as v
          from portfolios pf
          where exists (select 1 from portfolio_transactions t where t.portfolio_id = pf.id
                        and (pf.reset_at is null or t.created_at > pf.reset_at))) x on x.uid = b.id
    where p_board = 'portfolio'
  ),
  ranked as (
    select rank() over (order by vals.v desc, vals.last_scored_at asc nulls last) as rnk, vals.*
    from vals
  )
  select r.rnk, r.id, r.handle,
         case when r.is_public or r.id = auth.uid() then r.full_name else 'Private analyst' end,
         case when r.is_public or r.id = auth.uid() then r.university end,
         r.country_code, r.level_name, r.spec_name, r.v, r.id = auth.uid()
  from ranked r
  where r.is_public or r.id = auth.uid() or public.is_admin()
  order by r.rnk, r.handle
  limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

create or replace function public.admin_list_users(p_search text default null, p_limit int default 100)
returns table(id uuid, email text, full_name text, handle text, country_code text, university text,
              created_at timestamptz, last_sign_in_at timestamptz, finlab_score numeric, career_level text,
              is_admin boolean, submissions bigint, onboarded boolean)
language plpgsql stable security definer set search_path = public
as $$
#variable_conflict use_column
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

-- ---------------------------------------------------------------------
-- 1. Reset privileges
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Enable RLS everywhere
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3. Reference data: readable by signed-in users, writable by admins
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['career_levels','specializations','skills','challenge_categories','app_settings',
                           'scoring_rubrics','achievements','promotion_requirements',
                           'market_securities','market_price_history','market_fx_rates']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_write', t);
  end loop;
end $$;

-- A few reference tables are also needed by the public Finance Passport.
grant select on public.career_levels, public.specializations, public.skills to anon;
create policy career_levels_anon on public.career_levels for select to anon using (true);
create policy specializations_anon on public.specializations for select to anon using (true);
create policy skills_anon on public.skills for select to anon using (true);

-- Lessons
grant select, insert, update, delete on public.lessons to authenticated;
create policy lessons_read on public.lessons for select to authenticated using (is_published or public.is_admin());
create policy lessons_admin on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, delete on public.lesson_progress to authenticated;
create policy lesson_progress_own on public.lesson_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4. Profiles & preferences
-- ---------------------------------------------------------------------
grant select on public.profiles to authenticated;
-- Only these columns are user-editable. id / created_at / onboarded_at
-- ownership columns are protected by omission.
grant update (handle, full_name, headline, bio, country_code, university,
              primary_specialization_id, is_public, onboarded_at) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using (is_public or id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant select, update (interests, experience_level, goal) on public.user_preferences to authenticated;
create policy user_preferences_own_read on public.user_preferences for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_preferences_own_update on public.user_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Roles: readable for self/admin. No client write grants at all;
-- admins manage roles through admin_set_admin().
grant select on public.user_roles to authenticated;
create policy user_roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Calculated data: read-only (own or admin)
-- ---------------------------------------------------------------------
grant select on public.user_stats, public.user_skills, public.skill_evidence,
                public.user_achievements, public.promotion_attempts to authenticated;
create policy user_stats_read on public.user_stats for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_skills_read on public.user_skills for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy skill_evidence_read on public.skill_evidence for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_achievements_read on public.user_achievements for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy promotion_attempts_read on public.promotion_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 6. Challenges
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.challenges to authenticated;
create policy challenges_read on public.challenges for select to authenticated
  using (is_published or public.is_admin());
create policy challenges_admin on public.challenges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.challenge_answer_keys to authenticated;
create policy answer_keys_admin on public.challenge_answer_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Attempts / submissions / scores are written only through RPCs.
grant select on public.challenge_attempts, public.challenge_submissions, public.challenge_scores to authenticated;
create policy attempts_read on public.challenge_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy submissions_read on public.challenge_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy scores_read on public.challenge_scores for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Stock pitches, research, sources (user-owned work)
-- ---------------------------------------------------------------------
grant select, delete on public.stock_pitches to authenticated;
grant insert (format, company, ticker, exchange, currency, rating, current_price, target_price, valuation_method,
              thesis, catalysts, risks, company_analysis, financial_analysis, forecast, valuation,
              variant_perception, deadline_at, is_public)
  on public.stock_pitches to authenticated;
grant update (company, ticker, exchange, currency, rating, current_price, target_price, valuation_method,
              thesis, catalysts, risks, company_analysis, financial_analysis, forecast, valuation,
              variant_perception, is_public)
  on public.stock_pitches to authenticated;
grant select on public.stock_pitches to anon;
create policy pitches_read on public.stock_pitches for select to authenticated
  using (user_id = auth.uid() or (is_public and status = 'submitted') or public.is_admin());
create policy pitches_read_public on public.stock_pitches for select to anon
  using (is_public and status = 'submitted');
create policy pitches_insert on public.stock_pitches for insert to authenticated
  with check (user_id = auth.uid());
-- (guard_submitted_artifact trigger restricts submitted pitches to visibility changes)
create policy pitches_update on public.stock_pitches for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy pitches_delete on public.stock_pitches for delete to authenticated
  using (user_id = auth.uid() and challenge_id is null);

grant select, delete on public.research_projects to authenticated;
grant insert (title, company, ticker, exchange, currency, rating, current_price, target_price, is_public)
  on public.research_projects to authenticated;
grant update (title, company, ticker, exchange, currency, rating, current_price, target_price, is_public)
  on public.research_projects to authenticated;
grant select on public.research_projects to anon;
create policy research_read on public.research_projects for select to authenticated
  using (user_id = auth.uid() or (is_public and status = 'submitted') or public.is_admin());
create policy research_read_public on public.research_projects for select to anon
  using (is_public and status = 'submitted');
create policy research_insert on public.research_projects for insert to authenticated
  with check (user_id = auth.uid());
create policy research_update on public.research_projects for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy research_delete on public.research_projects for delete to authenticated
  using (user_id = auth.uid() and challenge_id is null);

grant select, update (content) on public.research_sections to authenticated;
grant select on public.research_sections to anon;
create policy sections_read on public.research_sections for select to authenticated
  using (exists (select 1 from public.research_projects rp where rp.id = project_id
                 and (rp.user_id = auth.uid() or (rp.is_public and rp.status = 'submitted') or public.is_admin())));
create policy sections_read_public on public.research_sections for select to anon
  using (exists (select 1 from public.research_projects rp where rp.id = project_id and rp.is_public and rp.status = 'submitted'));
create policy sections_update on public.research_sections for update to authenticated
  using (exists (select 1 from public.research_projects rp where rp.id = project_id
                 and rp.user_id = auth.uid() and rp.status = 'draft'))
  with check (exists (select 1 from public.research_projects rp where rp.id = project_id
                 and rp.user_id = auth.uid() and rp.status = 'draft'));

grant select, delete on public.sources to authenticated;
grant insert (stock_pitch_id, research_project_id, title, url, publisher, published_on, note) on public.sources to authenticated;
grant update (title, url, publisher, published_on, note) on public.sources to authenticated;
grant select on public.sources to anon;
create policy sources_read on public.sources for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.stock_pitches sp where sp.id = stock_pitch_id and sp.is_public and sp.status = 'submitted')
         or exists (select 1 from public.research_projects rp where rp.id = research_project_id and rp.is_public and rp.status = 'submitted'));
create policy sources_read_public on public.sources for select to anon
  using (exists (select 1 from public.stock_pitches sp where sp.id = stock_pitch_id and sp.is_public and sp.status = 'submitted')
         or exists (select 1 from public.research_projects rp where rp.id = research_project_id and rp.is_public and rp.status = 'submitted'));
-- Sources can only be changed while the parent is a draft owned by the user.
create policy sources_write on public.sources for insert to authenticated
  with check (user_id = auth.uid() and (
    exists (select 1 from public.stock_pitches sp where sp.id = stock_pitch_id and sp.user_id = auth.uid() and sp.status = 'draft')
    or exists (select 1 from public.research_projects rp where rp.id = research_project_id and rp.user_id = auth.uid() and rp.status = 'draft')));
create policy sources_update on public.sources for update to authenticated
  using (user_id = auth.uid() and (
    exists (select 1 from public.stock_pitches sp where sp.id = stock_pitch_id and sp.status = 'draft')
    or exists (select 1 from public.research_projects rp where rp.id = research_project_id and rp.status = 'draft')))
  with check (user_id = auth.uid());
create policy sources_delete on public.sources for delete to authenticated
  using (user_id = auth.uid() and (
    exists (select 1 from public.stock_pitches sp where sp.id = stock_pitch_id and sp.status = 'draft')
    or exists (select 1 from public.research_projects rp where rp.id = research_project_id and rp.status = 'draft')));

-- ---------------------------------------------------------------------
-- 8. Valuation & financial models (fully user-owned)
-- ---------------------------------------------------------------------
grant select, delete on public.valuation_models, public.financial_models to authenticated;
grant insert (name, company, ticker, method, currency, current_price, inputs, outputs, notes, is_public),
      update (name, company, ticker, method, currency, current_price, inputs, outputs, notes, is_public)
  on public.valuation_models to authenticated;
grant insert (name, company, ticker, currency, unit, data, notes),
      update (name, company, ticker, currency, unit, data, notes)
  on public.financial_models to authenticated;
create policy valuation_read on public.valuation_models for select to authenticated
  using (user_id = auth.uid() or is_public or public.is_admin());
create policy valuation_write on public.valuation_models for insert to authenticated with check (user_id = auth.uid());
create policy valuation_update on public.valuation_models for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy valuation_delete on public.valuation_models for delete to authenticated using (user_id = auth.uid());
create policy fin_models_read on public.financial_models for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy fin_models_write on public.financial_models for insert to authenticated with check (user_id = auth.uid());
create policy fin_models_update on public.financial_models for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fin_models_delete on public.financial_models for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 9. Portfolio (read-only to clients; trades go through execute_trade)
-- ---------------------------------------------------------------------
grant select on public.portfolios, public.portfolio_positions, public.portfolio_transactions to authenticated;
grant update (name) on public.portfolios to authenticated;
create policy portfolios_read on public.portfolios for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy portfolios_rename on public.portfolios for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy positions_read on public.portfolio_positions for select to authenticated
  using (exists (select 1 from public.portfolios p where p.id = portfolio_id and (p.user_id = auth.uid() or public.is_admin())));
create policy transactions_read on public.portfolio_transactions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 10. Market events
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.market_events, public.market_event_keys to authenticated;
create policy events_read on public.market_events for select to authenticated
  using (status <> 'draft' or public.is_admin());
create policy events_admin on public.market_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy event_keys_admin on public.market_event_keys for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.market_event_decisions to authenticated;
create policy decisions_read on public.market_event_decisions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 11. Competitions
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.competitions, public.competition_challenges to authenticated;
create policy competitions_read on public.competitions for select to authenticated
  using (is_published or public.is_admin());
create policy competitions_admin on public.competitions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy comp_challenges_read on public.competition_challenges for select to authenticated
  using (exists (select 1 from public.competitions c where c.id = competition_id and (c.is_published or public.is_admin())));
create policy comp_challenges_admin on public.competition_challenges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.competition_participants, public.competition_results to authenticated;
create policy participants_read on public.competition_participants for select to authenticated using (true);
create policy results_read on public.competition_results for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- 12. Notifications: read own, mark read, delete own
-- ---------------------------------------------------------------------
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 13. Function execution
-- ---------------------------------------------------------------------
-- Pure helpers / policy helpers
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.word_count(text), public.number_count(text), public.item_count(text),
                          public.ratio(numeric, numeric) to authenticated;

-- Client RPCs (each derives the user from auth.uid())
grant execute on function
  public.refresh_my_progress(),
  public.start_challenge(uuid, uuid),
  public.save_challenge_draft(uuid, jsonb),
  public.abandon_challenge_attempt(uuid),
  public.submit_challenge(uuid, jsonb),
  public.submit_stock_pitch(uuid),
  public.submit_research_project(uuid),
  public.duplicate_research_project(uuid),
  public.execute_trade(text, text, numeric, text, uuid),
  public.reset_portfolio(),
  public.portfolio_market_value(uuid),
  public.fx_to_base(text, text),
  public.submit_market_event_decision(uuid, text, text, text, int),
  public.get_market_event_resolution(uuid),
  public.register_for_competition(uuid),
  public.withdraw_from_competition(uuid),
  public.get_competition_standings(uuid),
  public.get_leaderboard(text, text, int),
  public.list_universities(),
  public.get_my_ranks(),
  public.get_promotion_status(uuid),
  public.attempt_promotion()
to authenticated;

grant execute on function public.get_passport(text) to authenticated, anon;

-- Admin RPCs (each asserts is_admin() internally)
grant execute on function
  public.admin_list_users(text, int),
  public.admin_set_admin(uuid, boolean),
  public.admin_score_submission(uuid, jsonb, text),
  public.admin_award_achievement(uuid, text, text),
  public.admin_revoke_achievement(uuid, text),
  public.admin_recalculate_all(),
  public.admin_finalize_competition(uuid),
  public.admin_resolve_market_event(uuid, text),
  public.admin_overview()
to authenticated;

-- Everything else (recalculate_user_scores, refresh_challenge_evidence,
-- record_rubric_evidence, evaluate_achievements, process_user_progress,
-- finalize_submission_score, grade_task_responses, score_* , user_metric,
-- handle_new_user, notify, ...) remains non-executable by clients.

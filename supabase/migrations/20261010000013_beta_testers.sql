-- =====================================================================
-- FINLAB — 0013 Beta tester checklist and recognition certificate
--   * Five checklist items, each verified from real activity.
--   * When all are done the tester claims a "FINLAB PH Founding Beta Tester"
--     Certificate of Recognition (issue_type 'recognition').
--   * beta_program_open = 0 closes new claims; issued certificates stay valid.
--   * Admins see every tester's progress (admin_beta_testers).
-- =====================================================================

insert into public.app_settings (key, value, description) values
 ('beta_program_open', '1', '1 = beta tester checklist shown and certificates can be claimed; 0 = closed (issued certificates stay valid).')
on conflict (key) do nothing;

alter table public.certificates drop constraint if exists certificates_issue_type_check;
alter table public.certificates add constraint certificates_issue_type_check
  check (issue_type in ('earned','admin_award','test','recognition'));

-- One beta tester certificate per person.
create unique index if not exists uq_certificates_beta_tester on public.certificates(user_id)
  where issue_type = 'recognition' and details->>'recognition' = 'beta_tester';

-- The person's active beta certificate: claimed (recognition) or awarded manually by an admin.
create or replace function public.beta_certificate_code(p_user uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select code from certificates
  where user_id = p_user and revoked_at is null
    and ((issue_type = 'recognition' and details->>'recognition' = 'beta_tester')
         or (issue_type = 'admin_award' and title = 'FINLAB PH Founding Beta Tester'))
  order by issued_at limit 1;
$$;

-- The checklist, evaluated from real activity (never from client input).
create or replace function public.beta_checklist_items(p_user uuid)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_array(
    jsonb_build_object('key', 'lesson', 'label', 'Pass a lesson''s knowledge check', 'link', '/learn',
      'done', exists (select 1 from lesson_progress where user_id = p_user)),
    jsonb_build_object('key', 'daily', 'label', 'Answer a Daily Challenge', 'link', '/dashboard#daily',
      'done', exists (select 1 from daily_answers where user_id = p_user)),
    jsonb_build_object('key', 'challenge', 'label', 'Complete a challenge', 'link', '/challenges',
      'done', exists (select 1 from challenge_submissions where user_id = p_user and status = 'scored')),
    jsonb_build_object('key', 'trade', 'label', 'Make a trade in the Portfolio Simulator', 'link', '/portfolio',
      'done', exists (select 1 from portfolio_transactions where user_id = p_user)),
    jsonb_build_object('key', 'feedback', 'label', 'Send feedback with the Feedback button', 'link', '#feedback',
      'done', exists (select 1 from feedback where user_id = p_user and char_length(btrim(message)) >= 20)));
$$;

create or replace function public.get_beta_checklist()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_items jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  v_items := public.beta_checklist_items(v_uid);
  return jsonb_build_object(
    'open', public.setting_num('beta_program_open', 0) >= 1,
    'items', v_items,
    'done', (select count(*) from jsonb_array_elements(v_items) i where (i->>'done')::boolean),
    'total', jsonb_array_length(v_items),
    'certificate_code', public.beta_certificate_code(v_uid));
end;
$$;

create or replace function public.claim_beta_certificate()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text;
  v_code text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  v_code := public.beta_certificate_code(v_uid);
  if v_code is not null then return v_code; end if;
  select code into v_code from certificates
   where user_id = v_uid and issue_type = 'recognition' and details->>'recognition' = 'beta_tester';
  if v_code is not null then
    if exists (select 1 from certificates where code = v_code and revoked_at is not null) then
      raise exception 'Your beta tester certificate was revoked — contact the FINLAB PH team';
    end if;
    return v_code;
  end if;
  if public.setting_num('beta_program_open', 0) < 1 then raise exception 'The beta tester program is closed'; end if;
  if exists (select 1 from jsonb_array_elements(public.beta_checklist_items(v_uid)) i where not (i->>'done')::boolean) then
    raise exception 'Finish all five checklist items first';
  end if;
  select full_name into v_name from profiles where id = v_uid;
  insert into certificates(code, user_id, kind, recipient_name, title, subtitle, details, issue_type, award_reason)
  values (public.gen_certificate_code(), v_uid, 'certification', coalesce(v_name, 'FINLAB Analyst'),
          'FINLAB PH Founding Beta Tester', 'Beta tester checklist', jsonb_build_object('recognition', 'beta_tester'), 'recognition',
          'Completed the FINLAB PH beta tester checklist: passed a lesson, answered a Daily Challenge, completed a challenge, made a simulated trade and sent product feedback.')
  returning code into v_code;
  perform public.notify(v_uid, 'achievement', 'Certificate earned: FINLAB PH Founding Beta Tester',
    'Thank you for testing FINLAB PH. Verification code ' || v_code || '.', '/verify/' || v_code);
  return v_code;
end;
$$;

-- Admin: every account with checklist progress, invite code and certificate.
create or replace function public.admin_beta_testers()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return (select coalesce(jsonb_agg(x order by (x->>'done')::int desc, x->>'joined_at' desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'user_id', p.id, 'full_name', p.full_name, 'handle', p.handle, 'email', u.email, 'joined_at', p.created_at,
      'last_sign_in_at', u.last_sign_in_at,
      'invite_code', (select code from invite_redemptions r where r.user_id = p.id),
      'items', items,
      'done', (select count(*) from jsonb_array_elements(items) i where (i->>'done')::boolean),
      'certificate_code', public.beta_certificate_code(p.id),
      'feedback_count', (select count(*) from feedback f where f.user_id = p.id)) as x
    from profiles p
    join auth.users u on u.id = p.id
    cross join lateral (select public.beta_checklist_items(p.id) as items) b
    where not exists (select 1 from user_roles r where r.user_id = p.id and r.role = 'admin')) t);
end;
$$;

-- Course-completion badges and the analytics funnel count course certificates only.
create or replace function public.user_metric(p_user uuid, p_metric text, p_arg text default null)
returns numeric
language plpgsql stable security definer set search_path = public
as $$
begin
  case p_metric
    when 'challenges_completed' then
      return (select count(distinct challenge_id) from challenge_submissions where user_id = p_user and status = 'scored');
    when 'challenges_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score);
    when 'category_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score and c.category_id = p_arg);
    when 'tag_passed' then
      return (select count(distinct s.challenge_id) from challenge_submissions s join challenges c on c.id = s.challenge_id
              where s.user_id = p_user and s.status = 'scored' and s.final_score >= c.passing_score and p_arg = any(c.tags));
    when 'challenge_submissions' then return (select count(*) from challenge_submissions where user_id = p_user);
    when 'stock_pitches_submitted' then return (select count(*) from stock_pitches where user_id = p_user and status = 'submitted');
    when 'research_reports_submitted' then return (select count(*) from research_projects where user_id = p_user and status = 'submitted');
    when 'valuation_models' then return (select count(*) from valuation_models where user_id = p_user);
    when 'financial_models' then return (select count(*) from financial_models where user_id = p_user);
    when 'portfolio_trades' then return (select count(*) from portfolio_transactions where user_id = p_user);
    when 'market_event_decisions' then return (select count(*) from market_event_decisions where user_id = p_user);
    when 'competitions_joined' then return (select count(*) from competition_participants where user_id = p_user);
    when 'competitions_won' then return (select count(*) from competition_results where user_id = p_user and rank = 1);
    when 'competitions_top3' then return (select count(*) from competition_results where user_id = p_user and rank <= 3);
    when 'lessons_completed' then return (select count(*) from lesson_progress where user_id = p_user);
    when 'finlab_score' then return (select finlab_score from user_stats where user_id = p_user);
    when 'skill_score' then return coalesce((select score from user_skills where user_id = p_user and skill_id = p_arg), 0);
    when 'streak_longest' then return (select longest_streak from public.user_streak(p_user));
    when 'flashcards_reviewed' then return (select count(*) from flashcard_review_log where user_id = p_user);
    when 'flashcards_mastered' then return (select count(*) from flashcard_state where user_id = p_user and interval_days >= 21);
    when 'peer_reviews_given' then return (select count(*) from peer_reviews where reviewer_id = p_user);
    when 'helpful_reviews' then return (select count(*) from peer_reviews where reviewer_id = p_user and helpful_rating >= 4);
    when 'capstones_passed' then return (select count(*) from capstone_submissions where user_id = p_user and status = 'scored' and score >= 70);
    when 'daily_correct' then return (select count(*) from daily_answers where user_id = p_user and correct);
    when 'certificates_earned' then return (select count(*) from certificates where user_id = p_user and revoked_at is null and kind <> 'competition' and issue_type not in ('test', 'recognition'));
    else raise exception 'Unknown metric: %', p_metric;
  end case;
end;
$$;

create or replace function public.admin_analytics(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'days', (select coalesce(jsonb_agg(jsonb_build_object('date', g::date,
                'signups', (select count(*) from profiles p where (p.created_at at time zone 'Asia/Manila')::date = g::date),
                'active', (select count(distinct e.user_id) from public.xp_events(v_since) e where (e.at at time zone 'Asia/Manila')::date = g::date),
                'xp', (select coalesce(sum(e.xp), 0) from public.xp_events(v_since) e where (e.at at time zone 'Asia/Manila')::date = g::date))
              order by g), '[]'::jsonb)
             from generate_series((v_since at time zone 'Asia/Manila')::date, public.manila_today(), interval '1 day') g),
    'funnel', jsonb_build_array(
       jsonb_build_object('step', 'Registered', 'users', (select count(*) from profiles)),
       jsonb_build_object('step', 'Onboarded', 'users', (select count(*) from profiles where onboarded_at is not null)),
       jsonb_build_object('step', 'Passed a lesson', 'users', (select count(distinct user_id) from lesson_progress)),
       jsonb_build_object('step', 'Scored a challenge', 'users', (select count(distinct user_id) from challenge_submissions where status = 'scored')),
       jsonb_build_object('step', 'Enrolled in a program', 'users', (select count(distinct user_id) from program_enrollments)),
       jsonb_build_object('step', 'Earned a certificate', 'users', (select count(distinct user_id) from certificates where kind <> 'competition' and revoked_at is null and issue_type not in ('test', 'recognition')))),
    'active_7d', (select count(distinct user_id) from public.xp_events(now() - interval '7 days')),
    'active_30d', (select count(distinct user_id) from public.xp_events(now() - interval '30 days')),
    'programs', (select coalesce(jsonb_agg(jsonb_build_object('title', p.title, 'kind', p.kind,
                    'enrolled', (select count(*) from program_enrollments e where e.program_id = p.id),
                    'completed', (select count(*) from program_enrollments e where e.program_id = p.id and e.completed_at is not null))
                  order by p.sort_order), '[]'::jsonb) from certification_programs p),
    'hardest_questions', (select coalesce(jsonb_agg(x order by (x->>'pct_correct')::numeric), '[]'::jsonb) from (
        select jsonb_build_object('lesson', l.title, 'lesson_slug', l.slug, 'question', r.key,
                 'prompt', (select q->>'prompt' from jsonb_array_elements(l.check_questions) q where q->>'id' = r.key),
                 'attempts', count(*), 'pct_correct', round(avg(case when r.value::boolean then 100 else 0 end), 1)) as x
        from lesson_attempts a join lessons l on l.id = a.lesson_id, jsonb_each(a.results) r
        where a.results is not null and a.created_at >= v_since
        group by l.title, l.slug, l.check_questions, r.key
        having count(*) >= 3
        order by avg(case when r.value::boolean then 1 else 0 end) asc limit 15) t),
    'hardest_tasks', (select coalesce(jsonb_agg(x order by (x->>'avg_pct')::numeric), '[]'::jsonb) from (
        select jsonb_build_object('challenge', c.title, 'task', cr->>'label', 'attempts', count(*),
                 'avg_pct', round(avg((cr->>'score')::numeric / nullif((cr->>'max')::numeric, 0) * 100), 1)) as x
        from challenge_scores s join challenge_submissions sb on sb.id = s.submission_id join challenges c on c.id = sb.challenge_id,
             jsonb_array_elements(s.criteria_scores) cr
        where s.is_final and s.created_at >= v_since and (cr->>'max')::numeric > 0
        group by c.title, cr->>'label'
        having count(*) >= 3
        order by avg((cr->>'score')::numeric / nullif((cr->>'max')::numeric, 0)) asc limit 10) t),
    'activities', (select coalesce(jsonb_agg(jsonb_build_object('title', la.title, 'kind', la.kind, 'lesson', l.title,
                      'attempts', (select count(*) from activity_attempts aa where aa.activity_id = la.id and aa.created_at >= v_since),
                      'avg_score', (select round(avg(score), 1) from activity_attempts aa where aa.activity_id = la.id and aa.created_at >= v_since))
                    order by l.sort_order, la.position), '[]'::jsonb)
                   from lesson_activities la join lessons l on l.id = la.lesson_id where la.kind <> 'calculator'),
    'daily', jsonb_build_object('answered_today', (select count(*) from daily_answers where day = public.manila_today()),
                                'correct_today', (select count(*) from daily_answers where day = public.manila_today() and correct)),
    'pending', jsonb_build_object('submissions', (select count(*) from challenge_submissions where status = 'pending_review'),
                                  'capstones', (select count(*) from capstone_submissions where status = 'submitted'),
                                  'feedback', (select count(*) from feedback where status = 'open')));
end;
$$;

revoke execute on function public.beta_checklist_items(uuid), public.beta_certificate_code(uuid) from public, anon, authenticated;
revoke execute on function public.get_beta_checklist(), public.claim_beta_certificate(), public.admin_beta_testers() from public, anon;
grant execute on function public.get_beta_checklist(), public.claim_beta_certificate(), public.admin_beta_testers() to authenticated;

-- =====================================================================
-- FINLAB — 0012 Admin-awarded and test certificates
--   * issue_type: 'earned' (automatic, unchanged), 'admin_award' (issued by
--     an admin with a public reason) or 'test' (an admin's end-to-end test).
--   * The verification page states plainly how a certificate was issued.
--   * Test certificates never appear on passports, never count toward
--     achievements or analytics, and can be deleted outright.
-- =====================================================================

alter table public.certificates
  add column if not exists issue_type   text not null default 'earned' check (issue_type in ('earned','admin_award','test')),
  add column if not exists award_reason text,
  add column if not exists awarded_by   uuid references public.profiles(id) on delete set null;

-- Admin: award a certificate for a program, or a custom-titled one (e.g. a workshop).
create or replace function public.admin_award_certificate(p_user uuid, p_program uuid, p_title text, p_reason text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_name  text;
  v_code  text;
  p       certification_programs%rowtype;
  v_title text;
begin
  perform public.assert_admin();
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then
    raise exception 'Give a reason of at least 10 characters — it is shown on the public verification page';
  end if;
  select full_name into v_name from profiles where id = p_user;
  if not found then raise exception 'User not found'; end if;

  if p_program is not null then
    select * into p from certification_programs where id = p_program;
    if not found then raise exception 'Program not found'; end if;
    insert into certificates(code, user_id, kind, program_id, recipient_name, title, subtitle, details, issue_type, award_reason, awarded_by)
    values (public.gen_certificate_code(), p_user, p.kind, p.id, coalesce(v_name, 'FINLAB Analyst'), p.certificate_title, p.title,
            jsonb_build_object('estimated_hours', p.estimated_hours, 'modules', (select count(*) from program_modules where program_id = p.id)),
            'admin_award', btrim(p_reason), auth.uid())
    on conflict (user_id, program_id) do update
      set issue_type = 'admin_award', award_reason = excluded.award_reason, awarded_by = excluded.awarded_by,
          issued_at = now(), revoked_at = null, revoked_reason = null, recipient_name = excluded.recipient_name
      where certificates.revoked_at is not null
    returning code into v_code;
    if v_code is null then raise exception 'This person already holds an active certificate for that program'; end if;
    v_title := p.certificate_title;
  else
    v_title := btrim(coalesce(p_title, ''));
    if char_length(v_title) < 4 then raise exception 'Give the certificate a title'; end if;
    insert into certificates(code, user_id, kind, recipient_name, title, subtitle, details, issue_type, award_reason, awarded_by)
    values (public.gen_certificate_code(), p_user, 'certification', coalesce(v_name, 'FINLAB Analyst'), v_title, 'Awarded by FINLAB PH', '{}'::jsonb,
            'admin_award', btrim(p_reason), auth.uid())
    returning code into v_code;
  end if;

  perform public.notify(p_user, 'achievement', 'Certificate awarded: ' || v_title,
    'Verification code ' || v_code || '. Find it under Learn → Certifications.', '/verify/' || v_code);
  perform public.evaluate_achievements(p_user);
  return v_code;
end;
$$;

-- Admin: a TEST certificate for yourself (real code and pages, clearly marked, not a credential).
create or replace function public.admin_create_test_certificate(p_program uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text;
  v_code text;
  p      certification_programs%rowtype;
begin
  perform public.assert_admin();
  select full_name into v_name from profiles where id = v_uid;
  select * into p from certification_programs where id = p_program;
  if not found then raise exception 'Program not found'; end if;
  -- program_id stays null so a test never blocks, or counts as, the real certificate.
  insert into certificates(code, user_id, kind, recipient_name, title, subtitle, details, issue_type, award_reason, awarded_by)
  values (public.gen_certificate_code(), v_uid, p.kind, coalesce(v_name, 'FINLAB Analyst'), p.certificate_title, p.title,
          jsonb_build_object('estimated_hours', p.estimated_hours, 'average_score', 90,
                             'modules', (select count(*) from program_modules where program_id = p.id),
                             'program_title', p.title, 'program_level', p.level),
          'test', 'Test certificate created by an administrator — not a credential.', v_uid)
  returning code into v_code;
  return v_code;
end;
$$;

create or replace function public.admin_delete_test_certificate(p_code text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  delete from certificates where code = upper(btrim(p_code)) and issue_type = 'test';
  if not found then raise exception 'Only test certificates can be deleted (revoke real ones instead)'; end if;
end;
$$;

-- Verification shows how the certificate was issued; tests carry their program in details.
create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'code', c.code, 'kind', c.kind, 'recipient_name', c.recipient_name, 'title', c.title, 'subtitle', c.subtitle,
    'details', c.details, 'issued_at', c.issued_at, 'revoked_at', c.revoked_at, 'revoked_reason', c.revoked_reason,
    'issue_type', c.issue_type, 'award_reason', case when c.issue_type <> 'earned' then c.award_reason end,
    'handle', case when pr.is_public and c.issue_type <> 'test' then pr.handle end,
    'program', coalesce(
       (select jsonb_build_object('title', p.title, 'level', p.level, 'estimated_hours', p.estimated_hours, 'description', p.subtitle)
          from certification_programs p where p.id = c.program_id),
       case when c.details ? 'program_title' then jsonb_build_object('title', c.details->>'program_title', 'level', c.details->>'program_level',
                                                                     'estimated_hours', c.details->'estimated_hours', 'description', '') end),
    'competition', (select jsonb_build_object('name', co.name, 'ends_at', co.ends_at) from competitions co where co.id = c.competition_id))
  from certificates c join profiles pr on pr.id = c.user_id
  where c.code = upper(btrim(p_code));
$$;

-- Passports never list test certificates.
create or replace function public.get_user_certificates(p_handle text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', c.code, 'kind', c.kind, 'title', c.title, 'subtitle', c.subtitle,
                                               'issued_at', c.issued_at, 'issue_type', c.issue_type) order by c.issued_at desc), '[]'::jsonb)
  from certificates c join profiles pr on pr.id = c.user_id
  where pr.handle = lower(p_handle) and c.revoked_at is null and c.issue_type <> 'test'
    and (pr.is_public or pr.id = auth.uid() or public.is_admin());
$$;

-- Achievements and analytics ignore test certificates (redefined from 0010 with that one change).
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
    when 'certificates_earned' then return (select count(*) from certificates where user_id = p_user and revoked_at is null and kind <> 'competition' and issue_type <> 'test');
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
       jsonb_build_object('step', 'Earned a certificate', 'users', (select count(distinct user_id) from certificates where kind <> 'competition' and revoked_at is null and issue_type <> 'test'))),
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

revoke execute on function public.admin_award_certificate(uuid, uuid, text, text), public.admin_create_test_certificate(uuid),
  public.admin_delete_test_certificate(text) from public, anon;
grant execute on function public.admin_award_certificate(uuid, uuid, text, text), public.admin_create_test_certificate(uuid),
  public.admin_delete_test_certificate(text) to authenticated;

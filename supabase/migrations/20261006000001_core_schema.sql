-- =====================================================================
-- FINLAB — 0001 Core schema
-- ---------------------------------------------------------------------
-- Data is separated into five layers:
--   REFERENCE   career_levels, specializations, skills, challenge_categories,
--               scoring_rubrics, app_settings, achievements,
--               promotion_requirements, lessons
--   USER        profiles, user_preferences, challenge_attempts,
--               stock_pitches, research_projects, research_sections, sources,
--               valuation_models, financial_models, market_event_decisions,
--               lesson_progress, notifications(read state)
--   CALCULATED  user_stats, user_skills, skill_evidence, challenge_submissions,
--               challenge_scores, user_achievements, promotion_attempts,
--               competition_results, portfolios / positions / transactions
--               (written only by SECURITY DEFINER functions)
--   MARKET      market_securities, market_price_history, market_fx_rates
--   ADMIN       user_roles, challenge_answer_keys, market_event_keys,
--               competitions, competition_challenges, market_events
-- =====================================================================

-- ---------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =====================================================================
-- REFERENCE DATA
-- =====================================================================
create table public.career_levels (
  id           smallint primary key,
  rank         smallint not null unique,
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  created_at   timestamptz not null default now()
);

create table public.specializations (
  id           text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  name         text not null,
  description  text not null default '',
  icon         text not null default 'briefcase',
  is_active    boolean not null default true,
  sort_order   int not null default 0
);

create table public.skills (
  id           text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  name         text not null,
  description  text not null default '',
  -- Contribution of this skill to the FINLAB Score. Weights are normalised
  -- by their sum, so they do not need to add to exactly 100.
  weight       numeric(6,3) not null check (weight >= 0),
  sort_order   int not null default 0
);

create table public.challenge_categories (
  id           text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  name         text not null,
  description  text not null default '',
  icon         text not null default 'folder',
  sort_order   int not null default 0
);

create table public.app_settings (
  key          text primary key,
  value        jsonb not null,
  description  text not null default '',
  updated_at   timestamptz not null default now()
);
create trigger trg_app_settings_updated before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Deterministic scoring rubrics (stock pitch, research report, ...).
-- criteria: [{key, label, weight, skill_id, description}]
create table public.scoring_rubrics (
  id           text primary key,
  name         text not null,
  description  text not null default '',
  criteria     jsonb not null,
  config       jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);
create trigger trg_scoring_rubrics_updated before update on public.scoring_rubrics
  for each row execute function public.set_updated_at();

-- =====================================================================
-- USERS
-- =====================================================================
create table public.profiles (
  id                         uuid primary key references auth.users(id) on delete cascade,
  handle                     text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  full_name                  text not null default '' check (char_length(full_name) <= 120),
  headline                   text not null default '' check (char_length(headline) <= 160),
  bio                        text not null default '' check (char_length(bio) <= 2000),
  country_code               text not null default 'PH' check (country_code ~ '^[A-Z]{2}$'),
  university                 text check (char_length(university) <= 160),
  primary_specialization_id  text references public.specializations(id) on delete set null,
  is_public                  boolean not null default true,
  onboarded_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index idx_profiles_country on public.profiles(country_code);
create index idx_profiles_specialization on public.profiles(primary_specialization_id);
create index idx_profiles_university on public.profiles(lower(university));
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_preferences (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  interests         text[] not null default '{}'
                    check (interests <@ array['equity_research','asset_management','investment_banking',
                                              'corporate_finance','venture_capital','portfolio_management']::text[]),
  experience_level  text check (experience_level in ('beginner','some_knowledge','finance_student','experienced')),
  goal              text check (goal in ('learn_finance','competitions','build_portfolio','career_prep','investing_skills')),
  updated_at        timestamptz not null default now()
);
create trigger trg_user_preferences_updated before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Roles live in their own table. No policy lets a user insert into it.
create table public.user_roles (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('admin')),
  granted_at  timestamptz not null default now(),
  granted_by  uuid references public.profiles(id) on delete set null,
  primary key (user_id, role)
);

-- CALCULATED: one row per user, written only by scoring functions.
create table public.user_stats (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  finlab_score           numeric(5,2) not null default 0 check (finlab_score between 0 and 100),
  career_level_id        smallint not null references public.career_levels(id),
  scored_activity_count  int not null default 0,
  last_scored_at         timestamptz,
  promoted_at            timestamptz,
  updated_at             timestamptz not null default now()
);
create index idx_user_stats_score on public.user_stats(finlab_score desc);
create index idx_user_stats_level on public.user_stats(career_level_id);

create table public.user_skills (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  skill_id         text not null references public.skills(id) on delete cascade,
  score            numeric(5,2) not null default 0 check (score between 0 and 100),
  evidence_weight  numeric(8,3) not null default 0,
  evidence_count   int not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index idx_user_skills_skill on public.user_skills(skill_id);

-- Every piece of scored work becomes evidence for one or more skills.
-- Skill scores are a confidence-weighted average of this evidence.
create table public.skill_evidence (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  skill_id     text not null references public.skills(id) on delete cascade,
  source_type  text not null check (source_type in ('challenge','stock_pitch','research_report','market_event','competition')),
  source_id    uuid not null,
  score        numeric(5,2) not null check (score between 0 and 100),
  weight       numeric(5,3) not null check (weight > 0),
  recorded_at  timestamptz not null default now(),
  primary key (user_id, skill_id, source_type, source_id)
);
create index idx_skill_evidence_source on public.skill_evidence(source_type, source_id);

-- =====================================================================
-- LEARN
-- =====================================================================
create table public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title              text not null,
  summary            text not null default '',
  category_id        text not null references public.challenge_categories(id),
  difficulty         text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced','expert')),
  estimated_minutes  int not null default 10 check (estimated_minutes > 0),
  body               text not null default '',
  related_challenge_slugs text[] not null default '{}',
  sort_order         int not null default 0,
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_lessons_category on public.lessons(category_id);
create trigger trg_lessons_updated before update on public.lessons
  for each row execute function public.set_updated_at();

create table public.lesson_progress (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index idx_lesson_progress_lesson on public.lesson_progress(lesson_id);

-- =====================================================================
-- CHALLENGES
-- =====================================================================
create table public.challenges (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  title              text not null check (char_length(title) between 3 and 160),
  summary            text not null default '',
  description        text not null default '',          -- markdown brief / case
  instructions       text not null default '',          -- markdown
  category_id        text not null references public.challenge_categories(id),
  kind               text not null default 'tasks' check (kind in ('tasks','stock_pitch','research_report')),
  pitch_format       text check (pitch_format in ('quick','professional')),
  difficulty         text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced','expert')),
  estimated_minutes  int not null default 20 check (estimated_minutes > 0),
  time_limit_minutes int check (time_limit_minutes > 0),
  duration_days      int check (duration_days between 1 and 30),
  points             int not null default 100 check (points >= 0),
  passing_score      numeric(5,2) not null default 60 check (passing_score between 0 and 100),
  -- auto: graded instantly. manual: waits for admin review.
  -- hybrid: graded instantly, admin may override. ('ai_judge' reserved for a later phase.)
  scoring_method     text not null default 'auto' check (scoring_method in ('auto','manual','hybrid')),
  scoring_criteria   jsonb not null default '[]'::jsonb,  -- displayed rubric [{label, weight, description}]
  skill_impact       jsonb not null default '{}'::jsonb,  -- {skill_id: weight 0..1}
  content            jsonb not null default '{"tasks":[]}'::jsonb, -- public task definitions (no answers)
  tags               text[] not null default '{}',
  max_attempts       int check (max_attempts > 0),
  is_published       boolean not null default false,
  published_at       timestamptz,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (kind <> 'stock_pitch' or pitch_format is not null)
);
create index idx_challenges_category on public.challenges(category_id);
create index idx_challenges_published on public.challenges(is_published);
create index idx_challenges_tags on public.challenges using gin(tags);
create trigger trg_challenges_updated before update on public.challenges
  for each row execute function public.set_updated_at();

-- ADMIN-ONLY answer keys. Never readable by normal users.
-- answers: {task_id: {answer, tolerance_pct, tolerance_abs, keywords[], keywords_required}}
create table public.challenge_answer_keys (
  challenge_id  uuid primary key references public.challenges(id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);
create trigger trg_answer_keys_updated before update on public.challenge_answer_keys
  for each row execute function public.set_updated_at();

-- =====================================================================
-- COMPETITIONS (declared before attempts, which reference them)
-- =====================================================================
create table public.competitions (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  name                   text not null,
  description            text not null default '',
  rules                  text not null default '',
  starts_at              timestamptz not null,
  ends_at                timestamptz not null,
  registration_deadline  timestamptz not null,
  participant_limit      int check (participant_limit > 0),
  scoring_method         text not null default 'sum' check (scoring_method in ('sum','average','best')),
  is_published           boolean not null default false,
  results_finalized_at   timestamptz,
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (ends_at > starts_at),
  check (registration_deadline <= ends_at)
);
create index idx_competitions_dates on public.competitions(starts_at, ends_at);
create trigger trg_competitions_updated before update on public.competitions
  for each row execute function public.set_updated_at();

create table public.competition_challenges (
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  challenge_id    uuid not null references public.challenges(id) on delete cascade,
  weight          numeric(6,3) not null default 1 check (weight > 0),
  position        int not null default 0,
  primary key (competition_id, challenge_id)
);
create index idx_competition_challenges_challenge on public.competition_challenges(challenge_id);

create table public.competition_participants (
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  registered_at   timestamptz not null default now(),
  primary key (competition_id, user_id)
);
create index idx_competition_participants_user on public.competition_participants(user_id);

create table public.competition_results (
  competition_id  uuid not null references public.competitions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  rank            int not null check (rank > 0),
  score           numeric(8,2) not null,
  details         jsonb not null default '{}'::jsonb,
  finalized_at    timestamptz not null default now(),
  primary key (competition_id, user_id)
);
create index idx_competition_results_user on public.competition_results(user_id);

-- =====================================================================
-- STOCK PITCHES & RESEARCH (user-generated work)
-- =====================================================================
create table public.stock_pitches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  challenge_id        uuid references public.challenges(id) on delete set null,
  format              text not null default 'quick' check (format in ('quick','professional')),
  status              text not null default 'draft' check (status in ('draft','submitted')),
  company             text not null default '' check (char_length(company) <= 160),
  ticker              text not null default '' check (char_length(ticker) <= 20),
  exchange            text check (char_length(exchange) <= 20),
  currency            text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  rating              text check (rating in ('BUY','HOLD','SELL')),
  current_price       numeric(18,4) check (current_price > 0),
  target_price        numeric(18,4) check (target_price > 0),
  valuation_method    text check (char_length(valuation_method) <= 60),
  thesis              text not null default '',
  catalysts           text not null default '',
  risks               text not null default '',
  company_analysis    text not null default '',
  financial_analysis  text not null default '',
  forecast            text not null default '',
  valuation           text not null default '',
  variant_perception  text not null default '',
  starts_at           timestamptz not null default now(),
  deadline_at         timestamptz,
  is_public           boolean not null default false,
  score               numeric(5,2),
  criteria_scores     jsonb,
  submitted_at        timestamptz,
  scored_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (format = 'quick' or deadline_at is not null)
);
create index idx_stock_pitches_user on public.stock_pitches(user_id, status);
create index idx_stock_pitches_challenge on public.stock_pitches(challenge_id);
create index idx_stock_pitches_public on public.stock_pitches(is_public) where is_public;
create trigger trg_stock_pitches_updated before update on public.stock_pitches
  for each row execute function public.set_updated_at();

create table public.research_projects (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  challenge_id   uuid references public.challenges(id) on delete set null,
  title          text not null default 'Untitled research' check (char_length(title) between 1 and 200),
  company        text not null default '' check (char_length(company) <= 160),
  ticker         text not null default '' check (char_length(ticker) <= 20),
  exchange       text check (char_length(exchange) <= 20),
  currency       text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  rating         text check (rating in ('BUY','HOLD','SELL')),
  current_price  numeric(18,4) check (current_price > 0),
  target_price   numeric(18,4) check (target_price > 0),
  status         text not null default 'draft' check (status in ('draft','submitted')),
  is_public      boolean not null default false,
  score          numeric(5,2),
  criteria_scores jsonb,
  submitted_at   timestamptz,
  scored_at      timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_research_projects_user on public.research_projects(user_id, status);
create index idx_research_projects_challenge on public.research_projects(challenge_id);
create index idx_research_projects_public on public.research_projects(is_public) where is_public;
create trigger trg_research_projects_updated before update on public.research_projects
  for each row execute function public.set_updated_at();

create table public.research_sections (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.research_projects(id) on delete cascade,
  section_key  text not null check (section_key in (
                 'investment_thesis','company_overview','industry_overview','competitive_analysis',
                 'financial_analysis','forecast','valuation','catalysts','risks','conclusion')),
  content      text not null default '' check (char_length(content) <= 40000),
  updated_at   timestamptz not null default now(),
  unique (project_id, section_key)
);
create trigger trg_research_sections_updated before update on public.research_sections
  for each row execute function public.set_updated_at();

-- Structured citations for pitches and research reports.
create table public.sources (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  stock_pitch_id       uuid references public.stock_pitches(id) on delete cascade,
  research_project_id  uuid references public.research_projects(id) on delete cascade,
  title                text not null check (char_length(title) between 1 and 300),
  url                  text check (url is null or url ~* '^https?://'),
  publisher            text check (char_length(publisher) <= 160),
  published_on         date,
  note                 text check (char_length(note) <= 1000),
  created_at           timestamptz not null default now(),
  check (num_nonnulls(stock_pitch_id, research_project_id) = 1)
);
create index idx_sources_pitch on public.sources(stock_pitch_id);
create index idx_sources_research on public.sources(research_project_id);
create index idx_sources_user on public.sources(user_id);

-- Challenge attempts are the workspace (drafts); submissions are immutable.
create table public.challenge_attempts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  challenge_id         uuid not null references public.challenges(id) on delete cascade,
  competition_id       uuid references public.competitions(id) on delete set null,
  status               text not null default 'in_progress' check (status in ('in_progress','submitted','abandoned')),
  responses            jsonb not null default '{}'::jsonb,
  stock_pitch_id       uuid references public.stock_pitches(id) on delete set null,
  research_project_id  uuid references public.research_projects(id) on delete set null,
  started_at           timestamptz not null default now(),
  deadline_at          timestamptz,
  last_saved_at        timestamptz,
  submitted_at         timestamptz
);
create index idx_attempts_user_challenge on public.challenge_attempts(user_id, challenge_id);
create index idx_attempts_challenge on public.challenge_attempts(challenge_id);
create index idx_attempts_competition on public.challenge_attempts(competition_id);
create index idx_attempts_pitch on public.challenge_attempts(stock_pitch_id);
create index idx_attempts_research on public.challenge_attempts(research_project_id);
create unique index uq_attempts_one_open on public.challenge_attempts
  (user_id, challenge_id, coalesce(competition_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'in_progress';

create table public.challenge_submissions (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null unique references public.challenge_attempts(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  challenge_id    uuid not null references public.challenges(id) on delete cascade,
  competition_id  uuid references public.competitions(id) on delete set null,
  responses       jsonb not null default '{}'::jsonb,
  status          text not null default 'pending_review' check (status in ('pending_review','scored')),
  final_score     numeric(5,2) check (final_score between 0 and 100),
  submitted_at    timestamptz not null default now(),
  scored_at       timestamptz
);
create index idx_submissions_user on public.challenge_submissions(user_id, status);
create index idx_submissions_challenge on public.challenge_submissions(challenge_id);
create index idx_submissions_competition on public.challenge_submissions(competition_id);
create index idx_submissions_status on public.challenge_submissions(status, submitted_at);

-- Score history per submission. Exactly one row is final at a time.
-- scorer_type 'ai' is reserved for the future AI Judge module.
create table public.challenge_scores (
  id               uuid primary key default gen_random_uuid(),
  submission_id    uuid not null references public.challenge_submissions(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  scorer_type      text not null check (scorer_type in ('auto','admin','ai')),
  total_score      numeric(5,2) not null check (total_score between 0 and 100),
  criteria_scores  jsonb not null default '[]'::jsonb,
  feedback         text not null default '',
  scored_by        uuid references public.profiles(id) on delete set null,
  is_final         boolean not null default false,
  created_at       timestamptz not null default now()
);
create index idx_scores_submission on public.challenge_scores(submission_id);
create index idx_scores_user on public.challenge_scores(user_id);
create unique index uq_scores_one_final on public.challenge_scores(submission_id) where is_final;

-- =====================================================================
-- VALUATION & FINANCIAL MODELS
-- =====================================================================
create table public.valuation_models (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 160),
  company        text not null default '' check (char_length(company) <= 160),
  ticker         text not null default '' check (char_length(ticker) <= 20),
  method         text not null check (method in ('pe','pb','dcf')),
  currency       text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  current_price  numeric(18,4) check (current_price > 0),
  inputs         jsonb not null default '{}'::jsonb,
  outputs        jsonb not null default '{}'::jsonb,
  notes          text not null default '' check (char_length(notes) <= 5000),
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_valuation_models_user on public.valuation_models(user_id);
create trigger trg_valuation_models_updated before update on public.valuation_models
  for each row execute function public.set_updated_at();

create table public.financial_models (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 160),
  company     text not null default '' check (char_length(company) <= 160),
  ticker      text not null default '' check (char_length(ticker) <= 20),
  currency    text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  unit        text not null default 'millions' check (unit in ('units','thousands','millions','billions')),
  data        jsonb not null default '{}'::jsonb,
  notes       text not null default '' check (char_length(notes) <= 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_financial_models_user on public.financial_models(user_id);
create trigger trg_financial_models_updated before update on public.financial_models
  for each row execute function public.set_updated_at();

-- =====================================================================
-- MARKET DATA (sample/static in Phase 1 — see MarketDataProvider)
-- =====================================================================
create table public.market_securities (
  id                  text primary key check (id ~ '^[A-Z]+:[A-Z0-9.\-]+$'),  -- e.g. PSE:BDO
  symbol              text not null,
  exchange            text not null check (exchange in ('PSE','NYSE','NASDAQ')),
  name                text not null,
  sector              text not null default '',
  currency            text not null check (currency ~ '^[A-Z]{3}$'),
  price               numeric(18,4) not null check (price > 0),
  prev_close          numeric(18,4) check (prev_close > 0),
  eps                 numeric(18,4),
  bvps                numeric(18,4),
  pe                  numeric(10,2),
  pb                  numeric(10,2),
  market_cap          numeric(22,2),
  revenue             numeric(22,2),
  shares_outstanding  numeric(22,2),
  description         text not null default '',
  data_as_of          date not null,
  data_source         text not null default 'sample' check (data_source in ('sample','manual','live')),
  is_active           boolean not null default true,
  updated_at          timestamptz not null default now()
);
create index idx_market_securities_exchange on public.market_securities(exchange);
create trigger trg_market_securities_updated before update on public.market_securities
  for each row execute function public.set_updated_at();

create table public.market_price_history (
  security_id  text not null references public.market_securities(id) on delete cascade,
  trade_date   date not null,
  close        numeric(18,4) not null check (close > 0),
  primary key (security_id, trade_date)
);

create table public.market_fx_rates (
  pair         text primary key check (pair ~ '^[A-Z]{6}$'),  -- e.g. USDPHP
  rate         numeric(18,6) not null check (rate > 0),
  as_of        date not null,
  data_source  text not null default 'sample'
);

-- =====================================================================
-- PORTFOLIO SIMULATOR (virtual money only)
-- =====================================================================
create table public.portfolios (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.profiles(id) on delete cascade,
  name              text not null default 'Main Portfolio',
  base_currency     text not null default 'PHP',
  starting_capital  numeric(20,2) not null check (starting_capital > 0),
  cash              numeric(20,2) not null check (cash >= 0),
  realized_pl       numeric(20,2) not null default 0,
  reset_at          timestamptz,
  created_at        timestamptz not null default now()
);

create table public.portfolio_positions (
  portfolio_id     uuid not null references public.portfolios(id) on delete cascade,
  security_id      text not null references public.market_securities(id),
  shares           numeric(20,4) not null check (shares > 0),
  avg_cost_local   numeric(18,4) not null check (avg_cost_local > 0),
  cost_basis_base  numeric(20,2) not null check (cost_basis_base >= 0),
  opened_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (portfolio_id, security_id)
);
create index idx_positions_security on public.portfolio_positions(security_id);

create table public.portfolio_transactions (
  id               uuid primary key default gen_random_uuid(),
  portfolio_id     uuid not null references public.portfolios(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  security_id      text not null references public.market_securities(id),
  side             text not null check (side in ('buy','sell')),
  shares           numeric(20,4) not null check (shares > 0),
  price_local      numeric(18,4) not null check (price_local > 0),
  fx_rate          numeric(18,6) not null check (fx_rate > 0),
  amount_base      numeric(20,2) not null,
  realized_pl_base numeric(20,2),
  rationale        text not null check (char_length(rationale) between 15 and 2000),
  market_event_id  uuid,
  created_at       timestamptz not null default now()
);
create index idx_transactions_portfolio on public.portfolio_transactions(portfolio_id, created_at desc);
create index idx_transactions_user on public.portfolio_transactions(user_id);
create index idx_transactions_security on public.portfolio_transactions(security_id);

-- =====================================================================
-- MARKET EVENTS (manually configured in Phase 1)
-- =====================================================================
create table public.market_events (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null check (char_length(title) between 3 and 200),
  description           text not null default '',
  category              text not null default 'macro' check (category in ('macro','sector','company','geopolitical')),
  region                text not null default 'PH',
  affected_securities   text[] not null default '{}',
  -- {security_id: pct_change} applied to sample prices when resolved
  price_impacts         jsonb not null default '{}'::jsonb,
  status                text not null default 'draft' check (status in ('draft','open','resolved')),
  opens_at              timestamptz not null default now(),
  closes_at             timestamptz,
  resolved_at           timestamptz,
  resolution_summary    text not null default '',
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index idx_market_events_status on public.market_events(status, opens_at desc);
create trigger trg_market_events_updated before update on public.market_events
  for each row execute function public.set_updated_at();

-- ADMIN-ONLY scoring key for an event.
create table public.market_event_keys (
  event_id            uuid primary key references public.market_events(id) on delete cascade,
  best_actions        text[] not null default '{}',
  acceptable_actions  text[] not null default '{}',
  keywords            text[] not null default '{}',
  updated_at          timestamptz not null default now()
);

create table public.market_event_decisions (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.market_events(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  action       text not null check (action in ('buy','sell','hold','rebalance')),
  security_id  text references public.market_securities(id),
  reasoning    text not null check (char_length(reasoning) between 40 and 4000),
  confidence   smallint not null default 3 check (confidence between 1 and 5),
  score        numeric(5,2),
  feedback     text,
  scored_at    timestamptz,
  created_at   timestamptz not null default now(),
  unique (event_id, user_id)
);
create index idx_event_decisions_user on public.market_event_decisions(user_id);

-- =====================================================================
-- ACHIEVEMENTS & CAREER PROGRESSION
-- =====================================================================
-- criteria (evaluated by public.achievement_criteria_met):
--   {"type":"metric","metric":"challenges_completed","gte":1}
--   {"type":"metric","metric":"category_passed","arg":"valuation","gte":3}
--   {"type":"percentile","max_pct":10,"min_population":10}
--   {"type":"all","conditions":[ ... ]}
create table public.achievements (
  id           text primary key check (id ~ '^[a-z0-9_]{2,60}$'),
  name         text not null,
  description  text not null default '',
  icon         text not null default 'award',
  tier         text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum')),
  criteria     jsonb not null,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table public.user_achievements (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  achievement_id  text not null references public.achievements(id) on delete cascade,
  awarded_at      timestamptz not null default now(),
  award_source    text not null default 'auto' check (award_source in ('auto','admin')),
  note            text,
  primary key (user_id, achievement_id)
);
create index idx_user_achievements_achievement on public.user_achievements(achievement_id);

-- requirement_type + params (evaluated by public.evaluate_requirement):
--   min_finlab_score   {"value":70}
--   challenges_passed  {"value":5}
--   category_passed    {"category":"valuation","value":1}
--   tag_passed         {"tag":"financial_modeling","value":1}
--   metric_gte         {"metric":"stock_pitches_submitted","value":1}
--   skill_min          {"skill":"valuation","value":60}
create table public.promotion_requirements (
  id                uuid primary key default gen_random_uuid(),
  target_level_id   smallint not null references public.career_levels(id) on delete cascade,
  requirement_type  text not null check (requirement_type in
                      ('min_finlab_score','challenges_passed','category_passed','tag_passed','metric_gte','skill_min')),
  params            jsonb not null default '{}'::jsonb,
  label             text not null,
  sort_order        int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
create index idx_promotion_requirements_level on public.promotion_requirements(target_level_id);

create table public.promotion_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  from_level_id    smallint not null references public.career_levels(id),
  target_level_id  smallint not null references public.career_levels(id),
  passed           boolean not null,
  results          jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);
create index idx_promotion_attempts_user on public.promotion_attempts(user_id, created_at desc);

-- =====================================================================
-- NOTIFICATIONS
-- =====================================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('score','achievement','promotion','competition','market_event','system')),
  title       text not null,
  body        text not null default '',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where read_at is null;

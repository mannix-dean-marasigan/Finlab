// Domain types mirroring the Supabase schema (supabase/migrations).

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Rating = 'BUY' | 'HOLD' | 'SELL';
export type ScoringMethod = 'auto' | 'manual' | 'hybrid';
export type ChallengeKind = 'tasks' | 'stock_pitch' | 'research_report';
export type PitchFormat = 'quick' | 'professional';

// ---------- Reference ----------
export interface CareerLevel {
  id: number;
  rank: number;
  slug: string;
  name: string;
  description: string;
}
export interface Specialization {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  weight: number;
  sort_order: number;
}
export interface ChallengeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

// ---------- Users ----------
export interface Profile {
  id: string;
  handle: string;
  full_name: string;
  headline: string;
  bio: string;
  country_code: string;
  university: string | null;
  primary_specialization_id: string | null;
  is_public: boolean;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface UserPreferences {
  user_id: string;
  interests: string[];
  experience_level: 'beginner' | 'some_knowledge' | 'finance_student' | 'experienced' | null;
  goal: 'learn_finance' | 'competitions' | 'build_portfolio' | 'career_prep' | 'investing_skills' | null;
}
export interface UserStats {
  user_id: string;
  finlab_score: number;
  career_level_id: number;
  scored_activity_count: number;
  last_scored_at: string | null;
  promoted_at: string | null;
}
export interface UserSkill {
  user_id: string;
  skill_id: string;
  score: number;
  evidence_weight: number;
  evidence_count: number;
}

// ---------- Challenges ----------
export interface TaskOption {
  id: string;
  label: string;
}
export interface ChallengeTask {
  id: string;
  type: 'mcq' | 'numeric' | 'text' | 'long_text';
  label?: string;
  prompt: string;
  options?: TaskOption[];
  unit?: string;
  min_words?: number;
  points?: number;
}
export interface ChallengeContent {
  tasks?: ChallengeTask[];
  company?: string;
  ticker?: string;
  exchange?: string;
  currency?: string;
  current_price?: string;
}
export interface RubricCriterionDisplay {
  label: string;
  weight?: number;
  description?: string;
}
export interface Challenge {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  instructions: string;
  category_id: string;
  kind: ChallengeKind;
  pitch_format: PitchFormat | null;
  difficulty: Difficulty;
  estimated_minutes: number;
  time_limit_minutes: number | null;
  duration_days: number | null;
  points: number;
  passing_score: number;
  scoring_method: ScoringMethod;
  scoring_criteria: RubricCriterionDisplay[];
  skill_impact: Record<string, number>;
  content: ChallengeContent;
  tags: string[];
  max_attempts: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface ChallengeAttempt {
  id: string;
  user_id: string;
  challenge_id: string;
  competition_id: string | null;
  status: 'in_progress' | 'submitted' | 'abandoned';
  responses: Record<string, string>;
  stock_pitch_id: string | null;
  research_project_id: string | null;
  started_at: string;
  deadline_at: string | null;
  last_saved_at: string | null;
  submitted_at: string | null;
}
export interface CriterionScore {
  key: string;
  label: string;
  score: number;
  max: number;
  weight?: number;
  skill_id?: string;
  feedback?: string;
}
export interface ChallengeSubmission {
  id: string;
  attempt_id: string;
  user_id: string;
  challenge_id: string;
  competition_id: string | null;
  responses: Record<string, string>;
  status: 'pending_review' | 'scored';
  final_score: number | null;
  submitted_at: string;
  scored_at: string | null;
  attempt_number: number | null;
}
export interface ChallengeScore {
  id: string;
  submission_id: string;
  scorer_type: 'auto' | 'admin' | 'ai';
  total_score: number;
  criteria_scores: CriterionScore[];
  feedback: string;
  is_final: boolean;
  created_at: string;
}
export interface SubmitResult {
  submission_id?: string;
  status: 'scored' | 'pending_review';
  score: number | null;
  passed?: boolean | null;
  criteria: CriterionScore[] | null;
  new_achievements: string[];
  upside_pct?: number | null;
  attempt_number?: number;
  skill_weight_factor?: number;
}

// ---------- Work products ----------
export interface StockPitch {
  id: string;
  user_id: string;
  challenge_id: string | null;
  format: PitchFormat;
  status: 'draft' | 'submitted';
  /** Opt-in: submitted pitch is shown (anonymised) to other analysts for peer review. */
  peer_review_open?: boolean;
  company: string;
  ticker: string;
  exchange: string | null;
  currency: string;
  rating: Rating | null;
  current_price: number | null;
  target_price: number | null;
  valuation_method: string | null;
  thesis: string;
  catalysts: string;
  risks: string;
  company_analysis: string;
  financial_analysis: string;
  forecast: string;
  valuation: string;
  variant_perception: string;
  starts_at: string;
  deadline_at: string | null;
  is_public: boolean;
  score: number | null;
  criteria_scores: CriterionScore[] | null;
  submitted_at: string | null;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface Source {
  id: string;
  user_id: string;
  stock_pitch_id: string | null;
  research_project_id: string | null;
  title: string;
  url: string | null;
  publisher: string | null;
  published_on: string | null;
  note: string | null;
  created_at: string;
}
export type ResearchSectionKey =
  | 'investment_thesis'
  | 'company_overview'
  | 'industry_overview'
  | 'competitive_analysis'
  | 'financial_analysis'
  | 'forecast'
  | 'valuation'
  | 'catalysts'
  | 'risks'
  | 'conclusion';
export interface ResearchProject {
  id: string;
  user_id: string;
  challenge_id: string | null;
  title: string;
  company: string;
  ticker: string;
  exchange: string | null;
  currency: string;
  rating: Rating | null;
  current_price: number | null;
  target_price: number | null;
  status: 'draft' | 'submitted';
  is_public: boolean;
  score: number | null;
  criteria_scores: CriterionScore[] | null;
  submitted_at: string | null;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface ResearchSection {
  id: string;
  project_id: string;
  section_key: ResearchSectionKey;
  content: string;
  updated_at: string;
}
export interface ValuationModel {
  id: string;
  user_id: string;
  name: string;
  company: string;
  ticker: string;
  method: 'pe' | 'pb' | 'dcf';
  currency: string;
  current_price: number | null;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  notes: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
export interface FinancialModelRecord {
  id: string;
  user_id: string;
  name: string;
  company: string;
  ticker: string;
  currency: string;
  unit: 'units' | 'thousands' | 'millions' | 'billions';
  data: unknown;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ---------- Portfolio & markets ----------
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  base_currency: string;
  starting_capital: number;
  cash: number;
  realized_pl: number;
  reset_at: string | null;
  created_at: string;
}
export interface PortfolioPosition {
  portfolio_id: string;
  security_id: string;
  shares: number;
  avg_cost_local: number;
  cost_basis_base: number;
  opened_at: string;
}
export interface PortfolioTransaction {
  id: string;
  security_id: string;
  side: 'buy' | 'sell';
  shares: number;
  price_local: number;
  fx_rate: number;
  amount_base: number;
  realized_pl_base: number | null;
  rationale: string;
  created_at: string;
}
export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  category: 'macro' | 'sector' | 'company' | 'geopolitical';
  region: string;
  affected_securities: string[];
  price_impacts: Record<string, number>;
  status: 'draft' | 'open' | 'resolved';
  opens_at: string;
  closes_at: string | null;
  resolved_at: string | null;
  resolution_summary: string;
  created_at: string;
}
export interface MarketEventDecision {
  id: string;
  event_id: string;
  user_id: string;
  action: 'buy' | 'sell' | 'hold' | 'rebalance';
  security_id: string | null;
  reasoning: string;
  confidence: number;
  score: number | null;
  feedback: string | null;
  scored_at: string | null;
  created_at: string;
}

// ---------- Competitions ----------
export interface Competition {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  participant_limit: number | null;
  scoring_method: 'sum' | 'average' | 'best';
  is_published: boolean;
  results_finalized_at: string | null;
  created_at: string;
}
export type CompetitionStatus = 'upcoming' | 'active' | 'completed';
export interface StandingRow {
  rank: number;
  user_id: string;
  handle: string;
  display_name: string;
  score: number;
  challenges_completed: number;
  last_submission: string | null;
  is_me: boolean;
}

// ---------- Progression ----------
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}
export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  awarded_at: string;
  award_source: 'auto' | 'admin';
  note: string | null;
}
export type RequirementType =
  | 'min_finlab_score'
  | 'challenges_passed'
  | 'category_passed'
  | 'tag_passed'
  | 'metric_gte'
  | 'skill_min';
export interface PromotionRequirement {
  id: string;
  target_level_id: number;
  requirement_type: RequirementType;
  params: Record<string, string | number>;
  label: string;
  sort_order: number;
  is_active: boolean;
}
export interface RequirementStatus {
  id: string;
  label: string;
  type: RequirementType;
  params: Record<string, unknown>;
  current: number;
  required: number;
  met: boolean;
}
export interface PromotionStatus {
  current_level: CareerLevel;
  next_level: CareerLevel | null;
  requirements: RequirementStatus[];
  eligible: boolean;
}
export interface PromotionAttempt {
  id: string;
  from_level_id: number;
  target_level_id: number;
  passed: boolean;
  results: RequirementStatus[];
  created_at: string;
}

// ---------- Leaderboards & passport ----------
export type LeaderboardBoard =
  | 'global'
  | 'philippines'
  | 'university'
  | 'specialization'
  | 'stock_pitch'
  | 'equity_research'
  | 'portfolio';
export interface LeaderboardRow {
  rank: number;
  user_id: string;
  handle: string;
  display_name: string;
  university: string | null;
  country_code: string;
  career_level: string;
  specialization: string | null;
  value: number;
  is_me: boolean;
}
export interface RankInfo {
  rank: number | null;
  total: number;
}
export interface MyRanks {
  global: RankInfo;
  country: RankInfo;
  country_code: string;
}
export interface Passport {
  profile: {
    id: string;
    handle: string;
    full_name: string;
    headline: string;
    bio: string;
    university: string | null;
    country_code: string;
    is_public: boolean;
    member_since: string;
    is_me: boolean;
  };
  specialization: Specialization | null;
  stats: {
    finlab_score: number;
    career_level: string;
    career_level_rank: number;
    scored_activity_count: number;
    promoted_at: string | null;
  };
  ranks: { global: RankInfo; country: RankInfo };
  skills: { skill_id: string; name: string; weight: number; score: number; evidence_count: number }[];
  counts: {
    stock_pitches: number;
    research_reports: number;
    valuation_models: number;
    financial_models: number;
    challenges: number;
    portfolio_trades: number;
    competitions: number;
    market_decisions: number;
  };
  achievements: { id: string; name: string; description: string; icon: string; tier: Achievement['tier']; awarded_at: string }[];
  public_pitches: {
    id: string;
    company: string;
    ticker: string;
    rating: Rating;
    format: PitchFormat;
    score: number | null;
    current_price: number;
    target_price: number;
    currency: string;
    submitted_at: string;
  }[];
  public_research: {
    id: string;
    title: string;
    company: string;
    ticker: string;
    rating: Rating | null;
    score: number | null;
    submitted_at: string;
  }[];
  competition_record: {
    competition_id: string;
    name: string;
    rank: number;
    score: number;
    participants: number;
    ended_at: string;
  }[];
}

// ---------- Learn ----------
export interface Lesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category_id: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  body: string;
  related_challenge_slugs: string[];
  sort_order: number;
  is_published: boolean;
  check_questions: ChallengeTask[];
  video_urls: string[];
}
// ---------- Lesson practice activities ----------
export type ActivityKind = 'calculator' | 'spot_error' | 'matching' | 'branching' | 'worked_example';
export interface BranchNode {
  text: string;
  end?: boolean;
  choices?: { id: string; label: string; next: string }[];
}
export interface LessonActivity {
  id: string;
  lesson_id: string;
  slug: string;
  position: number;
  kind: ActivityKind;
  title: string;
  instructions: string;
  is_required: boolean;
  content: {
    calculator?: string;
    defaults?: Record<string, number>;
    prompts?: string[];
    context?: string;
    columns?: string[];
    rows?: { id: string; cells: string[] }[];
    select_count?: number;
    categories?: { id: string; label: string }[];
    items?: { id: string; label: string }[];
    start?: string;
    nodes?: Record<string, BranchNode>;
    intro?: string;
    steps?: { id: string; prompt: string; unit?: string }[];
  };
}

export interface LessonCheckResult {
  score: number;
  passed: boolean;
  pass_pct: number;
  first_completion: boolean;
  questions: { key: string; correct: boolean }[];
  retry_after_seconds: number | null;
}

// ---------- Certifications ----------
export type ProgramKind = 'certification' | 'track';
export interface ProgramSummary {
  id: string;
  slug: string;
  kind: ProgramKind;
  title: string;
  subtitle: string;
  level: Difficulty;
  category_id: string | null;
  estimated_hours: number;
  certificate_title: string;
  is_published: boolean;
  modules: number;
  completed_modules: number;
  enrolled: boolean;
  certificate_code: string | null;
}
export interface ProgramModuleStatus {
  id: string;
  position: number;
  kind: 'lesson' | 'challenge' | 'exam' | 'capstone';
  title: string;
  lesson_slug: string | null;
  challenge_id: string | null;
  minutes: number | null;
  required_score: number | null;
  best_score: number | null;
  complete: boolean;
  locked: boolean;
  config: CapstoneConfig | null;
  capstone: CapstoneStatus | null;
}
export interface CapstoneRubricItem {
  key: string;
  label: string;
  max: number;
}
export interface CapstoneConfig {
  title: string;
  minutes: number;
  brief: string;
  deliverables: string[];
  rubric: CapstoneRubricItem[];
}
export interface CapstoneStatus {
  status: 'submitted' | 'scored' | 'returned';
  score: number | null;
  feedback: string | null;
  criteria: (CapstoneRubricItem & { score: number })[] | null;
  video_url: string;
  slides_url: string | null;
  summary: string;
  submitted_at: string;
  scored_at: string | null;
}

// ------------------------------------------------------------ Engagement
export interface FlashcardItem {
  card_id: string;
  lesson_id: string;
  lesson_title: string;
  front: string;
  back: string;
  is_new: boolean;
  interval_days: number;
}
export interface FlashcardStats {
  due: number;
  learned: number;
  mastered: number;
  total: number;
  reviewed_today: number;
}
export interface ReviewQueueItem {
  pitch_id: string;
  company: string | null;
  ticker: string | null;
  format: 'quick' | 'professional';
  rating: string | null;
  submitted_at: string;
  reviews: number;
}
export type PeerReviewCriterion = 'thesis' | 'financial_analysis' | 'valuation' | 'risk' | 'catalysts' | 'communication' | 'sources';
export interface PeerReview {
  id: string;
  scores: Record<PeerReviewCriterion, number>;
  overall: number;
  strengths: string;
  improvements: string;
  helpful_rating: number | null;
  created_at: string;
  mine: boolean;
  reviewer_label: string;
}
export interface DailyChallenge {
  day: string;
  question: {
    id: string;
    type: 'mcq' | 'numeric';
    prompt: string;
    options: { id: string; label: string }[] | null;
    unit: string | null;
    category_id: string | null;
  };
  answered: boolean;
  correct: boolean | null;
  response: string | null;
  explanation: string | null;
  answer: string | number | null;
  solved_today: number;
  correct_today: number;
}
export interface MyActivity {
  current_streak: number;
  longest_streak: number;
  active_today: boolean;
  xp_week: number;
  xp_total: number;
  days: { date: string; xp: number }[];
}
export interface XpLeaderRow {
  rank: number;
  user_id: string;
  handle: string;
  display_name: string;
  xp: number;
  is_me: boolean;
}
export interface ProgramLeaderRow {
  rank: number;
  user_id: string;
  handle: string;
  display_name: string;
  completed: number;
  total: number;
  avg_score: number | null;
  completed_at: string | null;
  is_me: boolean;
}
export interface TodayItem {
  kind: 'daily' | 'flashcards' | 'attempt' | 'program' | 'review' | 'explore';
  title: string;
  detail: string;
  link: string;
}
export interface AdminAnalytics {
  days: { date: string; signups: number; active: number; xp: number }[];
  funnel: { step: string; users: number }[];
  active_7d: number;
  active_30d: number;
  programs: { title: string; kind: string; enrolled: number; completed: number }[];
  hardest_questions: { lesson: string; lesson_slug: string; question: string; prompt: string | null; attempts: number; pct_correct: number }[];
  hardest_tasks: { challenge: string; task: string; attempts: number; avg_pct: number }[];
  activities: { title: string; kind: string; lesson: string; attempts: number; avg_score: number | null }[];
  daily: { answered_today: number; correct_today: number };
  pending: { submissions: number; capstones: number; feedback: number };
}
export interface AdminCapstoneRow {
  id: string;
  module_id: string;
  user_id: string;
  video_url: string;
  slides_url: string | null;
  summary: string;
  status: CapstoneStatus['status'];
  score: number | null;
  criteria: CapstoneStatus['criteria'];
  feedback: string | null;
  submitted_at: string;
  scored_at: string | null;
  learner: { full_name: string; handle: string } | null;
  module: { config: CapstoneConfig; program: { title: string } | null } | null;
}
export interface ProgramDetail {
  program: {
    id: string;
    slug: string;
    kind: ProgramKind;
    title: string;
    subtitle: string;
    description: string;
    level: Difficulty;
    estimated_hours: number;
    certificate_title: string;
    is_published: boolean;
  };
  modules: ProgramModuleStatus[];
  enrollment: { enrolled_at: string; completed_at: string | null } | null;
  certificate_code: string | null;
}
export interface CertificateView {
  code: string;
  kind: 'certification' | 'track' | 'competition';
  recipient_name: string;
  title: string;
  subtitle: string;
  details: { average_score?: number; estimated_hours?: number; modules?: number; rank?: number; participants?: number; score?: number; placement?: string };
  issued_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  /** earned = automatic from scored work; admin_award = issued by an admin; test = admin test, not a credential. */
  issue_type?: 'earned' | 'admin_award' | 'test';
  award_reason?: string | null;
  handle: string | null;
  program: { title: string; level: string; estimated_hours: number; description: string } | null;
  competition: { name: string; ends_at: string } | null;
}
export interface CertificateSummary {
  code: string;
  kind: CertificateView['kind'];
  title: string;
  subtitle: string;
  issued_at: string;
  issue_type?: CertificateView['issue_type'];
}
export interface FeedbackItem {
  id: string;
  user_id: string | null;
  category: 'bug' | 'idea' | 'content' | 'other';
  message: string;
  page: string | null;
  user_agent: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  user_id: string;
  kind: 'score' | 'achievement' | 'promotion' | 'competition' | 'market_event' | 'system';
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

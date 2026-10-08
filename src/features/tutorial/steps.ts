/**
 * The walkthrough: every section of FINLAB PH, in menu order.
 * `target` matches a `data-tour="…"` attribute on the page. When the target isn't on screen
 * (for example the sidebar on a phone), the step shows as a centred card instead.
 */
export interface TutorialStep {
  id: string;
  chapter: string;
  route: string;
  target?: string;
  title: string;
  body: string;
}

/** The program new users are pointed to for their first lesson. */
export const QUICK_START_PATH = '/certifications/quickstart-value-a-stock';

export const STEPS: TutorialStep[] = [
  // ---------------------------------------------------------------- Welcome
  {
    id: 'welcome', chapter: 'Welcome', route: '/dashboard',
    title: 'Welcome to FINLAB PH',
    body: "You're one of our founding beta testers. This tour visits every part of FINLAB in about two minutes. You can skip it any time and replay it from your account menu.",
  },
  {
    id: 'menu', chapter: 'Welcome', route: '/dashboard', target: 'sidebar',
    title: 'Your menu',
    body: 'Everything lives here: Learn, Challenges, Research, Markets, Career, Compete and Profile. We will visit each one in order.',
  },
  // ---------------------------------------------------------------- Dashboard
  {
    id: 'dashboard', chapter: 'Dashboard', route: '/dashboard', target: 'dashboard-header',
    title: 'Your dashboard',
    body: "Your desk. Every number here is calculated from work you've actually submitted. Nobody, including you, can edit a score.",
  },
  {
    id: 'score', chapter: 'Dashboard', route: '/dashboard', target: 'score',
    title: 'FINLAB Score',
    body: 'Your overall score from 0 to 100. It grows as you complete scored challenges, and it sets your rank and your career level.',
  },
  {
    id: 'beta', chapter: 'Dashboard', route: '/dashboard', target: 'beta-checklist',
    title: 'Beta tester checklist',
    body: 'Finish these five tasks to claim your Founding Beta Tester certificate. Each one ticks itself when you do it.',
  },
  {
    id: 'today', chapter: 'Dashboard', route: '/dashboard', target: 'today-plan',
    title: "Today's plan",
    body: 'A short to-do list for today, plus a daily question. Doing something every day keeps your streak alive and earns XP.',
  },
  {
    id: 'topbar-score', chapter: 'Dashboard', route: '/dashboard', target: 'topbar-score',
    title: 'Level and score',
    body: 'Your career level and FINLAB Score, always visible. Click it any time to see what you need for your next promotion.',
  },
  {
    id: 'notifications', chapter: 'Dashboard', route: '/dashboard', target: 'notifications',
    title: 'Notifications',
    body: 'Scores, achievements, certificates and peer-review results show up here.',
  },
  // ---------------------------------------------------------------- Learn
  {
    id: 'briefings', chapter: 'Learn', route: '/learn', target: 'page-header',
    title: 'Briefings',
    body: 'Short, practical lessons: a video, a written briefing, hands-on practice and a 10-question knowledge check.',
  },
  {
    id: 'certifications', chapter: 'Learn', route: '/certifications', target: 'page-header',
    title: 'Certifications',
    body: 'Structured programs of lessons, cases and a timed final exam. Pass every module and a verifiable certificate is issued automatically. New here? The 30-minute Quick Start is the fastest first certificate.',
  },
  {
    id: 'flashcards', chapter: 'Learn', route: '/flashcards', target: 'page-header',
    title: 'Flashcards',
    body: 'Spaced repetition for the formulas and ideas from every lesson. Cards you know come back less often; cards you miss come back sooner.',
  },
  // ---------------------------------------------------------------- Challenges
  {
    id: 'challenges', chapter: 'Challenges', route: '/challenges', target: 'page-header',
    title: 'Challenges',
    body: 'Real-style finance cases: journal entries, valuations, forecasts and investment committee cases. Every answer is scored and builds your skill profile.',
  },
  // ---------------------------------------------------------------- Research
  {
    id: 'research', chapter: 'Research', route: '/research', target: 'page-header',
    title: 'Research Studio',
    body: 'Write equity research reports in the format analysts use: thesis, financials, valuation, catalysts and risks.',
  },
  {
    id: 'pitches', chapter: 'Research', route: '/pitches', target: 'page-header',
    title: 'Stock Pitch Arena',
    body: 'Pitch a stock, from a quick 15–30 minute pitch to a professional multi-day one, scored against a clear rubric.',
  },
  {
    id: 'reviews', chapter: 'Research', route: '/reviews', target: 'page-header',
    title: 'Peer Review',
    body: "Review other analysts' pitches anonymously, and open your own pitches for feedback.",
  },
  {
    id: 'valuation', chapter: 'Research', route: '/valuation', target: 'page-header',
    title: 'Valuation',
    body: 'Value a company with multiples and a simplified DCF.',
  },
  {
    id: 'models', chapter: 'Research', route: '/models', target: 'page-header',
    title: 'Financial Models',
    body: 'Enter historicals, set growth, margin and tax assumptions, and an income statement forecast builds itself.',
  },
  // ---------------------------------------------------------------- Markets
  {
    id: 'markets', chapter: 'Markets', route: '/markets', target: 'page-header',
    title: 'Markets',
    body: 'Prices and charts for Philippine and global stocks. During the beta these use sample data.',
  },
  {
    id: 'trading', chapter: 'Markets', route: '/trading', target: 'page-header',
    title: 'Trading Floor',
    body: 'Trade simulated stocks on real charts with indicators, support and resistance, trend lines and Fibonacci. Play fast practice rounds, take the weekly challenge, or run a live account.',
  },
  {
    id: 'portfolio', chapter: 'Markets', route: '/portfolio', target: 'page-header',
    title: 'Portfolio Simulator',
    body: 'Manage a ₱10M practice portfolio. Every trade needs a written reason. No real money is involved.',
  },
  {
    id: 'events', chapter: 'Markets', route: '/events', target: 'page-header',
    title: 'Market Events',
    body: 'Market scenarios: decide Buy, Sell, Hold or Rebalance and defend it in writing. Your call is scored when the event resolves.',
  },
  // ---------------------------------------------------------------- Career
  {
    id: 'career', chapter: 'Career', route: '/career', target: 'page-header',
    title: 'Career ladder',
    body: 'Climb from Junior Analyst to Managing Director. Promotions are earned by meeting real requirements, checked by the system.',
  },
  // ---------------------------------------------------------------- Compete
  {
    id: 'competitions', chapter: 'Compete', route: '/competitions', target: 'page-header',
    title: 'Competitions',
    body: 'Timed, ranked events built from FINLAB challenges. Register, compete and see where you finish.',
  },
  {
    id: 'leaderboards', chapter: 'Compete', route: '/leaderboard', target: 'page-header',
    title: 'Leaderboards',
    body: 'Rankings nationwide, in the Philippines, by university, by specialization and by weekly XP. Each week you also compete in a pod of about 20.',
  },
  {
    id: 'classes', chapter: 'Compete', route: '/classes', target: 'page-header',
    title: 'Classes',
    body: 'Join your class or org with its code for a private leaderboard with your classmates.',
  },
  // ---------------------------------------------------------------- Profile
  {
    id: 'passport', chapter: 'Profile', route: '/passport', target: 'page-header',
    title: 'Finance Passport',
    body: 'Your public proof of work: scores, certificates and your best pitches, ready to share with recruiters.',
  },
  {
    id: 'settings', chapter: 'Profile', route: '/profile', target: 'page-header',
    title: 'Settings',
    body: 'Your name, school, privacy and account settings.',
  },
  // ---------------------------------------------------------------- Help
  {
    id: 'feedback', chapter: 'Help', route: '/profile', target: 'feedback',
    title: 'Feedback',
    body: 'Found a bug or have an idea? Tell us here. Sending feedback is also one of your beta tasks.',
  },
  {
    id: 'account', chapter: 'Help', route: '/profile', target: 'user-menu',
    title: 'Account menu',
    body: "What's new, this tutorial (replay it any time) and sign out.",
  },
  {
    id: 'finish', chapter: 'Done', route: '/dashboard',
    title: "You've seen everything",
    body: 'Now your first mission: three quick steps in the panel at the bottom of the screen. Finish them to earn the Tutorial Complete badge.',
  },
];

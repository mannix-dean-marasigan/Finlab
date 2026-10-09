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
    body: "You're one of our first beta testers, so thank you. This quick tour shows you around in about two minutes. Skip it any time; you can replay it from your account menu.",
  },
  {
    id: 'menu', chapter: 'Welcome', route: '/dashboard', target: 'sidebar',
    title: 'Your menu',
    body: 'Six sections: Dashboard, Learn, Practice, Tools, Compete and Profile. We will go through them in order.',
  },
  // ---------------------------------------------------------------- Dashboard
  {
    id: 'dashboard', chapter: 'Dashboard', route: '/dashboard', target: 'dashboard-header',
    title: 'Your dashboard',
    body: 'Your home base. It shows how you are doing and what to do next.',
  },
  {
    id: 'score', chapter: 'Dashboard', route: '/dashboard', target: 'score',
    title: 'FINLAB Score',
    body: 'A score from 0 to 100 that goes up as you finish scored challenges. It decides your rank and your career level.',
  },
  {
    id: 'beta', chapter: 'Dashboard', route: '/dashboard', target: 'beta-checklist',
    title: 'Beta tester checklist',
    body: 'Do these five things to claim your Founding Beta Tester certificate. Each one ticks itself off.',
  },
  {
    id: 'today', chapter: 'Dashboard', route: '/dashboard', target: 'today-plan',
    title: "Today's plan",
    body: "A few small things to do today, plus a daily question. Show up every day to keep your streak going.",
  },
  {
    id: 'topbar-score', chapter: 'Dashboard', route: '/dashboard', target: 'topbar-score',
    title: 'Level and score',
    body: 'Always visible up here. Click it to see what you need for your next promotion.',
  },
  {
    id: 'notifications', chapter: 'Dashboard', route: '/dashboard', target: 'notifications',
    title: 'Notifications',
    body: 'Scores, badges and certificates show up here.',
  },
  // ---------------------------------------------------------------- Learn
  {
    id: 'certifications', chapter: 'Learn', route: '/certifications', target: 'page-header',
    title: 'Certifications',
    body: 'Programs of lessons, cases and a final exam. Finish one and you get a certificate anyone can verify. Start with the 30-minute Quick Start.',
  },
  {
    id: 'lessons', chapter: 'Learn', route: '/learn', target: 'page-header',
    title: 'Lessons',
    body: 'Short lessons with a video, a written explanation, hands-on practice and a 10-question check.',
  },
  {
    id: 'flashcards', chapter: 'Learn', route: '/flashcards', target: 'page-header',
    title: 'Flashcards',
    body: 'Review the formulas and ideas from your lessons. Cards you miss come back sooner.',
  },
  // ---------------------------------------------------------------- Practice
  {
    id: 'challenges', chapter: 'Practice', route: '/challenges', target: 'page-header',
    title: 'Challenges',
    body: 'Real-style finance cases: journal entries, valuations, forecasts. Every answer is scored.',
  },
  {
    id: 'trading', chapter: 'Practice', route: '/trading', target: 'page-header',
    title: 'Trading Floor',
    body: 'Trade simulated stocks on real charts with indicators and support and resistance. Play quick rounds, take the weekly challenge, or run a live account.',
  },
  {
    id: 'pitches', chapter: 'Practice', route: '/pitches', target: 'page-header',
    title: 'Stock pitches',
    body: 'Pitch a stock, from a quick 15-minute pitch to a full one over a few days. Scored against a clear rubric.',
  },
  {
    id: 'research', chapter: 'Practice', route: '/research', target: 'page-header',
    title: 'Research reports',
    body: 'Write an equity research report the way analysts do: thesis, numbers, valuation, risks.',
  },
  // ---------------------------------------------------------------- Tools
  {
    id: 'valuation', chapter: 'Tools', route: '/valuation', target: 'page-header',
    title: 'Valuation',
    body: 'Value a company with multiples or a simple DCF.',
  },
  {
    id: 'models', chapter: 'Tools', route: '/models', target: 'page-header',
    title: 'Financial models',
    body: 'Enter past numbers and your assumptions, and a forecast builds itself.',
  },
  {
    id: 'planner', chapter: 'Tools', route: '/planner', target: 'page-header',
    title: 'Portfolio planner',
    body: "Build a portfolio for a real person's goal, then compare it with a coach's plan.",
  },
  {
    id: 'optimizer', chapter: 'Tools', route: '/optimizer', target: 'page-header',
    title: 'Portfolio optimizer',
    body: 'See the efficient frontier: the best return for each level of risk, and how the best mix changes with your assumptions.',
  },
  // ---------------------------------------------------------------- Compete
  {
    id: 'leaderboards', chapter: 'Compete', route: '/leaderboard', target: 'page-header',
    title: 'Leaderboards',
    body: 'See how you rank nationwide, at your school and each week. Each week you also race a group of about 20.',
  },
  {
    id: 'classes', chapter: 'Compete', route: '/classes', target: 'page-header',
    title: 'Classes',
    body: 'Got a class or org code? Join here for a private leaderboard with your classmates.',
  },
  // ---------------------------------------------------------------- Profile
  {
    id: 'passport', chapter: 'Profile', route: '/passport', target: 'page-header',
    title: 'Finance Passport',
    body: 'Your public profile: scores, certificates and best work, ready to share with recruiters.',
  },
  {
    id: 'career', chapter: 'Profile', route: '/career', target: 'page-header',
    title: 'Career ladder',
    body: 'Climb from Junior Analyst to Managing Director by meeting real requirements.',
  },
  {
    id: 'settings', chapter: 'Profile', route: '/profile', target: 'page-header',
    title: 'Settings',
    body: 'Your name, school, privacy and account.',
  },
  // ---------------------------------------------------------------- Help
  {
    id: 'feedback', chapter: 'Help', route: '/profile', target: 'feedback',
    title: 'Feedback',
    body: 'Spotted a bug or have an idea? Tell us here. It also counts toward your beta checklist.',
  },
  {
    id: 'account', chapter: 'Help', route: '/profile', target: 'user-menu',
    title: 'Account menu',
    body: "What's new, this tour, and sign out.",
  },
  {
    id: 'finish', chapter: 'Done', route: '/dashboard',
    title: "That's the tour",
    body: 'One last thing: a three-step first mission in the panel at the bottom. Finish it to earn the Tutorial Complete badge.',
  },
];

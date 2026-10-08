export interface ChangelogEntry {
  /** ISO date; also used to detect what the user has not seen yet. */
  id: string;
  title: string;
  items: string[];
}

/** Newest first. Add an entry whenever something worth announcing ships. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-10-12',
    title: 'Trading Floor: limit orders and a trade journal',
    items: [
      'Limit orders in rounds: buy if the price drops to your level, or sell if it rises to it.',
      'Add a note to any trade, then review your trade journal at the end of the round.',
      'New badges: First Profit, Risk Manager and Weekly Challenger.',
    ],
  },
  {
    id: '2026-10-11',
    title: 'A cleaner FINLAB PH',
    items: [
      'A "Continue where you left off" card at the top of your dashboard.',
      'Install FINLAB PH as an app: on your phone, use "Add to Home screen".',
      'A simpler menu: Learn, Practice, Tools, Compete and Profile. Competitions and market events show up when one is running.',
      'New About and FAQ pages.',
      'Clearer wording across the app, a new heading font, and friendlier empty pages.',
    ],
  },
  {
    id: '2026-10-10',
    title: 'Trading Floor',
    items: [
      'A virtual trading game on simulated stocks: candlestick charts with SMA, EMA, Bollinger Bands, VWAP, RSI and MACD.',
      'Draw support and resistance lines, trend lines and Fibonacci retracements, or switch on automatic support and resistance.',
      'Go long or short with stop-loss and take-profit orders. No leverage, 0.1% fee per trade.',
      'Fast practice rounds, a weekly challenge with the same chart for everyone, and a live market that moves every hour.',
    ],
  },
  {
    id: '2026-10-09',
    title: 'A guided tutorial',
    items: [
      'New analysts get a guided walkthrough of every part of FINLAB PH, one highlighted section at a time.',
      'Then a three-step first mission: open a lesson, try a practice activity, check the weekly leaderboard.',
      'Finish it to earn the Tutorial Complete badge. Replay the tutorial any time from your account menu.',
    ],
  },
  {
    id: '2026-10-08',
    title: 'More certifications, interview prep and a beta checklist',
    items: [
      'New certifications: Accounting Fundamentals, Corporate Finance & FP&A, Financial Modeling and Finance Interview Prep.',
      'New track: Personal Finance Essentials (budgeting, compounding, investing basics).',
      'A 30-minute Quick Start certificate, the fastest way to earn your first one.',
      'Beta tester checklist on your dashboard: finish five tasks to claim a Founding Beta Tester certificate.',
      '45 more daily challenge questions, so the daily question stays fresh for months.',
      'Share any certificate on LinkedIn with a ready-made post, picture, description and skills list.',
      'Classes: join your class or org with a code for a private leaderboard (class managers can see member progress).',
      'Weekly pods: every Monday you are placed in a group of about 20 and compete on that week’s XP.',
      'A welcome tour for new analysts, and this What’s new page.',
    ],
  },
  {
    id: '2026-10-07',
    title: 'Flashcards, peer review, capstones and streaks',
    items: [
      'Flashcards with spaced repetition for every lesson.',
      'Peer review: get anonymous feedback on your stock pitches and review others.',
      'Capstone presentations at the end of certifications, scored against a rubric.',
      'Daily streaks, XP, weekly leaderboards and a leaderboard for each certification.',
      'A daily challenge and a Today’s plan card on your dashboard.',
      'Invite codes for the closed beta.',
    ],
  },
  {
    id: '2026-10-06',
    title: 'FINLAB PH beta opens',
    items: [
      'Lessons with videos, interactive practice and 10-question knowledge checks.',
      'Real-style challenges, the Stock Pitch Arena, Research Studio and valuation tools.',
      'Portfolio simulator, market events, competitions and leaderboards.',
      'Finance Passport and verifiable certificates.',
    ],
  },
];

export const LATEST_CHANGELOG_ID = CHANGELOG[0].id;
export const CHANGELOG_SEEN_KEY = 'finlab:changelog-seen';

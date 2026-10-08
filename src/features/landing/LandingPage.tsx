import { Link, Navigate } from 'react-router';
import {
  Award, BadgeCheck, BookOpen, Briefcase, CalendarCheck, Flame, GraduationCap, LineChart, MessageSquareText, Swords, Target, Trophy,
} from 'lucide-react';
import { useAuth } from '@/app/auth';
import { FullScreenLoader } from '@/app/FullScreenLoader';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { LINKEDIN_PAGE_URL } from '@/lib/brand';

const FEATURES = [
  { icon: BookOpen, t: 'Lessons that make you do it', d: 'Short videos, hands-on practice and a quick check. No "mark as finished" button.' },
  { icon: Target, t: 'Real-style cases', d: 'Value a company, analyze a bank, build a cash flow, pitch a stock. Every answer is scored.' },
  { icon: Briefcase, t: 'A career ladder', d: 'Build your FINLAB Score and earn promotions from Junior Analyst upward.' },
  { icon: Swords, t: 'Leaderboards', d: 'See how you rank nationwide, at your school and each week.' },
  { icon: LineChart, t: 'Trading Floor', d: 'Trade simulated stocks on real charts with indicators and support and resistance.' },
  { icon: MessageSquareText, t: 'Classes', d: 'A private leaderboard for your class or org, with progress for your professor.' },
  { icon: Flame, t: 'Daily challenge & streaks', d: 'One question a day, flashcards that come back when you need them, and weekly XP races.' },
  { icon: BadgeCheck, t: 'Verifiable certificates', d: 'Free certificates with a public link, ready for LinkedIn.' },
];

const CERTS = [
  'Accounting Fundamentals',
  'Financial Statement Analyst',
  'Corporate Finance & FP&A',
  'Equity Valuation Analyst',
  'Financial Modeling',
  'Equity Research Associate',
  'Banking & Credit Analyst',
  'Finance Interview Prep',
  'Personal Finance Essentials',
];

/** Public front door. Signed-in users go straight to their dashboard. */
export default function LandingPage() {
  const { session, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm" variant="ghost">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="primary">
                Join with invite
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="grid-bg relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent-muted px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-accent">
            Free · Closed beta
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Don't just study finance. <span className="text-accent">Run the desk.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-fg-muted">
            FINLAB PH is the flight simulator for finance. Learn a concept in a short lesson, use it right away on a realistic case, and prove it with a
            certificate employers can verify. Free for students and young professionals.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg" variant="primary">
                I have an invite code
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg">Sign in</Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-fg-subtle">
            Don't have a code? The beta is invite-only while we test with a small group.{' '}
            <a href={LINKEDIN_PAGE_URL} target="_blank" rel="noreferrer noopener" className="text-accent underline underline-offset-2 hover:text-accent-strong">
              Message us on LinkedIn
            </a>{' '}
            to ask for one.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Everything you need to build a track record</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-lg border border-border bg-surface p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">{f.t}</div>
              <p className="mt-1 text-sm text-fg-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <GraduationCap className="h-6 w-6 text-accent" /> Certifications
            </h2>
            <p className="mt-2 text-fg-muted">
              Structured programs with lessons, hands-on cases and a timed final exam. Pass every module and your certificate is issued automatically, with a
              public verification page.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {CERTS.map((c) => (
                <li key={c} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <Award className="h-4 w-4 shrink-0 text-accent" /> {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-fg-subtle">Plus a 30-minute Quick Start certificate to begin with.</p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Trophy className="h-6 w-6 text-accent" /> How it works
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                ['Learn', 'Watch a short video, practise with interactive exercises, pass the knowledge check.'],
                ['Do the work', 'Solve cases, write pitches, run valuations. Everything is scored against a rubric.'],
                ['Rank up', 'Your results build your FINLAB Score, your level and your place on the leaderboards.'],
                ['Prove it', 'Earn verifiable certificates and share them on LinkedIn.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent-muted font-mono text-sm font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{t}</div>
                    <div className="text-sm text-fg-muted">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-center gap-2 text-sm text-fg-muted">
              <CalendarCheck className="h-4 w-4 text-accent" /> A new daily challenge every day.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Be one of the first analysts on FINLAB PH</h2>
        <p className="mx-auto mt-2 max-w-xl text-fg-muted">
          Beta testers who finish a short checklist and share feedback receive a <strong className="text-fg">Founding Beta Tester</strong> certificate.
        </p>
        <Link to="/register" className="mt-6 inline-block">
          <Button size="lg" variant="primary">
            Join with your invite code
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-fg-subtle">
          <span>FINLAB PH · Practice platform, not investment advice</span>
          <span className="flex gap-4">
            <Link to="/about" className="hover:text-fg">About</Link>
            <Link to="/faq" className="hover:text-fg">FAQ</Link>
            <Link to="/terms" className="hover:text-fg">Terms</Link>
            <Link to="/privacy" className="hover:text-fg">Privacy</Link>
            <a href={LINKEDIN_PAGE_URL} target="_blank" rel="noreferrer noopener" className="hover:text-fg">LinkedIn</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BadgeCheck, BookOpen, ChevronDown, Target, Trophy } from 'lucide-react';
import { PublicShell } from '@/features/passport/PublicPassportPage';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL, LINKEDIN_PAGE_URL } from '@/lib/brand';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: BookOpen, title: 'Learn', body: 'Short lessons with a video, a written explanation and hands-on practice. No "mark as finished" button.' },
  { icon: Target, title: 'Practice', body: 'Finance cases based on real situations, stock pitches, research reports and a trading game. Every answer is scored.' },
  { icon: Trophy, title: 'Compete', body: 'Leaderboards for the whole country, your school and each week, plus private boards for your class or org.' },
  { icon: BadgeCheck, title: 'Prove it', body: 'Finish a certification and get a certificate anyone can verify online, and a public profile that shows your work.' },
];

function Contact() {
  return (
    <p className="text-sm text-fg-muted">
      Questions or ideas? Use the Feedback button inside the app
      {CONTACT_EMAIL && (
        <>
          , email <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2 hover:text-accent-strong">{CONTACT_EMAIL}</a>
        </>
      )}
      , or message us on{' '}
      <a href={LINKEDIN_PAGE_URL} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2 hover:text-accent-strong">
        LinkedIn
      </a>
      .
    </p>
  );
}

export function AboutPage() {
  useEffect(() => {
    document.title = 'About · FINLAB PH';
  }, []);
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl space-y-12 py-4">
        <header>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">About FINLAB PH</div>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Finance is learned by doing.
            <br />
            <span className="text-accent">So we built a place to do it.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-fg-muted">
            Most finance students learn the theory in class but rarely get to practise it. You read about valuation, then sit an exam on it. You never
            build the model, defend the call or see how you compare.
          </p>
          <p className="mt-3 text-base leading-relaxed text-fg-muted">
            FINLAB PH is a free practice ground for students and young professionals in the Philippines. You learn a concept, use it straight away on a
            realistic case, get scored on the work itself, and build a record you can show employers.
          </p>
        </header>

        <section>
          <h2 className="text-xl font-bold tracking-tight">How it works</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-fg-subtle">0{i + 1}</span>
                  <s.icon className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{s.title}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight">What we care about</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
            <li>
              <span className="font-semibold text-fg">Scores you can trust.</span> Everything is scored on submitted work. Nobody can edit a score or a ranking,
              including us.
            </li>
            <li>
              <span className="font-semibold text-fg">Free to use.</span> We don't ask for payment details, and we don't sell your data or show ads.
            </li>
            <li>
              <span className="font-semibold text-fg">Honest about what it is.</span> Certificates show what you completed on FINLAB PH. They are not accredited
              qualifications, and nothing here is investment advice.
            </li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <Contact />
          <div className="flex flex-wrap gap-2">
            <Link to="/faq">
              <Button size="sm">Read the FAQ</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" variant="primary">
                Join the beta
              </Button>
            </Link>
          </div>
        </section>
      </article>
    </PublicShell>
  );
}

const FAQ: { q: string; a: string }[] = [
  { q: 'Is FINLAB PH free?', a: "Yes. We don't ask for payment details, and every lesson, case, certificate and leaderboard is free to use." },
  {
    q: 'Why do I need an invite code?',
    a: "We're in a closed beta, so we can fix problems with a small group before opening up. Ask whoever told you about FINLAB PH for a code, or message us on LinkedIn.",
  },
  {
    q: 'Are the certificates accredited?',
    a: 'No. A certificate shows that you completed a FINLAB PH program: the lessons, the scored cases and the final exam. It has a public verification link so anyone can check it, but it is not an accredited qualification like the CFA, and it is not endorsed by a university or regulator.',
  },
  {
    q: 'How is my score calculated?',
    a: 'Your FINLAB Score comes from scored work only: challenges, exams, pitches and reports. For each challenge your best attempt counts. Scores and rankings are calculated by the system, so nobody can edit them, including us.',
  },
  {
    q: 'Is the market data real?',
    a: 'No. The Trading Floor uses simulated stocks with fictional names, and other market pages use illustrative sample data. All money in FINLAB PH is practice money.',
  },
  { q: 'Is anything here investment advice?', a: 'No. FINLAB PH is for learning and practice only. Please do not make real investment decisions based on it.' },
  {
    q: 'Who can see my progress?',
    a: 'Your public profile (Finance Passport) is visible to others unless you make it private in Settings. If you join a class, its managers can see your progress in that class. Admins can see account data to run the platform. The Privacy Policy has the details.',
  },
  {
    q: 'Can my professor or org use it?',
    a: 'Yes. Classes give a group its own join code, a private leaderboard and a progress view for the class managers. Message us and we will set one up.',
  },
  { q: 'I found a bug or have an idea.', a: 'Please tell us with the Feedback button in the bottom corner of the app. We read every message.' },
];

export function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  useEffect(() => {
    document.title = 'FAQ · FINLAB PH';
  }, []);
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">FAQ</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Questions, answered</h1>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
                <span className="font-semibold">{f.q}</span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-fg-subtle transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-fg-muted">{f.a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <Contact />
          <p className="text-sm text-fg-muted">
            See also our{' '}
            <Link to="/terms" className="text-accent underline underline-offset-2 hover:text-accent-strong">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent underline underline-offset-2 hover:text-accent-strong">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </article>
    </PublicShell>
  );
}

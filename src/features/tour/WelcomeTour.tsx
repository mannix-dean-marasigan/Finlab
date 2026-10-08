import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Award, CalendarCheck, FlaskConical, GraduationCap, MessageSquarePlus, Rocket, Target } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export const OPEN_TOUR_EVENT = 'finlab:open-tour';
const tourKey = (uid: string) => `finlab:tour-seen:${uid}`;

const STEPS = [
  {
    icon: Rocket,
    title: 'Welcome to FINLAB PH',
    body: 'The flight simulator for finance. You learn with short lessons, then do the work: real-style cases, scored instantly. Your results build your FINLAB Score and your place on the career ladder.',
  },
  {
    icon: CalendarCheck,
    title: 'Your dashboard',
    body: 'Start here every day. "Today\'s plan" tells you what to do next, the Daily Challenge takes a minute, and your streak and XP grow when you stay active.',
  },
  {
    icon: GraduationCap,
    title: 'Learn by doing',
    body: 'Each lesson has a short video, interactive practice, then a 10-question knowledge check (80% to pass). Lessons count only when you pass — there is no "mark as finished".',
  },
  {
    icon: Award,
    title: 'Earn a certificate',
    body: 'Certifications combine lessons, cases and a final exam, and issue a verifiable certificate you can add to LinkedIn. The Quick Start takes about 30 minutes.',
  },
  {
    icon: FlaskConical,
    title: 'Beta tester checklist',
    body: 'Finish the five-item checklist on your dashboard — pass a lesson, answer the daily challenge, complete a challenge, make a trade and send feedback — and claim a Founding Beta Tester certificate.',
  },
  {
    icon: MessageSquarePlus,
    title: 'Tell us what you think',
    body: 'Use the Feedback button at the bottom-left of any page to report a bug or share an idea. In a beta, your feedback is the most valuable thing you can give.',
  },
];

/** First-time walkthrough (once per user, on the dashboard). Re-openable from the account menu. */
export function WelcomeTour() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user || pathname !== '/dashboard') return;
    try {
      if (!localStorage.getItem(tourKey(user.id))) setOpen(true);
    } catch {
      /* storage unavailable: skip the automatic tour */
    }
  }, [user, pathname]);

  useEffect(() => {
    const openIt = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_TOUR_EVENT, openIt);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, openIt);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      if (user) localStorage.setItem(tourKey(user.id), new Date().toISOString());
    } catch {
      /* ignore */
    }
  }, [user]);

  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Modal
      open
      onClose={close}
      size="sm"
      title={s.title}
      footer={
        <>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((n) => n - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={close}>
              Skip
            </Button>
          )}
          {last ? (
            <Link to="/certifications/quickstart-value-a-stock" onClick={close}>
              <Button variant="primary">
                <Target className="h-4 w-4" /> Start the Quick Start
              </Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={() => setStep((n) => n + 1)}>
              Next
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent-muted text-accent">
          <s.icon className="h-7 w-7" />
        </span>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">{s.body}</p>
        <div className="mt-5 flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-accent' : 'w-1.5 bg-surface-3')} />
          ))}
        </div>
        {last && (
          <button type="button" onClick={close} className="mt-4 text-xs text-fg-subtle hover:text-fg">
            I'll explore on my own
          </button>
        )}
      </div>
    </Modal>
  );
}

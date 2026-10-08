import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronDown, ChevronUp, Circle, Flag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { completeTutorial, hasPracticeAttempt } from '@/services/api/engage';
import { ACTIVITY_DONE_EVENT, OPEN_TUTORIAL_EVENT } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QUICK_START_PATH, STEPS } from './steps';

/** Accounts created on or after this date get the tutorial automatically; everyone can open it from the account menu. */
const RELEASED = Date.parse('2026-10-08T00:00:00+08:00');

type Mission = { lesson: boolean; practice: boolean; leaderboard: boolean };
interface TutorialState {
  phase: 'tour' | 'mission' | 'done' | 'skipped';
  step: number;
  mission: Mission;
  collapsed?: boolean;
  awarded?: boolean;
}
const NO_MISSION: Mission = { lesson: false, practice: false, leaderboard: false };
const key = (uid: string) => `finlab:tutorial:${uid}`;

function load(uid: string): TutorialState | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as TutorialState) : null;
  } catch {
    return null;
  }
}
function save(uid: string, s: TutorialState) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(s));
  } catch {
    /* private mode: the tutorial still works for this visit */
  }
}

/** The element a step points at, if it is actually visible. */
function findTarget(name: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return els.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  }) ?? null;
}

// ------------------------------------------------------------------ walkthrough
export function Walkthrough({ step, onBack, onNext, onSkip, stayOnPage }: { step: number; onBack: () => void; onNext: () => void; onSkip: () => void; stayOnPage?: boolean }) {
  const s = STEPS[step];
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [searching, setSearching] = useState(true);
  const [vw, setVw] = useState(window.innerWidth);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(220);

  // Go to the step's page.
  useEffect(() => {
    if (!stayOnPage && pathname !== s.route) navigate(s.route);
  }, [s.route, pathname, navigate, stayOnPage]);

  // Find the highlighted element (pages load their data first), then keep following it.
  useEffect(() => {
    setRect(null);
    if (!s.target) {
      setSearching(false);
      return;
    }
    setSearching(true);
    let el: HTMLElement | null = null;
    let scrolled = false;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (!stayOnPage && pathname !== s.route) return;
      el = el && el.isConnected ? el : findTarget(s.target!);
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          scrolled = true;
        }
        setRect(el.getBoundingClientRect());
        setSearching(false);
      } else if (Date.now() - started > 2500) {
        setSearching(false); // not on this screen (e.g. the sidebar on a phone): show a centred card
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [s.target, s.route, pathname, stayOnPage]);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  });

  // Keyboard: arrows / Enter to move, Escape to skip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      else if (e.key === 'ArrowLeft' && step > 0) onBack();
      else if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onBack, onSkip, step]);

  const mobile = vw < 640;
  const PAD = 8;
  // The spotlight never extends past the screen (the sidebar is full height).
  const spot = rect && {
    left: Math.max(4, rect.left - PAD),
    top: Math.max(4, rect.top - PAD),
    right: Math.min(window.innerWidth - 4, rect.right + PAD),
    bottom: Math.min(window.innerHeight - 4, rect.bottom + PAD),
  };

  // Card placement: beside narrow targets, else below, else above; centred when nothing is highlighted.
  const W = 380;
  let cardStyle: React.CSSProperties;
  if (mobile) {
    // Phones: a full-width card at the bottom, or at the top when the highlight is in the lower half.
    const lower = spot && (spot.top + spot.bottom) / 2 > window.innerHeight / 2;
    cardStyle = lower ? { left: 12, right: 12, top: 12 } : { left: 12, right: 12, bottom: 12 };
  }
  else if (!spot) cardStyle = { left: '50%', top: '50%', width: W, transform: 'translate(-50%, -50%)' };
  else {
    const vh = window.innerHeight;
    const clampX = (x: number) => Math.min(Math.max(16, x), window.innerWidth - W - 16);
    const clampY = (y: number) => Math.min(Math.max(16, y), vh - cardH - 16);
    if (spot.right - spot.left < 300 && spot.right + 16 + W < window.innerWidth) cardStyle = { left: spot.right + 16, top: clampY(spot.top), width: W };
    else if (spot.bottom + 16 + cardH < vh) cardStyle = { left: clampX(spot.left), top: spot.bottom + 16, width: W };
    else if (spot.top - 16 - cardH > 0) cardStyle = { left: clampX(spot.left), top: spot.top - 16 - cardH, width: W };
    else cardStyle = { left: clampX(spot.left), top: clampY(spot.top + 24), width: W };
  }

  const last = step === STEPS.length - 1;
  const pct = ((step + 1) / STEPS.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={`Tutorial: ${s.title}`}>
      {/* Blocks clicks on the app while the tour is open. */}
      <div className={cn('absolute inset-0', !spot && 'bg-[rgba(3,5,8,0.72)]')} />
      {spot && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-300 ease-out"
          style={{ left: spot.left, top: spot.top, width: spot.right - spot.left, height: spot.bottom - spot.top, boxShadow: '0 0 0 9999px rgba(3,5,8,0.72)' }}
        />
      )}
      {!searching && (
        <div
          ref={cardRef}
          className="absolute animate-fade-in rounded-xl border border-border-strong bg-surface p-4 shadow-2xl"
          style={cardStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-accent">
              {s.chapter} · {step + 1} of {STEPS.length}
            </span>
            <button onClick={onSkip} className="text-xs text-fg-subtle hover:text-fg">
              Skip tutorial
            </button>
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{s.body}</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={onBack} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button size="sm" variant="primary" onClick={onNext}>
              {last ? (
                <>
                  <Flag className="h-4 w-4" /> Start my first mission
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------------ first mission
function MissionPanel({ state, update }: { state: TutorialState; update: (s: Partial<TutorialState>) => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const m = state.mission;

  // Ticks itself off as the tester explores.
  useEffect(() => {
    if (!m.lesson && /^\/learn\/[^/]+/.test(pathname)) update({ mission: { ...m, lesson: true } });
    else if (!m.leaderboard && pathname.startsWith('/leaderboard')) update({ mission: { ...m, leaderboard: true } });
  }, [pathname, m, update]);

  const checkPractice = useCallback(() => {
    if (!user || m.practice) return;
    hasPracticeAttempt(user.id).then((yes) => yes && update({ mission: { ...m, practice: true } })).catch(() => {});
  }, [user, m, update]);
  useEffect(() => {
    checkPractice();
    window.addEventListener(ACTIVITY_DONE_EVENT, checkPractice);
    window.addEventListener('focus', checkPractice);
    return () => {
      window.removeEventListener(ACTIVITY_DONE_EVENT, checkPractice);
      window.removeEventListener('focus', checkPractice);
    };
  }, [checkPractice]);

  const allDone = m.lesson && m.practice && m.leaderboard;
  useEffect(() => {
    if (!allDone || state.awarded || claiming || error) return;
    setClaiming(true);
    setError(null);
    completeTutorial()
      .then(() => {
        update({ awarded: true, collapsed: false });
        qc.invalidateQueries();
        toast.success('Tutorial complete. Badge earned!');
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setClaiming(false));
  }, [allDone, state.awarded, claiming, error, update, qc]);

  const tasks: { done: boolean; label: string; hint: string; to: string }[] = [
    { done: m.lesson, label: 'Open your first lesson', hint: 'The Quick Start is the fastest way in.', to: QUICK_START_PATH },
    { done: m.practice, label: 'Try one practice activity', hint: 'In any lesson, scroll to Practice and press Check.', to: '/learn' },
    { done: m.leaderboard, label: 'Check the weekly leaderboard', hint: 'See where you rank this week.', to: '/leaderboard?board=xp_week' },
  ];
  const count = tasks.filter((t) => t.done).length;

  if (state.collapsed) {
    return (
      <button
        onClick={() => update({ collapsed: false })}
        className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-accent/50 bg-surface px-4 py-2 text-xs font-semibold shadow-xl hover:border-accent"
      >
        <Flag className="h-4 w-4 text-accent" /> First mission {count}/3 <ChevronUp className="h-3.5 w-3.5 text-fg-subtle" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 left-3 right-3 z-[60] animate-fade-in rounded-xl border border-accent/40 bg-surface p-4 shadow-2xl sm:bottom-4 sm:left-auto sm:right-4 sm:w-80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-widest text-accent">First mission · {count}/3</div>
          <div className="mt-0.5 text-sm font-semibold">{state.awarded ? 'Mission complete' : 'Three quick steps'}</div>
        </div>
        <div className="flex gap-1">
          {!state.awarded && (
            <button onClick={() => update({ collapsed: true })} className="rounded p-1 text-fg-subtle hover:text-fg" aria-label="Minimise">
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => update({ phase: state.awarded ? 'done' : 'skipped' })} className="rounded p-1 text-fg-subtle hover:text-fg" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {state.awarded ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/50 bg-accent-muted text-accent">
            <Award className="h-6 w-6" />
          </span>
          <p className="mt-2 text-sm font-semibold">Tutorial Complete badge earned</p>
          <p className="mt-1 text-xs text-fg-muted">It's on your Finance Passport. Next: finish your beta checklist for the Founding Beta Tester certificate.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Link to="/passport" onClick={() => update({ phase: 'done' })}>
              <Button size="sm">See my badge</Button>
            </Link>
            <Link to="/dashboard" onClick={() => update({ phase: 'done' })}>
              <Button size="sm" variant="primary">Beta checklist</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {tasks.map((t) => (
              <li key={t.label}>
                <Link to={t.to} className={cn('flex items-start gap-2.5 rounded-lg border px-3 py-2', t.done ? 'border-up/30 bg-up-muted/40' : 'border-border hover:border-accent/50')}>
                  {t.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />}
                  <span className="min-w-0">
                    <span className={cn('block text-sm', t.done && 'text-fg-muted line-through')}>{t.label}</span>
                    {!t.done && <span className="block text-xs text-fg-subtle">{t.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {claiming && <p className="mt-3 text-xs text-accent">Awarding your badge…</p>}
          {error && (
            <p className="mt-3 text-xs text-down">
              {error}{' '}
              <button onClick={() => setError(null)} className="font-semibold underline">
                Try again
              </button>
            </p>
          )}
          <p className="mt-3 text-[0.7rem] text-fg-subtle">Finish all three to earn the Tutorial Complete badge.</p>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ controller
/** New users get the walkthrough of every section, then a short first mission. Replay from the account menu. */
export function Tutorial() {
  const { user } = useAuth();
  const [state, setState] = useState<TutorialState | null>(null);

  useEffect(() => {
    if (!user) return;
    const saved = load(user.id);
    if (saved) setState(saved);
    else if (Date.parse(user.created_at) >= RELEASED) setState({ phase: 'tour', step: 0, mission: NO_MISSION });
  }, [user]);

  const update = useCallback(
    (patch: Partial<TutorialState>) => {
      setState((prev) => {
        if (!prev || !user) return prev;
        const next = { ...prev, ...patch };
        save(user.id, next);
        return next;
      });
    },
    [user],
  );

  // "Tutorial" in the account menu restarts the walkthrough (mission progress is kept).
  useEffect(() => {
    const open = () => {
      if (!user) return;
      setState((prev) => {
        const next: TutorialState = { phase: 'tour', step: 0, mission: prev?.mission ?? NO_MISSION, awarded: prev?.awarded };
        save(user.id, next);
        return next;
      });
    };
    window.addEventListener(OPEN_TUTORIAL_EVENT, open);
    return () => window.removeEventListener(OPEN_TUTORIAL_EVENT, open);
  }, [user]);

  const onNext = useCallback(() => {
    setState((prev) => {
      if (!prev || !user) return prev;
      const next: TutorialState =
        prev.step >= STEPS.length - 1 ? { ...prev, phase: prev.awarded ? 'done' : 'mission', collapsed: false } : { ...prev, step: prev.step + 1 };
      save(user.id, next);
      return next;
    });
  }, [user]);
  const onBack = useCallback(() => update({ step: Math.max(0, (state?.step ?? 0) - 1) }), [update, state?.step]);
  const onSkip = useCallback(() => {
    update({ phase: 'skipped' });
    toast('Tutorial skipped. Replay it any time from your account menu.');
  }, [update]);

  if (!state) return null;
  if (state.phase === 'tour') return <Walkthrough step={Math.min(state.step, STEPS.length - 1)} onBack={onBack} onNext={onNext} onSkip={onSkip} />;
  if (state.phase === 'mission') return <MissionPanel state={state} update={update} />;
  return null;
}

import { Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, BookOpen, Briefcase, Calculator, ChevronDown, FileSearch, GraduationCap, Layers, LayoutDashboard, LineChart,
  LogOut, Menu, MessageSquareText, Newspaper, PieChart, Presentation, Settings, Shield, Sigma, Swords, Target, Trophy, User, X, Zap,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn, initials } from '@/lib/utils';
import { fmtScore, timeAgo } from '@/lib/format';
import { useAuth } from './auth';
import { useIsAdmin, useMyProfile, useMyStats, useReference } from './queries';
import { listNotifications, markNotificationsRead } from '@/services/api/misc';
import { PageSkeleton } from '@/components/ui/states';
import { FeedbackButton } from '@/features/feedback/FeedbackButton';
import { LINKEDIN_PAGE_URL } from '@/lib/brand';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: { to: string; label: string; icon: ComponentType<{ className?: string }> }[];
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/learn',
    label: 'Learn',
    icon: BookOpen,
    children: [
      { to: '/learn', label: 'Briefings', icon: BookOpen },
      { to: '/certifications', label: 'Certifications', icon: GraduationCap },
      { to: '/flashcards', label: 'Flashcards', icon: Layers },
    ],
  },
  { to: '/challenges', label: 'Challenges', icon: Target },
  {
    to: '/research',
    label: 'Research',
    icon: FileSearch,
    children: [
      { to: '/research', label: 'Research Studio', icon: FileSearch },
      { to: '/pitches', label: 'Stock Pitch Arena', icon: Presentation },
      { to: '/reviews', label: 'Peer Review', icon: MessageSquareText },
      { to: '/valuation', label: 'Valuation', icon: Calculator },
      { to: '/models', label: 'Financial Models', icon: Sigma },
    ],
  },
  {
    to: '/markets',
    label: 'Markets',
    icon: LineChart,
    children: [
      { to: '/markets', label: 'Markets', icon: LineChart },
      { to: '/portfolio', label: 'Portfolio Simulator', icon: PieChart },
      { to: '/events', label: 'Market Events', icon: Zap },
    ],
  },
  { to: '/career', label: 'Career', icon: Briefcase },
  {
    to: '/competitions',
    label: 'Compete',
    icon: Swords,
    children: [
      { to: '/competitions', label: 'Competitions', icon: Swords },
      { to: '/leaderboard', label: 'Leaderboards', icon: Trophy },
    ],
  },
  {
    to: '/passport',
    label: 'Profile',
    icon: User,
    children: [
      { to: '/passport', label: 'Finance Passport', icon: GraduationCap },
      { to: '/profile', label: 'Settings', icon: Settings },
    ],
  },
];

function isActiveGroup(item: NavItem, path: string) {
  const prefixes = item.children ? item.children.map((c) => c.to) : [item.to];
  return prefixes.some((p) => path === p || path.startsWith(p + '/'));
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const admin = useIsAdmin();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link to="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = isActiveGroup(item, pathname);
          const Icon = item.icon;
          if (!item.children) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'text-accent')} />
                {item.label}
              </NavLink>
            );
          }
          const expanded = open[item.label] ?? active;
          return (
            <div key={item.label}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [item.label]: !expanded }))}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
                aria-expanded={expanded}
              >
                <Icon className={cn('h-4 w-4', active && 'text-accent')} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !expanded && '-rotate-90')} />
              </button>
              {expanded && (
                <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
                  {item.children.map((c) => {
                    const childActive = pathname === c.to || pathname.startsWith(c.to + '/');
                    return (
                      <NavLink
                        key={c.to}
                        to={c.to}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[0.82rem] transition-colors',
                          childActive ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                        )}
                      >
                        {c.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {admin.data && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={cn(
              'mt-3 flex items-center gap-3 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm',
              pathname.startsWith('/admin') ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            <Shield className="h-4 w-4 text-violet" /> Admin console
          </NavLink>
        )}
      </div>
      <div className="border-t border-border px-4 py-3 text-[0.7rem] leading-relaxed text-fg-subtle">
        Phase 1 beta · Market data is sample/static · Simulated money only
      </div>
    </nav>
  );
}

function NotificationsMenu() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const q = useQuery({
    queryKey: ['notifications', user!.id],
    queryFn: () => listNotifications(user!.id),
    refetchInterval: 60_000,
  });
  const unread = q.data?.filter((n) => !n.read_at).length ?? 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const markAll = async () => {
    await markNotificationsRead(user!.id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-fg-muted hover:bg-surface-3 hover:text-fg"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-border-strong bg-surface shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {q.isPending ? (
              <div className="p-4 text-sm text-fg-muted">Loading…</div>
            ) : q.isError ? (
              <div className="p-4 text-sm text-down">Could not load notifications.</div>
            ) : !q.data?.length ? (
              <div className="p-6 text-center text-sm text-fg-muted">No notifications yet.</div>
            ) : (
              q.data.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    setOpen(false);
                    if (!n.read_at) {
                      await markNotificationsRead(user!.id, [n.id]);
                      qc.invalidateQueries({ queryKey: ['notifications'] });
                    }
                    if (n.link) navigate(n.link);
                  }}
                  className={cn('block w-full border-b border-border/60 px-4 py-3 text-left hover:bg-surface-2', !n.read_at && 'bg-accent/[0.04]')}
                >
                  <div className="flex items-start gap-2">
                    {!n.read_at && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-xs text-fg-muted">{n.body}</div>}
                      <div className="mt-1 text-[0.7rem] text-fg-subtle">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { signOut } = useAuth();
  const profile = useMyProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-surface-3" aria-label="Account menu">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-xs font-semibold text-accent">
          {initials(profile.data?.full_name)}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-fg-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 w-56 rounded-lg border border-border-strong bg-surface py-1 shadow-2xl animate-fade-in">
          <div className="border-b border-border px-3 py-2">
            <div className="truncate text-sm font-medium">{profile.data?.full_name}</div>
            <div className="truncate text-xs text-fg-muted">@{profile.data?.handle}</div>
          </div>
          {[
            { to: '/passport', label: 'Finance Passport', icon: GraduationCap },
            { to: '/profile', label: 'Settings', icon: Settings },
          ].map((i) => (
            <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">
              <i.icon className="h-4 w-4" /> {i.label}
            </Link>
          ))}
          <button
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg-muted hover:bg-surface-2 hover:text-down"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const stats = useMyStats();
  const ref = useReference();
  const level = ref.data?.careerLevels.find((l) => l.id === stats.data?.career_level_id);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur">
      <button className="rounded-md p-2 text-fg-muted hover:bg-surface-3 lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {stats.data && (
          <Link to="/career" className="hidden items-center gap-3 rounded-md border border-border bg-surface px-3 py-1.5 text-xs sm:flex hover:border-border-strong">
            <span className="text-fg-muted">{level?.name ?? '—'}</span>
            <span className="h-3 w-px bg-border-strong" />
            <span className="text-fg-subtle">FINLAB</span>
            <span className="font-mono font-semibold tabular text-accent">{fmtScore(stats.data.finlab_score)}</span>
          </Link>
        )}
        <Link to="/events" className="hidden rounded-md p-2 text-fg-muted hover:bg-surface-3 hover:text-fg md:block" aria-label="Market events">
          <Newspaper className="h-4 w-4" />
        </Link>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  // Block bodies on purpose: an effect must return nothing or a cleanup function
  // (newer browsers make window.scrollTo return a Promise).
  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-surface lg:block">
        <Sidebar />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface animate-fade-in">
            <button className="absolute right-2 top-3 rounded p-1.5 text-fg-muted hover:bg-surface-3" onClick={() => setDrawer(false)} aria-label="Close navigation">
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <TopBar onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="no-print mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-16 pt-4 text-xs text-fg-subtle sm:px-6 lg:px-8">
          <span>FINLAB beta · Educational simulation — not investment advice</span>
          <Link to="/terms" className="hover:text-fg">Terms</Link>
          <Link to="/privacy" className="hover:text-fg">Privacy</Link>
          <a href={LINKEDIN_PAGE_URL} target="_blank" rel="noreferrer noopener" className="hover:text-fg">LinkedIn</a>
        </footer>
        <FeedbackButton />
      </div>
    </div>
  );
}

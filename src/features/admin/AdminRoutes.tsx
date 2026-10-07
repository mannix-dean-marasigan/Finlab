import { NavLink, Route, Routes } from 'react-router';
import { Award, BadgeCheck, BarChart3, BookOpen, ClipboardCheck, Database, GraduationCap, KeyRound, LayoutDashboard, LineChart, Briefcase, MessageSquare, MonitorPlay, Swords, Target, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminOverviewPage from './AdminOverviewPage';
import AdminChallengesPage from './AdminChallengesPage';
import AdminChallengeEditor from './AdminChallengeEditor';
import AdminSubmissionsPage from './AdminSubmissionsPage';
import AdminCompetitionsPage from './AdminCompetitionsPage';
import AdminAchievementsPage from './AdminAchievementsPage';
import AdminPromotionsPage from './AdminPromotionsPage';
import AdminEventsPage from './AdminEventsPage';
import AdminUsersPage from './AdminUsersPage';
import AdminMarketPage from './AdminMarketPage';
import AdminLessonsPage from './AdminLessonsPage';
import AdminProgramsPage from './AdminProgramsPage';
import AdminCertificatesPage from './AdminCertificatesPage';
import AdminFeedbackPage from './AdminFeedbackPage';
import AdminAnalyticsPage from './AdminAnalyticsPage';
import AdminCapstonesPage from './AdminCapstonesPage';
import AdminInvitesPage from './AdminInvitesPage';

const LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { to: '/admin/challenges', label: 'Challenges', icon: Target },
  { to: '/admin/submissions', label: 'Review', icon: ClipboardCheck },
  { to: '/admin/capstones', label: 'Capstones', icon: MonitorPlay },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/admin/programs', label: 'Certifications', icon: GraduationCap },
  { to: '/admin/certificates', label: 'Certificates', icon: BadgeCheck },
  { to: '/admin/competitions', label: 'Competitions', icon: Swords },
  { to: '/admin/achievements', label: 'Achievements', icon: Award },
  { to: '/admin/promotions', label: 'Promotions', icon: Briefcase },
  { to: '/admin/events', label: 'Market events', icon: Zap },
  { to: '/admin/market', label: 'Market data', icon: Database },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/invites', label: 'Invites', icon: KeyRound },
];

export default function AdminRoutes() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-violet" />
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-violet">Admin console</span>
      </div>
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cn('-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm', isActive ? 'border-violet text-fg' : 'border-transparent text-fg-muted hover:text-fg')
            }
          >
            <l.icon className="h-4 w-4" /> {l.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<AdminOverviewPage />} />
        <Route path="challenges" element={<AdminChallengesPage />} />
        <Route path="challenges/new" element={<AdminChallengeEditor />} />
        <Route path="challenges/:id" element={<AdminChallengeEditor />} />
        <Route path="submissions" element={<AdminSubmissionsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="capstones" element={<AdminCapstonesPage />} />
        <Route path="competitions" element={<AdminCompetitionsPage />} />
        <Route path="achievements" element={<AdminAchievementsPage />} />
        <Route path="promotions" element={<AdminPromotionsPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="market" element={<AdminMarketPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="invites" element={<AdminInvitesPage />} />
        <Route path="feedback" element={<AdminFeedbackPage />} />
        <Route path="lessons" element={<AdminLessonsPage />} />
        <Route path="programs" element={<AdminProgramsPage />} />
        <Route path="certificates" element={<AdminCertificatesPage />} />
      </Routes>
    </div>
  );
}

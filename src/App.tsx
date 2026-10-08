import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AppLayout } from './app/AppLayout';
import { RedirectIfAuthed, RequireAdmin, RequireAuth } from './app/guards';
import { FullScreenLoader } from './app/FullScreenLoader';
import { isSupabaseConfigured } from './lib/supabase';
import { ROUTER_BASENAME } from './lib/utils';
import { SetupRequired } from './features/system/SetupRequired';
import { NotFoundPage } from './features/system/NotFoundPage';

// Route-level code splitting keeps the initial bundle small.
const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./features/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const LearnPage = lazy(() => import('./features/learn/LearnPage'));
const LessonPage = lazy(() => import('./features/learn/LessonPage'));
const ChallengesPage = lazy(() => import('./features/challenges/ChallengesPage'));
const ChallengePage = lazy(() => import('./features/challenges/ChallengePage'));
const PitchesPage = lazy(() => import('./features/pitches/PitchesPage'));
const PitchEditorPage = lazy(() => import('./features/pitches/PitchEditorPage'));
const ResearchPage = lazy(() => import('./features/research/ResearchPage'));
const ResearchEditorPage = lazy(() => import('./features/research/ResearchEditorPage'));
const ValuationPage = lazy(() => import('./features/valuation/ValuationPage'));
const ModelsPage = lazy(() => import('./features/models/ModelsPage'));
const ModelEditorPage = lazy(() => import('./features/models/ModelEditorPage'));
const MarketsPage = lazy(() => import('./features/markets/MarketsPage'));
const SecurityPage = lazy(() => import('./features/markets/SecurityPage'));
const PortfolioPage = lazy(() => import('./features/portfolio/PortfolioPage'));
const EventsPage = lazy(() => import('./features/events/EventsPage'));
const CareerPage = lazy(() => import('./features/career/CareerPage'));
const CompetitionsPage = lazy(() => import('./features/competitions/CompetitionsPage'));
const CompetitionPage = lazy(() => import('./features/competitions/CompetitionPage'));
const LeaderboardPage = lazy(() => import('./features/leaderboard/LeaderboardPage'));
const MyPassportPage = lazy(() => import('./features/passport/MyPassportPage'));
const PublicPassportPage = lazy(() => import('./features/passport/PublicPassportPage'));
const PublicWorkPage = lazy(() => import('./features/passport/PublicWorkPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const CertificationsPage = lazy(() => import('./features/certifications/CertificationsPage'));
const ProgramPage = lazy(() => import('./features/certifications/ProgramPage'));
const VerifyCertificatePage = lazy(() => import('./features/certifications/VerifyCertificatePage'));
const TermsPage = lazy(() => import('./features/legal/LegalPages').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./features/legal/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TradingFloorPage = lazy(() => import('./features/trading/TradingFloorPage'));
const ClassesPage = lazy(() => import('./features/classes/ClassesPage'));
const WhatsNewPage = lazy(() => import('./features/whatsnew/WhatsNewPage'));
const FlashcardsPage = lazy(() => import('./features/flashcards/FlashcardsPage'));
const ReviewsPage = lazy(() => import('./features/reviews/ReviewsPage'));
const AdminRoutes = lazy(() => import('./features/admin/AdminRoutes'));

export default function App() {
  if (!isSupabaseConfigured) return <SetupRequired />;
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
          <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/p/:handle" element={<PublicPassportPage />} />
          <Route path="/verify/:code" element={<VerifyCertificatePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/p/:handle/:kind/:id" element={<PublicWorkPage />} />
          <Route path="/onboarding" element={<RequireAuth allowUnonboarded><OnboardingPage /></RequireAuth>} />

          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:slug" element={<LessonPage />} />
            <Route path="/certifications" element={<CertificationsPage />} />
            <Route path="/certifications/:slug" element={<ProgramPage />} />
            <Route path="/whats-new" element={<WhatsNewPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/trading" element={<TradingFloorPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/reviews/:pitchId" element={<ReviewsPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/challenges/:id" element={<ChallengePage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/research/:id" element={<ResearchEditorPage />} />
            <Route path="/pitches" element={<PitchesPage />} />
            <Route path="/pitches/:id" element={<PitchEditorPage />} />
            <Route path="/valuation" element={<ValuationPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/models/:id" element={<ModelEditorPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/markets/:id" element={<SecurityPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/competitions" element={<CompetitionsPage />} />
            <Route path="/competitions/:id" element={<CompetitionPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/passport" element={<MyPassportPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/*" element={<RequireAdmin><AdminRoutes /></RequireAdmin>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

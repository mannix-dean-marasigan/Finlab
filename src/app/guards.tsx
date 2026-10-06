import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from './auth';
import { useIsAdmin, useMyProfile } from './queries';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { FullScreenLoader } from './FullScreenLoader';

/** Requires a session; sends un-onboarded users to /onboarding. */
export function RequireAuth({ children, allowUnonboarded = false }: { children: ReactNode; allowUnonboarded?: boolean }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const profile = useMyProfile();

  if (loading) return <FullScreenLoader />;
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (profile.isPending) return <FullScreenLoader label="Loading your workspace…" />;
  if (profile.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState title="Could not load your profile" error={profile.error} onRetry={() => profile.refetch()} />
      </div>
    );
  }
  if (!profile.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState
          title="Profile not found"
          error="Your account exists but no FINLAB profile was created. Make sure the database migrations (including the auth trigger) were applied, then sign up again."
        />
      </div>
    );
  }
  if (!allowUnonboarded && !profile.data.onboarded_at) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** UX guard for admin pages. Real enforcement is RLS + admin RPC checks. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const admin = useIsAdmin();
  if (admin.isPending) return <FullScreenLoader label="Checking permissions…" />;
  if (admin.isError) return <ErrorState error={admin.error} onRetry={() => admin.refetch()} />;
  if (!admin.data) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Administrators only"
        description="Your account does not have admin access. Admin roles can only be granted by an existing administrator."
      />
    );
  }
  return <>{children}</>;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (session) {
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') ? next : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useAuth } from '@/app/auth';
import { fetchPassport } from '@/services/api/compete';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/states';
import { PassportView } from './PassportView';

export function PublicShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to={session ? '/dashboard' : '/login'}>
            <Logo />
          </Link>
          {session ? (
            <Link to="/dashboard">
              <Button size="sm">Back to FINLAB</Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="sm" variant="primary">
                Join the beta
              </Button>
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default function PublicPassportPage() {
  const { handle = '' } = useParams();
  const passport = useQuery({ queryKey: ['passport', handle], queryFn: () => fetchPassport(handle) });
  return (
    <PublicShell>
      {passport.isPending ? (
        <PageSkeleton />
      ) : passport.isError ? (
        <ErrorState error={passport.error} onRetry={() => passport.refetch()} />
      ) : !passport.data ? (
        <EmptyState icon={<Lock className="h-5 w-5" />} title="Passport not available" description="This profile doesn't exist or is private." />
      ) : (
        <PassportView passport={passport.data} publicLinks />
      )}
    </PublicShell>
  );
}

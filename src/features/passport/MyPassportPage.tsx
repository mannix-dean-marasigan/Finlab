import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useMyProfile } from '@/app/queries';
import { fetchPassport } from '@/services/api/compete';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ErrorState, PageSkeleton } from '@/components/ui/states';
import { PassportView } from './PassportView';

export default function MyPassportPage() {
  const profile = useMyProfile();
  const handle = profile.data?.handle;
  const passport = useQuery({ queryKey: ['passport', handle], queryFn: () => fetchPassport(handle!), enabled: !!handle });

  if (profile.isPending || passport.isPending) return <PageSkeleton />;
  if (passport.isError) return <ErrorState error={passport.error} onRetry={() => passport.refetch()} />;
  if (!passport.data) return <ErrorState error="Passport unavailable." />;

  const url = `${window.location.origin}/p/${handle}`;
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Profile"
        title="Finance Passport"
        description="Your recruiter-facing proof of work. Share the public link; control visibility of individual pitches and reports from their pages."
        actions={
          <>
            {profile.data?.is_public ? (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success('Public link copied'))
                      .catch(() => toast.error('Could not copy — ' + url))
                  }
                >
                  <Copy className="h-4 w-4" /> Copy public link
                </Button>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" /> View as recruiter
                  </Button>
                </a>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                <EyeOff className="h-4 w-4" /> Passport is private
              </span>
            )}
            <Link to="/profile">
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" /> Edit profile
              </Button>
            </Link>
          </>
        }
      />
      <PassportView passport={passport.data} />
    </div>
  );
}

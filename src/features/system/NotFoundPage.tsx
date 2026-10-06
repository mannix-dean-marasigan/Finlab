import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={<Compass className="h-5 w-5" />}
      title="Page not found"
      description="That route doesn't exist in FINLAB."
      action={
        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            Back to dashboard
          </Button>
        </Link>
      }
    />
  );
}

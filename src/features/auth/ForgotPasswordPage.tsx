import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { supabase, toErrorMessage } from '@/lib/supabase';
import { appUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { AuthShell } from './AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appUrl('/reset-password'),
    });
    setLoading(false);
    if (err) setError(toErrorMessage(err));
    else setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure reset link.">
      {sent ? (
        <div className="rounded-md border border-up/30 bg-up-muted px-4 py-3 text-sm text-up">
          If an account exists for {email}, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <InlineError message={error} />
          <Button type="submit" variant="primary" className="w-full justify-center" loading={loading} disabled={!email}>
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm text-fg-muted hover:text-accent">
        Back to sign in
      </Link>
    </AuthShell>
  );
}

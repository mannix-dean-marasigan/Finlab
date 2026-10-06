import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase, toErrorMessage } from '@/lib/supabase';
import { useAuth } from '@/app/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { InlineError, LoadingState } from '@/components/ui/states';
import { AuthShell } from './AuthShell';

export default function ResetPasswordPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) return setError(toErrorMessage(err));
    await supabase.auth.signOut();
    navigate('/login?reset=1', { replace: true });
  };

  if (authLoading) return <AuthShell title="Reset password"><LoadingState /></AuthShell>;

  if (!session) {
    return (
      <AuthShell title="Link expired or invalid" subtitle="Password reset links can only be used once and expire after a short time.">
        <Link to="/forgot-password">
          <Button variant="primary" className="w-full justify-center">
            Request a new link
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password" htmlFor="pw">
          <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm new password" htmlFor="pw2">
          <Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <InlineError message={error} />
        <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

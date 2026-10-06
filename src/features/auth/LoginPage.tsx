import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { supabase, toErrorMessage } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { AuthShell } from './AuthShell';

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(/Email not confirmed/i.test(err.message) ? 'Please confirm your email first — check your inbox for the link.' : /Invalid login/i.test(err.message) ? 'Incorrect email or password.' : toErrorMessage(err));
      return;
    }
    const next = params.get('next');
    navigate(next && next.startsWith('/') ? next : '/dashboard', { replace: true });
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back to the desk.">
      {params.get('confirmed') && (
        <div className="mb-4 rounded-md border border-up/30 bg-up-muted px-3 py-2 text-sm text-up">Account ready. Sign in to continue.</div>
      )}
      {params.get('reset') && (
        <div className="mb-4 rounded-md border border-up/30 bg-up-muted px-3 py-2 text-sm text-up">Password updated. Sign in with your new password.</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-fg-muted hover:text-accent">
            Forgot password?
          </Link>
        </div>
        <InlineError message={error} />
        <Button type="submit" variant="primary" className="w-full justify-center" loading={loading} disabled={!email || !password}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-fg-muted">
        New to FINLAB?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

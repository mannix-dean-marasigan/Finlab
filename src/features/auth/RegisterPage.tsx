import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { MailCheck } from 'lucide-react';
import { supabase, toErrorMessage } from '@/lib/supabase';
import { appUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { AuthShell } from './AuthShell';

export function validateRegistration(v: { name: string; email: string; password: string; confirm: string }) {
  const errors: Partial<Record<keyof typeof v, string>> = {};
  if (v.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address.';
  if (v.password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(v.password) || !/[0-9]/.test(v.password)) errors.password = 'Include at least one letter and one number.';
  if (v.confirm !== v.password) errors.confirm = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const errors = validateRegistration(form);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(errors).length) return;
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.name.trim() },
        emailRedirectTo: appUrl('/onboarding'),
      },
    });
    setLoading(false);
    if (err) {
      setError(/already registered/i.test(err.message) ? 'An account with this email already exists. Try signing in.' : toErrorMessage(err));
      return;
    }
    // Profile, stats, skills and portfolio are created by the on_auth_user_created trigger.
    if (data.session) navigate('/onboarding', { replace: true });
    else setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <AuthShell title="Confirm your email" subtitle={`We sent a confirmation link to ${form.email}.`}>
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-fg-muted">
          <MailCheck className="mb-3 h-6 w-6 text-accent" />
          Open the link to activate your account. You'll land on onboarding automatically. If it doesn't arrive within a few minutes, check
          spam.
        </div>
        <Link to="/login" className="mt-6 block text-center text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);
  return (
    <AuthShell title="Create your account" subtitle="Start as a Junior Analyst. Earn every promotion.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={show('name')}>
          <Input id="name" autoComplete="name" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={show('email')}>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={show('password')} hint="At least 8 characters with a letter and a number.">
          <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={show('confirm')}>
          <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </Field>
        <InlineError message={error} />
        <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

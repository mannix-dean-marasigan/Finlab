import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { KeyRound, Save, Sliders, Trash2, User } from 'lucide-react';
import { Modal } from '@/components/ui/misc';
import { deleteMyAccount } from '@/services/api/misc';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth';
import { qk, useMyPreferences, useMyProfile, useReference } from '@/app/queries';
import { updatePreferences, updateProfile } from '@/services/api/profile';
import { supabase, toErrorMessage } from '@/lib/supabase';
import type { UserPreferences } from '@/types/domain';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { ErrorState, InlineError, PageSkeleton } from '@/components/ui/states';
import { COUNTRIES, EXPERIENCE, GOALS, INTERESTS } from '@/features/onboarding/OnboardingPage';
import { appUrl, cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const prefs = useMyPreferences();
  const ref = useReference();

  const [p, setP] = useState({ full_name: '', handle: '', headline: '', bio: '', country_code: 'PH', university: '', primary_specialization_id: '', is_public: true });
  const [pr, setPr] = useState<{ interests: string[]; experience_level: UserPreferences['experience_level']; goal: UserPreferences['goal'] }>({ interests: [], experience_level: null, goal: null });
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile.data)
      setP({
        full_name: profile.data.full_name,
        handle: profile.data.handle,
        headline: profile.data.headline,
        bio: profile.data.bio,
        country_code: profile.data.country_code,
        university: profile.data.university ?? '',
        primary_specialization_id: profile.data.primary_specialization_id ?? '',
        is_public: profile.data.is_public,
      });
  }, [profile.data]);
  useEffect(() => {
    if (prefs.data) setPr({ interests: prefs.data.interests, experience_level: prefs.data.experience_level, goal: prefs.data.goal });
  }, [prefs.data]);

  const saveProfile = useMutation({
    mutationFn: () => {
      const handle = p.handle.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(handle)) throw new Error('Handle must be 3–30 characters: lowercase letters, numbers or underscores.');
      if (p.full_name.trim().length < 2) throw new Error('Enter your full name.');
      return updateProfile(user!.id, {
        full_name: p.full_name.trim(),
        handle,
        headline: p.headline.trim(),
        bio: p.bio.trim(),
        country_code: p.country_code,
        university: p.university.trim() || null,
        primary_specialization_id: p.primary_specialization_id || null,
        is_public: p.is_public,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile(user!.id) });
      qc.invalidateQueries({ queryKey: ['passport'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success('Profile saved');
    },
  });
  const savePrefs = useMutation({
    mutationFn: () => updatePreferences(user!.id, pr),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.prefs(user!.id) });
      qc.invalidateQueries({ queryKey: ['recommended'] });
      toast.success('Preferences saved');
    },
  });
  const changePw = useMutation({
    mutationFn: async () => {
      if (pw.next.length < 8) throw new Error('Use at least 8 characters.');
      if (pw.next !== pw.confirm) throw new Error('Passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw new Error(toErrorMessage(error));
    },
    onSuccess: () => {
      setPw({ next: '', confirm: '' });
      toast.success('Password updated');
    },
  });

  const removeAccount = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: async () => {
      await signOut();
      navigate('/login', { replace: true });
      toast.success('Your account has been deleted.');
    },
  });

  if (profile.isPending || prefs.isPending) return <PageSkeleton />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    saveProfile.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader eyebrow="Profile" title="Settings" description="Your public identity, preferences and account. Scores, ranks, levels and achievements are calculated and cannot be edited." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader title="Public profile" icon={<User className="h-3.5 w-3.5" />} />
          <CardContent>
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} maxLength={120} />
                </Field>
                <Field label="Handle" hint={`Public link: ${appUrl(`/p/${p.handle || '…'}`)}`}>
                  <Input value={p.handle} onChange={(e) => setP({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} maxLength={30} className="font-mono" />
                </Field>
              </div>
              <Field label="Headline">
                <Input value={p.headline} onChange={(e) => setP({ ...p, headline: e.target.value })} maxLength={160} placeholder="e.g. BS Management Engineering '27 · Aspiring equity research analyst" />
              </Field>
              <Field label="Bio" hint={`${p.bio.length}/2000`}>
                <Textarea rows={4} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={2000} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Country">
                  <Select value={p.country_code} onChange={(e) => setP({ ...p, country_code: e.target.value })}>
                    {COUNTRIES.map(([c, n]) => (
                      <option key={c} value={c}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="University">
                  <Input value={p.university} onChange={(e) => setP({ ...p, university: e.target.value })} maxLength={160} />
                </Field>
                <Field label="Specialization">
                  <Select value={p.primary_specialization_id} onChange={(e) => setP({ ...p, primary_specialization_id: e.target.value })}>
                    <option value="">None</option>
                    {ref.data?.specializations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Checkbox
                checked={p.is_public}
                onChange={(v) => setP({ ...p, is_public: v })}
                label="Public Finance Passport"
                description="When off, your passport link is hidden and you are hidden from other users on leaderboards (you're still ranked privately)."
              />
              <InlineError message={saveProfile.error ? (saveProfile.error as Error).message : null} />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saveProfile.isPending}>
                  <Save className="h-4 w-4" /> Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Preferences" icon={<Sliders className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-4">
              <Field label="Interests">
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => {
                    const on = pr.interests.includes(i.id);
                    return (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => setPr({ ...pr, interests: on ? pr.interests.filter((x) => x !== i.id) : [...pr.interests, i.id] })}
                        className={cn('rounded-full border px-3 py-1 text-xs', on ? 'border-accent/60 bg-accent-muted text-accent' : 'border-border-strong text-fg-muted hover:text-fg')}
                        aria-pressed={on}
                      >
                        {i.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Experience">
                <Select value={pr.experience_level ?? ''} onChange={(e) => setPr({ ...pr, experience_level: (e.target.value || null) as UserPreferences['experience_level'] })}>
                  {EXPERIENCE.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Goal">
                <Select value={pr.goal ?? ''} onChange={(e) => setPr({ ...pr, goal: (e.target.value || null) as UserPreferences['goal'] })}>
                  {GOALS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <InlineError message={savePrefs.error ? (savePrefs.error as Error).message : null} />
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => savePrefs.mutate()} loading={savePrefs.isPending}>
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Account" icon={<KeyRound className="h-3.5 w-3.5" />} />
            <CardContent className="space-y-4">
              <Field label="Email">
                <Input value={user?.email ?? ''} disabled />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="New password">
                  <Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                </Field>
                <Field label="Confirm">
                  <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </Field>
              </div>
              <InlineError message={changePw.error ? (changePw.error as Error).message : null} />
              <div className="flex justify-end">
                <Button size="sm" onClick={() => changePw.mutate()} loading={changePw.isPending} disabled={!pw.next}>
                  Change password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-down/30">
            <CardHeader title="Danger zone" icon={<Trash2 className="h-3.5 w-3.5 text-down" />} />
            <CardContent className="space-y-3">
              <p className="text-sm text-fg-muted">
                Permanently delete your account and everything in it: profile, submissions, pitches, reports, models, portfolio, scores, achievements and
                certificates. This cannot be undone.
              </p>
              <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
                <Trash2 className="h-4 w-4" /> Delete my account
              </Button>
            </CardContent>
          </Card>
          <Modal
            open={deleting}
            onClose={() => !removeAccount.isPending && setDeleting(false)}
            title="Delete your FINLAB account?"
            description="All your work and certificates will be permanently removed. Certificate verification links will stop working."
            footer={
              <>
                <Button variant="ghost" onClick={() => setDeleting(false)} disabled={removeAccount.isPending}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => removeAccount.mutate()} loading={removeAccount.isPending} disabled={confirmText !== 'DELETE'}>
                  Delete permanently
                </Button>
              </>
            }
          >
            <Field label='Type "DELETE" to confirm'>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="font-mono" autoFocus />
            </Field>
            <div className="mt-3">
              <InlineError message={removeAccount.error ? (removeAccount.error as Error).message : null} />
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
}

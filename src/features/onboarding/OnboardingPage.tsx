import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/auth';
import { qk, useMyProfile, useReference } from '@/app/queries';
import { updatePreferences, updateProfile } from '@/services/api/profile';
import type { UserPreferences } from '@/types/domain';

export const INTERESTS = [
  { id: 'equity_research', label: 'Equity Research' },
  { id: 'asset_management', label: 'Asset Management' },
  { id: 'investment_banking', label: 'Investment Banking' },
  { id: 'corporate_finance', label: 'Corporate Finance' },
  { id: 'venture_capital', label: 'Venture Capital' },
  { id: 'portfolio_management', label: 'Portfolio Management' },
];
export const EXPERIENCE: { id: NonNullable<UserPreferences['experience_level']>; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'New to finance' },
  { id: 'some_knowledge', label: 'Some finance knowledge', desc: 'Self-taught or a few courses' },
  { id: 'finance_student', label: 'Finance student', desc: 'Studying finance, accounting or economics' },
  { id: 'experienced', label: 'Experienced', desc: 'Working in or around finance' },
];
export const GOALS: { id: NonNullable<UserPreferences['goal']>; label: string }[] = [
  { id: 'learn_finance', label: 'Learn finance' },
  { id: 'competitions', label: 'Prepare for competitions' },
  { id: 'build_portfolio', label: 'Build a finance portfolio' },
  { id: 'career_prep', label: 'Prepare for a finance career' },
  { id: 'investing_skills', label: 'Improve investing skills' },
];
export const COUNTRIES = [
  ['PH', 'Philippines'], ['SG', 'Singapore'], ['MY', 'Malaysia'], ['ID', 'Indonesia'], ['TH', 'Thailand'], ['VN', 'Vietnam'],
  ['HK', 'Hong Kong'], ['JP', 'Japan'], ['IN', 'India'], ['AU', 'Australia'], ['GB', 'United Kingdom'], ['US', 'United States'],
  ['CA', 'Canada'], ['AE', 'United Arab Emirates'],
] as const;

function Choice({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
        selected ? 'border-accent/70 bg-accent-muted' : 'border-border bg-surface hover:border-border-strong',
      )}
      aria-pressed={selected}
    >
      <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border', selected ? 'border-accent bg-accent text-black' : 'border-border-strong')}>
        {selected && <Check className="h-3 w-3" />}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {desc && <span className="mt-0.5 block text-xs text-fg-muted">{desc}</span>}
      </span>
    </button>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const profile = useMyProfile();
  const ref = useReference();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [experience, setExperience] = useState<UserPreferences['experience_level']>(null);
  const [goal, setGoal] = useState<UserPreferences['goal']>(null);
  const [specialization, setSpecialization] = useState<string>('');
  const [country, setCountry] = useState('PH');
  const [university, setUniversity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Interests', 'Experience', 'Goal', 'Profile'];
  const canNext = [interests.length > 0, !!experience, !!goal, !!specialization][step];

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await updatePreferences(user!.id, { interests, experience_level: experience, goal });
      await updateProfile(user!.id, {
        primary_specialization_id: specialization,
        country_code: country,
        university: university.trim() || null,
        onboarded_at: new Date().toISOString(),
      });
      await qc.invalidateQueries({ queryKey: qk.profile(user!.id) });
      toast.success('Welcome to the desk, Junior Analyst.');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid-bg flex min-h-screen flex-col items-center bg-bg px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-2xl rounded-xl border border-border bg-surface p-6 sm:p-8 animate-fade-in">
        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col gap-1.5">
              <div className={cn('h-1 rounded-full', i <= step ? 'bg-accent' : 'bg-surface-3')} />
              <span className={cn('text-[0.7rem] uppercase tracking-wider', i === step ? 'text-fg' : 'text-fg-subtle')}>{s}</span>
            </div>
          ))}
        </div>

        <h1 className="text-xl font-semibold">
          {step === 0 && `Welcome${profile.data?.full_name ? `, ${profile.data.full_name.split(' ')[0]}` : ''}. What areas interest you?`}
          {step === 1 && 'How much finance experience do you have?'}
          {step === 2 && "What's your main goal on FINLAB?"}
          {step === 3 && 'Set up your analyst profile'}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {step === 0 && 'Pick all that apply. We use this to recommend challenges.'}
          {step === 1 && 'This helps us recommend where to start. It never affects your score.'}
          {step === 2 && 'You can change this later in Settings.'}
          {step === 3 && 'Your specialization and school power your leaderboards. You start as a Junior Analyst with a FINLAB Score of 0.'}
        </p>

        <div className="mt-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {INTERESTS.map((i) => (
                <Choice
                  key={i.id}
                  title={i.label}
                  selected={interests.includes(i.id)}
                  onClick={() => setInterests((cur) => (cur.includes(i.id) ? cur.filter((x) => x !== i.id) : [...cur, i.id]))}
                />
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {EXPERIENCE.map((x) => (
                <Choice key={x.id} title={x.label} desc={x.desc} selected={experience === x.id} onClick={() => setExperience(x.id)} />
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <Choice key={g.id} title={g.label} selected={goal === g.id} onClick={() => setGoal(g.id)} />
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Primary specialization" required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(ref.data?.specializations ?? []).map((s) => (
                    <Choice key={s.id} title={s.name} desc={s.description} selected={specialization === s.id} onClick={() => setSpecialization(s.id)} />
                  ))}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country" htmlFor="country">
                  <Select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="University (optional)" htmlFor="uni" hint="Used for the university leaderboard.">
                  <Input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of the Philippines" maxLength={160} />
                </Field>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <InlineError message={error} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" onClick={finish} disabled={!canNext} loading={saving}>
              Enter FINLAB
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

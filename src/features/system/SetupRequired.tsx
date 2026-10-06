import { Logo } from '@/components/Logo';

/** Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. */
export function SetupRequired() {
  return (
    <div className="grid-bg flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-8">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold">Connect FINLAB to Supabase</h1>
        <p className="mt-2 text-sm text-fg-muted">
          The app needs your Supabase project's <strong className="text-fg">public</strong> URL and anon key. Nothing is faked: without a
          database there is no authentication, scoring or persistence.
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-fg/90">
          <li>Create a free project at supabase.com.</li>
          <li>
            Run the SQL files in <code className="font-mono text-accent">supabase/migrations</code> (in order), then{' '}
            <code className="font-mono text-accent">supabase/seed.sql</code>.
          </li>
          <li>
            Copy <code className="font-mono text-accent">.env.example</code> to <code className="font-mono text-accent">.env.local</code> and fill in{' '}
            <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
          </li>
          <li>Restart the dev server.</li>
        </ol>
        <p className="mt-5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Never use the service-role key in the frontend. Only the anon/publishable key belongs in VITE_ variables.
        </p>
        <p className="mt-3 text-xs text-fg-subtle">See README.md for the full setup guide.</p>
      </div>
    </div>
  );
}

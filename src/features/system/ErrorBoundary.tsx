import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last-resort boundary so a render error never leaves a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FINLAB render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-6">
        <div className="max-w-md rounded-lg border border-down/30 bg-surface p-6 text-center">
          <h1 className="text-lg font-semibold">Something broke on this page</h1>
          <p className="mt-2 text-sm text-fg-muted">{this.state.error.message}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="rounded-md border border-border-strong px-4 py-2 text-sm hover:bg-surface-3" onClick={() => window.location.reload()}>
              Reload
            </button>
            <a className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-black" href={`${import.meta.env.BASE_URL}dashboard`}>
              Go to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}

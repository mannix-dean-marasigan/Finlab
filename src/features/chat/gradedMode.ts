import { useEffect, useSyncExternalStore } from 'react';

// Pages call useGradedMode(true) while graded work is in progress (for example a knowledge check being
// answered). The study helper hides itself while any graded work is active.
let active = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Marks graded work as in progress while `on` is true. */
export function useGradedMode(on: boolean) {
  useEffect(() => {
    if (!on) return;
    active += 1;
    notify();
    return () => {
      active -= 1;
      notify();
    };
  }, [on]);
}

/** True while any graded work is in progress. */
export function useIsGraded(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => active > 0,
  );
}

/** Pages where the helper never appears: challenges hold the cases and the timed final exams. */
export function isGradedPath(pathname: string): boolean {
  return /^\/challenges\/[^/]+/.test(pathname);
}

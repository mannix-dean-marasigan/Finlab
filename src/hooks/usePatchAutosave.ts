import { useCallback, useEffect, useRef, useState } from 'react';
import type { SaveState } from '@/features/challenges/TaskWorkspace';

/**
 * Accumulates partial updates and persists them after a pause in typing.
 * Used by the pitch and research editors.
 */
export function usePatchAutosave<T extends object>(save: (patch: Partial<T>) => Promise<void>, delay = 1200) {
  const pending = useRef<Partial<T>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    setState('saving');
    try {
      await saveRef.current(patch);
      setSavedAt(new Date().toISOString());
      setState('saved');
      setError(null);
    } catch (e) {
      pending.current = { ...patch, ...pending.current };
      setState('error');
      setError((e as Error).message);
    }
  }, []);

  const queue = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (timer.current) clearTimeout(timer.current);
      if (Object.keys(pending.current).length) void saveRef.current(pending.current).catch(() => undefined);
    };
  }, []);

  return { queue, flush, state, savedAt, error };
}

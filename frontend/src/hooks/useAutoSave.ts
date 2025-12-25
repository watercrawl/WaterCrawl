import { useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  enabled?: boolean;
  delay?: number;
  onSave: () => Promise<void> | void;
  dependencies?: unknown[];
}

/**
 * Deep comparison helper for objects and arrays
 */
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => deepEqual(val, b[idx]));
    }

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
};

/**
 * Custom hook for auto-saving with debouncing
 * Only triggers save when dependencies actually change (deep comparison)
 */
export const useAutoSave = ({
  enabled = true,
  delay = 1000,
  onSave,
  dependencies = [],
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  const prevDepsRef = useRef<unknown[] | null>(null);
  const isFirstRenderRef = useRef(true);

  // Keep onSave ref up to date
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled) {
      // Reset on disable
      prevDepsRef.current = null;
      isFirstRenderRef.current = true;
      return;
    }

    // Skip first render - don't save on initial mount
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevDepsRef.current = dependencies;
      return;
    }

    // Check if dependencies actually changed (deep comparison)
    if (prevDepsRef.current === null) {
      prevDepsRef.current = dependencies;
      return;
    }

    const hasChanged = dependencies.some(
      (dep, index) => !deepEqual(dep, prevDepsRef.current?.[index])
    );

    if (!hasChanged) {
      // Update refs but don't trigger save
      prevDepsRef.current = dependencies;
      return;
    }

    // Update previous dependencies
    prevDepsRef.current = dependencies;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onSaveRef.current();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, delay, dependencies]);
};


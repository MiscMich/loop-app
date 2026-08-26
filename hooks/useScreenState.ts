/**
 * useScreenState Hook
 * Unified state management for screen states
 */

import { useMemo, useState, useCallback } from 'react';
import type { ScreenState } from '@/components/states/types';

interface UseScreenStateOptions {
  /** Custom empty check function */
  isEmpty?: (data: any) => boolean;
}

interface UseScreenStateResult {
  /** Current screen state */
  state: ScreenState;
  /** Whether data is considered empty */
  isDataEmpty: boolean;
  /** Whether currently in loading state */
  isLoading: boolean;
  /** Whether in error state */
  hasError: boolean;
  /** Whether in ideal state (has data) */
  hasData: boolean;
}

/**
 * Determines the current screen state based on loading, error, and data
 *
 * @param data - The data to check for empty state
 * @param isLoading - Whether data is currently loading
 * @param error - Error object if any
 * @param options - Additional options for state determination
 *
 * @example
 * ```tsx
 * const { state, isDataEmpty } = useScreenState(posts, isLoading, error);
 *
 * if (state === 'loading') return <SkeletonFeed />;
 * if (state === 'error') return <ErrorState onRetry={refetch} />;
 * if (state === 'empty') return <EmptyFeed onAction={navigateToCreate} />;
 * return <FeedList data={posts} />;
 * ```
 */
export function useScreenState<T>(
  data: T | null | undefined,
  isLoading: boolean,
  error: Error | null | undefined,
  options?: UseScreenStateOptions
): UseScreenStateResult {
  const { isEmpty: customIsEmpty } = options ?? {};

  return useMemo(() => {
    // Loading takes priority
    if (isLoading) {
      return {
        state: 'loading' as ScreenState,
        isDataEmpty: false,
        isLoading: true,
        hasError: false,
        hasData: false,
      };
    }

    // Error state next
    if (error) {
      return {
        state: 'error' as ScreenState,
        isDataEmpty: false,
        isLoading: false,
        hasError: true,
        hasData: false,
      };
    }

    // Check for empty data
    let isDataEmpty = false;

    if (customIsEmpty) {
      isDataEmpty = customIsEmpty(data);
    } else if (data === null || data === undefined) {
      isDataEmpty = true;
    } else if (Array.isArray(data)) {
      isDataEmpty = data.length === 0;
    } else if (typeof data === 'object') {
      isDataEmpty = Object.keys(data).length === 0;
    }

    if (isDataEmpty) {
      return {
        state: 'empty' as ScreenState,
        isDataEmpty: true,
        isLoading: false,
        hasError: false,
        hasData: false,
      };
    }

    // Ideal state - has data
    return {
      state: 'ideal' as ScreenState,
      isDataEmpty: false,
      isLoading: false,
      hasError: false,
      hasData: true,
    };
  }, [data, isLoading, error, customIsEmpty]);
}

/**
 * Simplified hook for boolean loading states
 */
export function useLoadingState(isLoading: boolean): 'loading' | 'idle' {
  return isLoading ? 'loading' : 'idle';
}

/**
 * Hook for handling async operations with states
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

export default useScreenState;

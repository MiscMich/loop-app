/**
 * React Query Configuration
 *
 * Centralized query client setup with:
 * - Network-aware online/offline handling
 * - Optimistic default cache settings
 * - Error retry configuration
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 */
import { QueryClient, onlineManager, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from './logger';

/**
 * Query client with sensible defaults for mobile
 *
 * Cache Strategy:
 * - staleTime: 5 minutes - Data considered fresh, no background refetch
 * - gcTime: 30 minutes - Unused cache garbage collected (was cacheTime in v4)
 * - retry: 2 - Retry failed requests twice with exponential backoff
 *
 * Mobile Optimizations:
 * - refetchOnWindowFocus: false - Mobile doesn't have "windows"
 * - refetchOnReconnect: true - Refetch when coming back online
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (garbage collection)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Not relevant for mobile
      refetchOnReconnect: true, // Refetch when network comes back
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Setup network state listener for React Query
 * Integrates with expo-network to pause/resume queries based on connectivity
 *
 * Call this once at app startup (in _layout.tsx)
 *
 * NOTE: expo-network requires EAS build. In dev client, this gracefully does nothing.
 */
export function setupNetworkListener(): () => void {
  let unsubscribe: (() => void) | null = null;

  // Async setup - we'll run this but return cleanup immediately
  (async () => {
    try {
      // Dynamic import to avoid crash if native module doesn't exist
      const Network = await import('expo-network');

      // Test if it actually works by calling a method
      const state = await Network.getNetworkStateAsync();
      onlineManager.setOnline(state.isConnected ?? true);
      logger.debug('Network listener active', { action: 'setupNetworkListener' });

      // Subscribe to network changes
      const subscription = Network.addNetworkStateListener((netState) => {
        onlineManager.setOnline(netState.isConnected ?? true);
      });
      unsubscribe = () => subscription.remove();
    } catch (error) {
      // Native module not available (requires EAS build) - silently disable
      logger.debug('expo-network not available, network-aware caching disabled', { action: 'setupNetworkListener' });
    }
  })();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Setup app focus listener for React Query
 * Refetches stale queries when app returns to foreground
 *
 * Call this once at app startup (in _layout.tsx)
 */
export function setupAppFocusListener(): () => void {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    // Only consider focused when truly active
    focusManager.setFocused(status === 'active');
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Invalidate all queries - useful after auth state changes
 */
export function invalidateAllQueries(): Promise<void> {
  return queryClient.invalidateQueries();
}

/**
 * Clear all cached data - useful on logout
 */
export function clearQueryCache(): void {
  queryClient.clear();
}

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

/**
 * Hook to monitor network connectivity status in real-time
 * Uses expo-network for Expo managed workflow compatibility
 * Gracefully degrades if native module not available (dev client without EAS build)
 *
 * NOTE: expo-network requires EAS build. In dev client, returns optimistic defaults.
 *
 * @returns {NetworkStatus} Current network status
 * - isConnected: Whether device has any network connection (always true if module unavailable)
 * - isInternetReachable: Whether internet is actually reachable (null if unknown)
 *
 * @example
 * const { isConnected, isInternetReachable } = useNetworkStatus();
 * if (!isConnected) {
 *   // Show offline UI
 * }
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,  // Optimistic default
    isInternetReachable: null,
  });

  useEffect(() => {
    let isSubscribed = true;
    let subscription: { remove: () => void } | null = null;

    // Async setup with dynamic import
    (async () => {
      try {
        // Dynamic import to avoid crash if native module doesn't exist
        const Network = await import('expo-network');

        // Get initial state (this will throw if native module not available)
        const state = await Network.getNetworkStateAsync();
        if (isSubscribed) {
          setNetworkStatus({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable ?? null,
          });
        }

        // Subscribe to network state changes
        subscription = Network.addNetworkStateListener((netState) => {
          if (isSubscribed) {
            setNetworkStatus({
              isConnected: netState.isConnected ?? false,
              isInternetReachable: netState.isInternetReachable ?? null,
            });
          }
        });
      } catch (error) {
        // Native module not available (requires EAS build) - silently use defaults
        logger.debug('expo-network not available (requires EAS build)', { action: 'useNetworkStatus' });
      }
    })();

    // Cleanup subscription on unmount
    return () => {
      isSubscribed = false;
      subscription?.remove();
    };
  }, []);

  return networkStatus;
}

/**
 * useAnalytics Hook
 *
 * Provides analytics tracking functions with automatic user context
 * from the auth store. Includes screen tracking for navigation.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  track,
  identify,
  screen,
  reset,
  setUserProperty,
  AnalyticsEvent,
  type EventProperties,
  type UserTraits,
} from '@/lib/analytics';

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAnalyticsReturn {
  /**
   * Track an analytics event with automatic user context
   */
  track: (event: AnalyticsEvent | string, properties?: EventProperties) => void;

  /**
   * Identify the current user (called automatically on auth change)
   */
  identify: (traits?: Partial<UserTraits>) => void;

  /**
   * Track a screen view
   */
  screen: (screenName: string, properties?: Record<string, unknown>) => void;

  /**
   * Reset analytics (call on logout)
   */
  reset: () => void;

  /**
   * Set a user property
   */
  setUserProperty: (key: string, value: unknown) => void;

  /**
   * Get the current user ID (if authenticated)
   */
  userId: string | undefined;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Analytics hook that provides tracking functions with automatic user context.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track, screen } = useAnalytics();
 *
 *   useEffect(() => {
 *     screen('MyScreen');
 *   }, [screen]);
 *
 *   const handlePress = () => {
 *     track(AnalyticsEvent.CONTENT_SENT, { contentType: 'doodle' });
 *   };
 *
 *   return <Button onPress={handlePress}>Send</Button>;
 * }
 * ```
 */
export function useAnalytics(): UseAnalyticsReturn {
  // Get user from auth store using primitive selector for performance
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Track if we've identified the user in this session
  const identifiedUserRef = useRef<string | null>(null);

  // Auto-identify user when auth state changes
  useEffect(() => {
    if (isAuthenticated && user && user.id !== identifiedUserRef.current) {
      identify(user.id, {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        createdAt: user.createdAt,
      });
      identifiedUserRef.current = user.id;
    } else if (!isAuthenticated && identifiedUserRef.current) {
      reset();
      identifiedUserRef.current = null;
    }
  }, [isAuthenticated, user]);

  // Memoized track function with user context
  const trackWithContext = useCallback(
    (event: AnalyticsEvent | string, properties?: EventProperties) => {
      const enrichedProperties: EventProperties = {
        ...properties,
        // Add user context if available
        ...(user?.id && { userId: user.id }),
      };

      track(event, enrichedProperties);
    },
    [user?.id]
  );

  // Memoized identify function
  const identifyUser = useCallback(
    (traits?: Partial<UserTraits>) => {
      if (!user?.id) return;

      identify(user.id, {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        createdAt: user.createdAt,
        ...traits,
      });
    },
    [user]
  );

  // Memoized screen function with user context
  const trackScreen = useCallback(
    (screenName: string, properties?: Record<string, unknown>) => {
      screen(screenName, {
        ...properties,
        // Add user context if available
        ...(user?.id && { userId: user.id }),
      });
    },
    [user?.id]
  );

  // Memoized reset function
  const resetAnalytics = useCallback(() => {
    reset();
    identifiedUserRef.current = null;
  }, []);

  // Memoized setUserProperty function
  const setProperty = useCallback((key: string, value: unknown) => {
    setUserProperty(key, value);
  }, []);

  return {
    track: trackWithContext,
    identify: identifyUser,
    screen: trackScreen,
    reset: resetAnalytics,
    setUserProperty: setProperty,
    userId: user?.id,
  };
}

// ============================================================================
// Screen Tracking Hook
// ============================================================================

/**
 * Hook that automatically tracks screen views when the component mounts.
 * Use this in screen components for automatic screen tracking.
 *
 * @param screenName - The name of the screen to track
 * @param properties - Optional additional properties
 *
 * @example
 * ```tsx
 * function HomeScreen() {
 *   useScreenTracking('Home', { tab: 'feed' });
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export function useScreenTracking(
  screenName: string,
  properties?: Record<string, unknown>
): void {
  const { screen } = useAnalytics();
  const trackedRef = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (!trackedRef.current) {
      screen(screenName, properties);
      trackedRef.current = true;
    }
  }, [screen, screenName, properties]);
}

// ============================================================================
// Event Tracking Hooks
// ============================================================================

/**
 * Hook that returns a function to track a specific event.
 * Useful for components that need to track only one type of event.
 *
 * @param event - The event to track
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const trackSend = useTrackEvent(AnalyticsEvent.CONTENT_SENT);
 *
 *   const handlePress = () => {
 *     trackSend({ contentType: 'photo' });
 *     // ... send content
 *   };
 *
 *   return <Button onPress={handlePress}>Send</Button>;
 * }
 * ```
 */
export function useTrackEvent(
  event: AnalyticsEvent | string
): (properties?: EventProperties) => void {
  const { track } = useAnalytics();

  return useCallback(
    (properties?: EventProperties) => {
      track(event, properties);
    },
    [track, event]
  );
}

// ============================================================================
// Re-export Types and Enums
// ============================================================================

export { AnalyticsEvent } from '@/lib/analytics';
export type {
  EventProperties,
  UserTraits,
  ContentEventProperties,
  GameEventProperties,
  FriendEventProperties,
  AuthEventProperties,
} from '@/lib/analytics';

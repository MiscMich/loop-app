/**
 * Analytics Scaffolding
 *
 * Provides a unified interface for tracking events, user identification,
 * and screen views. Currently logs in development; ready for integration
 * with Mixpanel, Amplitude, or Segment in production.
 *
 * Environment variable: EXPO_PUBLIC_ANALYTICS_KEY (placeholder)
 */

import { logger } from './logger';

// ============================================================================
// Event Types
// ============================================================================

/**
 * Analytics event types for the Loop app.
 * Add new event types here as features are added.
 */
export enum AnalyticsEvent {
  // Auth events
  SIGN_IN_STARTED = 'sign_in_started',
  SIGN_IN_COMPLETED = 'sign_in_completed',
  SIGN_IN_FAILED = 'sign_in_failed',
  SIGN_OUT = 'sign_out',
  SESSION_RESTORED = 'session_restored',

  // Content events
  CONTENT_CREATED = 'content_created',
  CONTENT_SENT = 'content_sent',
  CONTENT_VIEWED = 'content_viewed',
  CONTENT_REACTION_ADDED = 'content_reaction_added',
  CONTENT_REACTION_REMOVED = 'content_reaction_removed',
  MOOD_SET = 'mood_set',

  // Friend events
  FRIEND_REQUEST_SENT = 'friend_request_sent',
  FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
  FRIEND_REQUEST_DECLINED = 'friend_request_declined',
  FRIEND_ADDED = 'friend_added',
  FRIEND_REMOVED = 'friend_removed',
  USER_BLOCKED = 'user_blocked',
  USER_UNBLOCKED = 'user_unblocked',
  USER_REPORTED = 'user_reported',

  // Game events
  GAME_STARTED = 'game_started',
  GAME_MOVE_MADE = 'game_move_made',
  GAME_COMPLETED = 'game_completed',
  GAME_WON = 'game_won',
  GAME_LOST = 'game_lost',
  GAME_DRAW = 'game_draw',

  // Widget events
  WIDGET_SYNCED = 'widget_synced',
  WIDGET_TAPPED = 'widget_tapped',

  // Onboarding events
  ONBOARDING_STARTED = 'onboarding_started',
  ONBOARDING_STEP_COMPLETED = 'onboarding_step_completed',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  ONBOARDING_SKIPPED = 'onboarding_skipped',

  // Profile events
  PROFILE_UPDATED = 'profile_updated',
  AVATAR_UPLOADED = 'avatar_uploaded',

  // Notification events
  PUSH_PERMISSION_GRANTED = 'push_permission_granted',
  PUSH_PERMISSION_DENIED = 'push_permission_denied',
  NOTIFICATION_OPENED = 'notification_opened',

  // Error events
  ERROR_OCCURRED = 'error_occurred',
  NETWORK_ERROR = 'network_error',
}

// ============================================================================
// Event Property Types
// ============================================================================

/**
 * Base properties included with every event
 */
export interface BaseEventProperties {
  timestamp?: string;
  sessionId?: string;
}

/**
 * Properties for content-related events
 */
export interface ContentEventProperties extends BaseEventProperties {
  contentType: 'doodle' | 'photo' | 'mood' | 'voice' | 'game';
  contentId?: string;
  recipientId?: string;
}

/**
 * Properties for game-related events
 */
export interface GameEventProperties extends BaseEventProperties {
  gameId: string;
  gameType: 'tictactoe';
  opponentId?: string;
  result?: 'win' | 'lose' | 'draw';
  movesCount?: number;
}

/**
 * Properties for friend-related events
 */
export interface FriendEventProperties extends BaseEventProperties {
  friendId: string;
  friendUsername?: string;
  totalFriends?: number;
}

/**
 * Properties for auth-related events
 */
export interface AuthEventProperties extends BaseEventProperties {
  method?: 'apple';
  isNewUser?: boolean;
  error?: string;
}

/**
 * Properties for onboarding events
 */
export interface OnboardingEventProperties extends BaseEventProperties {
  step?: number;
  stepName?: string;
  totalSteps?: number;
}

/**
 * Properties for error events
 */
export interface ErrorEventProperties extends BaseEventProperties {
  errorCode?: string;
  errorMessage?: string;
  screen?: string;
  action?: string;
}

/**
 * Union type for all event properties
 */
export type EventProperties =
  | BaseEventProperties
  | ContentEventProperties
  | GameEventProperties
  | FriendEventProperties
  | AuthEventProperties
  | OnboardingEventProperties
  | ErrorEventProperties
  | Record<string, unknown>;

// ============================================================================
// User Traits for Identification
// ============================================================================

/**
 * User traits for identification
 */
export interface UserTraits {
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  createdAt?: string;
  friendCount?: number;
  contentSentCount?: number;
  gamesPlayedCount?: number;
  isPremium?: boolean;
}

// ============================================================================
// Analytics Configuration
// ============================================================================

interface AnalyticsConfig {
  apiKey?: string;
  enabled: boolean;
  debugMode: boolean;
}

// Check if we're in development mode
const isDev = __DEV__;

// Placeholder for analytics API key
const ANALYTICS_KEY = process.env.EXPO_PUBLIC_ANALYTICS_KEY;

const config: AnalyticsConfig = {
  apiKey: ANALYTICS_KEY,
  enabled: true, // Can be toggled based on user preferences
  debugMode: isDev,
};

// ============================================================================
// Analytics Service Interface
// ============================================================================

/**
 * Interface for analytics service providers (Mixpanel, Amplitude, Segment, etc.)
 * Implement this interface when integrating an actual analytics service.
 */
export interface AnalyticsProvider {
  initialize(apiKey: string): Promise<void>;
  track(event: string, properties?: EventProperties): void;
  identify(userId: string, traits?: UserTraits): void;
  screen(screenName: string, properties?: Record<string, unknown>): void;
  reset(): void;
  setUserProperty(key: string, value: unknown): void;
  flush(): Promise<void>;
}

// ============================================================================
// Placeholder Analytics Provider
// ============================================================================

/**
 * Placeholder provider that logs events in development.
 * Replace with actual provider implementation (Mixpanel, Amplitude, etc.)
 */
const placeholderProvider: AnalyticsProvider = {
  async initialize(apiKey: string): Promise<void> {
    logger.debug('[Analytics] Initialized', { action: 'initialize' }, { apiKey: apiKey ? '***' : 'none' });
  },

  track(event: string, properties?: EventProperties): void {
    if (config.debugMode) {
      logger.info(`[Analytics] Track: ${event}`, { action: 'track' }, properties);
    }
  },

  identify(userId: string, traits?: UserTraits): void {
    if (config.debugMode) {
      logger.info(`[Analytics] Identify: ${userId}`, { action: 'identify' }, traits);
    }
  },

  screen(screenName: string, properties?: Record<string, unknown>): void {
    if (config.debugMode) {
      logger.info(`[Analytics] Screen: ${screenName}`, { action: 'screen' }, properties);
    }
  },

  reset(): void {
    if (config.debugMode) {
      logger.debug('[Analytics] Reset', { action: 'reset' });
    }
  },

  setUserProperty(key: string, value: unknown): void {
    if (config.debugMode) {
      logger.debug(`[Analytics] Set property: ${key}`, { action: 'setUserProperty' }, { value });
    }
  },

  async flush(): Promise<void> {
    if (config.debugMode) {
      logger.debug('[Analytics] Flush', { action: 'flush' });
    }
  },
};

// ============================================================================
// Analytics Service Singleton
// ============================================================================

/**
 * Current analytics provider. Replace with actual implementation.
 */
let provider: AnalyticsProvider = placeholderProvider;

/**
 * Set a custom analytics provider (for actual service integration)
 */
export function setAnalyticsProvider(customProvider: AnalyticsProvider): void {
  provider = customProvider;
}

/**
 * Initialize the analytics service
 */
export async function initializeAnalytics(): Promise<void> {
  if (!config.enabled) {
    logger.debug('[Analytics] Disabled', { action: 'initialize' });
    return;
  }

  if (config.apiKey) {
    await provider.initialize(config.apiKey);
  } else if (isDev) {
    logger.debug('[Analytics] No API key configured, using placeholder', { action: 'initialize' });
  }
}

// ============================================================================
// Core Analytics Functions
// ============================================================================

/**
 * Track an analytics event
 *
 * @param event - The event name from AnalyticsEvent enum
 * @param properties - Optional properties to include with the event
 *
 * @example
 * track(AnalyticsEvent.CONTENT_SENT, { contentType: 'doodle', recipientId: '123' });
 */
export function track(
  event: AnalyticsEvent | string,
  properties?: EventProperties
): void {
  if (!config.enabled) return;

  const enrichedProperties: EventProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  provider.track(event, enrichedProperties);

  // In production, this would send to the analytics service
  // For now, it just logs in development
  if (!isDev && config.apiKey) {
    // TODO: Send to actual analytics service
    // Example for Mixpanel:
    // mixpanel.track(event, enrichedProperties);
    //
    // Example for Amplitude:
    // amplitude.track(event, enrichedProperties);
    //
    // Example for Segment:
    // analytics.track({ event, properties: enrichedProperties });
  }
}

/**
 * Identify a user for analytics tracking
 *
 * @param userId - The unique user identifier
 * @param traits - Optional user traits to associate with the user
 *
 * @example
 * identify('user_123', { username: 'johndoe', email: 'john@example.com' });
 */
export function identify(userId: string, traits?: Partial<UserTraits>): void {
  if (!config.enabled) return;

  const fullTraits: UserTraits = {
    userId,
    ...traits,
  };

  provider.identify(userId, fullTraits);

  // In production, this would identify the user in the analytics service
  if (!isDev && config.apiKey) {
    // TODO: Send to actual analytics service
    // Example for Mixpanel:
    // mixpanel.identify(userId);
    // mixpanel.people.set(traits);
    //
    // Example for Amplitude:
    // amplitude.setUserId(userId);
    // amplitude.identify(new Identify().set(traits));
    //
    // Example for Segment:
    // analytics.identify({ userId, traits });
  }
}

/**
 * Track a screen view
 *
 * @param screenName - The name of the screen being viewed
 * @param properties - Optional properties to include with the screen view
 *
 * @example
 * screen('Home', { tab: 'feed' });
 */
export function screen(
  screenName: string,
  properties?: Record<string, unknown>
): void {
  if (!config.enabled) return;

  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
  };

  provider.screen(screenName, enrichedProperties);

  // In production, this would track the screen view
  if (!isDev && config.apiKey) {
    // TODO: Send to actual analytics service
    // Example for Mixpanel:
    // mixpanel.track('Screen Viewed', { screenName, ...properties });
    //
    // Example for Amplitude:
    // amplitude.track('Screen Viewed', { screenName, ...properties });
    //
    // Example for Segment:
    // analytics.screen({ name: screenName, properties });
  }
}

/**
 * Reset analytics (typically on logout)
 */
export function reset(): void {
  provider.reset();
}

/**
 * Set a user property
 *
 * @param key - The property key
 * @param value - The property value
 */
export function setUserProperty(key: string, value: unknown): void {
  if (!config.enabled) return;
  provider.setUserProperty(key, value);
}

/**
 * Flush any pending analytics events
 */
export async function flush(): Promise<void> {
  await provider.flush();
}

/**
 * Enable or disable analytics
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  config.enabled = enabled;
  logger.debug(`[Analytics] ${enabled ? 'Enabled' : 'Disabled'}`, { action: 'setEnabled' });
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return config.enabled;
}

// ============================================================================
// Convenience Functions for Common Events
// ============================================================================

/**
 * Track content sent event
 */
export function trackContentSent(
  contentType: ContentEventProperties['contentType'],
  recipientId: string,
  contentId?: string
): void {
  track(AnalyticsEvent.CONTENT_SENT, {
    contentType,
    recipientId,
    contentId,
  } as ContentEventProperties);
}

/**
 * Track game started event
 */
export function trackGameStarted(gameId: string, opponentId: string): void {
  track(AnalyticsEvent.GAME_STARTED, {
    gameId,
    gameType: 'tictactoe',
    opponentId,
  } as GameEventProperties);
}

/**
 * Track game completed event
 */
export function trackGameCompleted(
  gameId: string,
  result: 'win' | 'lose' | 'draw',
  movesCount: number
): void {
  track(AnalyticsEvent.GAME_COMPLETED, {
    gameId,
    gameType: 'tictactoe',
    result,
    movesCount,
  } as GameEventProperties);
}

/**
 * Track friend added event
 */
export function trackFriendAdded(friendId: string, totalFriends: number): void {
  track(AnalyticsEvent.FRIEND_ADDED, {
    friendId,
    totalFriends,
  } as FriendEventProperties);
}

/**
 * Track friend removed event
 */
export function trackFriendRemoved(friendId: string, totalFriends: number): void {
  track(AnalyticsEvent.FRIEND_REMOVED, {
    friendId,
    totalFriends,
  } as FriendEventProperties);
}

/**
 * Track error event
 */
export function trackError(
  errorCode: string,
  errorMessage: string,
  screen?: string,
  action?: string
): void {
  track(AnalyticsEvent.ERROR_OCCURRED, {
    errorCode,
    errorMessage,
    screen,
    action,
  } as ErrorEventProperties);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  track,
  identify,
  screen,
  reset,
  flush,
  setUserProperty,
  setAnalyticsEnabled,
  isAnalyticsEnabled,
  initializeAnalytics,
  setAnalyticsProvider,
  // Convenience functions
  trackContentSent,
  trackGameStarted,
  trackGameCompleted,
  trackFriendAdded,
  trackFriendRemoved,
  trackError,
};

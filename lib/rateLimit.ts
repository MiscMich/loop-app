/**
 * Client-side Rate Limiting Utility
 *
 * Simple token bucket rate limiter to prevent abuse.
 * Tracks calls per action type and auto-resets after the time window.
 */

import { logger } from './logger';

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

interface RateLimitState {
  calls: number;
  windowStart: number;
}

/**
 * Creates a rate limiter with the specified configuration.
 *
 * @param config - Rate limit configuration
 * @param config.maxCalls - Maximum number of calls allowed in the window
 * @param config.windowMs - Time window in milliseconds
 * @returns Object with check() method and reset() method
 */
export const createRateLimiter = (actionName: string, config: RateLimitConfig) => {
  let state: RateLimitState = {
    calls: 0,
    windowStart: Date.now(),
  };

  /**
   * Check if the action is allowed.
   * Returns true if allowed, false if rate limit exceeded.
   */
  const check = (): boolean => {
    const now = Date.now();

    // Reset window if expired
    if (now - state.windowStart >= config.windowMs) {
      state = {
        calls: 0,
        windowStart: now,
      };
    }

    // Check if within limit
    if (state.calls >= config.maxCalls) {
      const remainingMs = config.windowMs - (now - state.windowStart);
      logger.warn('Rate limit exceeded', {
        action: actionName,
        metadata: {
          maxCalls: config.maxCalls,
          windowMs: config.windowMs,
          currentCalls: state.calls,
          remainingMs,
        },
      });
      return false;
    }

    // Increment and allow
    state.calls++;
    return true;
  };

  /**
   * Get remaining calls in the current window.
   */
  const remaining = (): number => {
    const now = Date.now();

    // Check if window expired
    if (now - state.windowStart >= config.windowMs) {
      return config.maxCalls;
    }

    return Math.max(0, config.maxCalls - state.calls);
  };

  /**
   * Get time until window resets in milliseconds.
   */
  const resetIn = (): number => {
    const now = Date.now();
    const elapsed = now - state.windowStart;
    return Math.max(0, config.windowMs - elapsed);
  };

  /**
   * Manually reset the rate limiter.
   */
  const reset = (): void => {
    state = {
      calls: 0,
      windowStart: Date.now(),
    };
  };

  return {
    check,
    remaining,
    resetIn,
    reset,
  };
};

// Pre-configured rate limiters for specific actions
// Auth: max 3 sign-in attempts per minute
export const signInRateLimiter = createRateLimiter('signInWithApple', {
  maxCalls: 3,
  windowMs: 60 * 1000, // 1 minute
});

// User search: max 10 searches per 10 seconds
export const searchUsersRateLimiter = createRateLimiter('searchUsers', {
  maxCalls: 10,
  windowMs: 10 * 1000, // 10 seconds
});

// Content sending: max 20 per minute
export const sendContentRateLimiter = createRateLimiter('sendContent', {
  maxCalls: 20,
  windowMs: 60 * 1000, // 1 minute
});

// Error codes for rate limiting
export const RateLimitError = {
  SIGN_IN_RATE_LIMITED: 'SIGN_IN_RATE_LIMITED',
  SEARCH_RATE_LIMITED: 'SEARCH_RATE_LIMITED',
  SEND_CONTENT_RATE_LIMITED: 'SEND_CONTENT_RATE_LIMITED',
} as const;

export type RateLimitErrorCode = typeof RateLimitError[keyof typeof RateLimitError];

/**
 * Helper to check rate limit and throw if exceeded.
 * Useful when you want to throw an error instead of returning false.
 */
export const checkRateLimitOrThrow = (
  limiter: ReturnType<typeof createRateLimiter>,
  errorCode: RateLimitErrorCode
): void => {
  if (!limiter.check()) {
    const error = new Error(`Rate limit exceeded: ${errorCode}`);
    (error as any).code = errorCode;
    throw error;
  }
};

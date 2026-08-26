/**
 * Sentry Crash Reporting Integration
 *
 * Provides crash reporting, error tracking, and performance monitoring.
 * Only sends data in production builds (__DEV__ = false).
 *
 * Setup:
 * 1. Add EXPO_PUBLIC_SENTRY_DSN to your .env file
 * 2. Call initSentry() at app startup (in _layout.tsx)
 *
 * @see https://docs.sentry.io/platforms/react-native/
 */

import * as Sentry from '@sentry/react-native';
import { logger } from './logger';

// Check if we're in development mode
const isDev = __DEV__;

// Get DSN from environment variable
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Track initialization state
let isInitialized = false;

/**
 * Initialize Sentry SDK
 * Should be called once at app startup, before any other code
 */
export function initSentry(): void {
  // Skip initialization in development or if already initialized
  if (isDev) {
    logger.debug('Skipping Sentry initialization in development mode', { action: 'initSentry' });
    return;
  }

  if (isInitialized) {
    logger.warn('Sentry already initialized, skipping', { action: 'initSentry' });
    return;
  }

  if (!SENTRY_DSN) {
    logger.warn('No Sentry DSN configured, crash reporting disabled', { action: 'initSentry' });
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,

      // Enable performance monitoring
      tracesSampleRate: 0.2, // 20% of transactions for performance

      // Enable native crash reporting
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,

      // Capture uncaught errors and unhandled promise rejections
      enableCaptureFailedRequests: true,

      // Environment tag
      environment: 'production',

      // Debug mode (disable in production for better performance)
      debug: false,

      // Before sending error, you can modify or filter
      beforeSend(event) {
        // Don't send events in development (double-check)
        if (isDev) {
          return null;
        }
        return event;
      },

      // Before sending breadcrumb, you can modify or filter
      beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
        // Filter out noisy console breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        return breadcrumb;
      },
    });

    isInitialized = true;
    logger.info('Sentry initialized successfully', { action: 'initSentry' });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { action: 'initSentry' }, error);
  }
}

/**
 * Set user context for error reports
 * Call this after user authentication
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
} | null): void {
  if (isDev || !isInitialized) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    // Clear user context on logout
    Sentry.setUser(null);
  }
}

/**
 * Add custom context/tags for better error grouping
 */
export function setContext(
  name: string,
  context: Record<string, unknown>
): void {
  if (isDev || !isInitialized) return;

  Sentry.setContext(name, context);
}

/**
 * Set a tag for all future events
 */
export function setTag(key: string, value: string): void {
  if (isDev || !isInitialized) return;

  Sentry.setTag(key, value);
}

/**
 * Capture an exception and send to Sentry
 * Use this for caught errors that should be reported
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
): string | undefined {
  // Always log in dev, but don't send to Sentry
  if (isDev) {
    logger.error('Would capture exception (dev mode)', { action: 'captureException', metadata: context }, error);
    return undefined;
  }

  if (!isInitialized) {
    logger.warn('Sentry not initialized, cannot capture exception', { action: 'captureException' });
    return undefined;
  }

  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level,
  });
}

/**
 * Capture a message (for non-error events worth tracking)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): string | undefined {
  if (isDev) {
    logger.debug(`Would capture message (${level}): ${message}`, { action: 'captureMessage' });
    return undefined;
  }

  if (!isInitialized) {
    return undefined;
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Add a breadcrumb for debugging context
 * Breadcrumbs are included with error reports to show what happened before the error
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  if (isDev || !isInitialized) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'app',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Wrap a component with Sentry error boundary
 * Re-export for convenience
 */
export const withSentryErrorBoundary = Sentry.wrap;

/**
 * Start a performance transaction span
 */
export function startSpan<T>(
  name: string,
  operation: string,
  callback: () => T
): T {
  if (isDev || !isInitialized) {
    return callback();
  }

  return Sentry.startSpan(
    { name, op: operation },
    callback
  );
}

/**
 * Flush any queued events before app closes
 */
export async function flush(): Promise<boolean> {
  if (isDev || !isInitialized) return true;

  return Sentry.flush();
}

// Export Sentry for advanced usage
export { Sentry };

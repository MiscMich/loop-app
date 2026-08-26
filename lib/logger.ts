/**
 * Centralized Error Logging Utility
 *
 * Provides consistent error handling, logging, and debugging across the app.
 * In development: logs to console with color coding
 * In production: sends errors to Sentry for crash reporting
 */

import { captureException, addBreadcrumb } from '@/lib/sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  screen?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorInfo {
  message: string;
  code?: string;
  originalError?: unknown;
  context?: LogContext;
}

// Check if we're in development mode
const isDev = __DEV__;

// Color codes for console (React Native supports these)
const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',  // Reset
};

// Error code mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'Request timed out. Please try again.',

  // Auth errors
  AUTH_REQUIRED: 'Please sign in to continue.',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',

  // Permission errors
  PERMISSION_CAMERA: 'Camera access is required to take photos.',
  PERMISSION_MICROPHONE: 'Microphone access is required to record voice notes.',
  PERMISSION_PHOTOS: 'Photo library access is required.',

  // Content errors
  CONTENT_EMPTY: 'Please add some content before sending.',
  CONTENT_TOO_LARGE: 'Content is too large. Please try a smaller file.',
  SEND_FAILED: 'Failed to send. Please try again.',

  // Storage errors
  STORAGE_FULL: 'Device storage is full. Please free up some space.',
  SAVE_FAILED: 'Failed to save. Please try again.',

  // Generic errors
  UNKNOWN: 'Something went wrong. Please try again.',
};

/**
 * Format timestamp for logs
 */
function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 23);
}

/**
 * Format context for logging
 */
function formatContext(context?: LogContext): string {
  if (!context) return '';
  const parts: string[] = [];
  if (context.screen) parts.push(`screen=${context.screen}`);
  if (context.action) parts.push(`action=${context.action}`);
  if (context.userId) parts.push(`user=${context.userId.slice(0, 8)}`);
  return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, data?: unknown): void {
  if (!isDev && level === 'debug') return; // Skip debug logs in production

  const timestamp = formatTimestamp();
  const contextStr = formatContext(context);
  const color = LOG_COLORS[level];
  const reset = LOG_COLORS.reset;

  const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${contextStr}${reset}`;

  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }

  // In production, send errors to Sentry
  if (!isDev && level === 'error') {
    // Add breadcrumb for context
    addBreadcrumb({
      message,
      category: context?.screen || context?.action || 'app',
      level: 'error',
      data: {
        ...context,
        ...(data && typeof data === 'object' ? data : { value: data }),
      },
    });

    // Capture the error if we have one
    if (data instanceof Error) {
      captureException(data, {
        tags: {
          screen: context?.screen || 'unknown',
          action: context?.action || 'unknown',
        },
        extra: {
          message,
          context,
        },
      });
    } else if (data) {
      // Create an error from the message for non-Error data
      captureException(new Error(message), {
        tags: {
          screen: context?.screen || 'unknown',
          action: context?.action || 'unknown',
        },
        extra: {
          originalData: data,
          context,
        },
      });
    }
  }
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return fallback || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Logger object with methods for each level
 */
export const logger = {
  /**
   * Debug level - development only, detailed info
   */
  debug(message: string, context?: LogContext, data?: unknown): void {
    log('debug', message, context, data);
  },

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext, data?: unknown): void {
    log('info', message, context, data);
  },

  /**
   * Warn level - potential issues
   */
  warn(message: string, context?: LogContext, data?: unknown): void {
    log('warn', message, context, data);
  },

  /**
   * Error level - actual errors
   */
  error(message: string, context?: LogContext, error?: unknown): void {
    const errorMessage = error ? `${message}: ${extractErrorMessage(error)}` : message;
    log('error', errorMessage, context, error);
  },

  /**
   * Log a structured error with full context
   */
  logError(info: ErrorInfo): void {
    const { message, code, originalError, context } = info;
    const fullMessage = code ? `[${code}] ${message}` : message;
    log('error', fullMessage, context, originalError);
  },

  /**
   * Log screen navigation
   */
  screenView(screen: string, params?: Record<string, unknown>): void {
    log('info', `Screen viewed: ${screen}`, { screen }, params);
  },

  /**
   * Log user action
   */
  action(action: string, context?: LogContext, data?: unknown): void {
    log('info', `Action: ${action}`, context, data);
  },

  /**
   * Log performance timing
   */
  timing(label: string, durationMs: number, context?: LogContext): void {
    log('debug', `${label}: ${durationMs}ms`, context);
  },
};

/**
 * Create a logger scoped to a specific screen
 */
export function createScreenLogger(screen: string) {
  return {
    debug(message: string, data?: unknown): void {
      logger.debug(message, { screen }, data);
    },
    info(message: string, data?: unknown): void {
      logger.info(message, { screen }, data);
    },
    warn(message: string, data?: unknown): void {
      logger.warn(message, { screen }, data);
    },
    error(message: string, error?: unknown): void {
      logger.error(message, { screen }, error);
    },
    action(action: string, data?: unknown): void {
      logger.action(action, { screen }, data);
    },
  };
}

/**
 * Error codes for consistent error handling
 */
export const ErrorCodes = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',

  // Permissions
  PERMISSION_CAMERA: 'PERMISSION_CAMERA',
  PERMISSION_MICROPHONE: 'PERMISSION_MICROPHONE',
  PERMISSION_PHOTOS: 'PERMISSION_PHOTOS',

  // Content
  CONTENT_EMPTY: 'CONTENT_EMPTY',
  CONTENT_TOO_LARGE: 'CONTENT_TOO_LARGE',
  SEND_FAILED: 'SEND_FAILED',

  // Storage
  STORAGE_FULL: 'STORAGE_FULL',
  SAVE_FAILED: 'SAVE_FAILED',

  // Generic
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export default logger;

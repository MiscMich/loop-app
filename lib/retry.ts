/**
 * Retry utility with exponential backoff for network operations
 *
 * Usage:
 *   const data = await retryWithBackoff(() => fetchData());
 *   const result = await supabaseRetry(() => supabase.from('table').select());
 */

import { logger } from './logger';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Callback invoked on each retry attempt */
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retries a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The final error after all retries are exhausted
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Fetch failed');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry attempt ${attempt}: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s, 8s...
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Convenience wrapper for Supabase queries with automatic retry
 *
 * Automatically unwraps Supabase response and throws on error
 *
 * @param queryFn - Supabase query function
 * @returns The data from the query
 * @throws Error if the query fails after retries
 *
 * @example
 * ```typescript
 * const users = await supabaseRetry(() =>
 *   supabase.from('users').select('*')
 * );
 * ```
 */
export async function supabaseRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return retryWithBackoff(
    async () => {
      const { data, error } = await queryFn();

      if (error) {
        throw new Error(error.message || 'Supabase query failed');
      }

      if (data === null) {
        throw new Error('Supabase query returned null');
      }

      return data;
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      onRetry: (attempt, error) => {
        logger.warn(`Supabase retry attempt ${attempt}: ${error.message}`, { action: 'supabaseRetry', metadata: { attempt } });
      },
    }
  );
}

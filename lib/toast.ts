/**
 * Toast Helper - Simple API for showing toast notifications
 *
 * Usage:
 *   showToast({ type: 'success', message: 'Profile updated!' })
 *   showToast({ type: 'error', message: 'Failed to save', description: 'Please try again' })
 *   showToast({ type: 'error', message: 'Network error', action: { label: 'Retry', onPress: retry } })
 */

import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type ToastType = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  /** Toast variant: success (green), error (coral), info (lavender) */
  type: ToastType;

  /** Primary message - short, concise */
  message: string;

  /** Optional secondary description - more details */
  description?: string;

  /** Optional action button (only for error toasts) */
  action?: ToastAction;

  /** Custom duration in ms (default: 4000) */
  duration?: number;

  /** Disable haptic feedback (default: false) */
  disableHaptics?: boolean;
}

// =============================================================================
// TOAST FUNCTION
// =============================================================================

/**
 * Show a toast notification
 *
 * @example
 * ```ts
 * // Success
 * showToast({
 *   type: 'success',
 *   message: 'Content sent!',
 *   description: 'Your doodle was delivered to friends'
 * });
 *
 * // Error with retry
 * showToast({
 *   type: 'error',
 *   message: 'Failed to upload',
 *   description: 'Check your internet connection',
 *   action: {
 *     label: 'Retry',
 *     onPress: () => uploadPhoto()
 *   }
 * });
 *
 * // Info
 * showToast({
 *   type: 'info',
 *   message: 'New friend request',
 *   description: 'Sarah wants to connect'
 * });
 * ```
 */
export function showToast(options: ToastOptions): void {
  const { type, message, description, action, duration = 4000, disableHaptics = false } = options;

  // Trigger haptic feedback based on toast type
  if (!disableHaptics) {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'info':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }

  // Show the toast
  Toast.show({
    type,
    text1: message,
    text2: description,
    visibilityTime: duration,
    props: {
      onRetry: action?.onPress,
      retryLabel: action?.label,
    },
    onPress: () => Toast.hide(),
  });
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Show a success toast (green)
 */
export function showSuccessToast(message: string, description?: string) {
  showToast({ type: 'success', message, description });
}

/**
 * Show an error toast (coral red)
 */
export function showErrorToast(message: string, description?: string, action?: ToastAction) {
  showToast({ type: 'error', message, description, action });
}

/**
 * Show an info toast (lavender)
 */
export function showInfoToast(message: string, description?: string) {
  showToast({ type: 'info', message, description });
}

/**
 * Hide any currently visible toast
 */
export function hideToast() {
  Toast.hide();
}

// =============================================================================
// EXAMPLES
// =============================================================================

/**
 * Example usage patterns:
 *
 * @example Basic success
 * showSuccessToast('Profile updated!');
 *
 * @example Success with description
 * showSuccessToast('Content sent!', 'Your doodle was delivered to 3 friends');
 *
 * @example Error with retry action
 * showErrorToast(
 *   'Upload failed',
 *   'Check your internet connection',
 *   { label: 'Retry', onPress: () => uploadAgain() }
 * );
 *
 * @example Info notification
 * showInfoToast('Friend request', 'Sarah wants to connect with you');
 *
 * @example Custom duration
 * showToast({
 *   type: 'info',
 *   message: 'Quick tip',
 *   description: 'Swipe to dismiss',
 *   duration: 2000
 * });
 *
 * @example Disable haptics (for rapid-fire toasts)
 * showToast({
 *   type: 'info',
 *   message: 'Processing...',
 *   disableHaptics: true
 * });
 */

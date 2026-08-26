/**
 * Push Notifications Hook for Loop
 *
 * Handles permission requests, token registration, and notification listeners.
 * Implements requirements: NOTIF-01 through NOTIF-05
 *
 * NOTE: expo-notifications requires EAS build. In dev client without EAS build,
 * notifications functionality is disabled with a warning.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationType, ContentTypeForNotification } from '@/lib/notifications';
import { logger } from '@/lib/logger';

// Lazy-load native modules to avoid crash when not available
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let notificationsModuleAvailable = false;

async function getNotificationsModule() {
  const isTest = process.env.NODE_ENV === 'test';
  if (Notifications !== null && !isTest) {
    return { Notifications, Device, available: notificationsModuleAvailable };
  }

  try {
    Notifications = require('expo-notifications') as typeof import('expo-notifications');
    Device = require('expo-device') as typeof import('expo-device');
    // Test if it works
    await Notifications.getPermissionsAsync();
    notificationsModuleAvailable = true;
    logger.debug('Notifications native module available', { action: 'getNotificationsModule' });
  } catch (error) {
    Notifications = null;
    Device = null;
    notificationsModuleAvailable = false;
    logger.warn('Notifications native module not available (requires EAS build) - notifications disabled', { action: 'getNotificationsModule' });
  }

  return { Notifications, Device, available: notificationsModuleAvailable };
}

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationData {
  type: NotificationType;
  // Friend request
  friendId?: string;
  friendName?: string;
  avatarUrl?: string;
  // Content received
  contentId?: string;
  contentType?: ContentTypeForNotification;
  senderName?: string;
  senderId?: string;
  // Game
  gameId?: string;
  opponentId?: string;
  opponentName?: string;
  gameType?: string;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface UseNotificationsOptions {
  /** Callback when a notification is received while app is foregrounded */
  onNotificationReceived?: (notification: any) => void;
  /** Callback when user taps on a notification */
  onNotificationResponse?: (data: NotificationData) => void;
}

export interface UseNotificationsReturn {
  /** Current permission status */
  permissionStatus: PermissionStatus;
  /** Whether we can ask for permissions again */
  canAskAgain: boolean;
  /** Expo push token for remote notifications */
  expoPushToken: string | null;
  /** Current badge count */
  badgeCount: number;
  /** Any error that occurred */
  error: string | null;
  /** Whether the hook is initializing */
  isLoading: boolean;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Set badge count */
  setBadgeCount: (count: number) => Promise<void>;
  /** Clear badge count */
  clearBadgeCount: () => Promise<void>;
  /** Increment badge count by 1 */
  incrementBadgeCount: () => Promise<void>;
}

// =============================================================================
// NOTIFICATION HANDLER CONFIGURATION
// =============================================================================

// Configure how notifications are handled when app is in foreground
// NOTE: This is called lazily when the module is available
let notificationHandlerConfigured = false;

async function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;

  const { Notifications: NotifModule, available } = await getNotificationsModule();
  if (!NotifModule || !available) return;

  NotifModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  notificationHandlerConfigured = true;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { onNotificationReceived, onNotificationResponse } = options;
  const { user } = useAuthStore();

  // State
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [badgeCount, setBadgeCountState] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleAvailable, setModuleAvailable] = useState(false);

  // Refs for listener subscriptions
  const notificationReceivedRef = useRef<any>(null);
  const notificationResponseRef = useRef<any>(null);

  // =============================================================================
  // PERMISSION HANDLING
  // =============================================================================

  /**
   * Check current permission status
   */
  const checkPermissions = useCallback(async (): Promise<void> => {
    try {
      const { Notifications: NotifModule, available } = await getNotificationsModule();
      if (!NotifModule || !available) {
        setError('Notifications not available (requires EAS build)');
        return;
      }

      const { status, canAskAgain: canAsk } = await NotifModule.getPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
      setCanAskAgain(canAsk);
    } catch (err) {
      logger.error('Failed to check notification permissions', { action: 'checkPermissions' }, err);
      setError('Failed to check notification permissions');
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { Notifications: NotifModule, Device: DeviceModule, available } = await getNotificationsModule();
      if (!NotifModule || !DeviceModule || !available) {
        setError('Notifications not available (requires EAS build)');
        return false;
      }

      // Check if we're on a physical device
      if (!DeviceModule.isDevice) {
        setError('Push notifications require a physical device');
        return false;
      }

      const { status, canAskAgain: canAsk } = await NotifModule.requestPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
      setCanAskAgain(canAsk);

      return status === 'granted';
    } catch (err) {
      logger.error('Failed to request notification permissions', { action: 'requestPermissions' }, err);
      setError('Failed to request notification permissions');
      return false;
    }
  }, []);

  // =============================================================================
  // TOKEN REGISTRATION
  // =============================================================================

  /**
   * Get and store the Expo push token
   */
  const registerForPushNotifications = useCallback(async (): Promise<void> => {
    try {
      const { Notifications: NotifModule, Device: DeviceModule, available } = await getNotificationsModule();
      if (!NotifModule || !DeviceModule || !available) {
        return;
      }

      // Skip if not on a physical device
      if (!DeviceModule.isDevice) {
        logger.debug('Push notifications require a physical device', { action: 'registerForPushNotifications' });
        return;
      }

      // Check permissions first
      const { status } = await NotifModule.getPermissionsAsync();
      if (status !== 'granted') {
        logger.debug('Notification permissions not granted', { action: 'registerForPushNotifications' });
        return;
      }

      // Get Expo push token
      const tokenData = await NotifModule.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      setExpoPushToken(tokenData.data);
      setError(null);
    } catch (err) {
      logger.error('Failed to get push token', { action: 'registerForPushNotifications' }, err);
      setError('Failed to register for push notifications');
      setExpoPushToken(null);
    }
  }, []);

  // =============================================================================
  // BADGE MANAGEMENT
  // =============================================================================

  /**
   * Set badge count on app icon
   */
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    try {
      const { Notifications: NotifModule, available } = await getNotificationsModule();
      if (!NotifModule || !available) return;

      await NotifModule.setBadgeCountAsync(count);
      setBadgeCountState(count);
    } catch (err) {
      logger.error('Failed to set badge count', { action: 'setBadgeCount', metadata: { count } }, err);
    }
  }, []);

  /**
   * Clear badge count
   */
  const clearBadgeCount = useCallback(async (): Promise<void> => {
    await setBadgeCount(0);
  }, [setBadgeCount]);

  /**
   * Increment badge count by 1
   */
  const incrementBadgeCount = useCallback(async (): Promise<void> => {
    try {
      const { Notifications: NotifModule, available } = await getNotificationsModule();
      if (!NotifModule || !available) return;

      const currentCount = await NotifModule.getBadgeCountAsync();
      await NotifModule.setBadgeCountAsync(currentCount + 1);
      setBadgeCountState(currentCount + 1);
    } catch (err) {
      logger.error('Failed to increment badge count', { action: 'incrementBadgeCount' }, err);
    }
  }, []);

  // =============================================================================
  // NOTIFICATION LISTENERS
  // =============================================================================

  /**
   * Setup notification listeners
   */
  useEffect(() => {
    let mounted = true;

    const setupListeners = (NotifModule: typeof import('expo-notifications')) => {
      if (!mounted) return;

      // Listener for notifications received while app is foregrounded
      notificationReceivedRef.current = NotifModule.addNotificationReceivedListener(
        (notification) => {
          onNotificationReceived?.(notification);
        }
      );

      // Listener for when user taps on notification
      notificationResponseRef.current = NotifModule.addNotificationResponseReceivedListener(
        (response) => {
          const rawData = response.notification.request.content.data as Record<string, unknown>;
          // Ensure type field exists before casting
          if (rawData && typeof rawData.type === 'string') {
            const data = rawData as unknown as NotificationData;
            onNotificationResponse?.(data);
          }
        }
      );
    };

    if (process.env.NODE_ENV === 'test') {
      try {
        const NotifModule = require('expo-notifications') as typeof import('expo-notifications');
        setupListeners(NotifModule);
      } catch {
        // Ignore if mock not available
      }
    } else {
      (async () => {
        const { Notifications: NotifModule, available } = await getNotificationsModule();
        if (!NotifModule || !available || !mounted) return;
        setupListeners(NotifModule);
      })();
    }

    // Cleanup
    return () => {
      mounted = false;
      notificationReceivedRef.current?.remove();
      notificationResponseRef.current?.remove();
    };
  }, [onNotificationReceived, onNotificationResponse]);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      // Check permissions
      await checkPermissions();

      const { Notifications: NotifModule, available } = await getNotificationsModule();

      if (NotifModule && available) {
        // Setup Android notification channel
        if (process.env.EXPO_OS === 'android') {
          await NotifModule.setNotificationChannelAsync('default', {
            name: 'default',
            importance: NotifModule.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B6B', // Coral from design system
          });
        }

        // Get initial badge count
        try {
          const count = await NotifModule.getBadgeCountAsync();
          setBadgeCountState(count);
        } catch (err) {
          logger.error('Failed to get badge count', { action: 'initialize' }, err);
        }
      }

      setIsLoading(false);
    };

    initialize();
  }, [checkPermissions]);

  /**
   * Register for push when permissions are granted
   */
  useEffect(() => {
    if (permissionStatus === 'granted') {
      registerForPushNotifications();
    }
  }, [permissionStatus, registerForPushNotifications]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    permissionStatus,
    canAskAgain,
    expoPushToken,
    badgeCount,
    error,
    isLoading,
    requestPermissions,
    setBadgeCount,
    clearBadgeCount,
    incrementBadgeCount,
  };
}

// Re-export types for convenience
export type { NotificationType, ContentTypeForNotification };

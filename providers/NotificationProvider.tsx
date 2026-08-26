/**
 * Notification Provider for Loop
 *
 * Provides notification context throughout the app and handles
 * navigation based on notification responses.
 */

import React, { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotifications, NotificationData, PermissionStatus } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/authStore';
import { useFriendsStore } from '@/stores/friendsStore';
import { useContentStore } from '@/stores/contentStore';
import { useGameStore } from '@/stores/gameStore';
import * as Haptics from 'expo-haptics';

// =============================================================================
// TYPES
// =============================================================================

interface NotificationContextValue {
  /** Current permission status */
  permissionStatus: PermissionStatus;
  /** Whether we can ask for permissions again */
  canAskAgain: boolean;
  /** Expo push token */
  expoPushToken: string | null;
  /** Current badge count */
  badgeCount: number;
  /** Any error that occurred */
  error: string | null;
  /** Whether notifications are loading */
  isLoading: boolean;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Set badge count */
  setBadgeCount: (count: number) => Promise<void>;
  /** Clear badge count */
  clearBadgeCount: () => Promise<void>;
  /** Increment badge count */
  incrementBadgeCount: () => Promise<void>;
  /** Whether notifications are enabled */
  isEnabled: boolean;
}

interface NotificationProviderProps {
  children: ReactNode;
}

// =============================================================================
// CONTEXT
// =============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Hook to access notification context
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { pendingRequests } = useFriendsStore();
  const { getUnviewedCount } = useContentStore();
  const { getMyTurnGames } = useGameStore();

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      // Trigger haptic feedback for foreground notifications
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Log for debugging
      console.log('Notification received:', notification.request.content);
    },
    []
  );

  /**
   * Handle notification response (user tapped on notification)
   */
  const handleNotificationResponse = useCallback(
    (data: NotificationData) => {
      if (!data?.type) return;

      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Navigate based on notification type
      switch (data.type) {
        case 'friend_request':
          // Navigate to friends tab
          router.push('/(tabs)/friends');
          break;

        case 'content_received':
          // Navigate to home feed
          router.push('/(tabs)');
          break;

        case 'game_invite':
        case 'game_turn':
          // Navigate to the specific game
          if (data.gameId) {
            router.push(`/game/${data.gameId}`);
          }
          break;

        default:
          // Navigate to home
          router.push('/(tabs)');
      }
    },
    []
  );

  // Initialize notifications hook with handlers
  const {
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
  } = useNotifications({
    onNotificationReceived: handleNotificationReceived,
    onNotificationResponse: handleNotificationResponse,
  });

  /**
   * Update badge count based on unread items
   * Badge = unviewed content + pending friend requests + games where it's your turn
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateBadge = async () => {
      const unviewedContent = getUnviewedCount();
      const pendingFriendRequests = pendingRequests.length;
      const myTurnGames = getMyTurnGames(user.id).length;

      const totalBadge = unviewedContent + pendingFriendRequests + myTurnGames;

      // Only update if changed
      if (totalBadge !== badgeCount) {
        await setBadgeCount(totalBadge);
      }
    };

    updateBadge();
  }, [
    isAuthenticated,
    user,
    getUnviewedCount,
    pendingRequests.length,
    getMyTurnGames,
    badgeCount,
    setBadgeCount,
  ]);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const contextValue: NotificationContextValue = {
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
    isEnabled: permissionStatus === 'granted',
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

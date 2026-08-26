/**
 * Push Notification Utilities for Loop
 *
 * Handles local notification scheduling, badge management, and notification content generation.
 * Implements requirements: NOTIF-01 through NOTIF-05
 */

import * as Notifications from 'expo-notifications';
import { logger } from './logger';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType =
  | 'friend_request'
  | 'content_received'
  | 'game_invite'
  | 'game_turn';

export type ContentTypeForNotification = 'doodle' | 'photo' | 'mood' | 'voice' | 'game';

export interface FriendRequestNotificationData {
  friendId: string;
  friendName: string;
  avatarUrl?: string;
}

export interface ContentReceivedNotificationData {
  contentId: string;
  contentType: ContentTypeForNotification;
  senderName: string;
  senderId: string;
}

export interface GameNotificationData {
  gameId: string;
  opponentId: string;
  opponentName: string;
  gameType: 'tictactoe';
}

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data: { type: NotificationType } & Record<string, unknown>;
  delaySeconds?: number;
  sound?: boolean;
}

export interface NotificationContent {
  title: string;
  body: string;
}

// =============================================================================
// NOTIFICATION CONTENT TEMPLATES
// =============================================================================

const contentTypeLabels: Record<ContentTypeForNotification, { title: string; action: string }> = {
  doodle: { title: 'New Doodle', action: 'sent you a doodle' },
  photo: { title: 'New Photo', action: 'sent you a photo' },
  mood: { title: 'New Mood Update', action: 'shared their mood with you' },
  voice: { title: 'New Voice Note', action: 'sent you a voice note' },
  game: { title: 'New Game', action: 'wants to play a game' },
};

const gameTypeLabels: Record<string, string> = {
  tictactoe: 'Tic-Tac-Toe',
};

/**
 * Get notification content based on type and parameters
 */
export function getNotificationContent(
  type: NotificationType,
  params: Record<string, unknown>
): NotificationContent {
  switch (type) {
    case 'friend_request':
      return {
        title: 'New Friend Request',
        body: `${params.friendName || 'Someone'} wants to be your friend`,
      };

    case 'content_received': {
      const contentType = params.contentType as ContentTypeForNotification;
      const labels = contentTypeLabels[contentType] || { title: 'New Content', action: 'sent you something' };
      return {
        title: labels.title,
        body: `${params.senderName || 'Someone'} ${labels.action}`,
      };
    }

    case 'game_invite': {
      const gameLabel = gameTypeLabels[(params.gameType as string) || 'tictactoe'] || 'a game';
      return {
        title: 'Game Invite',
        body: `${params.opponentName || 'Someone'} wants to play ${gameLabel} with you`,
      };
    }

    case 'game_turn': {
      const gameLabel = gameTypeLabels[(params.gameType as string) || 'tictactoe'] || 'the game';
      return {
        title: "It's Your Turn!",
        body: `${params.opponentName || 'Someone'} made a move in ${gameLabel}`,
      };
    }

    default:
      return {
        title: 'Loop',
        body: 'You have a new notification',
      };
  }
}

// =============================================================================
// LOCAL NOTIFICATION SCHEDULING
// =============================================================================

/**
 * Schedule a local notification
 * Returns notification ID or null if failed
 */
export async function scheduleLocalNotification(
  options: LocalNotificationOptions
): Promise<string | null> {
  try {
    const { title, body, data, delaySeconds, sound = true } = options;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound,
      },
      trigger: delaySeconds
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
        : null,
    });

    return notificationId;
  } catch (error) {
    logger.error('Failed to schedule notification', { action: 'scheduleLocalNotification' }, error);
    return null;
  }
}

/**
 * Schedule a friend request notification (NOTIF-01)
 */
export async function scheduleFriendRequestNotification(
  data: FriendRequestNotificationData
): Promise<string | null> {
  const content = getNotificationContent('friend_request', { friendName: data.friendName });

  return scheduleLocalNotification({
    title: content.title,
    body: content.body,
    data: {
      type: 'friend_request',
      friendId: data.friendId,
      friendName: data.friendName,
      avatarUrl: data.avatarUrl,
    },
  });
}

/**
 * Schedule a content received notification (NOTIF-02)
 */
export async function scheduleContentReceivedNotification(
  data: ContentReceivedNotificationData
): Promise<string | null> {
  const content = getNotificationContent('content_received', {
    senderName: data.senderName,
    contentType: data.contentType,
  });

  return scheduleLocalNotification({
    title: content.title,
    body: content.body,
    data: {
      type: 'content_received',
      contentId: data.contentId,
      contentType: data.contentType,
      senderName: data.senderName,
      senderId: data.senderId,
    },
  });
}

/**
 * Schedule a game invite notification (NOTIF-03)
 */
export async function scheduleGameInviteNotification(
  data: GameNotificationData
): Promise<string | null> {
  const content = getNotificationContent('game_invite', {
    opponentName: data.opponentName,
    gameType: data.gameType,
  });

  return scheduleLocalNotification({
    title: content.title,
    body: content.body,
    data: {
      type: 'game_invite',
      gameId: data.gameId,
      opponentId: data.opponentId,
      opponentName: data.opponentName,
      gameType: data.gameType,
    },
  });
}

/**
 * Schedule a game turn notification (NOTIF-04)
 */
export async function scheduleGameTurnNotification(
  data: GameNotificationData
): Promise<string | null> {
  const content = getNotificationContent('game_turn', {
    opponentName: data.opponentName,
    gameType: data.gameType,
  });

  return scheduleLocalNotification({
    title: content.title,
    body: content.body,
    data: {
      type: 'game_turn',
      gameId: data.gameId,
      opponentId: data.opponentId,
      opponentName: data.opponentName,
      gameType: data.gameType,
    },
  });
}

// =============================================================================
// BADGE MANAGEMENT (NOTIF-05)
// =============================================================================

/**
 * Set the app icon badge count
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    logger.error('Failed to set badge count', { action: 'setBadgeCount', metadata: { count } }, error);
    return false;
  }
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    logger.error('Failed to get badge count', { action: 'getBadgeCount' }, error);
    return 0;
  }
}

/**
 * Clear the badge count
 */
export async function clearBadgeCount(): Promise<boolean> {
  return setBadgeCount(0);
}

/**
 * Increment the badge count by 1
 */
export async function incrementBadgeCount(): Promise<boolean> {
  try {
    const currentCount = await getBadgeCount();
    return setBadgeCount(currentCount + 1);
  } catch (error) {
    logger.error('Failed to increment badge count', { action: 'incrementBadgeCount' }, error);
    return false;
  }
}

// =============================================================================
// NOTIFICATION MANAGEMENT
// =============================================================================

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    logger.error('Failed to cancel notifications', { action: 'cancelAllNotifications' }, error);
  }
}

/**
 * Widget Data Sync Utility
 * Syncs app data to the iOS widget via App Groups
 *
 * Architecture:
 * React Native App -> syncWidgetData() -> App Groups UserDefaults -> Swift Widget
 *
 * Data Structure:
 * - widget_friends_list.json: List of friends for widget picker
 * - widget_friend_{id}.json: Per-friend data (content, games, unread count)
 * - widgetData: Legacy aggregated data (for backwards compatibility)
 */

import { Platform } from 'react-native';
import WidgetSyncNative, {
  setWidgetData,
  getWidgetData,
  reloadAllTimelines,
  isWidgetSyncAvailable,
  WIDGET_KEYS,
} from '@/modules/widget-sync';
import { logger } from './logger';

// ============================================================
// Type Definitions
// ============================================================

/**
 * Per-friend widget data (stored in App Groups)
 * Key format: widget_friend_{friendId}
 */
export interface FriendWidgetData {
  friendId: string;
  friendName: string;
  friendAvatar: string;

  // Latest content from this friend
  latestContent: {
    id: string;
    type: 'doodle' | 'photo' | 'mood' | 'voice' | 'game';
    thumbnailUrl?: string;
    moodEmoji?: string;
    voiceDuration?: number;
    timestamp: string;
  } | null;

  // Active game with this friend (if any)
  activeGame: {
    id: string;
    board: string[]; // 9-cell array ('X', 'O', or '')
    isYourTurn: boolean;
  } | null;

  // Unread count from this friend
  unreadCount: number;

  // Last sync timestamp
  lastSyncAt: string;
}

/**
 * Friends list for widget picker
 * Key: widget_friends_list
 */
export interface FriendsListData {
  friends: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  lastSyncAt: string;
}

/**
 * Legacy widget data (for backwards compatibility with existing widget)
 * Key: widgetData
 */
export interface LegacyWidgetData {
  latestContent: WidgetContent[];
  currentMood?: string;
  moodNote?: string;
  friendCount: number;
  unreadCount: number;
  lastUpdated: string;
}

/**
 * Content item format for widget display
 */
export interface WidgetContent {
  id: string;
  type: 'doodle' | 'mood' | 'photo' | 'voice' | 'game';
  senderName: string;
  senderAvatar?: string;
  emoji?: string;
  note?: string;
  imageUrl?: string;
  createdAt: string;
}

/**
 * Global widget settings (applies to all widget instances)
 */
export interface WidgetSettings {
  themeId: 'coral' | 'lavender' | 'lime' | 'gold' | 'minimal' | 'dark';
  styleId: 'standard' | 'compact' | 'full';
  updatedAt: string;
}

// Re-export for backwards compatibility
export type WidgetData = LegacyWidgetData;

// ============================================================
// Debug flag
// ============================================================

const DEBUG = __DEV__;

function log(message: string, data?: Record<string, unknown>) {
  if (DEBUG) {
    logger.debug(message, { action: 'widgetSync' }, data);
  }
}

// ============================================================
// Per-Friend Data Sync (NEW - Phase 1)
// ============================================================

/**
 * Sync data for a single friend to the widget
 */
export async function syncFriendWidgetData(data: FriendWidgetData): Promise<boolean> {
  if (Platform.OS !== 'ios' || !isWidgetSyncAvailable()) {
    log('Not available - skipping sync');
    return false;
  }

  const key = `${WIDGET_KEYS.FRIEND_DATA_PREFIX}${data.friendId}`;

  try {
    const success = await setWidgetData(key, data);
    log(`Synced friend ${data.friendId}`, {
      hasContent: !!data.latestContent,
      hasGame: !!data.activeGame,
      unread: data.unreadCount,
    });
    return success;
  } catch (error) {
    logger.error('syncFriendWidgetData failed', { action: 'syncFriendWidgetData', metadata: { friendId: data.friendId } }, error);
    return false;
  }
}

/**
 * Sync the friends list for widget picker
 */
export async function syncFriendsList(data: FriendsListData): Promise<boolean> {
  if (Platform.OS !== 'ios' || !isWidgetSyncAvailable()) {
    return false;
  }

  try {
    const success = await setWidgetData(WIDGET_KEYS.FRIENDS_LIST, data);
    log('Synced friends list', { count: data.friends.length });
    return success;
  } catch (error) {
    logger.error('syncFriendsList failed', { action: 'syncFriendsList', metadata: { friendCount: data.friends.length } }, error);
    return false;
  }
}

/**
 * Get friend widget data (for debugging)
 */
export async function getFriendWidgetData(friendId: string): Promise<FriendWidgetData | null> {
  const key = `${WIDGET_KEYS.FRIEND_DATA_PREFIX}${friendId}`;
  return getWidgetData<FriendWidgetData>(key);
}

/**
 * Get friends list (for debugging)
 */
export async function getFriendsList(): Promise<FriendsListData | null> {
  return getWidgetData<FriendsListData>(WIDGET_KEYS.FRIENDS_LIST);
}

/**
 * Sync global widget settings (theme + layout style)
 */
export async function syncWidgetSettings(settings: WidgetSettings): Promise<boolean> {
  if (Platform.OS !== 'ios' || !isWidgetSyncAvailable()) {
    return false;
  }

  try {
    const success = await setWidgetData(WIDGET_KEYS.SETTINGS, settings);
    log('Synced widget settings', settings as unknown as Record<string, unknown>);
    return success;
  } catch (error) {
    logger.error('syncWidgetSettings failed', { action: 'syncWidgetSettings' }, error);
    return false;
  }
}

/**
 * Get global widget settings (for UI or debugging)
 */
export async function getWidgetSettings(): Promise<WidgetSettings | null> {
  return getWidgetData<WidgetSettings>(WIDGET_KEYS.SETTINGS);
}

// ============================================================
// Legacy Aggregated Data Sync (Backwards Compatible)
// ============================================================

/**
 * Sync aggregated data to the widget (legacy format)
 * This maintains compatibility with the existing Swift widget
 */
export async function syncWidgetData(data: LegacyWidgetData): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    if (isWidgetSyncAvailable()) {
      // Use native module to write to App Groups
      await setWidgetData(WIDGET_KEYS.LEGACY_WIDGET_DATA, data);
      log('Synced legacy widget data', {
        contentCount: data.latestContent.length,
        mood: data.currentMood,
        friends: data.friendCount,
        unread: data.unreadCount,
      });
    } else {
      // Native module not available (development/Expo Go)
      log('Native module not available - data prepared but not written', {
        contentCount: data.latestContent.length,
        mood: data.currentMood,
        friends: data.friendCount,
        unread: data.unreadCount,
      });
    }
  } catch (error) {
    logger.error('syncWidgetData failed', { action: 'syncWidgetData' }, error);
  }
}

// ============================================================
// Widget Timeline Reload
// ============================================================

/**
 * Request widget timeline reload
 * Call WidgetKit.reloadAllTimelines() to refresh widgets
 */
export async function reloadWidgetTimelines(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    if (isWidgetSyncAvailable()) {
      await reloadAllTimelines();
      log('Timeline reload requested');
    } else {
      log('Timeline reload requested (native module not available)');
    }
  } catch (error) {
    logger.error('Timeline reload failed', { action: 'reloadWidgetTimelines' }, error);
  }
}

// ============================================================
// Data Formatting Helpers
// ============================================================

/**
 * Format app content for widget display
 * Takes the most recent 5 items and formats them for the widget
 */
export function formatContentForWidget(content: any[]): WidgetContent[] {
  return content.slice(0, 5).map((item) => ({
    id: item.id,
    type: item.type,
    senderName: item.senderName || item.sender?.displayName || 'Unknown',
    senderAvatar: item.senderAvatar || item.sender?.avatarUrl,
    emoji: item.emoji || (item.type === 'mood' ? item.content : undefined),
    note: item.note || item.caption,
    imageUrl: item.imageUrl || item.mediaUrl,
    createdAt: item.createdAt,
  }));
}

/**
 * Create empty widget data for initialization
 */
export function createEmptyWidgetData(): LegacyWidgetData {
  return {
    latestContent: [],
    currentMood: undefined,
    moodNote: 'Open Loop to get started',
    friendCount: 0,
    unreadCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Create empty friend widget data
 */
export function createEmptyFriendWidgetData(
  friendId: string,
  friendName: string,
  friendAvatar: string = ''
): FriendWidgetData {
  return {
    friendId,
    friendName,
    friendAvatar,
    latestContent: null,
    activeGame: null,
    unreadCount: 0,
    lastSyncAt: new Date().toISOString(),
  };
}

// ============================================================
// Batch Sync Helper
// ============================================================

/**
 * Sync all friends data at once
 * Call this when app comes to foreground or after bulk updates
 */
export async function syncAllFriendsData(
  friendsData: FriendWidgetData[],
  friendsList: FriendsListData
): Promise<void> {
  if (Platform.OS !== 'ios' || !isWidgetSyncAvailable()) {
    log('Batch sync skipped - not available');
    return;
  }

  try {
    // Sync friends list first
    await syncFriendsList(friendsList);

    // Sync each friend's data in parallel
    await Promise.all(friendsData.map((data) => syncFriendWidgetData(data)));

    // Reload widget timelines after all data is synced
    await reloadWidgetTimelines();

    log('Batch sync complete', { friendCount: friendsData.length });
  } catch (error) {
    logger.error('Batch sync failed', { action: 'syncAllFriendsData', metadata: { friendCount: friendsData.length } }, error);
  }
}

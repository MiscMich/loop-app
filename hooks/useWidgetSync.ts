/**
 * Widget Sync Hook
 * Automatically syncs app state to iOS widget via App Groups
 *
 * Features:
 * - Per-friend widget data (Phase 1)
 * - Legacy aggregated data (backwards compatible)
 * - App foreground sync
 * - Content change sync
 *
 * Note: Full functionality requires EAS Build with dev client.
 * The widget reads data from the example app group's shared UserDefaults suite.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { useContentStore, type Content } from '@/stores/contentStore';
import { useFriendsStore, type Friend } from '@/stores/friendsStore';
import { useGameStore, type TicTacToeGame } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/lib/logger';
import {
  syncWidgetData,
  syncAllFriendsData,
  reloadWidgetTimelines,
  formatContentForWidget,
  type WidgetData,
  type FriendWidgetData,
  type FriendsListData,
} from '@/lib/widgetSync';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get the latest content from a specific friend
 */
function getLatestContentFromFriend(
  feed: Content[],
  friendId: string
): FriendWidgetData['latestContent'] {
  const friendContent = feed.filter((item) => item.senderId === friendId);

  if (friendContent.length === 0) {
    return null;
  }

  // Sort by createdAt descending and get the most recent
  const latest = friendContent.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return {
    id: latest.id,
    type: latest.type,
    thumbnailUrl:
      latest.type === 'doodle' || latest.type === 'photo'
        ? (latest as any).imageUrl
        : undefined,
    moodEmoji: latest.type === 'mood' ? (latest as any).emoji : undefined,
    voiceDuration: latest.type === 'voice' ? (latest as any).duration : undefined,
    timestamp: latest.createdAt,
  };
}

/**
 * Get active game with a specific friend
 */
function getActiveGameWithFriend(
  games: TicTacToeGame[],
  friendId: string,
  currentUserId: string
): FriendWidgetData['activeGame'] {
  // Find active game where friend is a player
  const activeGame = games.find(
    (game) =>
      game.status === 'active' &&
      (game.player1Id === friendId || game.player2Id === friendId)
  );

  if (!activeGame) {
    return null;
  }

  // Convert board cells to strings ('X', 'O', or '')
  const boardStrings = activeGame.board.map((cell) => cell ?? '');

  return {
    id: activeGame.id,
    board: boardStrings,
    isYourTurn: activeGame.currentTurn === currentUserId,
  };
}

/**
 * Count unread content from a specific friend
 */
function getUnreadCountFromFriend(feed: Content[], friendId: string): number {
  return feed.filter(
    (item) => item.senderId === friendId && !item.viewedAt
  ).length;
}

/**
 * Build per-friend widget data for all friends
 */
function buildFriendsWidgetData(
  friends: Friend[],
  feed: Content[],
  games: TicTacToeGame[],
  currentUserId: string
): FriendWidgetData[] {
  return friends.map((friend) => ({
    friendId: friend.id,
    friendName: friend.displayName || friend.username,
    friendAvatar: friend.avatarUrl || '',
    latestContent: getLatestContentFromFriend(feed, friend.id),
    activeGame: getActiveGameWithFriend(games, friend.id, currentUserId),
    unreadCount: getUnreadCountFromFriend(feed, friend.id),
    lastSyncAt: new Date().toISOString(),
  }));
}

/**
 * Build friends list for widget picker
 */
function buildFriendsList(friends: Friend[]): FriendsListData {
  return {
    friends: friends.map((friend) => ({
      id: friend.id,
      name: friend.displayName || friend.username,
      avatar: friend.avatarUrl || '',
    })),
    lastSyncAt: new Date().toISOString(),
  };
}

// ============================================================
// Main Hook
// ============================================================

/**
 * Hook to automatically sync widget data when app state changes
 */
export function useWidgetSync() {
  const { feed, currentMood } = useContentStore();
  const { friends } = useFriendsStore();
  const { activeGames } = useGameStore();
  const { user } = useAuthStore();

  // Memoize the current user ID
  const currentUserId = useMemo(() => user?.id || '', [user?.id]);

  /**
   * Sync per-friend data to widget (NEW - Phase 1)
   */
  const syncPerFriendData = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    if (!currentUserId) return;

    // Build per-friend widget data
    const friendsWidgetData = buildFriendsWidgetData(
      friends,
      feed,
      activeGames,
      currentUserId
    );

    // Build friends list for picker
    const friendsList = buildFriendsList(friends);

    // Sync all data to widget
    await syncAllFriendsData(friendsWidgetData, friendsList);
  }, [friends, feed, activeGames, currentUserId]);

  /**
   * Sync legacy aggregated data to widget (backwards compatible)
   */
  const syncLegacyData = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    // Calculate unread count (content from last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentContent = feed.filter((item) => item.createdAt > oneDayAgo);

    const widgetData: WidgetData = {
      latestContent: formatContentForWidget(feed),
      currentMood: currentMood?.emoji,
      moodNote: currentMood?.note,
      friendCount: friends.length,
      unreadCount: recentContent.length,
      lastUpdated: new Date().toISOString(),
    };

    await syncWidgetData(widgetData);
  }, [feed, currentMood, friends]);

  /**
   * Combined sync function - syncs both per-friend and legacy data
   */
  const syncToWidget = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    // Run both syncs in parallel
    await Promise.all([syncPerFriendData(), syncLegacyData()]);

    // Reload widget timelines after all data is synced
    await reloadWidgetTimelines();
  }, [syncPerFriendData, syncLegacyData]);

  // Sync when state changes
  useEffect(() => {
    syncToWidget();
  }, [syncToWidget]);

  // Return sync functions for manual/imperative use
  return {
    syncToWidget,
    syncPerFriendData,
    syncLegacyData,
  };
}

// ============================================================
// Foreground Sync Hook
// ============================================================

/**
 * Hook to sync widget on app foreground
 * Use this in your root layout or App component
 */
export function useWidgetSyncOnForeground() {
  const { syncToWidget } = useWidgetSync();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Sync on mount
    syncToWidget();

    // Sync when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - sync widget data
        syncToWidget();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncToWidget]);
}

// ============================================================
// Content-Specific Sync Hooks
// ============================================================

/**
 * Hook to sync widget when specific content is added
 * Use this after creating new content
 */
export function useSyncOnContentCreate() {
  const { syncToWidget } = useWidgetSync();

  return useCallback(
    async (contentType: 'doodle' | 'photo' | 'mood' | 'voice' | 'game') => {
      // Sync immediately after content creation
      await syncToWidget();

      logger.debug(`Synced widget after creating ${contentType}`, { action: 'syncOnContentCreate', metadata: { contentType } });
    },
    [syncToWidget]
  );
}

/**
 * Hook to sync widget after game move
 * Use this in the game screen after a move is made
 */
export function useSyncOnGameMove() {
  const { syncToWidget } = useWidgetSync();

  return useCallback(
    async (gameId: string) => {
      // Sync immediately after game move
      await syncToWidget();

      logger.debug(`Synced widget after game move in ${gameId}`, { action: 'syncOnGameMove', metadata: { gameId } });
    },
    [syncToWidget]
  );
}

/**
 * SkeletonGameBoard - Loading skeleton for game play screen
 * Matches tic-tac-toe board layout
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBase, SkeletonCircle } from './SkeletonBase';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';

interface SkeletonGameBoardProps {
  style?: ViewStyle;
}

export function SkeletonGameBoard({ style }: SkeletonGameBoardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Game Header - Players */}
      <View style={styles.playersRow}>
        <SkeletonPlayer isActive />
        <SkeletonBase width={40} height={20} borderRadius={4} />
        <SkeletonPlayer />
      </View>

      {/* Status bar */}
      <SkeletonBase
        width={180}
        height={24}
        borderRadius={borderRadius.md}
        style={styles.statusBar}
      />

      {/* Game Board - 3x3 grid */}
      <View style={styles.board}>
        {Array.from({ length: 3 }).map((_, row) => (
          <View key={row} style={styles.boardRow}>
            {Array.from({ length: 3 }).map((_, col) => (
              <SkeletonCell key={`${row}-${col}`} />
            ))}
          </View>
        ))}
      </View>

      {/* Action button */}
      <SkeletonBase
        width={200}
        height={52}
        borderRadius={borderRadius.pill}
        style={styles.actionButton}
      />
    </View>
  );
}

/**
 * Player indicator skeleton
 */
function SkeletonPlayer({
  isActive = false,
  style,
}: {
  isActive?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.player, isActive && styles.activePlayer, style]}>
      <SkeletonCircle size={48} />
      <View style={styles.playerInfo}>
        <SkeletonBase width={60} height={14} borderRadius={4} />
        <SkeletonBase width={20} height={20} borderRadius={4} style={styles.playerSymbol} />
      </View>
    </View>
  );
}

/**
 * Board cell skeleton
 */
function SkeletonCell({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.cell, style]}>
      <SkeletonBase width={50} height={50} borderRadius={borderRadius.md} />
    </View>
  );
}

/**
 * Game list skeleton (for selecting games)
 */
export function SkeletonGameList({
  count = 3,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonGameItem
          key={index}
          style={index > 0 ? styles.gameItemSpacing : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Game list item skeleton
 */
function SkeletonGameItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.gameItem, style]}>
      {/* Players */}
      <View style={styles.gameItemPlayers}>
        <SkeletonCircle size={40} />
        <SkeletonBase width={24} height={12} borderRadius={4} style={styles.vsText} />
        <SkeletonCircle size={40} />
      </View>

      {/* Status */}
      <View style={styles.gameItemStatus}>
        <SkeletonBase width={80} height={14} borderRadius={4} />
        <SkeletonBase width={60} height={11} borderRadius={4} style={styles.gameTime} />
      </View>

      {/* Action */}
      <SkeletonBase width={32} height={32} borderRadius={16} />
    </View>
  );
}

/**
 * Friend selection skeleton (for starting new game)
 */
export function SkeletonFriendSelection({
  count = 4,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      <SkeletonBase width={140} height={20} borderRadius={4} style={styles.sectionTitle} />
      <View style={styles.friendsGrid}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.friendOption}>
            <SkeletonCircle size={64} />
            <SkeletonBase width={60} height={12} borderRadius={4} style={styles.friendName} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  player: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.secondary,
  },
  activePlayer: {
    backgroundColor: colors.primary.light + '20',
  },
  playerInfo: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  playerSymbol: {
    marginTop: 4,
  },
  statusBar: {
    marginTop: spacing.xl,
  },
  board: {
    marginTop: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius['2xl'],
    padding: spacing.md,
    ...shadows.md,
  },
  boardRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  actionButton: {
    marginTop: spacing.xl,
  },
  gameItemSpacing: {
    marginTop: spacing.sm,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  gameItemPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsText: {
    marginHorizontal: spacing.sm,
  },
  gameItemStatus: {
    flex: 1,
    marginLeft: spacing.md,
  },
  gameTime: {
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  friendsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  friendOption: {
    alignItems: 'center',
    width: 80,
  },
  friendName: {
    marginTop: spacing.sm,
  },
});

export default SkeletonGameBoard;

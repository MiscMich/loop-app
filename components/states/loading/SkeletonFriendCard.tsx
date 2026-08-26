/**
 * SkeletonFriendCard - Loading skeleton for friend list items
 * Matches FriendCard layout exactly
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBase, SkeletonCircle } from './SkeletonBase';
import { colors, borderRadius, spacing } from '@/lib/theme';

interface SkeletonFriendCardProps {
  style?: ViewStyle;
  showStatus?: boolean;
}

export function SkeletonFriendCard({
  style,
  showStatus = true,
}: SkeletonFriendCardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <SkeletonCircle size={52} />

      {/* Name + Username */}
      <View style={styles.textContainer}>
        <SkeletonBase width={100} height={16} borderRadius={4} />
        <SkeletonBase width={70} height={12} borderRadius={4} style={styles.username} />
      </View>

      {/* Status indicator or action */}
      {showStatus && (
        <SkeletonBase width={32} height={32} borderRadius={16} />
      )}
    </View>
  );
}

/**
 * Search bar skeleton
 */
export function SkeletonSearchBar({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.searchBar, style]}>
      <SkeletonBase width={20} height={20} borderRadius={4} />
      <SkeletonBase width="70%" height={16} borderRadius={4} style={styles.searchText} />
    </View>
  );
}

/**
 * Friend request card skeleton
 */
export function SkeletonFriendRequest({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.requestContainer, style]}>
      <SkeletonCircle size={48} />
      <View style={styles.requestText}>
        <SkeletonBase width={90} height={14} borderRadius={4} />
        <SkeletonBase width={120} height={11} borderRadius={4} style={styles.requestMessage} />
      </View>
      <View style={styles.requestActions}>
        <SkeletonBase width={70} height={32} borderRadius={16} />
        <SkeletonBase width={70} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

/**
 * Multiple friend card skeletons for list
 */
export function SkeletonFriendsList({
  count = 5,
  showSearch = true,
  style,
}: {
  count?: number;
  showSearch?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {showSearch && <SkeletonSearchBar style={styles.searchSpacing} />}
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonFriendCard
          key={index}
          style={index > 0 ? styles.listSpacing : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  username: {
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.pill,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchText: {
    marginLeft: spacing.md,
  },
  searchSpacing: {
    marginBottom: spacing.md,
  },
  listSpacing: {
    marginTop: spacing.sm,
  },
  requestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  requestText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestMessage: {
    marginTop: 4,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default SkeletonFriendCard;

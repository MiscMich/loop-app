/**
 * SkeletonContentCard - Loading skeleton for content feed cards
 * Matches ContentCard layout exactly
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBase, SkeletonText, SkeletonCircle, SkeletonRect } from './SkeletonBase';
import { colors, borderRadius, spacing, shadows } from '@/lib/theme';

interface SkeletonContentCardProps {
  style?: ViewStyle;
  showImage?: boolean;
}

export function SkeletonContentCard({
  style,
  showImage = true,
}: SkeletonContentCardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Header: Avatar + Name + Time */}
      <View style={styles.header}>
        <SkeletonCircle size={44} />
        <View style={styles.headerText}>
          <SkeletonBase width={120} height={14} borderRadius={4} />
          <SkeletonBase width={60} height={10} borderRadius={4} style={styles.timeBar} />
        </View>
      </View>

      {/* Content Image */}
      {showImage && (
        <SkeletonRect
          width="100%"
          height={200}
          borderRadius={borderRadius.xl}
          style={styles.image}
        />
      )}

      {/* Caption Text */}
      <SkeletonText lines={2} lineHeight={14} gap={6} style={styles.caption} />

      {/* Reaction Bar */}
      <View style={styles.reactions}>
        <SkeletonBase width={80} height={28} borderRadius={14} />
        <SkeletonBase width={60} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

/**
 * Multiple content card skeletons for feed
 */
export function SkeletonFeed({
  count = 3,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonContentCard
          key={index}
          style={index > 0 ? styles.feedSpacing : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  timeBar: {
    marginTop: 6,
  },
  image: {
    marginTop: spacing.md,
  },
  caption: {
    marginTop: spacing.md,
  },
  reactions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  feedSpacing: {
    marginTop: spacing.md,
  },
});

export default SkeletonContentCard;

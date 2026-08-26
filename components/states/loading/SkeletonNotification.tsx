/**
 * SkeletonNotification - Loading skeleton for activity notifications
 * Matches notification row layout
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkeletonBase, SkeletonCircle } from './SkeletonBase';
import { colors, borderRadius, spacing } from '@/lib/theme';

interface SkeletonNotificationProps {
  style?: ViewStyle;
  showThumbnail?: boolean;
}

export function SkeletonNotification({
  style,
  showThumbnail = true,
}: SkeletonNotificationProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon circle */}
      <SkeletonBase width={44} height={44} borderRadius={14} />

      {/* Text content */}
      <View style={styles.textContainer}>
        <SkeletonBase width="80%" height={15} borderRadius={4} />
        <SkeletonBase width="50%" height={11} borderRadius={4} style={styles.subtitle} />
      </View>

      {/* Thumbnail or indicator */}
      {showThumbnail && (
        <SkeletonBase width={44} height={44} borderRadius={borderRadius.md} />
      )}
    </View>
  );
}

/**
 * Notification type card skeleton (for the types list)
 */
export function SkeletonNotificationType({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.typeContainer, style]}>
      <SkeletonBase width={44} height={44} borderRadius={14} />
      <SkeletonBase width="60%" height={15} borderRadius={4} style={styles.typeText} />
      <SkeletonBase width={32} height={32} borderRadius={16} />
    </View>
  );
}

/**
 * Multiple notification skeletons for activity feed
 */
export function SkeletonActivityFeed({
  count = 6,
  style,
}: {
  count?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonNotification
          key={index}
          style={index > 0 ? styles.listSpacing : undefined}
        />
      ))}
    </View>
  );
}

/**
 * Activity screen skeleton with header and types
 */
export function SkeletonActivityScreen({ style }: { style?: ViewStyle }) {
  return (
    <View style={style}>
      {/* Empty state placeholder (shows when no notifications) */}
      <View style={styles.emptyPlaceholder}>
        <SkeletonCircle size={96} />
        <SkeletonBase width={140} height={24} borderRadius={4} style={styles.emptyTitle} />
        <SkeletonBase width={200} height={14} borderRadius={4} style={styles.emptySubtitle} />
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <SkeletonBase width={120} height={11} borderRadius={4} />
        <View style={styles.dividerLine} />
      </View>

      {/* Notification types */}
      <View style={styles.typesList}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonNotificationType
            key={index}
            style={index > 0 ? styles.listSpacing : undefined}
          />
        ))}
      </View>
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
    marginHorizontal: spacing.md,
  },
  subtitle: {
    marginTop: 6,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  typeText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listSpacing: {
    marginTop: spacing.sm,
  },
  emptyPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.md,
  },
  typesList: {
    paddingHorizontal: spacing.lg,
  },
});

export default SkeletonNotification;

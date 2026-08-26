/**
 * EmptyState - Premium empty state component
 * Warm Sunrise Design System
 *
 * Features:
 * - Gradient icon circles with glow effects
 * - Friendly, encouraging copy
 * - Optional action button with spring animation
 * - Staggered entrance animations
 * - Subtle floating animation on icon
 * - Floating decorative blobs for visual interest
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { type SFSymbol } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { PillButton } from '@/components/ui/PillButton';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { colors, typography, spacing, shadows, borderRadius } from '@/lib/theme';
import { EmptyType, EMPTY_COPY } from '../types';

interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: SFSymbol;
  style?: ViewStyle;
  compact?: boolean;
  /** Enable floating animation on icon */
  animated?: boolean;
}

// Gradient colors for each empty type
const EMPTY_GRADIENTS: Record<EmptyType, readonly [string, string]> = {
  feed: colors.primary.gradient,
  friends: colors.accent.gradient,
  activity: colors.success.gradient,
  search: [colors.neutral[300], colors.neutral[500]] as const,
  games: colors.primary.gradient,
};

// Shadow styles for each empty type
const EMPTY_SHADOWS: Record<EmptyType, object> = {
  feed: shadows.primaryGlow,
  friends: shadows.accentGlow,
  activity: shadows.successGlow,
  search: shadows.md,
  games: shadows.primaryGlow,
};

// SF Symbol icons for each empty type (mapping from Ionicons)
const EMPTY_ICONS: Record<EmptyType, SFSymbol> = {
  feed: 'sparkles',
  friends: 'person.2',
  activity: 'checkmark.circle',
  search: 'magnifyingglass',
  games: 'gamecontroller',
};

export function EmptyState({
  type = 'feed',
  title,
  message,
  onAction,
  actionLabel,
  icon,
  style,
  compact = false,
  animated = true,
}: EmptyStateProps) {
  // Get copy based on type
  const defaultCopy = EMPTY_COPY[type];

  const displayTitle = title ?? defaultCopy.title;
  const displayMessage = message ?? defaultCopy.message;
  const displayActionLabel = actionLabel ?? defaultCopy.actionLabel;
  const displayIcon = icon ?? EMPTY_ICONS[type];
  const gradientColors = EMPTY_GRADIENTS[type];
  const shadowStyle = EMPTY_SHADOWS[type];

  // Floating animation for icon
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        false
      );
    }
  }, [animated]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  // Map EmptyType to FloatingDecorations preset
  const decorationPreset = type === 'feed' ? 'feed'
    : type === 'friends' ? 'friends'
    : type === 'activity' ? 'activity'
    : 'default';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).delay(100)}
      style={[styles.container, compact && styles.compactContainer, style]}
    >
      {/* Floating Decorative Blobs */}
      {!compact && animated && (
        <FloatingDecorations preset={decorationPreset} animated={animated} />
      )}

      {/* Icon Circle with Gradient, Glow, and Float */}
      <Animated.View
        entering={FadeIn.delay(150)}
        style={[
          styles.iconContainer,
          compact && styles.compactIcon,
          shadowStyle,
          animated && floatStyle,
        ]}
      >
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <SafeSymbol
            name={displayIcon}
            size={compact ? 32 : 48}
            tintColor={colors.text.inverse}
          />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(250).springify()}
        style={[styles.title, compact && styles.compactTitle]}
      >
        {displayTitle}
      </Animated.Text>

      {/* Message */}
      <Animated.Text
        entering={FadeInDown.delay(350).springify()}
        style={[styles.message, compact && styles.compactMessage]}
      >
        {displayMessage}
      </Animated.Text>

      {/* Action Button */}
      {onAction && displayActionLabel && (
        <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.buttonContainer}>
          <PillButton
            title={displayActionLabel}
            onPress={handleAction}
            variant="primary"
            accessibilityLabel={`${displayActionLabel} button`}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Empty feed state with sparkles icon
 */
export function EmptyFeed({
  onAction,
  style,
}: {
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <EmptyState
      type="feed"
      onAction={onAction}
      style={style}
    />
  );
}

/**
 * Empty friends list state
 */
export function EmptyFriends({
  onAction,
  style,
}: {
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <EmptyState
      type="friends"
      onAction={onAction}
      style={style}
    />
  );
}

/**
 * All caught up activity state - celebratory!
 */
export function EmptyActivity({ style }: { style?: ViewStyle }) {
  return (
    <EmptyState
      type="activity"
      style={style}
      animated={true}
    />
  );
}

/**
 * No search results state
 */
export function EmptySearch({
  onAction,
  searchTerm,
  style,
}: {
  onAction?: () => void;
  searchTerm?: string;
  style?: ViewStyle;
}) {
  const message = searchTerm
    ? `No results found for "${searchTerm}"`
    : EMPTY_COPY.search.message;

  return (
    <EmptyState
      type="search"
      message={message}
      onAction={onAction}
      style={style}
      compact
      animated={false}
    />
  );
}

/**
 * No active games state
 */
export function EmptyGames({
  onAction,
  style,
}: {
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <EmptyState
      type="games"
      onAction={onAction}
      style={style}
    />
  );
}

/**
 * Inline empty hint (smaller, for sections within screens)
 */
export function EmptyHint({
  icon,
  message,
  style,
}: {
  icon: SFSymbol;
  message: string;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(200)}
      style={[styles.hint, style]}
    >
      <View style={styles.hintIconContainer}>
        <SafeSymbol name={icon} size={20} tintColor={colors.text.tertiary} />
      </View>
      <Text style={styles.hintText}>{message}</Text>
    </Animated.View>
  );
}

/**
 * Celebration empty state (for achievements, completions)
 */
export function EmptyCelebration({
  title = 'Amazing!',
  message,
  style,
}: {
  title?: string;
  message: string;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      style={[styles.celebrationContainer, style]}
    >
      <Animated.View
        entering={FadeIn.delay(150)}
        style={[styles.celebrationIcon, shadows.successGlow]}
      >
        <LinearGradient
          colors={colors.success.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <SafeSymbol name="trophy.fill" size={48} tintColor={colors.text.inverse} />
        </LinearGradient>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(250).springify()}
        style={styles.celebrationTitle}
      >
        {title}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(350).springify()}
        style={styles.celebrationMessage}
      >
        {message}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['2xl'],
  },
  compactContainer: {
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  compactIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.md,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.DEFAULT,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  compactTitle: {
    fontSize: typography.fontSize.headline,
  },
  message: {
    fontSize: typography.fontSize.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  compactMessage: {
    fontSize: typography.fontSize.subheadline,
    marginBottom: spacing.md,
    maxWidth: 240,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  // Hint styles
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
  },
  hintIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  hintText: {
    fontSize: typography.fontSize.subheadline,
    color: colors.text.tertiary,
    textAlign: 'center',
    flex: 1,
  },
  // Celebration styles
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['2xl'],
  },
  celebrationIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  celebrationTitle: {
    fontSize: typography.fontSize.title1,
    fontWeight: typography.fontWeight.bold,
    color: colors.success.DEFAULT,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  celebrationMessage: {
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    maxWidth: 280,
  },
});

export default EmptyState;

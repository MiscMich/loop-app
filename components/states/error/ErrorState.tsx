/**
 * ErrorState - Premium error state component
 * Warm Sunrise Design System
 *
 * Features:
 * - Multiple error types (network, permission, generic, profile)
 * - Shake animation on icon for emphasis
 * - Coral gradient icon circle with glow
 * - Retry action with PillButton
 * - Spring entrance animation with staggered children
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Linking, ViewStyle, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PillButton } from '@/components/ui/PillButton';
import { colors, typography, spacing, shadows, borderRadius, gradients } from '@/lib/theme';
import {
  ErrorType,
  PermissionType,
  ERROR_COPY,
  PERMISSION_COPY,
} from '../types';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  permissionType?: PermissionType;
  style?: ViewStyle;
  /** Show shake animation on mount */
  shake?: boolean;
}

const ERROR_ICONS: Record<ErrorType, SFSymbol> = {
  network: 'wifi',
  permission: 'lock',
  generic: 'exclamationmark.circle',
  profile: 'person',
};

// Gradient colors for each error type
const ERROR_GRADIENTS: Record<ErrorType, readonly [string, string]> = {
  network: colors.primary.gradient,
  permission: colors.accent.gradient,
  generic: colors.primary.gradient,
  profile: [colors.warning, colors.celebration.goldDark] as const,
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  retryLabel,
  permissionType,
  style,
  shake = true,
}: ErrorStateProps) {
  // Get copy based on type
  const defaultCopy = type === 'permission' && permissionType
    ? PERMISSION_COPY[permissionType]
    : ERROR_COPY[type];

  const displayTitle = title ?? defaultCopy.title;
  const displayMessage = message ?? defaultCopy.message;
  const displayRetryLabel = retryLabel ?? (type === 'permission' ? 'Open Settings' : 'Try Again');
  const icon = ERROR_ICONS[type];
  const gradientColors = ERROR_GRADIENTS[type];

  // Shake animation value
  const shakeValue = useSharedValue(0);

  useEffect(() => {
    if (shake) {
      // Trigger shake after entrance animation
      shakeValue.value = withDelay(
        400,
        withSequence(
          withTiming(1, { duration: 80, easing: Easing.linear }),
          withTiming(-1, { duration: 80, easing: Easing.linear }),
          withTiming(0.5, { duration: 80, easing: Easing.linear }),
          withTiming(-0.5, { duration: 80, easing: Easing.linear }),
          withTiming(0, { duration: 80, easing: Easing.linear })
        )
      );
      // Haptic feedback with shake
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 400);
    }
  }, [shake]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shakeValue.value, [-1, 0, 1], [-8, 0, 8]) },
      { rotate: `${interpolate(shakeValue.value, [-1, 0, 1], [-3, 0, 3])}deg` },
    ],
  }));

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === 'permission') {
      // Open app settings for permission errors
      Linking.openSettings();
    } else if (onRetry) {
      onRetry();
    }
  };

  // Get shadow style based on error type
  const getIconShadow = () => {
    switch (type) {
      case 'permission':
        return shadows.accentGlow;
      case 'profile':
        return {
          shadowColor: colors.warning,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        };
      default:
        return shadows.primaryGlow;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).delay(100)}
      style={[styles.container, style]}
    >
      {/* Icon Circle with Gradient and Shake */}
      <Animated.View
        entering={FadeIn.delay(150)}
        style={[styles.iconContainer, getIconShadow(), shakeStyle]}
      >
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <SafeSymbol name={icon} size={44} tintColor={colors.text.inverse} />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.delay(250).springify()}
        style={styles.title}
      >
        {displayTitle}
      </Animated.Text>

      {/* Message */}
      <Animated.Text
        entering={FadeInDown.delay(350).springify()}
        style={styles.message}
      >
        {displayMessage}
      </Animated.Text>

      {/* Retry Button */}
      {(onRetry || type === 'permission') && (
        <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.buttonContainer}>
          <PillButton
            title={displayRetryLabel}
            onPress={handleRetry}
            variant="primary"
            accessibilityLabel={`${displayRetryLabel} button`}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Network-specific error state
 */
export function NetworkError({
  onRetry,
  style,
  title,
  message,
}: {
  onRetry?: () => void;
  style?: ViewStyle;
  title?: string;
  message?: string;
}) {
  return (
    <ErrorState
      type="network"
      title={title}
      message={message}
      onRetry={onRetry}
      style={style}
    />
  );
}

/**
 * Permission-specific error state
 */
export function PermissionError({
  permissionType,
  style,
}: {
  permissionType: PermissionType;
  style?: ViewStyle;
}) {
  return (
    <ErrorState
      type="permission"
      permissionType={permissionType}
      style={style}
    />
  );
}

/**
 * Inline error banner (smaller, for within screens)
 */
export function ErrorBanner({
  message,
  onDismiss,
  onRetry,
  style,
}: {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  style?: ViewStyle;
}) {
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(20)}
      style={[styles.banner, style]}
    >
      <View style={styles.bannerIcon}>
        <SafeSymbol name="exclamationmark.circle.fill" size={20} tintColor={colors.primary.DEFAULT} />
      </View>
      <Text style={styles.bannerText} numberOfLines={2}>
        {message}
      </Text>
      {onRetry && (
        <Pressable onPress={handleRetry} hitSlop={8}>
          <SafeSymbol
            name="arrow.clockwise"
            size={20}
            tintColor={colors.primary.DEFAULT}
            style={styles.bannerAction}
          />
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={handleDismiss} hitSlop={8}>
          <SafeSymbol
            name="xmark"
            size={20}
            tintColor={colors.text.tertiary}
            style={styles.bannerAction}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

/**
 * Minimal inline error text
 */
export function ErrorText({
  message,
  style,
}: {
  message: string;
  style?: ViewStyle;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.errorTextContainer, style]}
    >
      <SafeSymbol name="exclamationmark.circle.fill" size={14} tintColor={colors.primary.DEFAULT} />
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.lg,
    overflow: 'hidden',
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
  message: {
    fontSize: typography.fontSize.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.fontSize.body * typography.lineHeight.normal,
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  // Banner styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT + '12',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.DEFAULT,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.fontSize.subheadline,
    color: colors.text.DEFAULT,
    lineHeight: typography.fontSize.subheadline * typography.lineHeight.normal,
  },
  bannerAction: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  // Inline error text
  errorTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.caption1,
    color: colors.primary.DEFAULT,
  },
});

export default ErrorState;

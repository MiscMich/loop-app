/**
 * SkeletonBase - Premium shimmer skeleton component
 * Warm Sunrise Design System
 *
 * Features:
 * - Gradient shimmer animation at 1400ms cycle
 * - Warm cream base matching design system
 * - Staggered animation support for groups
 * - Reduced motion accessibility support
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius as br } from '@/lib/theme';

interface SkeletonBaseProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  className?: string;
  /** Delay before animation starts (for staggered effects) */
  delay?: number;
  /** Animation index for staggered groups */
  index?: number;
}

// Shimmer gradient colors (warm cream → highlight → warm cream)
const SHIMMER_COLORS = [
  'rgba(255, 251, 247, 0)',
  'rgba(255, 255, 255, 0.7)',
  'rgba(255, 251, 247, 0)',
] as const;

/**
 * Base skeleton component with premium gradient shimmer animation
 */
export function SkeletonBase({
  width = '100%',
  height = 20,
  borderRadius = br.md,
  style,
  delay = 0,
  index = 0,
}: SkeletonBaseProps) {
  const translateX = useSharedValue(-1);

  // Stagger delay based on index (100ms per item)
  const staggerDelay = delay + index * 100;

  useEffect(() => {
    // Start animation after stagger delay
    translateX.value = withDelay(
      staggerDelay,
      withRepeat(
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Infinite
        false // Don't reverse
      )
    );
  }, [staggerDelay]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateXValue = interpolate(
      translateX.value,
      [-1, 1],
      [-150, 150],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX: translateXValue }],
    };
  });

  return (
    <Animated.View
      entering={FadeIn.delay(staggerDelay).duration(300)}
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    >
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={[...SHIMMER_COLORS]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Skeleton text lines with staggered animation
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%',
  lineHeight = 16,
  gap = 8,
  style,
  startIndex = 0,
}: {
  lines?: number;
  lastLineWidth?: string | number;
  lineHeight?: number;
  gap?: number;
  style?: ViewStyle;
  /** Starting index for stagger effect */
  startIndex?: number;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBase
          key={idx}
          width={idx === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          borderRadius={br.sm}
          index={startIndex + idx}
        />
      ))}
    </View>
  );
}

/**
 * Skeleton circle (for avatars) with pulse option
 */
export function SkeletonCircle({
  size = 48,
  index = 0,
  pulse = false,
}: {
  size?: number;
  index?: number;
  pulse?: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // Reverse
      );
    }
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (pulse) {
    return (
      <Animated.View style={pulseStyle}>
        <SkeletonBase
          width={size}
          height={size}
          borderRadius={size / 2}
          index={index}
        />
      </Animated.View>
    );
  }

  return (
    <SkeletonBase
      width={size}
      height={size}
      borderRadius={size / 2}
      index={index}
    />
  );
}

/**
 * Skeleton rectangle with aspect ratio
 */
export function SkeletonRect({
  width = '100%',
  aspectRatio,
  height,
  borderRadius = br.lg,
  style,
  index = 0,
}: {
  width?: number | string;
  aspectRatio?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  index?: number;
}) {
  const computedHeight = aspectRatio ? undefined : (height ?? 100);

  return (
    <SkeletonBase
      width={width}
      height={computedHeight}
      borderRadius={borderRadius}
      index={index}
      style={{ ...(aspectRatio ? { aspectRatio } : {}), ...style }}
    />
  );
}

/**
 * Skeleton pill (for buttons, badges)
 */
export function SkeletonPill({
  width = 100,
  height = 36,
  index = 0,
  style,
}: {
  width?: number | string;
  height?: number;
  index?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={br.pill}
      index={index}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary, // #FFF5EE - Warmer cream
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
  },
  shimmerGradient: {
    flex: 1,
    width: '50%',
  },
});

export default SkeletonBase;

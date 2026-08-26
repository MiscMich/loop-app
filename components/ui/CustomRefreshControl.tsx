/**
 * CustomRefreshControl - Premium pull-to-refresh with coral animation
 * Warm Sunrise Design System
 *
 * Features:
 * - Custom animated refresh indicator in coral color
 * - Spinning loop icon animation
 * - Pulsing glow effect
 * - Smooth pull-down reveal animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, RefreshControl, RefreshControlProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, Loader } from 'lucide-react-native';
import { colors, animation } from '@/lib/theme';

interface CustomRefreshControlProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
  refreshing: boolean;
  onRefresh: () => void;
  /** Pull progress (0-1) for custom animation */
  pullProgress?: number;
}

/**
 * Animated refresh indicator that shows during pull-to-refresh
 */
export function RefreshIndicator({
  isRefreshing,
  pullProgress = 0,
}: {
  isRefreshing: boolean;
  pullProgress?: number;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Start/stop spin animation based on refreshing state
  useEffect(() => {
    if (isRefreshing) {
      // Spin animation
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1, // Infinite
        false
      );

      // Pulse scale
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Glow animation
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        false
      );

      // Show indicator
      scale.value = withSpring(1, animation.springs.bouncy);
    } else {
      // Stop all animations
      cancelAnimation(rotation);
      cancelAnimation(pulseScale);
      cancelAnimation(glowOpacity);

      rotation.value = withTiming(0, { duration: 200 });
      pulseScale.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0, animation.springs.snappy);
    }
  }, [isRefreshing]);

  // Animate scale based on pull progress when not refreshing
  useEffect(() => {
    if (!isRefreshing && pullProgress > 0) {
      scale.value = withSpring(
        Math.min(pullProgress, 1),
        animation.springs.responsive
      );
    }
  }, [pullProgress, isRefreshing]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 0.5, 1], [0, 0.5, 1], Extrapolation.CLAMP),
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulseScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.3 }],
  }));

  return (
    <Animated.View style={[styles.indicatorContainer, containerStyle]}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={[colors.primary.DEFAULT, 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Spinner */}
      <Animated.View style={[styles.spinner, spinnerStyle]}>
        <LinearGradient
          colors={[colors.primary.DEFAULT, colors.primary.light]}
          style={styles.spinnerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <RefreshCw size={24} color={colors.text.inverse} strokeWidth={2.5} />
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Loop-branded refresh control wrapper
 * Uses native RefreshControl with custom tint
 */
export function CustomRefreshControl({
  refreshing,
  onRefresh,
  ...props
}: CustomRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary.DEFAULT}
      colors={[colors.primary.DEFAULT, colors.primary.light]}
      progressBackgroundColor={colors.surface.DEFAULT}
      {...props}
    />
  );
}

/**
 * Premium animated refresh header for custom implementations
 * Use this with Animated.ScrollView for full control
 */
export function AnimatedRefreshHeader({
  isRefreshing,
  pullDistance,
  threshold = 80,
}: {
  isRefreshing: boolean;
  pullDistance: number;
  threshold?: number;
}) {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withSpring(1, animation.springs.bouncy);
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(progress, animation.springs.responsive);
    }
  }, [isRefreshing, progress]);

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      pullDistance,
      [0, threshold],
      [0, threshold],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(
      pullDistance,
      [0, threshold * 0.5, threshold],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${isRefreshing ? rotation.value : progress * 180}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.refreshHeader, headerStyle]}>
      <Animated.View style={[styles.refreshIconContainer, iconStyle]}>
        <LinearGradient
          colors={[colors.primary.DEFAULT, colors.primary.light]}
          style={styles.refreshIconBg}
        >
          {isRefreshing ? (
            <Loader size={20} color={colors.text.inverse} strokeWidth={2.5} />
          ) : (
            <RefreshCw size={20} color={colors.text.inverse} strokeWidth={2.5} />
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 36,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  spinnerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  refreshHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  refreshIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  refreshIconBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

export default CustomRefreshControl;

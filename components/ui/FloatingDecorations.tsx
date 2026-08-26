/**
 * FloatingDecorations - Animated decorative elements for empty states
 * Warm Sunrise Design System
 *
 * Features:
 * - Floating/pulsing decorative blobs (simpler than website morphing blobs)
 * - Multiple preset configurations
 * - Subtle movement animations
 * - Reduced motion support
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  useReducedMotion,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';

type DecorationPreset = 'feed' | 'friends' | 'activity' | 'default';

interface FloatingDecorationProps {
  /** Decoration style preset */
  preset?: DecorationPreset;
  /** Enable animations */
  animated?: boolean;
  /** Container style */
  style?: ViewStyle;
}

interface BlobConfig {
  size: number;
  position: { top?: number | string; bottom?: number | string; left?: number | string; right?: number | string };
  colors: readonly [string, string];
  delay: number;
  duration: number;
  floatDistance: number;
  opacity: number;
}

// Preset configurations
const PRESETS: Record<DecorationPreset, BlobConfig[]> = {
  feed: [
    {
      size: 120,
      position: { top: '10%', right: -30 },
      colors: ['rgba(255, 107, 107, 0.15)', 'rgba(255, 142, 142, 0.08)'],
      delay: 0,
      duration: 4000,
      floatDistance: 10,
      opacity: 0.6,
    },
    {
      size: 80,
      position: { top: '35%', left: -20 },
      colors: ['rgba(161, 168, 234, 0.12)', 'rgba(191, 196, 242, 0.06)'],
      delay: 500,
      duration: 5000,
      floatDistance: 8,
      opacity: 0.5,
    },
    {
      size: 60,
      position: { bottom: '20%', right: '15%' },
      colors: ['rgba(151, 220, 56, 0.1)', 'rgba(181, 232, 104, 0.05)'],
      delay: 1000,
      duration: 4500,
      floatDistance: 12,
      opacity: 0.4,
    },
  ],
  friends: [
    {
      size: 100,
      position: { top: '15%', left: -25 },
      colors: ['rgba(161, 168, 234, 0.18)', 'rgba(191, 196, 242, 0.08)'],
      delay: 0,
      duration: 5000,
      floatDistance: 8,
      opacity: 0.6,
    },
    {
      size: 70,
      position: { bottom: '25%', right: -15 },
      colors: ['rgba(255, 107, 107, 0.12)', 'rgba(255, 142, 142, 0.06)'],
      delay: 600,
      duration: 4500,
      floatDistance: 10,
      opacity: 0.5,
    },
  ],
  activity: [
    {
      size: 90,
      position: { top: '20%', right: -20 },
      colors: ['rgba(151, 220, 56, 0.15)', 'rgba(181, 232, 104, 0.08)'],
      delay: 0,
      duration: 4000,
      floatDistance: 8,
      opacity: 0.6,
    },
    {
      size: 65,
      position: { bottom: '30%', left: -15 },
      colors: ['rgba(255, 179, 71, 0.12)', 'rgba(255, 200, 120, 0.06)'],
      delay: 400,
      duration: 5000,
      floatDistance: 10,
      opacity: 0.5,
    },
  ],
  default: [
    {
      size: 100,
      position: { top: '15%', right: -25 },
      colors: ['rgba(255, 107, 107, 0.12)', 'rgba(255, 142, 142, 0.06)'],
      delay: 0,
      duration: 4500,
      floatDistance: 10,
      opacity: 0.5,
    },
    {
      size: 70,
      position: { bottom: '25%', left: -15 },
      colors: ['rgba(161, 168, 234, 0.1)', 'rgba(191, 196, 242, 0.05)'],
      delay: 500,
      duration: 5000,
      floatDistance: 8,
      opacity: 0.4,
    },
  ],
};

/**
 * Individual floating blob component
 */
function FloatingBlob({
  config,
  animated,
}: {
  config: BlobConfig;
  animated: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(config.opacity);

  const shouldAnimate = animated && !reducedMotion;

  useEffect(() => {
    if (!shouldAnimate) {
      translateY.value = 0;
      scale.value = 1;
      opacity.value = config.opacity;
      return;
    }

    // Float up and down
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(-config.floatDistance, {
            duration: config.duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(config.floatDistance, {
            duration: config.duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );

    // Subtle scale pulse
    scale.value = withDelay(
      config.delay + 200,
      withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: config.duration * 0.6,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: config.duration * 0.6,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    // Subtle opacity variation
    opacity.value = withDelay(
      config.delay + 100,
      withRepeat(
        withSequence(
          withTiming(config.opacity + 0.1, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(config.opacity - 0.05, {
            duration: config.duration * 0.5,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    );
  }, [shouldAnimate, config]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        config.position as ViewStyle,
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[...config.colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.blobGradient}
      />
    </Animated.View>
  );
}

/**
 * Container with floating decorative blobs
 */
export function FloatingDecorations({
  preset = 'default',
  animated = true,
  style,
}: FloatingDecorationProps) {
  const blobs = PRESETS[preset];

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {blobs.map((config, index) => (
        <FloatingBlob key={index} config={config} animated={animated} />
      ))}
    </View>
  );
}

/**
 * Single floating circle for simpler use cases
 */
export function FloatingCircle({
  size = 80,
  color = colors.primary.light,
  opacity = 0.15,
  position = { top: 0, right: 0 },
  animated = true,
  floatDistance = 8,
  duration = 4000,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  position?: { top?: number; bottom?: number; left?: number; right?: number };
  animated?: boolean;
  floatDistance?: number;
  duration?: number;
}) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!animated || reducedMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-floatDistance, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(floatDistance, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, [animated, reducedMotion, floatDistance, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          ...position,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

/**
 * Pulsing dot indicator
 */
export function PulsingDot({
  size = 12,
  color = colors.primary.DEFAULT,
  style,
}: {
  size?: number;
  color?: string;
  style?: ViewStyle;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    overflow: 'hidden',
  },
  blobGradient: {
    flex: 1,
    borderRadius: 9999,
  },
});

export default FloatingDecorations;

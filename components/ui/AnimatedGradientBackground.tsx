/**
 * AnimatedGradientBackground - Subtle animated background gradients
 * Warm Sunrise Design System
 *
 * Features:
 * - Very subtle color shift animation (won't distract from content)
 * - Multiple preset animations (sunrise, calm, energy)
 * - Smooth interpolation between gradient colors
 * - Reduced motion support
 */

import React, { useEffect, ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients as themeGradients } from '@/lib/theme';

type AnimationPreset = 'sunrise' | 'calm' | 'energy' | 'subtle' | 'none';

interface AnimatedGradientBackgroundProps {
  children: ReactNode;
  /** Animation preset */
  preset?: AnimationPreset;
  /** Animation duration in ms (full cycle) */
  duration?: number;
  /** Custom gradient colors (overrides preset) */
  colors?: readonly string[];
  /** Additional animated colors to shift between */
  animatedColors?: readonly string[];
  /** Gradient direction */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
}

// Preset configurations
const PRESETS: Record<AnimationPreset, {
  baseColors: readonly string[];
  shiftColors: readonly string[];
  duration: number;
}> = {
  sunrise: {
    baseColors: ['#FFFBF7', '#FFE4D6', '#FFD4C4'],
    shiftColors: ['#FFF8F2', '#FFE8DC', '#FFD8CA'],
    duration: 8000,
  },
  calm: {
    baseColors: ['#FFFBF7', '#F5F5FF', '#EEF0FF'],
    shiftColors: ['#FFF9F5', '#F8F8FF', '#F0F2FF'],
    duration: 10000,
  },
  energy: {
    baseColors: ['#FFFBF7', '#FFF0F0', '#FFE8E8'],
    shiftColors: ['#FFF8F5', '#FFF5F0', '#FFECE8'],
    duration: 6000,
  },
  subtle: {
    baseColors: ['#FFFBF7', '#FFF5EE', '#FFEEE5'],
    shiftColors: ['#FFFCF8', '#FFF7F0', '#FFF0E8'],
    duration: 12000,
  },
  none: {
    baseColors: ['#FFFBF7', '#FFF5EE', '#FFEEE5'],
    shiftColors: ['#FFFBF7', '#FFF5EE', '#FFEEE5'],
    duration: 0,
  },
};

/**
 * Animated gradient background with subtle color shifting
 */
export function AnimatedGradientBackground({
  children,
  preset = 'subtle',
  duration: customDuration,
  colors: customColors,
  animatedColors,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  style,
}: AnimatedGradientBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const config = PRESETS[preset];
  const baseDuration = customDuration ?? config.duration;
  const baseColors = customColors ?? config.baseColors;
  const shiftColors = animatedColors ?? config.shiftColors;

  // Animate progress value
  useEffect(() => {
    if (reducedMotion || preset === 'none' || baseDuration === 0) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: baseDuration / 2,
          easing: Easing.inOut(Easing.ease)
        }),
        withTiming(0, {
          duration: baseDuration / 2,
          easing: Easing.inOut(Easing.ease)
        })
      ),
      -1, // Infinite
      false
    );
  }, [preset, baseDuration, reducedMotion]);

  // We can't directly animate LinearGradient colors in React Native
  // So we use an overlay approach with opacity
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.3, // Very subtle - max 30% opacity
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      {/* Base gradient */}
      <LinearGradient
        colors={baseColors as unknown as readonly [string, string, ...string[]]}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated overlay gradient */}
      {preset !== 'none' && !reducedMotion && (
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          <LinearGradient
            colors={shiftColors as unknown as readonly [string, string, ...string[]]}
            start={start}
            end={end}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Content */}
      {children}
    </Animated.View>
  );
}

/**
 * Subtle pulsing background for emphasis areas
 */
export function PulsingBackground({
  children,
  color = colors.primary.light,
  intensity = 0.1,
  duration = 2000,
  style,
}: {
  children: ReactNode;
  color?: string;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0;
      return;
    }

    opacity.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [intensity, duration, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    backgroundColor: color,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]} />
      {children}
    </Animated.View>
  );
}

/**
 * Pre-configured sunrise animated background
 */
export function SunriseAnimatedBackground({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <AnimatedGradientBackground preset="sunrise" style={style}>
      {children}
    </AnimatedGradientBackground>
  );
}

/**
 * Pre-configured calm animated background
 */
export function CalmAnimatedBackground({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <AnimatedGradientBackground preset="calm" style={style}>
      {children}
    </AnimatedGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedGradientBackground;

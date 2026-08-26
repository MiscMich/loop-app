/**
 * GradientBackground - Warm Sunrise gradient background wrapper
 *
 * Features:
 * - Pre-defined gradient presets (sunrise, celebration, onboarding, coral, lavender)
 * - Full screen coverage with safe area support
 * - Custom gradient colors support
 */

import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '@/lib/theme';

type GradientPreset = keyof typeof gradients;

interface GradientBackgroundProps {
  children: ReactNode;
  preset?: GradientPreset;
  colors?: readonly string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  useSafeArea?: boolean;
}

export function GradientBackground({
  children,
  preset = 'sunrise',
  colors: customColors,
  locations,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  style,
  useSafeArea = false,
}: GradientBackgroundProps) {
  const insets = useSafeAreaInsets();

  // Use custom colors or preset
  const gradientColors = customColors || gradients[preset];

  // Default locations spread evenly
  const defaultLocations = gradientColors.map(
    (_, index) => index / (gradientColors.length - 1)
  );

  const safeAreaStyle = useSafeArea
    ? {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    : {};

  return (
    <LinearGradient
      colors={gradientColors as unknown as readonly [string, string, ...string[]]}
      locations={(locations || defaultLocations) as unknown as readonly [number, number, ...number[]]}
      start={start}
      end={end}
      style={[styles.container, safeAreaStyle, style]}
    >
      {children}
    </LinearGradient>
  );
}

// Pre-configured gradient components for convenience
export function SunriseBackground({
  children,
  style,
  useSafeArea,
}: Omit<GradientBackgroundProps, 'preset'>) {
  return (
    <GradientBackground preset="sunrise" style={style} useSafeArea={useSafeArea}>
      {children}
    </GradientBackground>
  );
}

export function OnboardingBackground({
  children,
  style,
  useSafeArea,
}: Omit<GradientBackgroundProps, 'preset'>) {
  return (
    <GradientBackground preset="onboarding" style={style} useSafeArea={useSafeArea}>
      {children}
    </GradientBackground>
  );
}

export function CelebrationBackground({
  children,
  style,
  useSafeArea,
}: Omit<GradientBackgroundProps, 'preset'>) {
  return (
    <GradientBackground preset="celebration" style={style} useSafeArea={useSafeArea}>
      {children}
    </GradientBackground>
  );
}

export function CoralBackground({
  children,
  style,
  useSafeArea,
}: Omit<GradientBackgroundProps, 'preset'>) {
  return (
    <GradientBackground preset="coral" style={style} useSafeArea={useSafeArea}>
      {children}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;

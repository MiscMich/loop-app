/**
 * GlassCard - iOS 26 Liquid Glass card component
 *
 * Features:
 * - iOS 26 native liquid glass effect via expo-glass-effect (official Expo package)
 * - Automatic fallback to expo-blur for older iOS versions and Android
 * - Subtle border with transparency
 * - Proper React Native shadows (NOT CSS boxShadow!)
 * - Performance optimized (limit 3-4 per screen)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { GlassStyle } from 'expo-glass-effect';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius } from '@/lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  /** Blur intensity for fallback BlurView (0-100). Default: 80 */
  intensity?: number;
  /** Tint color for blur effect. 'default' follows theme. */
  tint?: 'light' | 'dark' | 'default';
  /** Tailwind class names */
  className?: string;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Remove default padding */
  noPadding?: boolean;
  /** Use native liquid glass on iOS 26+ (default: true) */
  useLiquidGlass?: boolean;
  /** Glass effect style: 'regular' (default) or 'clear' */
  glassStyle?: GlassStyle;
  /** Tint color for glass effect */
  glassTintColor?: string;
  /** Whether glass effect is interactive */
  isInteractive?: boolean;
  /** Accessibility role */
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'text' | 'adjustable' | 'header' | 'summary' | 'imagebutton';
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function GlassCard({
  children,
  intensity = 80,
  tint = 'light',
  className = '',
  style,
  noPadding = false,
  useLiquidGlass = true,
  glassStyle = 'regular',
  glassTintColor,
  isInteractive = false,
  accessibilityRole,
  accessibilityLabel,
}: GlassCardProps) {
  const { isDark, colors } = useTheme();
  const actualTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;

  // Determine if we should use liquid glass
  // Only available on iOS 26+ when explicitly enabled
  const platform = Platform.OS;
  const shouldUseLiquidGlass =
    useLiquidGlass &&
    platform === 'ios' &&
    isLiquidGlassAvailable();

  // Compute tint color for glass effect
  const computedGlassTintColor =
    glassTintColor ??
    (isDark ? 'rgba(30, 30, 46, 0.15)' : 'rgba(255, 255, 255, 0.15)');

  // Use iOS 26 Liquid Glass if available and requested
  if (shouldUseLiquidGlass) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        tintColor={computedGlassTintColor}
        isInteractive={isInteractive}
        style={[styles.liquidGlassContainer, style]}
        testID="glass-view"
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.content, noPadding && styles.noPadding]}>
          {children}
        </View>
      </GlassView>
    );
  }

  // Fallback: BlurView for older iOS / Android
  const blurAccessibilityHint = `blur-intensity-${intensity}-${actualTint}`;
  return (
    <View
      className={`rounded-[24px] overflow-hidden ${className}`}
      style={[styles.container, { shadowColor: colors.text.DEFAULT }, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      <BlurView
        intensity={intensity}
        tint={actualTint}
        style={StyleSheet.absoluteFill}
        testID="blur-view"
        accessibilityHint={blurAccessibilityHint}
      />
      <View style={styles.border} pointerEvents="none" />
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    borderCurve: 'continuous',
    overflow: 'hidden',
    // React Native shadow properties (NOT CSS boxShadow!)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  liquidGlassContainer: {
    borderRadius: borderRadius['2xl'],
    borderCurve: 'continuous',
    overflow: 'hidden',
  },

  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  content: {
    padding: 20,
  },

  noPadding: {
    padding: 0,
  },
});

export default GlassCard;

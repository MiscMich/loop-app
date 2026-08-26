/**
 * ProgressDots - Animated progress indicator
 * Based on 2025-2026 iOS trends research
 *
 * Features:
 * - Active dot expands width (8px → 24px)
 * - Spring animation on transition
 * - Color interpolation for completed dots
 */

import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/providers/ThemeProvider';

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
  style?: import('react-native').ViewStyle;
}

interface AnimatedDotProps {
  isActive: boolean;
  isPast: boolean;
  activeColor: string;
  pastColor: string;
  inactiveColor: string;
}

function AnimatedDot({ isActive, isPast, activeColor, pastColor, inactiveColor }: AnimatedDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const colorValue = isActive ? 1 : isPast ? 0.5 : 0;

    return {
      width: withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 300 }),
      backgroundColor: interpolateColor(
        colorValue,
        [0, 0.5, 1],
        [inactiveColor, pastColor, activeColor]
      ),
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="h-2 rounded-full"
    />
  );
}

export function ProgressDots({ total, current, className = '', style }: ProgressDotsProps) {
  const { colors } = useTheme();

  return (
    <View className={`flex-row items-center gap-2 ${className}`} style={style}>
      {Array.from({ length: total }).map((_, index) => (
        <AnimatedDot
          key={index}
          isActive={index === current}
          isPast={index < current}
          activeColor={colors.primary.DEFAULT}
          pastColor={colors.primary.DEFAULT}
          inactiveColor={colors.background.tertiary}
        />
      ))}
    </View>
  );
}

export default ProgressDots;

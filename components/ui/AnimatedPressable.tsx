/**
 * AnimatedPressable - Premium micro-interactions component
 * Warm Sunrise Design System
 *
 * Features:
 * - Scale bounce with overshoot on press
 * - Icon rotation on press (rotate-6 effect)
 * - Shadow depth changes on press states
 * - Haptic feedback integration
 * - Spring physics animations
 */

import React, { ReactNode } from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { animation, shadows } from '@/lib/theme';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type PressStyle = 'scale' | 'bounce' | 'tilt' | 'sink' | 'glow';

interface AnimatedPressableProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Press animation style */
  pressStyle?: PressStyle;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Haptic intensity */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  /** Scale amount on press (0-1, default 0.96) */
  scaleAmount?: number;
  /** Rotation amount in degrees on press */
  rotationAmount?: number;
  /** Enable shadow depth change on press */
  shadowDepth?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  pressStyle = 'bounce',
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  scaleAmount = 0.96,
  rotationAmount = 3,
  shadowDepth = true,
  accessibilityLabel,
  accessibilityHint,
}: AnimatedPressableProps) {
  // Animation values
  const pressed = useSharedValue(0);

  // Get spring config based on press style
  const getSpringConfig = () => {
    switch (pressStyle) {
      case 'bounce':
        return animation.springs.bouncy;
      case 'tilt':
        return animation.springs.snappy;
      case 'sink':
        return animation.springs.gentle;
      case 'glow':
        return animation.springs.responsive;
      default:
        return animation.springs.snappy;
    }
  };

  const springConfig = getSpringConfig();

  // Animated style with multiple transforms
  const animatedStyle = useAnimatedStyle(() => {
    // Scale interpolation with overshoot for bounce effect
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, scaleAmount],
      Extrapolation.CLAMP
    );

    // Rotation for tilt effect
    const rotate = pressStyle === 'tilt'
      ? interpolate(
          pressed.value,
          [0, 1],
          [0, rotationAmount],
          Extrapolation.CLAMP
        )
      : 0;

    // Y translation for sink effect
    const translateY = pressStyle === 'sink'
      ? interpolate(
          pressed.value,
          [0, 1],
          [0, 2],
          Extrapolation.CLAMP
        )
      : 0;

    // Shadow opacity for depth effect
    const shadowOpacity = shadowDepth
      ? interpolate(
          pressed.value,
          [0, 1],
          [1, 0.5],
          Extrapolation.CLAMP
        )
      : 1;

    return {
      transform: [
        { scale },
        { rotate: `${rotate}deg` },
        { translateY },
      ],
      opacity: disabled ? 0.5 : 1,
      // Note: shadowOpacity can't be animated directly on all platforms
      // but the scale reduction gives visual depth impression
    };
  });

  const handlePressIn = () => {
    // Animate to pressed state with overshoot
    if (pressStyle === 'bounce') {
      pressed.value = withSpring(1.1, springConfig); // Slight overshoot
      setTimeout(() => {
        pressed.value = withSpring(1, springConfig);
      }, 50);
    } else {
      pressed.value = withSpring(1, springConfig);
    }

    if (haptic && !disabled) {
      Haptics.impactAsync(hapticStyle);
    }
  };

  const handlePressOut = () => {
    // Animate back with bounce
    pressed.value = withSpring(0, {
      ...springConfig,
      // Extra bounce on release
      damping: springConfig.damping - 2,
    });
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <AnimatedPressableBase
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {children}
    </AnimatedPressableBase>
  );
}

/**
 * Icon-specific animated wrapper with rotation on press
 */
export function AnimatedIcon({
  children,
  onPress,
  style,
  rotationDegrees = 6,
  haptic = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  rotationDegrees?: number;
  haptic?: boolean;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, animation.springs.snappy);
    rotation.value = withSpring(rotationDegrees, animation.springs.bouncy);

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.springs.bouncy);
    rotation.value = withSpring(0, animation.springs.bouncy);
  };

  return (
    <AnimatedPressableBase
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

/**
 * Card-specific animated wrapper with shadow depth
 */
export function AnimatedCard({
  children,
  onPress,
  style,
  shadowStyle = 'md',
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  shadowStyle?: 'sm' | 'md' | 'lg' | 'float';
}) {
  const pressed = useSharedValue(0);

  const getShadowValues = () => {
    switch (shadowStyle) {
      case 'sm': return { normal: 4, pressed: 1 };
      case 'md': return { normal: 12, pressed: 4 };
      case 'lg': return { normal: 24, pressed: 8 };
      case 'float': return { normal: 32, pressed: 12 };
      default: return { normal: 12, pressed: 4 };
    }
  };

  const shadowValues = getShadowValues();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.98],
      Extrapolation.CLAMP
    );

    const shadowRadius = interpolate(
      pressed.value,
      [0, 1],
      [shadowValues.normal, shadowValues.pressed],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      pressed.value,
      [0, 1],
      [0, 2],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      shadowRadius,
      shadowOffset: {
        width: 0,
        height: interpolate(pressed.value, [0, 1], [8, 2], Extrapolation.CLAMP),
      },
      shadowOpacity: interpolate(pressed.value, [0, 1], [0.15, 0.1], Extrapolation.CLAMP),
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, animation.springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, animation.springs.responsive);
  };

  return (
    <AnimatedPressableBase
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { shadowColor: '#1A1A2E' }, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

export default AnimatedPressable;

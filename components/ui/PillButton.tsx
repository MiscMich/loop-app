/**
 * PillButton - Dribbble-style pill button with arrow icon
 *
 * Features:
 * - Pill shape with rounded corners
 * - Arrow icon on right side in colored circle
 * - Press animation with spring physics
 * - Haptic feedback on press
 */

import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { colors, shadows, borderRadius, typography, animation } from '@/lib/theme';
import { playSound } from '@/lib/sounds';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'default' | 'primary' | 'success' | 'secondary';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: SFSymbol;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showArrow?: boolean;
  accessibilityLabel?: string;
}

export function PillButton({
  title,
  onPress,
  variant = 'default',
  disabled = false,
  icon,
  style,
  textStyle,
  showArrow = true,
  accessibilityLabel,
}: PillButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    // Scale with slight overshoot on release
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.95],
      Extrapolation.CLAMP
    );

    // Subtle shadow depth reduction on press
    const shadowRadius = interpolate(
      pressed.value,
      [0, 1],
      [12, 4],
      Extrapolation.CLAMP
    );

    const shadowOffsetY = interpolate(
      pressed.value,
      [0, 1],
      [4, 1],
      Extrapolation.CLAMP
    );

    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [0.15, 0.08],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      shadowRadius,
      shadowOffset: { width: 0, height: shadowOffsetY },
      shadowOpacity,
    };
  });

  const handlePressIn = () => {
    // Bounce with overshoot effect
    pressed.value = withSequence(
      withSpring(1.1, animation.springs.snappy),
      withSpring(1, animation.springs.bouncy)
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound('tap', 0.3);
  };

  const handlePressOut = () => {
    // Bounce back with overshoot
    pressed.value = withSpring(0, {
      ...animation.springs.bouncy,
      damping: 8, // More bounce on release
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: [styles.container, styles.primaryContainer, style],
          text: [styles.text, styles.primaryText, textStyle],
          arrowBg: styles.primaryArrowBg,
          arrowColor: colors.primary.DEFAULT,
        };
      case 'success':
        return {
          container: [styles.container, styles.successContainer, style],
          text: [styles.text, styles.successText, textStyle],
          arrowBg: styles.successArrowBg,
          arrowColor: colors.success.DEFAULT,
        };
      case 'secondary':
        return {
          container: [styles.container, styles.secondaryContainer, style],
          text: [styles.text, styles.secondaryText, textStyle],
          arrowBg: styles.secondaryArrowBg,
          arrowColor: colors.text.DEFAULT,
        };
      default:
        return {
          container: [styles.container, styles.defaultContainer, style],
          text: [styles.text, styles.defaultText, textStyle],
          arrowBg: styles.defaultArrowBg,
          arrowColor: colors.text.inverse,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, variantStyles.container, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
    >
      {icon && (
        <SafeSymbol
          name={icon}
          size={22}
          tintColor={variant === 'primary' || variant === 'success' ? colors.text.inverse : colors.text.DEFAULT}
          style={styles.leftIcon}
        />
      )}
      <Text style={variantStyles.text}>{title}</Text>
      {showArrow && (
        <View style={[styles.arrowContainer, variantStyles.arrowBg]}>
          <SafeSymbol
            name="arrow.forward"
            size={20}
            tintColor={variantStyles.arrowColor}
          />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    paddingLeft: 24,
    paddingRight: 8,
    minWidth: 200,
  },

  // Default variant (white bg, coral arrow)
  defaultContainer: {
    backgroundColor: colors.surface.DEFAULT,
    ...shadows.md,
  },
  defaultText: {
    color: colors.text.DEFAULT,
  },
  defaultArrowBg: {
    backgroundColor: colors.primary.DEFAULT,
  },

  // Primary variant (coral bg, white text)
  primaryContainer: {
    backgroundColor: colors.primary.DEFAULT,
    ...shadows.primaryGlow,
  },
  primaryText: {
    color: colors.text.inverse,
  },
  primaryArrowBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Success variant (lime bg)
  successContainer: {
    backgroundColor: colors.success.DEFAULT,
    ...shadows.successGlow,
  },
  successText: {
    color: colors.text.DEFAULT,
  },
  successArrowBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Secondary variant (outline)
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.text.DEFAULT,
    paddingVertical: 14,
  },
  secondaryText: {
    color: colors.text.DEFAULT,
  },
  secondaryArrowBg: {
    backgroundColor: colors.fill,
  },

  text: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },

  arrowContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },

  leftIcon: {
    marginRight: 12,
  },

  disabled: {
    opacity: 0.5,
  },
});

export default PillButton;

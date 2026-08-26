/**
 * AnimatedButton - Modern button using HeroUI Native
 *
 * Wraps HeroUI Button with Loop's design system
 * Features: variants, sizes, icons, loading state, haptic feedback
 */

import React from 'react';
import { Button, useThemeColor, Spinner } from 'heroui-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import { ViewStyle, StyleProp } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

interface AnimatedButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: SFSymbol | React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  haptic?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Map our variants to HeroUI variants
const VARIANT_MAP = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
} as const;

// Map our sizes to HeroUI sizes
const SIZE_MAP = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
} as const;

export function AnimatedButton({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  isLoading = false,
  haptic = true,
  fullWidth = false,
  disabled,
  onPress,
  style,
  className,
  accessibilityLabel,
  accessibilityHint,
}: AnimatedButtonProps) {
  const themeColorForeground = useThemeColor('accent-foreground');
  const themeColorDangerForeground = useThemeColor('danger-foreground');

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const iconColor =
    variant === 'danger' ? themeColorDangerForeground : themeColorForeground;

  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;

  const heroVariant = VARIANT_MAP[variant] || 'primary';
  const heroSize = SIZE_MAP[size] || 'md';

  // Render icon - supports both SF Symbols (string) and Lucide (React component)
  const renderIcon = () => {
    if (!icon) return null;

    // If icon is a string, it's an SF Symbol name
    if (typeof icon === 'string') {
      return <SafeSymbol name={icon as SFSymbol} size={iconSize} tintColor={iconColor} />;
    }

    // Otherwise it's a Lucide React component
    const IconComponent = icon;
    return <IconComponent size={iconSize} color={iconColor} />;
  };

  return (
    <Button
      variant={heroVariant}
      size={heroSize}
      onPress={handlePress}
      isDisabled={disabled || isLoading}
      className={`${fullWidth ? 'w-full' : ''} ${className || ''}`}
      style={style}
      pressableFeedbackVariant="highlight"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {isLoading ? (
        <Spinner entering={FadeIn.delay(50)} color={iconColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && renderIcon()}
          <Button.Label>{title}</Button.Label>
          {icon && iconPosition === 'right' && renderIcon()}
        </>
      )}
    </Button>
  );
}

export default AnimatedButton;

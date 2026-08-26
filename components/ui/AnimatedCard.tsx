/**
 * AnimatedCard - Pressable card using HeroUI Native
 *
 * Wraps HeroUI Card with PressableFeedback for interactive cards
 * Features: elevation, press feedback, haptic support
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Card, PressableFeedback } from 'heroui-native';
import * as Haptics from 'expo-haptics';

interface AnimatedCardProps {
  children: React.ReactNode;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  borderRadius?: number;
  haptic?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
  contentClassName?: string;
}

// Tailwind shadow classes for elevation
const ELEVATION_CLASSES = {
  none: '',
  small: 'shadow-sm',
  medium: 'shadow-md',
  large: 'shadow-lg',
} as const;

export function AnimatedCard({
  children,
  elevation = 'medium',
  backgroundColor,
  borderRadius = 16,
  haptic = true,
  onPress,
  style,
  className = '',
  contentClassName = '',
}: AnimatedCardProps) {
  const elevationClass = ELEVATION_CLASSES[elevation];
  const bgStyle = backgroundColor ? { backgroundColor } : undefined;
  const radiusStyle = { borderRadius };

  const handlePress = () => {
    if (haptic && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  // Non-interactive card
  if (!onPress) {
    return (
      <Card
        className={`bg-white overflow-hidden ${elevationClass} ${className}`}
        style={[radiusStyle, bgStyle, style]}
      >
        <Card.Body className={contentClassName}>{children}</Card.Body>
      </Card>
    );
  }

  // Interactive card with press feedback
  return (
    <PressableFeedback
      onPress={handlePress}
      className={`overflow-hidden ${elevationClass} ${className}`}
      style={[radiusStyle, bgStyle, style]}
    >
      <Card className="flex-1 bg-transparent">
        <PressableFeedback.Highlight />
        <Card.Body className={contentClassName}>{children}</Card.Body>
      </Card>
    </PressableFeedback>
  );
}

// Subcomponents for structured cards
AnimatedCard.Header = function AnimatedCardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`px-4 pt-4 pb-2 ${className}`}>{children}</View>
  );
};

AnimatedCard.Body = function AnimatedCardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={`px-4 py-2 ${className}`}>{children}</View>;
};

AnimatedCard.Footer = function AnimatedCardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`px-4 pt-2 pb-4 ${className}`}>{children}</View>
  );
};

export default AnimatedCard;

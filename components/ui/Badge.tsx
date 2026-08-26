/**
 * Badge - Notification badge with count
 * Uses Tailwind classes via Uniwind
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface BadgeProps {
  count?: number;
  maxCount?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  style?: ViewStyle;
  className?: string;
}

const VARIANT_COLORS = {
  primary: 'bg-primary',
  secondary: 'bg-accent',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  danger: 'bg-primary',
} as const;

const SIZE_CONFIG = {
  small: { container: 'min-w-4 h-4 px-0.5', text: 'text-[10px]' },
  medium: { container: 'min-w-5 h-5 px-1', text: 'text-xs' },
  large: { container: 'min-w-6 h-6 px-1.5', text: 'text-sm' },
} as const;

export function Badge({
  count,
  maxCount = 99,
  variant = 'primary',
  size = 'medium',
  dot = false,
  style,
  className = '',
}: BadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const colorClass = VARIANT_COLORS[variant];

  const displayCount = count !== undefined
    ? count > maxCount
      ? `${maxCount}+`
      : count.toString()
    : '';

  if (dot) {
    return (
      <View
        className={`w-2.5 h-2.5 rounded-full ${colorClass} ${className}`}
        style={style}
      />
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <View
      className={`rounded-full justify-center items-center ${colorClass} ${sizeConfig.container} ${className}`}
      style={style}
    >
      <Text className={`text-white font-bold text-center ${sizeConfig.text}`}>
        {displayCount}
      </Text>
    </View>
  );
}

// Wrapper component for positioning badge on other elements
interface BadgeWrapperProps {
  children: React.ReactNode;
  badge: BadgeProps;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const POSITION_CLASSES = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
} as const;

export function BadgeWrapper({
  children,
  badge,
  position = 'top-right',
}: BadgeWrapperProps) {
  return (
    <View className="relative">
      {children}
      <View className={`absolute ${POSITION_CLASSES[position]}`}>
        <Badge {...badge} />
      </View>
    </View>
  );
}

export default Badge;

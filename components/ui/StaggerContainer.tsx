/**
 * StaggerContainer - Staggered entrance animation wrapper
 * Based on 2025-2026 iOS animation trends
 *
 * Features:
 * - Auto-stagger children on mount
 * - Configurable delay between items
 * - FadeInDown animation with spring physics
 */

import React, { Children, cloneElement, isValidElement } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

type AnimationType = 'fadeInDown' | 'fadeInUp' | 'fadeIn';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  animation?: AnimationType;
  className?: string;
  style?: ViewStyle;
}

interface StaggerItemProps {
  children: React.ReactNode;
  delay: number;
  animation: AnimationType;
}

function StaggerItem({ children, delay, animation }: StaggerItemProps) {
  const getEntering = () => {
    const base = animation === 'fadeInDown'
      ? FadeInDown
      : animation === 'fadeInUp'
        ? FadeInUp
        : FadeIn;

    return base.delay(delay).springify().damping(15).stiffness(100);
  };

  return (
    <Animated.View entering={getEntering()}>
      {children}
    </Animated.View>
  );
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  initialDelay = 0,
  animation = 'fadeInDown',
  className = '',
  style,
}: StaggerContainerProps) {
  const childArray = Children.toArray(children);

  return (
    <View style={style} className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const delay = initialDelay + index * staggerDelay;

        return (
          <StaggerItem key={index} delay={delay} animation={animation}>
            {child}
          </StaggerItem>
        );
      })}
    </View>
  );
}

export default StaggerContainer;

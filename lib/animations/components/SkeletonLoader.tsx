/**
 * SkeletonLoader - Animated loading placeholder
 *
 * Provides beautiful shimmer loading states for content
 * Uses Uniwind/Tailwind for styling with className props
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  /** Width of the skeleton */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Whether to show the shimmer animation */
  animate?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Variant type */
  variant?: 'text' | 'circle' | 'card' | 'image';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  animate = true,
  style,
  variant = 'text',
}) => {
  const shimmerValue = useSharedValue(0);

  React.useEffect(() => {
    if (animate) {
      shimmerValue.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [animate]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmerValue.value, [0, 1], [-200, 200]),
      },
    ],
  }));

  // Get dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'circle':
        return {
          width: height,
          height,
          borderRadius: height / 2,
        };
      case 'card':
        return {
          width,
          height: 120,
          borderRadius: 16,
        };
      case 'image':
        return {
          width,
          height: 200,
          borderRadius: 12,
        };
      default:
        return {
          width,
          height,
          borderRadius,
        };
    }
  };

  const dimensions = getDimensions();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Pre-configured skeleton variants
 */
export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <View className="gap-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        height={16}
      />
    ))}
  </View>
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <SkeletonLoader variant="circle" height={size} />
);

export const SkeletonCard: React.FC = () => (
  <View className="gap-3">
    <SkeletonLoader variant="image" />
    <View className="gap-2 px-2">
      <SkeletonLoader height={20} width="70%" />
      <SkeletonLoader height={14} width="90%" />
      <SkeletonLoader height={14} width="40%" />
    </View>
  </View>
);

export const SkeletonContentCard: React.FC = () => (
  <View className="bg-white rounded-3xl p-4 gap-3 shadow-sm">
    <View className="flex-row items-center gap-3">
      <SkeletonAvatar size={40} />
      <View className="flex-1 gap-1">
        <SkeletonLoader height={16} width="50%" />
        <SkeletonLoader height={12} width="30%" />
      </View>
    </View>
    <SkeletonLoader variant="image" height={160} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    width: 200,
  },
});

export default SkeletonLoader;

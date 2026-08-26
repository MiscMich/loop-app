/**
 * useShimmer - Shimmer loading animation hook
 *
 * Provides continuous shimmer effect for skeleton loaders
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface UseShimmerOptions {
  /** Animation duration (ms) */
  duration?: number;
  /** Whether animation is active */
  isActive?: boolean;
  /** Shimmer width as percentage of container */
  shimmerWidth?: number;
}

interface UseShimmerReturn {
  /** Animated style for the shimmer overlay */
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
  /** Start the shimmer animation */
  start: () => void;
  /** Stop the shimmer animation */
  stop: () => void;
}

export const useShimmer = (
  options: UseShimmerOptions = {}
): UseShimmerReturn => {
  const { duration = 1500, isActive = true, shimmerWidth = 0.5 } = options;

  const translateX = useSharedValue(-1);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-1, 1],
          [-100, 100]
        ) as unknown as number,
      },
    ],
    opacity: interpolate(translateX.value, [-1, 0, 1], [0.3, 0.6, 0.3]),
  }));

  const start = () => {
    translateX.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  };

  const stop = () => {
    cancelAnimation(translateX);
    translateX.value = -1;
  };

  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [isActive, duration]);

  return {
    shimmerStyle,
    start,
    stop,
  };
};

/**
 * Hook for pulsing opacity animation (alternative to shimmer)
 */
export const usePulse = (duration: number = 1000, isActive: boolean = true) => {
  const opacity = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isActive) {
      opacity.value = withRepeat(
        withTiming(0.4, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true // Reverse
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }

    return () => {
      cancelAnimation(opacity);
    };
  }, [isActive, duration]);

  return { pulseStyle };
};

export default useShimmer;

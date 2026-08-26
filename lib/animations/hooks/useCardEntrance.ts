/**
 * useCardEntrance - Animated card entrance hook
 *
 * Provides smooth entrance animations for cards and list items
 * with staggered delay support
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, OPACITY, TRANSLATE, STAGGER } from '../springs';

interface UseCardEntranceOptions {
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Index for staggered animations */
  index?: number;
  /** Stagger delay between items (ms) */
  staggerDelay?: number;
  /** Initial Y offset */
  initialY?: number;
  /** Spring config to use */
  springConfig?: keyof typeof SPRING_CONFIGS;
  /** Whether to auto-animate on mount */
  autoAnimate?: boolean;
}

interface UseCardEntranceReturn {
  /** Animated style to apply to the card */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Trigger the entrance animation */
  animate: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Current animation progress (0-1) */
  progress: { value: number };
}

export const useCardEntrance = (
  options: UseCardEntranceOptions = {}
): UseCardEntranceReturn => {
  const {
    delay = 0,
    index = 0,
    staggerDelay = STAGGER.normal,
    initialY = TRANSLATE.slideIn,
    springConfig = 'responsive',
    autoAnimate = true,
  } = options;

  const progress = useSharedValue(0);

  const totalDelay = delay + index * staggerDelay;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 1],
      [OPACITY.hidden, OPACITY.visible],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [initialY, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const animate = () => {
    progress.value = withDelay(
      totalDelay,
      withSpring(1, SPRING_CONFIGS[springConfig])
    );
  };

  const reset = () => {
    progress.value = withTiming(0, { duration: 150 });
  };

  useEffect(() => {
    if (autoAnimate) {
      animate();
    }
  }, [autoAnimate]);

  return {
    animatedStyle,
    animate,
    reset,
    progress,
  };
};

/**
 * Hook for staggered list entrance animations
 */
export const useListEntrance = (
  itemCount: number,
  options: Omit<UseCardEntranceOptions, 'index'> = {}
) => {
  const items = Array.from({ length: itemCount }, (_, index) =>
    useCardEntrance({ ...options, index })
  );

  const animateAll = () => {
    items.forEach((item) => item.animate());
  };

  const resetAll = () => {
    items.forEach((item) => item.reset());
  };

  return {
    items,
    animateAll,
    resetAll,
  };
};

export default useCardEntrance;

/**
 * useReducedMotion - Accessibility hook for respecting user motion preferences
 *
 * Returns true if the user has enabled "Reduce Motion" in iOS Settings.
 * Use this to disable or simplify animations for accessibility.
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * // Skip animations for users who prefer reduced motion
 * const entering = reducedMotion
 *   ? FadeIn.duration(0)  // Instant
 *   : FadeIn.springify(); // Animated
 * ```
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook that subscribes to the device's reduced motion preference
 * @returns true if reduced motion is enabled, false otherwise
 */
export function useReducedMotion(): boolean {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setIsReducedMotionEnabled(enabled);
    });

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setIsReducedMotionEnabled(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isReducedMotionEnabled;
}

/**
 * Helper to get animation duration based on reduced motion preference
 * @param normalDuration - Duration when animations are enabled
 * @param reducedDuration - Duration when reduced motion is enabled (default: 0)
 * @returns The appropriate duration
 */
export function useAnimationDuration(
  normalDuration: number,
  reducedDuration: number = 0
): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? reducedDuration : normalDuration;
}

/**
 * Helper to get spring config based on reduced motion preference
 * Returns instant config when reduced motion is enabled
 */
export function useSpringConfig(normalConfig: {
  damping: number;
  stiffness: number;
  mass?: number;
}): {
  damping: number;
  stiffness: number;
  mass?: number;
} {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    // Very stiff spring = instant with no bounce
    return {
      damping: 100,
      stiffness: 1000,
      mass: 1,
    };
  }

  return normalConfig;
}

export default useReducedMotion;

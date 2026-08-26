/**
 * Loop App Spring Configurations
 *
 * Modern spring physics using react-native-reanimated
 * Following PRD specifications for Gen Z playful, responsive feel
 */

import { withSpring, WithSpringConfig } from 'react-native-reanimated';

/**
 * Spring configurations from PRD
 * Each config is tuned for specific use cases
 */
export const SPRING_CONFIGS = {
  /**
   * Snappy - Quick, responsive interactions
   * Use for: Button presses, toggles, quick feedback
   */
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },

  /**
   * Responsive - Balanced spring for general UI
   * Use for: Cards, modals appearing, transitions
   */
  responsive: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  /**
   * Gentle - Soft, elegant movements
   * Use for: Background elements, subtle animations
   */
  gentle: {
    damping: 12,
    stiffness: 100,
    mass: 1.2,
  },

  /**
   * Bouncy - Playful, energetic animations
   * Use for: Celebrations, achievements, fun interactions
   */
  bouncy: {
    damping: 8,
    stiffness: 180,
    mass: 0.6,
  },
} as const;

export type SpringConfigName = keyof typeof SPRING_CONFIGS;

/**
 * Animation timing constants
 */
export const TIMING = {
  instant: 100,
  quick: 150,
  normal: 250,
  slow: 400,
  enter: 300,
  exit: 200,
} as const;

/**
 * Easing presets for non-spring animations
 */
export const EASING = {
  easeIn: { duration: TIMING.normal },
  easeOut: { duration: TIMING.normal },
  easeInOut: { duration: TIMING.normal },
} as const;

/**
 * Helper to apply spring animation with config name
 */
export const springWithConfig = (
  value: number,
  configName: SpringConfigName = 'responsive'
): number => {
  'worklet';
  return withSpring(value, SPRING_CONFIGS[configName]);
};

/**
 * Get spring config by name
 */
export const getSpringConfig = (name: SpringConfigName): WithSpringConfig => {
  return SPRING_CONFIGS[name];
};

/**
 * Animation scale values
 */
export const SCALE = {
  pressed: 0.95,
  normal: 1,
  emphasized: 1.05,
  large: 1.1,
  celebration: 1.2,
} as const;

/**
 * Animation opacity values
 */
export const OPACITY = {
  hidden: 0,
  dimmed: 0.5,
  visible: 1,
} as const;

/**
 * Animation translate values
 */
export const TRANSLATE = {
  offscreenBottom: 100,
  offscreenTop: -100,
  slideIn: 20,
  none: 0,
} as const;

/**
 * Stagger delays for list animations
 */
export const STAGGER = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;

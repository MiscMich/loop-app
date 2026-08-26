/**
 * Loop App Animation System
 *
 * Modern animation utilities using react-native-reanimated
 *
 * @example
 * import { SPRING_CONFIGS, useButtonPress, SkeletonLoader } from '@/lib/animations';
 */

// Spring configurations and constants
export {
  SPRING_CONFIGS,
  TIMING,
  EASING,
  SCALE,
  OPACITY,
  TRANSLATE,
  STAGGER,
  springWithConfig,
  getSpringConfig,
  type SpringConfigName,
} from './springs';

// Animation hooks
export {
  useButtonPress,
  useCardEntrance,
  useListEntrance,
  useShimmer,
  usePulse,
} from './hooks';

// Animation components
export {
  SkeletonLoader,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonContentCard,
  Confetti,
  useConfetti,
} from './components';

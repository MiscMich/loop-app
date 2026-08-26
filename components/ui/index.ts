// Animated UI Components
export { AnimatedButton } from './AnimatedButton';
export { AnimatedCard } from './AnimatedCard';
export { AnimatedInput } from './AnimatedInput';
export { Badge, BadgeWrapper } from './Badge';
export { ProgressDots } from './ProgressDots';
export { GlassCard } from './GlassCard';
export { GlassModal } from './GlassModal';
export { StaggerContainer } from './StaggerContainer';

// Premium Motion Components
export { AnimatedPressable, AnimatedIcon, AnimatedCard as PremiumAnimatedCard } from './AnimatedPressable';
export { CustomRefreshControl, RefreshIndicator, AnimatedRefreshHeader } from './CustomRefreshControl';
export { AnimatedGradientBackground, SunriseAnimatedBackground, CalmAnimatedBackground, PulsingBackground } from './AnimatedGradientBackground';
export { FloatingDecorations, FloatingCircle, PulsingDot } from './FloatingDecorations';

// Warm Sunrise Design System Components
export { PillButton } from './PillButton';
export { UnderlinedInput } from './UnderlinedInput';
export {
  GradientBackground,
  SunriseBackground,
  OnboardingBackground,
  CelebrationBackground,
  CoralBackground,
} from './GradientBackground';

// Re-export animation utilities from the new reanimated system
export {
  SPRING_CONFIGS,
  TIMING,
  EASING,
  SCALE,
  OPACITY,
  TRANSLATE,
  STAGGER,
  useButtonPress,
  useCardEntrance,
  useListEntrance,
  useShimmer,
  usePulse,
  SkeletonLoader,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonContentCard,
  Confetti,
  useConfetti,
} from '@/lib/animations';

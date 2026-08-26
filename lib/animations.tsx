/**
 * Animations Library - Warm Sunrise Micro-Interactions
 *
 * Features:
 * - Spring configs and timing presets
 * - Skeleton loaders for loading states
 * - Confetti celebration animations
 * - Reusable animation hooks
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { colors } from './theme';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const SPRING_CONFIGS = {
  // Snappy - Quick, responsive feel
  snappy: {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
  },
  // Bouncy - Playful, energetic
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 0.8,
  },
  // Gentle - Smooth, subtle
  gentle: {
    damping: 20,
    stiffness: 80,
    mass: 1,
  },
  // Wobbly - Fun, exaggerated
  wobbly: {
    damping: 8,
    stiffness: 180,
    mass: 0.6,
  },
  // Stiff - Precise, controlled
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 0.5,
  },
};

// ============================================================================
// TIMING PRESETS
// ============================================================================

export const TIMING = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

export const EASING = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  bounceIn: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
};

// ============================================================================
// TRANSFORM PRESETS
// ============================================================================

export const SCALE = {
  pressed: 0.95,
  active: 1.05,
  inactive: 1,
  small: 0.8,
  large: 1.2,
};

export const OPACITY = {
  visible: 1,
  dimmed: 0.6,
  hidden: 0,
  disabled: 0.4,
};

export const TRANSLATE = {
  slideUp: -20,
  slideDown: 20,
  slideLeft: -20,
  slideRight: 20,
};

export const STAGGER = {
  fast: 50,
  normal: 100,
  slow: 150,
};

// ============================================================================
// ANIMATION HOOKS
// ============================================================================

/**
 * Button press animation hook
 */
export function useButtonPress() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(SCALE.pressed, SPRING_CONFIGS.snappy);
    opacity.value = withTiming(0.9, { duration: TIMING.fast });
  };

  const onPressOut = () => {
    scale.value = withSpring(SCALE.inactive, SPRING_CONFIGS.bouncy);
    opacity.value = withTiming(1, { duration: TIMING.fast });
  };

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Card entrance animation hook
 */
export function useCardEntrance(delay: number = 0) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withSpring(0, SPRING_CONFIGS.gentle);
      opacity.value = withTiming(1, { duration: TIMING.normal });
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return animatedStyle;
}

/**
 * List entrance stagger animation hook
 */
export function useListEntrance(index: number, staggerDelay: number = STAGGER.normal) {
  return useCardEntrance(index * staggerDelay);
}

/**
 * Shimmer animation hook for skeleton loaders
 */
export function useShimmer() {
  const translateX = useSharedValue(-100);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1200, easing: EASING.smooth }),
      -1, // infinite
      false // don't reverse
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value}%` as unknown as number }],
  }));

  return shimmerStyle;
}

/**
 * Pulse animation hook
 */
export function usePulse(active: boolean = true) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: TIMING.fast });
    }
  }, [active]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return pulseStyle;
}

// ============================================================================
// SKELETON LOADER COMPONENTS
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base skeleton loader component
 */
export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmerStyle = useShimmer();

  return (
    <View
      style={[
        skeletonStyles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[skeletonStyles.shimmer, shimmerStyle]} />
    </View>
  );
}

/**
 * Text skeleton placeholder
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%',
  lineHeight = 16,
  gap = 8,
  style,
}: {
  lines?: number;
  lastLineWidth?: string | number;
  lineHeight?: number;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

/**
 * Avatar skeleton placeholder
 */
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <SkeletonLoader width={size} height={size} borderRadius={size / 2} />;
}

/**
 * Card skeleton placeholder
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <View style={skeletonStyles.cardHeader}>
        <SkeletonAvatar size={44} />
        <View style={skeletonStyles.cardHeaderText}>
          <SkeletonLoader width={120} height={14} />
          <SkeletonLoader width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={160} borderRadius={12} style={{ marginTop: 12 }} />
      <SkeletonText lines={2} style={{ marginTop: 12 }} />
    </View>
  );
}

/**
 * Content card skeleton (matches ContentCard component)
 */
export function SkeletonContentCard() {
  return (
    <View style={skeletonStyles.contentCard}>
      <View style={skeletonStyles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={skeletonStyles.cardHeaderText}>
          <SkeletonLoader width={100} height={14} />
          <SkeletonLoader width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={200} borderRadius={16} style={{ marginTop: 12 }} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '50%',
  },
  card: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 20,
    padding: 16,
  },
  contentCard: {
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
});

// ============================================================================
// CONFETTI COMPONENT
// ============================================================================

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  color: string;
}

/**
 * Confetti celebration animation component
 */
export function Confetti({
  active,
  count = 50,
  duration = 3000,
  colors: confettiColors = [
    colors.primary.DEFAULT,
    colors.success.DEFAULT,
    colors.accent.DEFAULT,
    colors.warning,
    '#8289D8',  // accent.dark (design system)
  ],
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);

  React.useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces: ConfettiPiece[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: useSharedValue(Math.random() * 100 - 50),
      y: useSharedValue(-20),
      rotation: useSharedValue(0),
      scale: useSharedValue(Math.random() * 0.5 + 0.5),
      opacity: useSharedValue(1),
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }));

    setPieces(newPieces);

    // Animate each piece
    newPieces.forEach((piece, index) => {
      const delay = index * 20;
      setTimeout(() => {
        piece.y.value = withTiming(120, { duration: duration * 0.8 });
        piece.x.value = withTiming(
          piece.x.value + (Math.random() * 100 - 50),
          { duration }
        );
        piece.rotation.value = withTiming(
          Math.random() * 720 - 360,
          { duration }
        );
        piece.opacity.value = withTiming(0, {
          duration: duration * 0.3,
          easing: EASING.easeOut,
        });
      }, delay);
    });

    const timeout = setTimeout(() => {
      setPieces([]);
      onComplete?.();
    }, duration + count * 20);

    return () => clearTimeout(timeout);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceView key={piece.id} piece={piece} />
      ))}
    </View>
  );
}

function ConfettiPieceView({ piece }: { piece: ConfettiPiece }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x.value },
      { translateY: `${piece.y.value}%` as unknown as number },
      { rotate: `${piece.rotation.value}deg` },
      { scale: piece.scale.value },
    ],
    opacity: piece.opacity.value,
  }));

  return (
    <Animated.View
      style={[
        confettiStyles.piece,
        { backgroundColor: piece.color },
        animatedStyle,
      ]}
    />
  );
}

/**
 * Hook for controlling confetti
 */
export function useConfetti() {
  const [isActive, setIsActive] = React.useState(false);

  const fire = React.useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = React.useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, fire, reset };
}

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

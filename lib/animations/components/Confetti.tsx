/**
 * Confetti - Celebration animation component
 *
 * Creates a burst of confetti particles for achievements and wins
 */

import React, { useEffect, useCallback } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_CONFIGS } from '../springs';

// Confetti colors - Warm Sunrise design system palette
const CONFETTI_COLORS = [
  '#FF6B6B', // Coral (primary.DEFAULT)
  '#A1A8EA', // Lavender (accent.DEFAULT)
  '#FFB347', // Gold (warning)
  '#FF8E8E', // Light coral (primary.light)
  '#BFC4F2', // Light lavender (accent.light)
  '#97DC38', // Lime (success.DEFAULT)
];

interface ConfettiPieceProps {
  index: number;
  startX: number;
  color: string;
  delay: number;
  screenHeight: number;
  onComplete?: () => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({
  index,
  startX,
  color,
  delay,
  screenHeight,
  onComplete,
}) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const targetX = (Math.random() - 0.5) * 200;
    const targetY = screenHeight + 100;
    const rotation = Math.random() * 720 - 360;

    // Initial pop
    scale.value = withDelay(
      delay,
      withSpring(1, SPRING_CONFIGS.bouncy)
    );

    // Fall animation
    translateY.value = withDelay(
      delay + 100,
      withTiming(targetY, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      delay + 100,
      withTiming(targetX, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );

    rotate.value = withDelay(
      delay + 100,
      withTiming(rotation, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );

    // Fade out near the end
    opacity.value = withDelay(
      delay + 2000,
      withTiming(0, {
        duration: 500,
      }, (finished) => {
        if (finished && index === 0 && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const size = 8 + Math.random() * 8;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left: startX,
          width: size,
          height: isCircle ? size : size * 2,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: color,
        },
      ]}
    />
  );
};

interface ConfettiProps {
  /** Whether confetti is active */
  isActive: boolean;
  /** Number of confetti pieces */
  count?: number;
  /** Origin X position (default: center) */
  originX?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Whether to trigger haptic feedback */
  haptic?: boolean;
}

export const Confetti: React.FC<ConfettiProps> = ({
  isActive,
  count = 50,
  originX,
  onComplete,
  haptic = true,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const effectiveOriginX = originX ?? screenWidth / 2;
  const [pieces, setPieces] = React.useState<
    Array<{ id: number; x: number; color: string; delay: number }>
  >([]);

  const triggerHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (isActive) {
      if (haptic) {
        triggerHaptic();
      }

      const newPieces = Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: effectiveOriginX + (Math.random() - 0.5) * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 200,
      }));

      setPieces(newPieces);

      // Clear pieces after animation
      const timeout = setTimeout(() => {
        setPieces([]);
      }, 4000);

      return () => clearTimeout(timeout);
    } else {
      setPieces([]);
    }
  }, [isActive, count, effectiveOriginX, haptic]);

  if (pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => (
        <ConfettiPiece
          key={piece.id}
          index={index}
          startX={piece.x}
          color={piece.color}
          delay={piece.delay}
          screenHeight={screenHeight}
          onComplete={index === 0 ? onComplete : undefined}
        />
      ))}
    </View>
  );
};

/**
 * Hook for triggering confetti programmatically
 */
export const useConfetti = () => {
  const [isActive, setIsActive] = React.useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 100);
  }, []);

  return {
    isActive,
    trigger,
    ConfettiComponent: (props: Omit<ConfettiProps, 'isActive'>) => (
      <Confetti {...props} isActive={isActive} />
    ),
  };
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti;

/**
 * useButtonPress - Animated button press hook
 *
 * Provides smooth scale animation for button interactions
 * with haptic feedback support
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_CONFIGS, SCALE } from '../springs';

interface UseButtonPressOptions {
  /** Scale when pressed (default: 0.95) */
  pressedScale?: number;
  /** Enable haptic feedback (default: true) */
  haptic?: boolean;
  /** Haptic feedback type */
  hapticType?: Haptics.ImpactFeedbackStyle;
  /** Custom spring config */
  springConfig?: keyof typeof SPRING_CONFIGS;
}

interface UseButtonPressReturn {
  /** Animated style to apply to the button */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Handler for press in */
  onPressIn: () => void;
  /** Handler for press out */
  onPressOut: () => void;
  /** Combined press handlers object */
  pressHandlers: {
    onPressIn: () => void;
    onPressOut: () => void;
  };
}

const triggerHaptic = (type: Haptics.ImpactFeedbackStyle) => {
  Haptics.impactAsync(type);
};

export const useButtonPress = (
  options: UseButtonPressOptions = {}
): UseButtonPressReturn => {
  const {
    pressedScale = SCALE.pressed,
    haptic = true,
    hapticType = Haptics.ImpactFeedbackStyle.Light,
    springConfig = 'snappy',
  } = options;

  const scale = useSharedValue<number>(SCALE.normal);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(pressedScale, SPRING_CONFIGS[springConfig]);
    if (haptic) {
      runOnJS(triggerHaptic)(hapticType);
    }
  }, [pressedScale, haptic, hapticType, springConfig, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(SCALE.normal, SPRING_CONFIGS.gentle);
  }, [scale]);

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    pressHandlers: { onPressIn, onPressOut },
  };
};

export default useButtonPress;

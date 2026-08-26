/**
 * useSound Hook
 * Easy sound effects for React components
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { playSound, SoundType } from '../lib/sounds';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface UseSoundOptions {
  haptic?: HapticType;
  volume?: number;
}

/**
 * Hook to play sounds with optional haptic feedback
 *
 * @example
 * const { play } = useSound();
 *
 * // Simple usage
 * <Button onPress={() => play('tap')}>Click me</Button>
 *
 * // With haptic
 * <Button onPress={() => play('success', { haptic: 'success' })}>Save</Button>
 */
export function useSound() {
  const play = useCallback(
    async (type: SoundType, options?: UseSoundOptions) => {
      const { haptic, volume = 0.5 } = options || {};

      // Play haptic feedback (immediate)
      if (haptic) {
        switch (haptic) {
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'selection':
            Haptics.selectionAsync();
            break;
        }
      }

      // Play sound
      await playSound(type, volume);
    },
    []
  );

  // Convenience methods for common sounds
  const tap = useCallback(() => play('tap', { haptic: 'light' }), [play]);
  const select = useCallback(() => play('select', { haptic: 'selection' }), [play]);
  const success = useCallback(() => play('success', { haptic: 'success' }), [play]);
  const send = useCallback(() => play('send', { haptic: 'medium' }), [play]);
  const pop = useCallback(() => play('pop', { haptic: 'light' }), [play]);
  const move = useCallback(() => play('move', { haptic: 'light' }), [play]);
  const victory = useCallback(() => play('victory', { haptic: 'success' }), [play]);
  const error = useCallback(() => play('error', { haptic: 'error' }), [play]);
  const notification = useCallback(() => play('notification', { haptic: 'medium' }), [play]);

  return {
    play,
    // Convenience methods
    tap,
    select,
    success,
    send,
    pop,
    move,
    victory,
    error,
    notification,
  };
}

export default useSound;

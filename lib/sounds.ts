/**
 * Sound Effects System for Loop
 * Uses Octave sound library (MIT License)
 * https://github.com/scopegate/octave
 */

import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { logger } from './logger';

// Sound effect types
export type SoundType =
  | 'tap'        // Button press
  | 'select'     // Toggle/selection
  | 'pop'        // Mood selection, light feedback
  | 'success'    // Content saved/exported
  | 'send'       // Content sent to friends
  | 'move'       // Game move
  | 'victory'    // Game win
  | 'error'      // Error/game draw
  | 'notification' // Incoming content
  | 'record';    // Recording start/stop

// Sound file mapping
const SOUND_FILES: Record<SoundType, any> = {
  tap: require('../assets/sounds/tap.aif'),
  select: require('../assets/sounds/select.aif'),
  pop: require('../assets/sounds/pop.aif'),
  success: require('../assets/sounds/success.aif'),
  send: require('../assets/sounds/send.aif'),
  move: require('../assets/sounds/move.aif'),
  victory: require('../assets/sounds/victory.aif'),
  error: require('../assets/sounds/error.aif'),
  notification: require('../assets/sounds/notification.aif'),
  record: require('../assets/sounds/record.aif'),
};

// Cache loaded sounds for performance
const soundCache: Map<SoundType, Sound> = new Map();

// Global settings
let soundEnabled = true;

/**
 * Initialize the audio system
 * Call this once at app startup
 */
export async function initSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // Respect silent switch
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    logger.warn('Failed to initialize audio', { action: 'initSounds' }, error);
  }
}

/**
 * Preload sounds for instant playback
 * Call this after app loads for better performance
 */
export async function preloadSounds(types?: SoundType[]): Promise<void> {
  const toLoad = types || ['tap', 'select', 'pop', 'success', 'send'];

  await Promise.all(
    toLoad.map(async (type) => {
      try {
        if (!soundCache.has(type)) {
          const { sound } = await Audio.Sound.createAsync(SOUND_FILES[type]);
          soundCache.set(type, sound);
        }
      } catch (error) {
        logger.warn(`Failed to preload sound ${type}`, { action: 'preloadSounds', metadata: { soundType: type } }, error);
      }
    })
  );
}

/**
 * Play a sound effect
 * @param type - The sound type to play
 * @param volume - Volume from 0 to 1 (default 0.5)
 */
export async function playSound(
  type: SoundType,
  volume: number = 0.5
): Promise<void> {
  if (!soundEnabled) return;

  try {
    // Try to use cached sound first
    let sound = soundCache.get(type);

    if (sound) {
      // Reset to beginning and play
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(volume);
      await sound.playAsync();
    } else {
      // Load and play (slower, first time only)
      const { sound: newSound } = await Audio.Sound.createAsync(
        SOUND_FILES[type],
        { volume, shouldPlay: true }
      );
      soundCache.set(type, newSound);
    }
  } catch (error) {
    logger.warn(`Failed to play sound ${type}`, { action: 'playSound', metadata: { soundType: type } }, error);
  }
}

/**
 * Enable or disable all sound effects
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

/**
 * Check if sounds are enabled
 */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Cleanup all cached sounds
 * Call when app is closing or sounds no longer needed
 */
export async function unloadSounds(): Promise<void> {
  await Promise.all(
    Array.from(soundCache.values()).map((sound) => sound.unloadAsync())
  );
  soundCache.clear();
}

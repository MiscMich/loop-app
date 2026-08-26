/**
 * VoiceRecorder - Voice note recording component
 * Uses expo-audio (SDK 54+) + HeroUI + Tailwind
 *
 * Note: expo-audio doesn't expose real-time metering during recording
 * like expo-av did. We use a simulated waveform that approximates
 * natural speech patterns for visual feedback.
 */

import { SafeSymbol } from '@/components/ui/SafeSymbol';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  useAudioRecorder,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { SymbolView, SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/providers/ThemeProvider';
import { logger } from '@/lib/logger';

const MAX_DURATION = 10; // 10 seconds max for voice notes

/**
 * Generate a natural-looking waveform level based on time.
 * Uses multiple sine waves to simulate speech patterns.
 */
const generateNaturalLevel = (timeMs: number): number => {
  const t = timeMs / 1000;
  // Base level with slow variation
  const base = 0.4 + 0.15 * Math.sin(t * 2.5);
  // Medium frequency variation (speech rhythm)
  const speech = 0.2 * Math.sin(t * 8 + Math.cos(t * 3));
  // High frequency variation (phonemes)
  const detail = 0.1 * Math.sin(t * 25 + Math.sin(t * 7));
  // Small random component for natural feel
  const noise = 0.05 * (Math.random() - 0.5);
  // Clamp between 0.2 and 0.95
  return Math.max(0.2, Math.min(0.95, base + speech + detail + noise));
};

interface VoiceRecorderProps {
  onRecordComplete: (uri: string, duration: number, waveform: number[]) => void;
  onCancel?: () => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

export function VoiceRecorder({
  onRecordComplete,
  onCancel,
}: VoiceRecorderProps) {
  const { colors } = useTheme();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const recordingStartTime = useRef(0);

  // expo-audio hooks
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordingUri ?? '');

  // Configure audio mode for recording on mount
  useEffect(() => {
    const setupAudioMode = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (error) {
        logger.error('Failed to configure audio mode', { action: 'setupAudioMode' }, error);
      }
    };
    setupAudioMode();
  }, []);

  // Cleanup ALL intervals on unmount (regardless of recording state)
  useEffect(() => {
    return () => {
      // Clear timer interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear waveform/metering interval
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }
      // Clear playback progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Track player state
  useEffect(() => {
    if (!player) return;

    const handlePlaybackStatus = () => {
      if (player.playing) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    };

    // Poll player state
    const statusInterval = setInterval(handlePlaybackStatus, 100);
    return () => clearInterval(statusInterval);
  }, [player]);

  const startRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        logger.error('Permission to record was denied', { action: 'startRecording' });
        return;
      }

      // Ensure audio mode is set before recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      audioRecorder.record();
      setRecordingState('recording');
      setDuration(0);
      durationRef.current = 0;
      recordingStartTime.current = Date.now();
      setWaveform([]);

      intervalRef.current = setInterval(() => {
        durationRef.current += 0.1;
        setDuration(durationRef.current);

        if (durationRef.current >= MAX_DURATION) {
          stopRecording();
        }
      }, 100);

      // Waveform visualization (simulated - expo-audio doesn't expose metering)
      meteringIntervalRef.current = setInterval(() => {
        if (audioRecorder.isRecording) {
          const elapsed = Date.now() - recordingStartTime.current;
          const level = generateNaturalLevel(elapsed);
          setWaveform((prev) => [...prev.slice(-49), level]);
        }
      }, 100);

      // Auto-stop after max duration
      setTimeout(() => {
        if (audioRecorder.isRecording) {
          stopRecording();
        }
      }, MAX_DURATION * 1000);
    } catch (error) {
      logger.error('Failed to start recording', { action: 'startRecording' }, error);
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (!audioRecorder.isRecording) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (meteringIntervalRef.current) clearInterval(meteringIntervalRef.current);

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (uri) {
        setRecordingUri(uri);
        setRecordingState('preview');
      }
    } catch (error) {
      logger.error('Failed to stop recording', { action: 'stopRecording' }, error);
    }
  }, [audioRecorder]);

  const playPreview = useCallback(async () => {
    if (!player || !recordingUri) return;

    try {
      player.seekTo(0);
      player.play();
      setIsPlaying(true);
      setProgress(0);

      const startTime = Date.now();
      const recordedDuration = durationRef.current;

      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progressPercent = Math.min((elapsed / recordedDuration) * 100, 100);
        setProgress(progressPercent);

        if (progressPercent >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setIsPlaying(false);
          setProgress(0);
        }
      }, 50);
    } catch (error) {
      logger.error('Failed to play preview', { action: 'playPreview' }, error);
    }
  }, [player, recordingUri]);

  const stopPreview = useCallback(async () => {
    if (!player) return;
    try {
      player.pause();
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } catch (error) {
      logger.error('Failed to stop preview', { action: 'stopPreview' }, error);
    }
  }, [player]);

  const handleConfirm = useCallback(() => {
    if (recordingUri) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRecordComplete(recordingUri, durationRef.current, waveform);
    }
  }, [recordingUri, waveform, onRecordComplete]);

  const handleDiscard = useCallback(async () => {
    if (player) {
      player.pause();
    }
    setRecordingUri(null);
    setRecordingState('idle');
    setDuration(0);
    durationRef.current = 0;
    setWaveform([]);
    setProgress(0);
  }, [player]);

  const formatDuration = (seconds: number) => {
    const s = Math.floor(seconds);
    return `0:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 p-6 items-center justify-center" style={{ backgroundColor: colors.background.DEFAULT }}>
      {/* Waveform Display */}
      <View className="w-full h-[100px] justify-center items-center mb-6">
        {waveform.length > 0 ? (
          <View className="flex-row items-center gap-[3px] h-[60px]">
            {waveform.map((level, i) => (
              <View
                key={i}
                className="w-1 bg-primary rounded-sm"
                style={{
                  height: Math.max(4, level * 60),
                  opacity: recordingState === 'preview' ? 0.6 : 1,
                }}
              />
            ))}
          </View>
        ) : (
          <Text className="text-base" style={{ color: colors.text.tertiary }}>
            {recordingState === 'idle' ? 'Tap to record' : 'Recording...'}
          </Text>
        )}
      </View>

      {/* Duration */}
      <View className="flex-row items-baseline mb-8">
        <Text className="text-5xl font-bold" style={{ color: colors.text.DEFAULT }}>
          {formatDuration(duration)}
        </Text>
        <Text className="text-base ml-1" style={{ color: colors.text.tertiary }}>
          / 0:{MAX_DURATION}
        </Text>
      </View>

      {/* Progress Bar (Preview Mode) */}
      {recordingState === 'preview' && (
        <View className="w-full h-[3px] bg-gray-200 rounded-sm mb-8 overflow-hidden">
          <View className="h-full bg-primary rounded-sm" style={{ width: `${progress}%` }} />
        </View>
      )}

      {/* Controls */}
      <View className="items-center justify-center h-[100px]">
        {recordingState === 'idle' && (
          <Pressable
            onPress={startRecording}
            className="w-20 h-20 rounded-full bg-primary justify-center items-center shadow-lg active:scale-95"
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            accessibilityHint={`Record a voice note up to ${MAX_DURATION} seconds`}
          >
            <SafeSymbol name="mic.fill" size={32} tintColor={colors.text.inverse} />
          </Pressable>
        )}

        {recordingState === 'recording' && (
          <Pressable
            onPress={stopRecording}
            className="w-20 h-20 rounded-full bg-red-600 justify-center items-center shadow-lg active:scale-95"
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            accessibilityHint="Stops the current recording and shows preview"
          >
            <SafeSymbol name="stop.fill" size={32} tintColor={colors.text.inverse} />
          </Pressable>
        )}

        {recordingState === 'preview' && (
          <View className="flex-row items-center gap-6" accessibilityRole="toolbar">
            <Pressable
              onPress={handleDiscard}
              className="w-14 h-14 rounded-full bg-red-50 justify-center items-center active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Discard recording"
              accessibilityHint="Deletes this recording and lets you record again"
            >
              <SafeSymbol name="trash" size={24} tintColor={colors.error} />
            </Pressable>

            <Pressable
              onPress={isPlaying ? stopPreview : playPreview}
              className="w-20 h-20 rounded-full bg-accent justify-center items-center shadow-lg active:scale-95"
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
              accessibilityHint={isPlaying ? 'Pauses playback' : 'Plays back your recording'}
              accessibilityState={{ selected: isPlaying }}
            >
              <SafeSymbol
                name={isPlaying ? 'pause.fill' : 'play.fill'}
                size={32}
              tintColor={colors.text.inverse}
              />
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              className="w-14 h-14 rounded-full bg-green-500 justify-center items-center active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Send voice note"
              accessibilityHint={`Sends your ${formatDuration(duration)} voice note`}
            >
              <SafeSymbol name="checkmark" size={24} tintColor={colors.text.inverse} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Cancel Button */}
      {onCancel && recordingState === 'idle' && (
        <Pressable onPress={onCancel} className="mt-6 p-3">
          <Text className="text-base" style={{ color: colors.text.tertiary }}>
            Cancel
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default VoiceRecorder;

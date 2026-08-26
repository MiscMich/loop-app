import React, { useEffect } from 'react';
import { StyleSheet , Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { colors, animation } from '@/lib/theme';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';

/**
 * ConnectionStatus - Banner that appears when Supabase realtime is disconnected
 *
 * Features:
 * - Shows when realtime connection is lost
 * - Animated slide-in/out from top
 * - "Reconnecting..." state with spinner
 * - Warm coral color from theme
 * - Safe area aware
 * - Auto-hides when connection restored
 */
export function ConnectionStatus() {
  const { isConnected, isReconnecting } = useRealtimeStatus();
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  // Show banner when disconnected or reconnecting
  const shouldShow = !isConnected;

  // Animate banner in/out based on connection status
  useEffect(() => {
    if (shouldShow) {
      // Slide in from top
      translateY.value = withSpring(0, animation.springs.responsive);
      opacity.value = withTiming(1, { duration: animation.duration.fast });
    } else {
      // Slide out to top
      translateY.value = withSpring(-100, animation.springs.responsive);
      opacity.value = withTiming(0, { duration: animation.duration.fast });
    }
  }, [shouldShow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        animatedStyle,
      ]}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        {isReconnecting ? (
          <>
            <ActivityIndicator size="small" color={colors.text.inverse} />
            <Text style={styles.text}>Reconnecting...</Text>
          </>
        ) : (
          <>
            <WifiOff
              size={20}
              color={colors.text.inverse}
              strokeWidth={2.5}
            />
            <Text style={styles.text}>
              Connection lost. Trying to reconnect...
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary.DEFAULT, // Warm coral
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 9998, // Below OfflineBanner (9999) but above content
    // Shadow for depth
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
    letterSpacing: 0.2,
  },
});

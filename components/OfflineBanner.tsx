import React, { useEffect } from 'react';
import { StyleSheet , Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { runtimeConfig } from '@/lib/config';

/**
 * OfflineBanner - Fixed position banner that appears when offline
 *
 * Features:
 * - Animated slide-in/out from top
 * - Warm warning color from theme
 * - Safe area aware
 * - Icon + clear message
 */
export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const shouldShow = !runtimeConfig.demoMode && !isConnected;

  // Animation values
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  // Animate banner in/out based on connection status
  useEffect(() => {
    if (shouldShow) {
      // Slide in from top
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      // Slide out to top
      translateY.value = withSpring(-100, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withTiming(0, { duration: 300 });
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
        <WifiOff
          size={20}
          color={colors.text.inverse}
          strokeWidth={2.5}
        />
        <Text style={styles.text}>
          You're offline. Some features may not work.
        </Text>
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
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 9999,
    // Shadow for depth
    shadowColor: colors.warning,
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

/**
 * Modal Screen - Example iOS 26 Liquid Glass Modal
 *
 * Demonstrates the GlassCard component with native liquid glass effects.
 * Falls back to BlurView on older iOS versions and Android.
 */

import { StatusBar } from 'expo-status-bar';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/providers/ThemeProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';

export default function ModalScreen() {
  const { colors, isDark } = useTheme();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View
      className="flex-1 items-center justify-center px-5"
      style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }}
    >
      <GlassCard
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        glassStyle="regular"
        style={{
          width: '100%',
          maxWidth: 360,
        }}
      >
        {/* Close button */}
        <Pressable
          onPress={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <X size={20} color={colors.text.secondary} strokeWidth={2.5} />
        </Pressable>

        {/* Content */}
        <View className="items-center pt-2">
          <Text
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text.DEFAULT }}
          >
            iOS 26 Liquid Glass
          </Text>
          <View
            className="my-4 h-px w-4/5"
            style={{ backgroundColor: colors.separator }}
          />
          <Text
            className="text-base text-center mb-6 px-2"
            style={{ color: colors.text.secondary }}
          >
            This modal uses the native iOS 26 liquid glass effect when available,
            with automatic fallback to BlurView on older devices.
          </Text>

          {/* Feature list */}
          <View className="w-full space-y-2 mb-6">
            <FeatureItem text="Native iOS 26 liquid glass" available={process.env.EXPO_OS === 'ios'} />
            <FeatureItem text="BlurView fallback" available={true} />
            <FeatureItem text="Dark mode support" available={true} />
            <FeatureItem text="Accessibility compliant" available={true} />
          </View>

          <PillButton
            title="Got it"
            onPress={handleClose}
            style={{ width: '100%' }}
          />
        </View>
      </GlassCard>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={process.env.EXPO_OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

function FeatureItem({ text, available }: { text: string; available: boolean }) {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center gap-2 px-2">
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{ backgroundColor: available ? colors.success.DEFAULT : colors.text.tertiary }}
      >
        <Text className="text-white text-xs font-bold">
          {available ? '\u2713' : '\u2717'}
        </Text>
      </View>
      <Text style={{ color: colors.text.secondary }} className="text-sm">
        {text}
      </Text>
    </View>
  );
}

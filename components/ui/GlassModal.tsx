/**
 * GlassModal - iOS 26 Liquid Glass modal background component
 *
 * A modal wrapper that applies liquid glass effects to modal overlays.
 * Uses expo-glass-effect for native glass on iOS 26+, falls back to BlurView.
 *
 * Usage:
 * <GlassModal visible={isVisible} onClose={handleClose}>
 *   <View>Your modal content here</View>
 * </GlassModal>
 */

import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { GlassStyle } from 'expo-glass-effect';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { borderRadius } from '@/lib/theme';

interface GlassModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close (tap outside, etc.) */
  onClose?: () => void;
  /** Modal content */
  children: React.ReactNode;
  /** Animation type */
  animationType?: 'none' | 'slide' | 'fade';
  /** Allow closing by tapping backdrop */
  closeOnBackdrop?: boolean;
  /** Use liquid glass for the backdrop (default: true) */
  useGlassBackdrop?: boolean;
  /** Use liquid glass for the content container (default: false) */
  useGlassContent?: boolean;
  /** Glass effect style */
  glassStyle?: GlassStyle;
  /** Backdrop blur intensity (for fallback) */
  backdropIntensity?: number;
  /** Content container style */
  contentStyle?: StyleProp<ViewStyle>;
  /** Present from bottom (sheet-like) */
  presentationStyle?: 'center' | 'bottom';
}

export function GlassModal({
  visible,
  onClose,
  children,
  animationType = 'fade',
  closeOnBackdrop = true,
  useGlassBackdrop = true,
  useGlassContent = false,
  glassStyle = 'regular',
  backdropIntensity = 60,
  contentStyle,
  presentationStyle = 'center',
}: GlassModalProps) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Determine if we should use liquid glass
  const shouldUseLiquidGlass =
    useGlassBackdrop &&
    process.env.EXPO_OS === 'ios' &&
    isLiquidGlassAvailable();

  const tintColor = isDark
    ? 'rgba(30, 30, 46, 0.4)'
    : 'rgba(255, 255, 255, 0.4)';

  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const renderBackdrop = () => {
    if (shouldUseLiquidGlass) {
      return (
        <GlassView
          glassEffectStyle={glassStyle}
          tintColor={tintColor}
          style={StyleSheet.absoluteFill}
        />
      );
    }

    return (
      <BlurView
        intensity={backdropIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
    );
  };

  const renderContent = () => {
    const contentContainerStyle = [
      styles.contentContainer,
      {
        backgroundColor: colors.surface.DEFAULT,
        shadowColor: colors.text.DEFAULT,
      },
      presentationStyle === 'bottom' && {
        ...styles.bottomSheet,
        paddingBottom: insets.bottom + 20,
      },
      contentStyle,
    ];

    if (useGlassContent && shouldUseLiquidGlass) {
      return (
        <GlassView
          glassEffectStyle={glassStyle}
          tintColor={isDark ? 'rgba(30, 30, 46, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
          style={contentContainerStyle}
        >
          {children}
        </GlassView>
      );
    }

    return (
      <View style={contentContainerStyle}>
        {children}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            {renderBackdrop()}
            {/* Semi-transparent dark overlay for contrast */}
            <View style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)' }
            ]} />
          </Animated.View>
        </Pressable>

        {/* Content */}
        <View
          style={[
            styles.contentWrapper,
            presentationStyle === 'bottom' && styles.bottomWrapper,
          ]}
          pointerEvents="box-none"
        >
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  bottomWrapper: {
    justifyContent: 'flex-end',
  },

  contentContainer: {
    borderRadius: borderRadius['2xl'],
    padding: 20,
    minWidth: 280,
    maxWidth: '90%',
    // Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },

  bottomSheet: {
    width: '100%',
    maxWidth: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
});

export default GlassModal;

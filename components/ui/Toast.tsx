/**
 * Toast Component - Warm Sunrise Design
 *
 * Non-blocking toast notifications matching the Dribbble-inspired design system.
 * Uses pill shapes, SF Pro font, and appropriate color semantics.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Toast, { BaseToast, ToastConfigParams } from 'react-native-toast-message';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '@/lib/theme';

// =============================================================================
// TOAST VARIANTS
// =============================================================================

interface ToastProps extends ToastConfigParams<any> {
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Success Toast - Lime Green (#97DC38)
 * For successful actions, confirmations, achievements
 */
function SuccessToast({ text1, text2, onPress, onRetry, retryLabel }: ToastProps) {
  return (
    <View
      style={{
        width: '90%',
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: borderRadius.pill,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 4,
        borderLeftColor: colors.success.DEFAULT,
        ...shadows.lg,
      }}
    >
      {/* Icon + Content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.success.DEFAULT,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <CheckCircle size={20} color={colors.text.inverse} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSize.subheadline,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.DEFAULT,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
          {text2 && (
            <Text
              style={{
                fontSize: typography.fontSize.footnote,
                fontWeight: typography.fontWeight.regular,
                color: colors.text.secondary,
              }}
              numberOfLines={2}
            >
              {text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={({ pressed }) => ({
          padding: spacing.sm,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <X size={18} color={colors.text.tertiary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/**
 * Error Toast - Coral Red (#FF6B6B)
 * For errors, failures, destructive actions
 */
function ErrorToast({ text1, text2, onPress, onRetry, retryLabel }: ToastProps) {
  return (
    <View
      style={{
        width: '90%',
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: borderRadius.pill,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        ...shadows.lg,
      }}
    >
      {/* Icon + Content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.error,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <AlertCircle size={20} color={colors.text.inverse} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSize.subheadline,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.DEFAULT,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
          {text2 && (
            <Text
              style={{
                fontSize: typography.fontSize.footnote,
                fontWeight: typography.fontWeight.regular,
                color: colors.text.secondary,
              }}
              numberOfLines={2}
            >
              {text2}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {onRetry && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRetry();
              Toast.hide();
            }}
            style={({ pressed }) => ({
              paddingVertical: spacing.sm - 2,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.pill,
              backgroundColor: colors.error,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: typography.fontSize.footnote,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.inverse,
              }}
            >
              {retryLabel || 'Retry'}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          style={({ pressed }) => ({
            padding: spacing.sm,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <X size={18} color={colors.text.tertiary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Info Toast - Lavender (#A1A8EA)
 * For informational messages, tips, neutral updates
 */
function InfoToast({ text1, text2, onPress, onRetry, retryLabel }: ToastProps) {
  return (
    <View
      style={{
        width: '90%',
        backgroundColor: colors.surface.DEFAULT,
        borderRadius: borderRadius.pill,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 4,
        borderLeftColor: colors.info,
        ...shadows.lg,
      }}
    >
      {/* Icon + Content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.info,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Info size={20} color={colors.text.inverse} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.fontSize.subheadline,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.DEFAULT,
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {text1}
          </Text>
          {text2 && (
            <Text
              style={{
                fontSize: typography.fontSize.footnote,
                fontWeight: typography.fontWeight.regular,
                color: colors.text.secondary,
              }}
              numberOfLines={2}
            >
              {text2}
            </Text>
          )}
        </View>
      </View>

      {/* Close Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={({ pressed }) => ({
          padding: spacing.sm,
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <X size={18} color={colors.text.tertiary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// =============================================================================
// TOAST CONFIG
// =============================================================================

export const toastConfig = {
  success: (props: ToastConfigParams<any>) => <SuccessToast {...props} />,
  error: (props: ToastConfigParams<any>) => <ErrorToast {...props} />,
  info: (props: ToastConfigParams<any>) => <InfoToast {...props} />,
};

// =============================================================================
// TOAST ROOT COMPONENT
// =============================================================================

/**
 * ToastRoot - Must be placed at the root of the app
 * Add to app/_layout.tsx after all other providers
 */
export function ToastRoot() {
  return (
    <Toast
      config={toastConfig}
      position="top"
      topOffset={process.env.EXPO_OS === 'ios' ? 60 : 40}
      visibilityTime={4000}
      autoHide
      onPress={() => Toast.hide()}
    />
  );
}

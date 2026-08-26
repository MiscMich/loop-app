/**
 * Toast Demo - Example usage patterns
 *
 * This file demonstrates how to use the toast notification system.
 * Import and use these patterns in your components.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { showToast, showSuccessToast, showErrorToast, showInfoToast } from '@/lib/toast';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';

export function ToastDemo() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.title2,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.DEFAULT,
          marginBottom: spacing.md,
        }}
      >
        Toast Notification Demo
      </Text>

      {/* Success Examples */}
      <View style={{ gap: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.fontSize.subheadline,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            marginTop: spacing.md,
          }}
        >
          Success Toasts (Green)
        </Text>

        <DemoButton
          label="Simple Success"
          onPress={() => showSuccessToast('Profile updated!')}
        />

        <DemoButton
          label="Success with Description"
          onPress={() =>
            showSuccessToast('Content sent!', 'Your doodle was delivered to 3 friends')
          }
        />

        <DemoButton
          label="Game Won"
          onPress={() =>
            showSuccessToast('You won!', 'Beat Alex at tic-tac-toe')
          }
        />
      </View>

      {/* Error Examples */}
      <View style={{ gap: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.fontSize.subheadline,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            marginTop: spacing.md,
          }}
        >
          Error Toasts (Coral Red)
        </Text>

        <DemoButton
          label="Simple Error"
          onPress={() => showErrorToast('Upload failed')}
        />

        <DemoButton
          label="Error with Description"
          onPress={() =>
            showErrorToast('Network error', 'Check your internet connection')
          }
        />

        <DemoButton
          label="Error with Retry Action"
          onPress={() =>
            showErrorToast(
              'Upload failed',
              'Check your internet connection',
              {
                label: 'Retry',
                onPress: () => {
                  console.log('Retrying...');
                  showInfoToast('Retrying upload...');
                },
              }
            )
          }
        />
      </View>

      {/* Info Examples */}
      <View style={{ gap: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.fontSize.subheadline,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            marginTop: spacing.md,
          }}
        >
          Info Toasts (Lavender)
        </Text>

        <DemoButton
          label="Simple Info"
          onPress={() => showInfoToast('New friend request')}
        />

        <DemoButton
          label="Info with Description"
          onPress={() =>
            showInfoToast('Friend request', 'Sarah wants to connect with you')
          }
        />

        <DemoButton
          label="Widget Updated"
          onPress={() =>
            showInfoToast('Widget synced', 'Latest content is now visible on your home screen')
          }
        />
      </View>

      {/* Advanced Examples */}
      <View style={{ gap: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.fontSize.subheadline,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            marginTop: spacing.md,
          }}
        >
          Advanced Usage
        </Text>

        <DemoButton
          label="Custom Duration (2s)"
          onPress={() =>
            showToast({
              type: 'info',
              message: 'Quick message',
              description: 'This will disappear quickly',
              duration: 2000,
            })
          }
        />

        <DemoButton
          label="Long Duration (10s)"
          onPress={() =>
            showToast({
              type: 'success',
              message: 'Read this carefully',
              description: 'This toast stays visible for 10 seconds',
              duration: 10000,
            })
          }
        />

        <DemoButton
          label="No Haptics"
          onPress={() =>
            showToast({
              type: 'info',
              message: 'Silent notification',
              description: 'No haptic feedback',
              disableHaptics: true,
            })
          }
        />
      </View>
    </ScrollView>
  );
}

// Demo button component
function DemoButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface.DEFAULT,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.separator,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: typography.fontSize.body,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.DEFAULT,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

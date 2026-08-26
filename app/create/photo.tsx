/**
 * Photo Screen - Two-Step Photo Sharing
 *
 * Step 1: Take or pick a photo
 * Step 2: Select which friends to send it to
 *
 * This clarifies the UX: "Who will see my photo?"
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  X,
  Camera,
  ArrowLeft,
  SwitchCamera,
  ImageIcon,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useReducedMotion,
} from 'react-native-reanimated';

import { FriendSelector } from '@/components/FriendSelector';
import { useContentStore , useAuthStore } from '@/stores';
import { useFriendsStore } from '@/stores/friendsStore';
import { useTheme } from '@/providers/ThemeProvider';
import { colors as themeColors, spacing, typography, borderRadius } from '@/lib/theme';
import { PermissionError, ErrorState, ErrorBanner } from '@/components/states';

type Step = 'capture' | 'preview' | 'select-friends';

interface SavedPhoto {
  uri: string;
  caption?: string;
}

export default function PhotoScreen() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion() ?? false;

  // State
  const [step, setStep] = useState<Step>('capture');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [savedPhoto, setSavedPhoto] = useState<SavedPhoto | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Store selectors
  const addToSent = useContentStore((state) => state.addToSent);
  const user = useAuthStore((state) => state.user);
  const friends = useFriendsStore((state) => state.friends);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    setIsTakingPhoto(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setStep('preview');
      }
    } catch (err) {
      setError('Failed to take photo. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTakingPhoto(false);
    }
  }, [isTakingPhoto]);

  const handlePickImage = useCallback(async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep('preview');
    }
  }, []);

  const handleRetake = useCallback(() => {
    Haptics.selectionAsync();
    setPhotoUri(null);
    setCaption('');
    setStep('capture');
  }, []);

  // Move from preview to friend selection (Step 2 -> Step 3)
  const handleConfirmPhoto = useCallback(() => {
    if (!photoUri) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavedPhoto({ uri: photoUri, caption: caption.trim() || undefined });
    setStep('select-friends');
  }, [photoUri, caption]);

  // Handle friend selection and send
  const handleFriendsSelect = useCallback(async (friendIds: string[]) => {
    if (!savedPhoto || !user || friendIds.length === 0) return;

    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Create photo content for each selected friend
      for (const friendId of friendIds) {
        const friend = friends.find((f) => f.id === friendId);
        const photoContent = {
          id: `photo_${Date.now()}_${friendId}`,
          type: 'photo' as const,
          senderId: user.id,
          senderName: user.displayName,
          senderAvatar: user.avatarUrl,
          recipientId: friendId,
          recipientName: friend?.displayName,
          createdAt: new Date().toISOString(),
          reactions: [],
          imageUrl: savedPhoto.uri,
          caption: savedPhoto.caption,
        };

        addToSent(photoContent);
      }

      router.back();
    } catch (err) {
      setError('Failed to send photo. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [savedPhoto, user, friends, addToSent]);

  const toggleFacing = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (step === 'select-friends') {
      setStep('preview');
      setSavedPhoto(null);
    } else if (step === 'preview') {
      setStep('capture');
      setPhotoUri(null);
      setCaption('');
    } else {
      router.back();
    }
  }, [step]);

  // Loading state
  if (!permission) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background.DEFAULT }]}>
        <ActivityIndicator size="large" color={themeColors.primary.DEFAULT} />
      </View>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background.DEFAULT }]}
        edges={['top']}
      >
        <PermissionError permissionType="camera" />
      </SafeAreaView>
    );
  }

  // Auth check
  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.DEFAULT }}>
        <ErrorState
          type="generic"
          title="Sign In Required"
          message="Please sign in to share photos with friends."
          onRetry={() => router.back()}
          retryLabel="Go Back"
        />
      </SafeAreaView>
    );
  }

  // Get step info for indicator
  const getStepNumber = () => {
    switch (step) {
      case 'capture': return 1;
      case 'preview': return 2;
      case 'select-friends': return 3;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: step === 'capture' ? '#000000' : colors.background.DEFAULT }]}
      edges={['top']}
    >
      {/* Header */}
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(300)}
        style={[styles.header, { backgroundColor: colors.background.DEFAULT }]}
      >
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={step === 'capture' ? 'Close' : 'Go back'}
          style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
        >
          {step === 'capture' ? (
            <X size={22} color={colors.text.DEFAULT} />
          ) : (
            <ArrowLeft size={22} color={colors.text.DEFAULT} />
          )}
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent.DEFAULT }]}>
            <Camera size={16} color={colors.text.inverse} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text.DEFAULT }]}>
            {step === 'capture' ? 'Photo' : step === 'preview' ? 'Preview' : 'Send to Friends'}
          </Text>
        </View>

        {step === 'capture' ? (
          <Pressable
            onPress={toggleFacing}
            accessibilityRole="button"
            accessibilityLabel="Switch camera"
            style={[styles.headerButton, { backgroundColor: colors.background.secondary }]}
          >
            <SwitchCamera size={22} color={colors.text.DEFAULT} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </Animated.View>

      {/* Step Indicator */}
      <View style={[styles.stepIndicator, { backgroundColor: colors.background.DEFAULT }]}>
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                getStepNumber() >= 1
                  ? getStepNumber() > 1 ? colors.success.DEFAULT : colors.primary.DEFAULT
                  : colors.separator,
            },
          ]}
        />
        <View
          style={[
            styles.stepLine,
            {
              backgroundColor:
                getStepNumber() >= 2
                  ? colors.success.DEFAULT
                  : colors.separator,
            },
          ]}
        />
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                getStepNumber() >= 2
                  ? getStepNumber() > 2 ? colors.success.DEFAULT : colors.primary.DEFAULT
                  : colors.separator,
            },
          ]}
        />
        <View
          style={[
            styles.stepLine,
            {
              backgroundColor:
                getStepNumber() >= 3
                  ? colors.success.DEFAULT
                  : colors.separator,
            },
          ]}
        />
        <View
          style={[
            styles.stepDot,
            {
              backgroundColor:
                getStepNumber() === 3
                  ? colors.primary.DEFAULT
                  : colors.separator,
            },
          ]}
        />
      </View>
      <View style={[styles.stepLabels, { backgroundColor: colors.background.DEFAULT }]}>
        <Text
          style={[
            styles.stepLabel,
            { color: getStepNumber() === 1 ? colors.text.DEFAULT : colors.text.tertiary },
          ]}
        >
          Capture
        </Text>
        <Text
          style={[
            styles.stepLabel,
            { color: getStepNumber() === 2 ? colors.text.DEFAULT : colors.text.tertiary },
          ]}
        >
          Preview
        </Text>
        <Text
          style={[
            styles.stepLabel,
            { color: getStepNumber() === 3 ? colors.text.DEFAULT : colors.text.tertiary },
          ]}
        >
          Send
        </Text>
      </View>

      {/* Step Content */}
      {step === 'capture' ? (
        <Animated.View
          key="capture"
          entering={reducedMotion ? undefined : FadeIn}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Error Banner */}
          {error ? (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={handleTakePhoto}
              style={styles.errorBanner}
            />
          ) : null}

          {/* Camera */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
          </View>

          {/* Controls */}
          <View style={[styles.controls, { backgroundColor: colors.background.DEFAULT }]}>
            <Pressable
              onPress={handlePickImage}
              accessibilityRole="button"
              accessibilityLabel="Choose from library"
              style={[styles.controlButton, { backgroundColor: colors.background.secondary }]}
            >
              <ImageIcon size={26} color={colors.text.DEFAULT} />
            </Pressable>

            <Pressable
              onPress={handleTakePhoto}
              disabled={isTakingPhoto}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={[
                styles.shutterButton,
                { borderColor: themeColors.primary.DEFAULT, backgroundColor: colors.background.pure },
              ]}
            >
              <View style={[styles.shutterInner, { backgroundColor: themeColors.primary.DEFAULT }]}>
                {isTakingPhoto ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : null}
              </View>
            </Pressable>

            <View style={styles.controlSpacer} />
          </View>
        </Animated.View>
      ) : step === 'preview' ? (
        <Animated.View
          key="preview"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Preview */}
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: photoUri! }}
              style={styles.previewImage}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Photo preview"
            />
          </View>

          {/* Caption */}
          <View style={[styles.captionContainer, { backgroundColor: colors.background.DEFAULT }]}>
            <View style={[styles.captionInput, { backgroundColor: colors.background.secondary }]}>
              <TextInput
                style={[styles.captionTextInput, { color: colors.text.DEFAULT }]}
                placeholder="Add a caption (optional)..."
                placeholderTextColor={colors.text.tertiary}
                value={caption}
                onChangeText={setCaption}
                maxLength={100}
                multiline
                accessibilityLabel="Photo caption"
              />
            </View>

            {/* Continue Button */}
            <Pressable
              onPress={handleConfirmPhoto}
              style={[styles.continueButton, { backgroundColor: themeColors.primary.DEFAULT }]}
              accessibilityRole="button"
              accessibilityLabel="Continue to select friends"
            >
              <Text style={[styles.continueButtonText, { color: colors.text.inverse }]}>Continue</Text>
              <Check size={20} color={colors.text.inverse} />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key="select-friends"
          entering={reducedMotion ? undefined : FadeInDown.springify()}
          exiting={reducedMotion ? undefined : FadeOut.duration(200)}
          style={styles.content}
        >
          {/* Show photo preview */}
          {savedPhoto && (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: savedPhoto.uri }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.photoPreviewText}>
                <Text style={[styles.previewTitle, { color: colors.text.DEFAULT }]}>
                  Your photo is ready!
                </Text>
                {savedPhoto.caption ? (
                  <Text style={[styles.previewCaption, { color: colors.text.secondary }]} numberOfLines={1}>
                    "{savedPhoto.caption}"
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <FriendSelector
            onSelect={handleFriendsSelect}
            onCancel={handleBack}
            contentType="photo"
            title="Who should see this?"
            subtitle="Your photo will appear on their widget"
            isLoading={isSending}
          />
        </Animated.View>
      )}

      {/* Loading Overlay */}
      {isSending ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.loadingOverlay}
        >
          <View style={[styles.loadingCard, { backgroundColor: colors.background.secondary }]}>
            <ActivityIndicator size="large" color={themeColors.primary.DEFAULT} />
            <Text style={[styles.loadingText, { color: colors.text.DEFAULT }]}>
              Sending photo...
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: spacing.xs,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 50,
    marginBottom: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.fontSize.caption1,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSpacer: {
    width: 56,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
  },
  captionContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  captionInput: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  captionTextInput: {
    padding: spacing.md,
    minHeight: 60,
    fontSize: typography.fontSize.body,
    textAlignVertical: 'top',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.separator,
    marginBottom: spacing.sm,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: '#000000',
  },
  photoPreviewText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  previewTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  previewCaption: {
    fontSize: typography.fontSize.caption1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
});

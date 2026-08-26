/**
 * Edit Profile Screen
 * Allows users to update their profile information
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Card } from 'heroui-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import { AnimatedButton } from '@/components/ui';

export default function EditProfileScreen() {
  const { user, updateProfile, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to login if not authenticated (defensive check)
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to edit your profile.',
        [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
      );
    }
  }, [isAuthenticated]);

  const hasChanges =
    displayName !== (user?.displayName || '') ||
    username !== (user?.username || '') ||
    bio !== (user?.bio || '') ||
    avatarUrl !== (user?.avatarUrl || '');

  const handlePickImage = useCallback(async () => {
    Haptics.selectionAsync();

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    Haptics.selectionAsync();

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  }, []);

  const handleChangePhoto = useCallback(() => {
    Haptics.selectionAsync();
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickImage },
      ...(avatarUrl ? [{ text: 'Remove Photo', onPress: () => setAvatarUrl(''), style: 'destructive' as const }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [avatarUrl, handlePickImage, handleTakePhoto]);

  const validateUsername = (value: string): boolean => {
    // Username: 3-20 chars, lowercase letters, numbers, underscores only
    const regex = /^[a-z0-9_]{3,20}$/;
    return regex.test(value);
  };

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Name', 'Please enter your display name.');
      return;
    }

    if (!username.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Username', 'Please enter a username.');
      return;
    }

    if (!validateUsername(username.toLowerCase())) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Invalid Username',
        'Username must be 3-20 characters, using only lowercase letters, numbers, and underscores.'
      );
      return;
    }

    setIsSaving(true);
    Haptics.selectionAsync();

    try {
      // Simulate network delay for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateProfile({
        displayName: displayName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, username, bio, avatarUrl, updateProfile]);

  const handleCancel = useCallback(() => {
    Haptics.selectionAsync();
    if (hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [hasChanges]);

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.background.DEFAULT }}
      className="flex-1"
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          className="flex-row items-center justify-between px-4 py-3"
        >
          <Pressable
            onPress={handleCancel}
            className="px-4 py-2 -ml-4"
          >
            <Text
              style={{ color: colors.text.DEFAULT }}
              className="text-base font-medium"
            >
              Cancel
            </Text>
          </Pressable>

          <Text
            style={{ color: colors.text.DEFAULT }}
            className="text-lg font-semibold"
          >
            Edit Profile
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-4 py-2 -mr-4"
            style={{ opacity: hasChanges && !isSaving ? 1 : 0.5 }}
          >
            <Text
              style={{ color: colors.primary.DEFAULT }}
              className="text-base font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Avatar Section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            className="items-center py-6"
          >
            <Pressable onPress={handleChangePhoto} className="relative">
              <Avatar
                size="lg"
                alt={displayName || 'Profile'}
                className="w-28 h-28"
              >
                {avatarUrl ? (
                  <Avatar.Image source={{ uri: avatarUrl }} />
                ) : null}
                <Avatar.Fallback
                  style={{ backgroundColor: colors.primary.DEFAULT }}
                >
                  <Text className="text-4xl font-bold text-white">
                    {(displayName || 'U').charAt(0).toUpperCase()}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <View
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full items-center justify-center border-4"
                style={{
                  backgroundColor: colors.primary.DEFAULT,
                  borderColor: colors.background.DEFAULT,
                }}
              >
                <SafeSymbol name="camera.fill" size={18} tintColor={colors.text.inverse} />
              </View>
            </Pressable>
            <Pressable onPress={handleChangePhoto} className="mt-3">
              <Text
                style={{ color: colors.primary.DEFAULT }}
                className="text-base font-medium"
              >
                Change Photo
              </Text>
            </Pressable>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            className="px-5"
          >
            <Card variant="secondary" className="rounded-[23px] p-1">
              {/* Display Name */}
              <View className="p-4">
                <Text
                  style={{ color: colors.text.tertiary }}
                  className="text-xs font-medium mb-2"
                >
                  DISPLAY NAME
                </Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.text.tertiary}
                  style={{ color: colors.text.DEFAULT }}
                  className="text-base font-medium py-2"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={50}
                />
              </View>

              <View
                style={{ backgroundColor: colors.separator }}
                className="h-px mx-4"
              />

              {/* Username */}
              <View className="p-4">
                <Text
                  style={{ color: colors.text.tertiary }}
                  className="text-xs font-medium mb-2"
                >
                  USERNAME
                </Text>
                <View className="flex-row items-center">
                  <Text
                    style={{ color: colors.text.tertiary }}
                    className="text-base font-medium"
                  >
                    @
                  </Text>
                  <TextInput
                    value={username}
                    onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    placeholderTextColor={colors.text.tertiary}
                    style={{ color: colors.text.DEFAULT }}
                    className="flex-1 text-base font-medium py-2"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                </View>
                <Text
                  style={{ color: colors.text.tertiary }}
                  className="text-xs mt-1"
                >
                  3-20 characters, letters, numbers, underscores
                </Text>
              </View>

              <View
                style={{ backgroundColor: colors.separator }}
                className="h-px mx-4"
              />

              {/* Bio */}
              <View className="p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    style={{ color: colors.text.tertiary }}
                    className="text-xs font-medium"
                  >
                    BIO
                  </Text>
                  <Text
                    style={{ color: colors.text.tertiary }}
                    className="text-xs"
                  >
                    {bio.length}/150
                  </Text>
                </View>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell your friends about yourself..."
                  placeholderTextColor={colors.text.tertiary}
                  style={{ color: colors.text.DEFAULT }}
                  className="text-base py-2"
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                  textAlignVertical="top"
                />
              </View>
            </Card>
          </Animated.View>

          {/* Tips */}
          <Animated.View
            entering={FadeIn.duration(400).delay(300)}
            className="px-5 mt-6"
          >
            <View
              style={{ backgroundColor: colors.background.secondary }}
              className="p-4 rounded-2xl flex-row items-start"
            >
              <SafeSymbol
                name="info.circle"
                size={20}
                tintColor={colors.text.tertiary}
                style={{ marginTop: 2 }}
              />
              <View className="flex-1 ml-3">
                <Text
                  style={{ color: colors.text.secondary }}
                  className="text-sm leading-5"
                >
                  Your display name is visible to your friends. Your username is
                  how friends can find and add you.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

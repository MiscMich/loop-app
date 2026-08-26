/**
 * Profile Setup Screen - REQUIRED Registration
 *
 * PRD Flow: This is a REQUIRED step before accessing the app
 * - User arrives here AFTER drawing their first doodle
 * - Apple Sign In is REQUIRED to use the app
 * - No skip option - users must create an account
 * - Keeps doodle data to sync after signup
 *
 * Best Practices Applied:
 * - Lucide icons (consistent icon library)
 * - Optimized Zustand selectors
 * - useReducedMotion for accessibility
 * - Proper accessibility labels
 * - Spring physics animations
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, UserPlus, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Input, Label, TextField, PressableFeedback } from 'heroui-native';
import Animated, {
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/providers/ThemeProvider';
import {
  StaggerContainer,
  GradientBackground,
} from '@/components/ui';
import { colors as themeColors } from '@/lib/theme';

export default function SignupScreen() {
  const { doodleData, friendName } = useLocalSearchParams<{
    doodleData?: string;
    friendName?: string;
  }>();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  const { colors } = useTheme();

  // Optimized selectors
  const setOnboarded = useAuthStore((state) => state.setOnboarded);
  const signInWithApple = useAuthStore((state) => state.signInWithApple);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const reducedMotion = useReducedMotion() ?? false;

  // Check Apple Auth availability
  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
  }, []);

  // Pre-fill name if user came from "Already have account" flow
  useEffect(() => {
    if (isAuthenticated && user?.displayName && !displayName) {
      setDisplayName(user.displayName);
    }
  }, [isAuthenticated, user?.displayName]);

  // Validate form
  const isValid = displayName.trim().length >= 2 && username.trim().length >= 3;
  const showNameError = displayName.length > 0 && displayName.trim().length < 2;
  const showUsernameError = username.length > 0 && username.trim().length < 3;

  // Continue with Apple
  const handleContinueWithApple = useCallback(async () => {
    if (!displayName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (!isAuthenticated) {
        await signInWithApple();
      }

      try {
        await updateProfile({
          displayName: displayName.trim(),
          username: username.toLowerCase().trim(),
        });
      } catch (profileError: any) {
        const errorMessage = profileError?.message?.toLowerCase() || '';
        if (errorMessage.includes('username') && errorMessage.includes('taken')) {
          Alert.alert(
            'Username Taken',
            'This username is already in use. Please choose a different one.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw profileError;
      }

      // TODO: If doodleData exists, queue it for sync

      // Don't set onboarded yet - that happens after widget tutorial
      // User is now authenticated, proceed to widget setup
      router.push('/onboarding/widget');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert(
        'Something Went Wrong',
        'Could not complete setup. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [displayName, username, isAuthenticated, signInWithApple, updateProfile, setOnboarded, doodleData]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    router.back();
  }, []);

  return (
    <GradientBackground preset="onboarding" useSafeArea>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <PressableFeedback
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to drawing"
              style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
            >
              <ArrowLeft size={22} color={colors.text.DEFAULT} />
            </PressableFeedback>
            <View style={styles.headerSpacer} />
          </View>

          <StaggerContainer staggerDelay={100} initialDelay={100}>
            {/* Title Section - Value-focused messaging */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(100).springify()}
              style={styles.titleSection}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: themeColors.primary.DEFAULT,
                    shadowColor: themeColors.primary.DEFAULT,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  },
                ]}
              >
                <UserPlus size={28} color={colors.text.inverse} />
              </View>
              <Text
                style={[styles.title, { color: colors.text.DEFAULT }]}
                accessibilityRole="header"
              >
                Save your Loop
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                {friendName
                  ? `Keep your doodle for ${friendName} safe`
                  : 'Create an account to save your creations'}
              </Text>
            </Animated.View>

            {/* Benefits callout */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(150).springify()}
              style={[styles.benefitsCard, { backgroundColor: `${colors.primary.DEFAULT}12` }]}
            >
              <Sparkles size={16} color={themeColors.primary.DEFAULT} />
              <Text style={[styles.benefitsText, { color: colors.text.secondary }]}>
                Your doodles will sync across devices and notify your friends
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(200).springify()}
              style={styles.form}
            >
              {/* Display Name Field */}
              <TextField style={styles.fieldContainer}>
                <Label>
                  Your Name
                </Label>
                <Input
                  placeholder="How should friends call you?"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.DEFAULT,
                    },
                  ]}
                  placeholderTextColor={colors.text.tertiary}
                  accessibilityLabel="Your display name"
                />
                {showNameError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Please enter at least 2 characters.
                  </Text>
                ) : (
                  <Text style={[styles.fieldHint, { color: colors.text.tertiary }]}>
                    Use your real name so friends recognize you.
                  </Text>
                )}
              </TextField>

              {/* Username Field */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
                  Username
                </Text>
                <View
                  style={[styles.usernameInputContainer, { backgroundColor: colors.background.secondary }]}
                >
                  <Text style={[styles.usernamePrefix, { color: colors.text.tertiary }]}>
                    @
                  </Text>
                  <TextInput
                    style={[styles.usernameInput, { color: colors.text.DEFAULT }]}
                    placeholder="yourname"
                    placeholderTextColor={colors.text.tertiary}
                    value={username}
                    onChangeText={(text) =>
                      setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect={false}
                    accessibilityLabel="Username"
                  />
                </View>
                {showUsernameError ? (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    Username must be at least 3 characters.
                  </Text>
                ) : (
                  <Text style={[styles.fieldHint, { color: colors.text.tertiary }]}>
                    Letters, numbers, and underscores only.
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Continue Button */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
            >
              {isAuthenticated ? (
                <PressableFeedback
                  onPress={handleContinueWithApple}
                  isDisabled={isLoading || !isValid}
                  accessibilityRole="button"
                  accessibilityLabel="Complete profile setup"
                  style={[
                    styles.continueButton,
                    {
                      backgroundColor: isValid ? themeColors.primary.DEFAULT : colors.background.secondary,
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Text
                      style={[
                        styles.continueButtonText,
                        { color: isValid ? colors.text.inverse : colors.text.tertiary },
                      ]}
                    >
                      Continue
                    </Text>
                  )}
                </PressableFeedback>
              ) : isAppleAuthAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={23}
                  style={styles.appleAuthButton}
                  onPress={handleContinueWithApple}
                />
              ) : (
                <PressableFeedback
                  onPress={handleContinueWithApple}
                  isDisabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                  style={[styles.appleButton, { backgroundColor: colors.background.secondary }]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.text.DEFAULT} />
                  ) : (
                    <>
                      <Text style={styles.appleIcon}></Text>
                      <Text style={[styles.appleText, { color: colors.text.DEFAULT }]}>
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </PressableFeedback>
              )}
            </Animated.View>

            {/* Validation Hint */}
            {!isValid && (displayName.trim().length > 0 || username.trim().length > 0) ? (
              <Animated.View
                entering={reducedMotion ? undefined : FadeInDown.delay(350).springify()}
              >
                <Text style={[styles.validationHint, { color: colors.text.tertiary }]}>
                  {displayName.trim().length < 2
                    ? 'Name must be at least 2 characters'
                    : 'Username must be at least 3 characters'}
                </Text>
              </Animated.View>
            ) : null}

            {/* Terms */}
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(450).springify()}
            >
              <Text
                style={[styles.termsText, { color: colors.text.tertiary }]}
                accessibilityRole="text"
              >
                By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
              </Text>
            </Animated.View>
          </StaggerContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  benefitsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  benefitsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  textInput: {
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  usernameInputContainer: {
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  usernamePrefix: {
    fontSize: 16,
    marginRight: 2,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  appleAuthButton: {
    width: '100%',
    height: 56,
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeColors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  validationHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 23,
    gap: 12,
  },
  appleIcon: {
    fontSize: 22,
  },
  appleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});

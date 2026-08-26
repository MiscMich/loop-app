/**
 * UnderlinedInput - Dribbble-style minimal underlined input
 *
 * Features:
 * - No border, just bottom underline
 * - Uppercase label above
 * - Focus state with primary color underline
 * - Animated focus transitions
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography, animation } from '@/lib/theme';

interface UnderlinedInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function UnderlinedInput({
  label,
  hint,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}: UnderlinedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const underlineWidth = useSharedValue(1);
  const underlineColor = useSharedValue<string>(colors.separator);

  const animatedUnderlineStyle = useAnimatedStyle(() => ({
    borderBottomWidth: underlineWidth.value,
    borderBottomColor: underlineColor.value,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    underlineWidth.value = withTiming(2, { duration: animation.duration.fast });
    underlineColor.value = error ? colors.error : colors.primary.DEFAULT;
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    underlineWidth.value = withTiming(1, { duration: animation.duration.fast });
    underlineColor.value = error ? colors.error : colors.separator;
    onBlur?.(e);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle, error && styles.labelError]}>
          {label}
        </Text>
      )}
      <Animated.View style={[styles.container, animatedUnderlineStyle]}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.text.muted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
      </Animated.View>
      {(hint || error) && (
        <Text style={[styles.hint, error && styles.hintError]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },

  label: {
    fontSize: typography.fontSize.caption1,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },

  labelError: {
    color: colors.error,
  },

  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    paddingVertical: 4,
  },

  input: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.DEFAULT,
    paddingVertical: 8,
  },

  hint: {
    fontSize: typography.fontSize.caption1,
    color: colors.text.tertiary,
    marginTop: 6,
  },

  hintError: {
    color: colors.error,
  },
});

export default UnderlinedInput;

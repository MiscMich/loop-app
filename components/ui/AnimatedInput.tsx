/**
 * AnimatedInput - Text input using HeroUI Native TextField
 *
 * Wraps HeroUI TextField with Loop's design system
 * Features: label, icon, error/hint states, focus animation
 */

import React, { useState, useCallback } from 'react';
import { View , TextInputProps, ViewStyle } from 'react-native';
import { Description, FieldError, Input, Label, TextField, useThemeColor } from 'heroui-native';
import { type SFSymbol } from 'expo-symbols';
import { SafeSymbol } from '@/components/ui/SafeSymbol';
import { useTheme } from '@/providers/ThemeProvider';

interface AnimatedInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  icon?: SFSymbol;
  error?: string;
  hint?: string;
  isRequired?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function AnimatedInput({
  label,
  icon,
  error,
  hint,
  isRequired = false,
  onFocus,
  onBlur,
  className = '',
  style,
  value,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
  onChangeText,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const themeColorMuted = useThemeColor('muted');
  const { colors } = useTheme();

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const isInvalid = Boolean(error);

  return (
    <TextField
      isRequired={isRequired}
      isInvalid={isInvalid}
      className={className}
      style={style}
    >
      {label && <Label>{label}</Label>}
      <View className="relative">
        {icon && (
          <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
            <SafeSymbol
              name={icon}
              size={18}
              tintColor={isFocused ? colors.accent.DEFAULT : themeColorMuted}
            />
          </View>
        )}
        <Input
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          className={icon ? 'pl-10' : ''}
          {...props}
        />
      </View>
      {hint && !error && (
        <Description>{hint}</Description>
      )}
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  );
}

export default AnimatedInput;

/**
 * Content Stack Layout
 * Handles content detail screens with proper navigation
 */

import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';

export default function ContentLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.DEFAULT,
        },
        headerTintColor: colors.primary.DEFAULT,
        headerTitleStyle: {
          color: colors.text.DEFAULT,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Content',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

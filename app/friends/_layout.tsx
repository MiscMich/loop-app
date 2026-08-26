/**
 * Friends Stack Layout
 * Handles friend profile and add friend screens
 */

import { Stack } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';

export default function FriendsLayout() {
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
        name="add"
        options={{
          title: 'Add Friend',
          headerBackTitle: 'Back',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

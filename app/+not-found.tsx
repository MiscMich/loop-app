import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        className="flex-1 items-center justify-center p-5"
        style={{ backgroundColor: colors.background.DEFAULT }}
      >
        <Text
          className="text-xl font-bold mb-4"
          style={{ color: colors.text.DEFAULT }}
        >
          This screen doesn't exist.
        </Text>

        <Link href="/" className="mt-4 py-4">
          <Text
            className="text-sm"
            style={{ color: colors.primary.DEFAULT }}
          >
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

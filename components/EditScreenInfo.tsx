/**
 * EditScreenInfo - Development helper component
 * Shows file path info for debugging (development only)
 */

import React from 'react';
import { View, Text, Linking, Pressable } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export default function EditScreenInfo({ path }: { path: string }) {
  const { colors } = useTheme();

  return (
    <View className="items-center">
      <View className="items-center mx-12">
        <Text
          className="text-[17px] leading-6 text-center"
          style={{ color: colors.text.secondary }}
        >
          Open up the code for this screen:
        </Text>

        <View
          className="my-2 px-1 rounded"
          style={{ backgroundColor: colors.background.secondary }}
        >
          <Text
            className="font-mono text-sm"
            style={{ color: colors.text.DEFAULT }}
          >
            {path}
          </Text>
        </View>

        <Text
          className="text-[17px] leading-6 text-center"
          style={{ color: colors.text.secondary }}
        >
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View className="mt-4 mx-5 items-center">
        <Pressable
          className="py-4"
          onPress={() =>
            Linking.openURL(
              'https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet'
            )
          }
        >
          <Text
            className="text-center text-sm"
            style={{ color: colors.primary.DEFAULT }}
          >
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

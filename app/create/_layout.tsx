import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="doodle" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="mood" />
      <Stack.Screen name="voice" />
      <Stack.Screen name="game" />
    </Stack>
  );
}

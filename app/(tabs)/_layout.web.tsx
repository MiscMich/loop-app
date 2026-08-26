import { Tabs } from 'expo-router';
import { Bell, Home, PlusCircle, User, Users } from 'lucide-react-native';
import { useWindowDimensions } from 'react-native';
import { useColors } from '@/providers/ThemeProvider';

const icon = (IconComponent: typeof Home) =>
  function TabBarIcon({ color, size }: { color: string; size: number }) {
    return <IconComponent color={color} size={size} strokeWidth={2.2} />;
  };

export default function WebTabLayout() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const tabWidth = Math.min(width, 720);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.DEFAULT,
          borderTopColor: colors.background.tertiary,
          position: 'absolute',
          left: (width - tabWidth) / 2,
          bottom: compact ? 0 : 14,
          width: tabWidth,
          height: 66,
          borderRadius: compact ? 0 : 20,
          paddingTop: 7,
          paddingBottom: 7,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends', tabBarIcon: icon(Users) }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: icon(PlusCircle) }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: icon(Bell) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon(User) }} />
    </Tabs>
  );
}

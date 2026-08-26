import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect, useCallback, useRef } from 'react';
import 'react-native-reanimated';
import { HeroUINativeProvider, PortalHost } from 'heroui-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, LogBox, AppState, AppStateStatus } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

// Initialize Sentry as early as possible for crash reporting
import { initSentry, setUserContext } from '@/lib/sentry';
import { queryClient, setupNetworkListener, setupAppFocusListener } from '@/lib/queryClient';

// Uniwind + HeroUI global styles
import '../global.css';

import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { SupabaseRealtimeProvider } from '@/providers/SupabaseRealtimeProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { colors, darkColors } from '@/lib/theme';
import { useWidgetSyncOnForeground } from '@/hooks/useWidgetSync';
import { useAuthStore } from '@/stores/authStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ToastRoot } from '@/components/ui/Toast';
import { parseInviteLink, isInviteLink } from '@/lib/smsInvite';
import { initSounds, preloadSounds } from '@/lib/sounds';
import { ensureBucketsExist } from '@/lib/supabase/storage';
import { initOfflineSync } from '@/hooks/useOfflineSync';
initSentry();

// Ignore expected native module errors in dev client (these modules require EAS build)
// These are gracefully handled with fallbacks but Metro still shows the error overlay
LogBox.ignoreLogs([
  'Cannot find native module',
  'ExpoSecureStore',
  'ExpoNetwork',
  'ExpoDevice',
  'ExpoPushTokenManager',
  'ExpoGlassEffect',
  'SymbolModule',
  'NativeViewManagerAdapter',
  // Reanimated warnings about layout animations (cosmetic, not breaking)
  'Property "transform" of AnimatedComponent',
]);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary as ExpoErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Setup React Query network and focus listeners once
  const networkCleanupRef = useRef<(() => void) | null>(null);
  const focusCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Setup network-aware query management
    networkCleanupRef.current = setupNetworkListener();
    focusCleanupRef.current = setupAppFocusListener();

    return () => {
      networkCleanupRef.current?.();
      focusCleanupRef.current?.();
    };
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize sound system after app loads
      initSounds()
        .then(() => {
          preloadSounds(['tap', 'select', 'pop', 'success', 'send']).catch((err) => {
            // Non-critical: sounds will load on-demand if preload fails
            if (__DEV__) console.warn('Sound preload failed:', err);
          });
        })
        .catch((err) => {
          // Non-critical: app works without sounds
          if (__DEV__) console.warn('Sound initialization failed:', err);
        });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SupabaseRealtimeProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
          </SupabaseRealtimeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Custom navigation theme using the Warm Sunrise palette
const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.DEFAULT,
    background: colors.background.DEFAULT,
    card: colors.background.DEFAULT,
    text: colors.text.DEFAULT,
    border: colors.separator,
    notification: colors.primary.DEFAULT,
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary.DEFAULT,
    background: darkColors.background.DEFAULT,
    card: darkColors.background.secondary,
    text: darkColors.text.DEFAULT,
    border: darkColors.separator,
    notification: darkColors.primary.DEFAULT,
  },
};

function RootLayoutNav() {
  const { isDark } = useTheme();
  // Use individual selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Track app state for session revalidation
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Update Sentry user context when user changes
  useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } else {
      setUserContext(null);
    }
  }, [user]);

  // Initialize auth on mount and revalidate when app returns to foreground
  useEffect(() => {
    initializeAuth();

    // Revalidate session when app comes back to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - revalidate session
        initializeAuth();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // Initialize storage buckets after auth is ready (non-blocking)
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Run async without blocking - buckets only need to exist before first upload
    ensureBucketsExist().catch((err) => {
      // Non-critical: will retry on next app launch
      if (__DEV__) console.warn('Storage bucket initialization failed:', err);
    });
  }, [isLoading, isAuthenticated]);

  // Initialize offline content sync after auth is ready
  const offlineSyncCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      // Cleanup if user logs out
      offlineSyncCleanupRef.current?.();
      offlineSyncCleanupRef.current = null;
      return;
    }

    // Initialize offline sync - processes queued content when online
    offlineSyncCleanupRef.current = initOfflineSync(user.id);

    return () => {
      offlineSyncCleanupRef.current?.();
      offlineSyncCleanupRef.current = null;
    };
  }, [isLoading, isAuthenticated, user?.id]);

  // Handle deep link invites
  const handleDeepLink = useCallback((event: { url: string }) => {
    const { url } = event;
    if (isInviteLink(url)) {
      const invite = parseInviteLink(url);
      if (invite) {
        // Show welcome message and navigate to add friends
        Alert.alert(
          'Welcome to Loop!',
          `${invite.inviterName} invited you to connect on Loop. Add them as a friend to start sharing!`,
          [
            {
              text: 'Add Friend',
              onPress: () => {
                // Navigate to add friend screen
                // The inviter info could be pre-filled in a future enhancement
                router.push('/friends/add');
              },
            },
            {
              text: 'Later',
              style: 'cancel',
            },
          ]
        );
      }
    }
  }, []);

  // Listen for deep links
  useEffect(() => {
    // Don't process deep links until auth is initialized
    if (isLoading) return;

    // Handle deep links when app is opened from link
    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && isInviteLink(initialUrl)) {
        // Only handle invite if user is authenticated
        if (isAuthenticated) {
          handleDeepLink({ url: initialUrl });
        } else {
          // Store pending deep link to handle after auth
          // Or just ignore - user will need to click link again after signing in
          if (__DEV__) console.log('Deep link received before auth, ignoring:', initialUrl);
        }
      }
    };

    checkInitialUrl();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      if (isAuthenticated) {
        handleDeepLink(event);
      }
    });
    return () => subscription.remove();
  }, [handleDeepLink, isLoading, isAuthenticated]);

  // Navigation guard to prevent double-replace
  const isNavigatingRef = useRef(false);

  // Handle authentication and onboarding redirect
  // CRITICAL: Users MUST be authenticated to access the main app
  useEffect(() => {
    if (!navigationState?.key || isLoading) return;
    if (isNavigatingRef.current) return; // Prevent double navigation

    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inOnboarding) {
      // User not authenticated - must go through onboarding/signup
      isNavigatingRef.current = true;
      router.replace('/onboarding');
      setTimeout(() => { isNavigatingRef.current = false; }, 500);
    } else if (isAuthenticated && !isOnboarded && !inOnboarding) {
      // Authenticated but not finished onboarding (e.g., widget setup)
      isNavigatingRef.current = true;
      router.replace('/onboarding/widget');
      setTimeout(() => { isNavigatingRef.current = false; }, 500);
    } else if (isAuthenticated && isOnboarded && inOnboarding) {
      // User is fully authenticated and onboarded, redirect to tabs
      isNavigatingRef.current = true;
      router.replace('/(tabs)');
      setTimeout(() => { isNavigatingRef.current = false; }, 500);
    }
  }, [isAuthenticated, isOnboarded, isLoading, segments, navigationState?.key]);

  // Sync widget data on app foreground
  useWidgetSyncOnForeground();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <NavigationThemeProvider value={isDark ? DarkNavigationTheme : LightNavigationTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="create" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="game" options={{ headerShown: false }} />
            <Stack.Screen name="content" options={{ headerShown: false }} />
            <Stack.Screen name="friends" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <PortalHost />
          <OfflineBanner />
          <ToastRoot />
        </NavigationThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

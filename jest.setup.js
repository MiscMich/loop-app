// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Keep native crash reporting out of the Jest runtime.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  wrap: (component) => component,
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
}));

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => ({
    record: jest.fn(),
    stop: jest.fn(),
    isRecording: false,
    uri: 'file:///mock/recording.m4a',
  })),
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    playing: false,
  })),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: 'AppleAuthenticationButton',
  signInAsync: jest.fn(),
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
    CONTINUE: 1,
  },
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
    WHITE_OUTLINE: 2,
  },
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '17.0',
}));

// Mock expo-glass-effect (iOS 26 Liquid Glass)
jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GlassView: React.forwardRef(({ children, style, glassEffectStyle, tintColor, isInteractive, ...props }, ref) => (
      React.createElement(View, { ref, testID: 'glass-view', style, ...props }, children)
    )),
    GlassContainer: React.forwardRef(({ children, style, ...props }, ref) => (
      React.createElement(View, { ref, testID: 'glass-container', style, ...props }, children)
    )),
    isLiquidGlassAvailable: jest.fn(() => false), // Default to false; tests can override
  };
});

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BlurView: React.forwardRef(({ children, style, intensity, tint, ...props }, ref) => (
      React.createElement(View, {
        ref,
        testID: 'blur-view',
        style,
        accessibilityHint: `blur-intensity-${intensity}-${tint}`,
        ...props
      }, children)
    )),
  };
});

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: true })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'ExponentPushToken[test]' })),
  getDevicePushTokenAsync: jest.fn(() => Promise.resolve({ data: 'device-token', type: 'ios' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  getBadgeCountAsync: jest.fn(() => Promise.resolve(0)),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CALENDAR: 'calendar',
  },
}));

// Mock Supabase with proper chaining
const createChainMock = () => {
  const chainMock = {
    select: jest.fn(() => chainMock),
    eq: jest.fn(() => chainMock),
    or: jest.fn(() => chainMock),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    insert: jest.fn(() => chainMock),
    update: jest.fn(() => chainMock),
    delete: jest.fn(() => chainMock),
    upsert: jest.fn(() => chainMock),
  };
  return chainMock;
};

jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => createChainMock()),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test.com/file' } })),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
  isSupabaseConfigured: jest.fn(() => false), // Disable Supabase in tests to use local state only
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    ScrollView: View,
  };
});

// Mock Skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Path: 'Path',
  useTouchHandler: jest.fn(),
  Skia: {
    Path: {
      Make: jest.fn(() => ({
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        close: jest.fn(),
      })),
    },
  },
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

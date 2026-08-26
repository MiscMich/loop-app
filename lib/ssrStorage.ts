/**
 * SSR-safe storage adapters for Zustand and Supabase
 * During SSR (server-side rendering), window/AsyncStorage/SecureStore aren't available
 *
 * SECURITY: Auth tokens are stored in SecureStore (encrypted keychain) when available
 * Non-sensitive data uses AsyncStorage for better performance
 *
 * NOTE: SecureStore requires EAS build (native module). In dev client without EAS build,
 * we gracefully fall back to AsyncStorage with a warning.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';
import { logger } from './logger';

// Check if we're in SSR environment (Node.js without window)
export const isSSR = typeof window === 'undefined';

// Lazy-load SecureStore to avoid crash when native module isn't available
let SecureStore: typeof import('expo-secure-store') | null = null;
let secureStoreChecked = false;
let secureStoreAvailable = false;

async function getSecureStore() {
  if (secureStoreChecked) {
    return SecureStore;
  }

  try {
    // Dynamic import to avoid crash if native module doesn't exist
    SecureStore = await import('expo-secure-store');
    // Test if it actually works by checking if we can call a method
    await SecureStore.getItemAsync('__test__');
    secureStoreAvailable = true;
    logger.debug('Native module available - using encrypted storage', { action: 'getSecureStore' });
  } catch (error) {
    SecureStore = null;
    secureStoreAvailable = false;
    logger.warn('SecureStore native module not available (requires EAS build) - using AsyncStorage fallback', { action: 'getSecureStore' });
  }

  secureStoreChecked = true;
  return SecureStore;
}

/**
 * SSR-safe storage adapter for Zustand persist middleware
 * Returns null/no-op during SSR, uses AsyncStorage on client
 * NOTE: This is for non-sensitive app state, NOT auth tokens
 */
export const ssrSafeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isSSR) return null;
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (isSSR) return;
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (isSSR) return;
    await AsyncStorage.removeItem(name);
  },
};

/**
 * SECURE storage adapter for Supabase auth tokens
 * Uses expo-secure-store (iOS Keychain / Android Keystore) for encryption
 * Falls back to AsyncStorage on web or when SecureStore is unavailable
 *
 * SECURITY: Auth tokens contain sensitive credentials and should be encrypted at rest
 * NOTE: SecureStore requires EAS build - gracefully falls back in dev client
 */
export const supabaseSsrStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isSSR) return null;

    // Try SecureStore first (requires EAS build)
    const store = await getSecureStore();
    if (store && secureStoreAvailable) {
      try {
        return await store.getItemAsync(key);
      } catch (error) {
        // SecureStore can fail in certain edge cases (e.g., device lock state)
        logger.warn('Failed to get item from SecureStore, falling back to AsyncStorage', { action: 'supabaseSsrStorage.getItem', metadata: { key } }, error);
        return AsyncStorage.getItem(key);
      }
    }

    // Fallback to AsyncStorage (web, dev client without EAS build)
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isSSR) return;

    // Try SecureStore first (requires EAS build)
    const store = await getSecureStore();
    if (store && secureStoreAvailable) {
      try {
        await store.setItemAsync(key, value);
        return;
      } catch (error) {
        // SecureStore has a 2048 byte limit per item
        logger.warn('Failed to set item in SecureStore, falling back to AsyncStorage', { action: 'supabaseSsrStorage.setItem', metadata: { key } }, error);
        await AsyncStorage.setItem(key, value);
        return;
      }
    }

    // Fallback to AsyncStorage (web, dev client without EAS build)
    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (isSSR) return;

    // Try to remove from SecureStore if available
    const store = await getSecureStore();
    if (store && secureStoreAvailable) {
      try {
        await store.deleteItemAsync(key);
      } catch (error) {
        logger.warn('Failed to delete item from SecureStore', { action: 'supabaseSsrStorage.removeItem', metadata: { key } }, error);
      }
    }

    // Always try to remove from AsyncStorage (migration cleanup)
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      // Ignore errors on fallback removal
    }
  },
};

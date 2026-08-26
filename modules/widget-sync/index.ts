import { Platform } from 'react-native';

// Type definitions for the native module
interface WidgetSyncModuleType {
  setItem(key: string, value: string): Promise<boolean>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<boolean>;
  getKeysWithPrefix(prefix: string): Promise<string[]>;
  reloadAllTimelines(): Promise<void>;
  reloadTimelines(kind: string): Promise<void>;
  getCurrentConfigurations(): Promise<Array<{ kind: string; family: string }>>;
}

// Get native module with graceful fallback for Expo Go
function getWidgetSyncModule(): WidgetSyncModuleType | null {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    // Only try to load native module in EAS builds
    const { requireNativeModule } = require('expo-modules-core');
    return requireNativeModule('WidgetSync');
  } catch (error) {
    // Expected in Expo Go - native module requires EAS build
    console.log('[WidgetSync] Native module not available (requires EAS build)');
    return null;
  }
}

const WidgetSyncModule: WidgetSyncModuleType | null = getWidgetSyncModule();

// App Groups storage key patterns
export const WIDGET_KEYS = {
  FRIENDS_LIST: 'widget_friends_list',
  FRIEND_DATA_PREFIX: 'widget_friend_',
  LEGACY_WIDGET_DATA: 'widgetData', // For backwards compatibility
  SETTINGS: 'widget_settings',
} as const;

/**
 * Store JSON data in App Groups UserDefaults
 */
export async function setWidgetData<T>(key: string, data: T): Promise<boolean> {
  if (!WidgetSyncModule) {
    console.log('[WidgetSync] Not available on this platform');
    return false;
  }

  try {
    const jsonString = JSON.stringify(data);
    return await WidgetSyncModule.setItem(key, jsonString);
  } catch (error) {
    console.error('[WidgetSync] setWidgetData failed:', error);
    return false;
  }
}

/**
 * Get JSON data from App Groups UserDefaults
 */
export async function getWidgetData<T>(key: string): Promise<T | null> {
  if (!WidgetSyncModule) {
    return null;
  }

  try {
    const jsonString = await WidgetSyncModule.getItem(key);
    if (jsonString) {
      return JSON.parse(jsonString) as T;
    }
    return null;
  } catch (error) {
    console.error('[WidgetSync] getWidgetData failed:', error);
    return null;
  }
}

/**
 * Remove data from App Groups UserDefaults
 */
export async function removeWidgetData(key: string): Promise<boolean> {
  if (!WidgetSyncModule) {
    return false;
  }

  try {
    return await WidgetSyncModule.removeItem(key);
  } catch (error) {
    console.error('[WidgetSync] removeWidgetData failed:', error);
    return false;
  }
}

/**
 * Get all friend data keys
 */
export async function getFriendDataKeys(): Promise<string[]> {
  if (!WidgetSyncModule) {
    return [];
  }

  try {
    return await WidgetSyncModule.getKeysWithPrefix(WIDGET_KEYS.FRIEND_DATA_PREFIX);
  } catch (error) {
    console.error('[WidgetSync] getFriendDataKeys failed:', error);
    return [];
  }
}

/**
 * Reload all widget timelines
 */
export async function reloadAllTimelines(): Promise<void> {
  if (!WidgetSyncModule) {
    return;
  }

  try {
    await WidgetSyncModule.reloadAllTimelines();
  } catch (error) {
    console.error('[WidgetSync] reloadAllTimelines failed:', error);
  }
}

/**
 * Reload specific widget kind
 */
export async function reloadTimelines(kind: string): Promise<void> {
  if (!WidgetSyncModule) {
    return;
  }

  try {
    await WidgetSyncModule.reloadTimelines(kind);
  } catch (error) {
    console.error('[WidgetSync] reloadTimelines failed:', error);
  }
}

/**
 * Check if widget sync is available
 */
export function isWidgetSyncAvailable(): boolean {
  return Platform.OS === 'ios' && WidgetSyncModule !== null;
}

export default {
  setWidgetData,
  getWidgetData,
  removeWidgetData,
  getFriendDataKeys,
  reloadAllTimelines,
  reloadTimelines,
  isWidgetSyncAvailable,
  WIDGET_KEYS,
};

/**
 * Offline content queue with AsyncStorage persistence
 *
 * Stores pending content when offline and syncs when connectivity returns.
 * Queue items are persisted to survive app restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentType } from '@/stores/contentStore';
import { logger } from './logger';

const QUEUE_STORAGE_KEY = 'loop-offline-queue';
const MAX_RETRY_COUNT = 3;

export interface QueuedContent {
  id: string;
  recipientId: string;
  type: ContentType;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

/**
 * Add content to the offline queue
 */
export async function addToQueue(
  recipientId: string,
  type: ContentType,
  data: Record<string, any>
): Promise<QueuedContent> {
  const item: QueuedContent = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    recipientId,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const queue = await getQueue();
  queue.push(item);
  await saveQueue(queue);

  logger.debug('Added item to offline queue', { action: 'addToQueue', metadata: { itemId: item.id, queueSize: queue.length } });

  return item;
}

/**
 * Get all queued items
 */
export async function getQueue(): Promise<QueuedContent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedContent[];
  } catch (error) {
    logger.error('Failed to read offline queue', { action: 'getQueue' }, error);
    return [];
  }
}

/**
 * Get the number of items in the queue
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Remove an item from the queue (after successful sync)
 */
export async function removeFromQueue(itemId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== itemId);
  await saveQueue(filtered);

  logger.debug('Removed item from offline queue', { action: 'removeFromQueue', metadata: { itemId, queueSize: filtered.length } });
}

/**
 * Increment retry count for an item
 * Returns true if item should be retried, false if max retries exceeded
 */
export async function incrementRetryCount(itemId: string): Promise<boolean> {
  const queue = await getQueue();
  const item = queue.find((i) => i.id === itemId);

  if (!item) return false;

  item.retryCount += 1;

  if (item.retryCount >= MAX_RETRY_COUNT) {
    // Remove from queue after max retries
    const filtered = queue.filter((i) => i.id !== itemId);
    await saveQueue(filtered);
    logger.warn('Max retries exceeded for offline queue item', { action: 'incrementRetryCount', metadata: { itemId } });
    return false;
  }

  await saveQueue(queue);
  return true;
}

/**
 * Clear the entire queue (for testing or recovery)
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  logger.debug('Offline queue cleared', { action: 'clearQueue' });
}

/**
 * Save queue to AsyncStorage
 */
async function saveQueue(queue: QueuedContent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    logger.error('Failed to save offline queue', { action: 'saveQueue' }, error);
  }
}

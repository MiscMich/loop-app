import { supabase, isSupabaseConfigured } from '../supabase';
import * as FileSystem from 'expo-file-system';
import { logger } from '@/lib/logger';

// Storage bucket names
export const BUCKETS = {
  AVATARS: 'avatars',
  DOODLES: 'doodles',
  PHOTOS: 'photos',
  VOICE_NOTES: 'voice-notes',
} as const;

type BucketName = typeof BUCKETS[keyof typeof BUCKETS];

// Generate unique filename
const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

// Upload file from URI (React Native)
export const uploadFromUri = async (
  bucket: BucketName,
  uri: string,
  userId: string,
  options?: {
    filename?: string;
    contentType?: string;
  }
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    // Return local URI in offline mode
    return uri;
  }

  try {
    // Determine content type and extension
    const extension = uri.split('.').pop()?.toLowerCase() || 'bin';
    const contentType = options?.contentType || getContentType(extension);
    const filename = options?.filename || generateFilename(userId, extension);
    const path = `${userId}/${filename}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Convert to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, bytes.buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      logger.error(`Upload to ${bucket} error`, { action: 'uploadFromUri', userId }, error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    logger.error('Upload error', { action: 'uploadFromUri', userId }, err);
    return null;
  }
};

// Upload avatar
export const uploadAvatar = async (
  uri: string,
  userId: string
): Promise<string | null> => {
  return uploadFromUri(BUCKETS.AVATARS, uri, userId, {
    contentType: 'image/jpeg',
  });
};

// Upload doodle
export const uploadDoodle = async (
  imageData: string, // Base64 PNG
  userId: string
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    // Return data URI in offline mode
    return `data:image/png;base64,${imageData}`;
  }

  try {
    const filename = generateFilename(userId, 'png');
    const path = `${userId}/${filename}`;

    // Convert base64 to ArrayBuffer
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKETS.DOODLES)
      .upload(path, bytes.buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      logger.error('Upload doodle error', { action: 'uploadDoodle', userId }, error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKETS.DOODLES).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    logger.error('Upload doodle error', { action: 'uploadDoodle', userId }, err);
    return null;
  }
};

// Upload photo
export const uploadPhoto = async (
  uri: string,
  userId: string
): Promise<string | null> => {
  return uploadFromUri(BUCKETS.PHOTOS, uri, userId, {
    contentType: 'image/jpeg',
  });
};

// Upload voice note
export const uploadVoiceNote = async (
  uri: string,
  userId: string
): Promise<string | null> => {
  return uploadFromUri(BUCKETS.VOICE_NOTES, uri, userId, {
    contentType: 'audio/aac',
  });
};

// Get signed URL for private files (voice notes)
export const getSignedUrl = async (
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return path; // Return as-is in offline mode
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    logger.error('Get signed URL error', { action: 'getSignedUrl' }, error);
    return null;
  }

  return data.signedUrl;
};

// Delete file
export const deleteFile = async (
  bucket: BucketName,
  path: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    logger.error('Delete file error', { action: 'deleteFile' }, error);
    return false;
  }

  return true;
};

// Helper to get content type from extension
const getContentType = (extension: string): string => {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
  };
  return types[extension] || 'application/octet-stream';
};

// Create storage buckets (run once during setup)
export const createBuckets = async (): Promise<void> => {
  if (!isSupabaseConfigured()) return;

  const buckets = [
    { name: BUCKETS.AVATARS, public: true },
    { name: BUCKETS.DOODLES, public: true },
    { name: BUCKETS.PHOTOS, public: true },
    { name: BUCKETS.VOICE_NOTES, public: false },
  ];

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
    });

    if (error && !error.message.includes('already exists')) {
      logger.error(`Create bucket ${bucket.name} error`, { action: 'createBuckets' }, error);
    }
  }
};

// Module-level flag to ensure buckets are only initialized once per session
let bucketsInitialized = false;

// Ensure storage buckets exist (safe to call multiple times)
export const ensureBucketsExist = async (): Promise<{ success: boolean; created: string[]; existing: string[] }> => {
  // Prevent multiple calls
  if (bucketsInitialized) {
    logger.info('Storage buckets already initialized this session', { action: 'ensureBucketsExist' });
    return { success: true, created: [], existing: [] };
  }

  if (!isSupabaseConfigured()) {
    logger.info('Supabase not configured, skipping bucket initialization', { action: 'ensureBucketsExist' });
    bucketsInitialized = true;
    return { success: true, created: [], existing: [] };
  }

  const buckets = [
    { name: BUCKETS.AVATARS, public: true },
    { name: BUCKETS.DOODLES, public: true },
    { name: BUCKETS.PHOTOS, public: true },
    { name: BUCKETS.VOICE_NOTES, public: false },
  ];

  const created: string[] = [];
  const existing: string[] = [];
  let hasError = false;

  try {
    // Get list of existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      logger.error('Failed to list buckets', { action: 'ensureBucketsExist' }, listError);
      return { success: false, created: [], existing: [] };
    }

    const existingNames = new Set(existingBuckets?.map(b => b.name) || []);

    // Create only missing buckets
    for (const bucket of buckets) {
      if (existingNames.has(bucket.name)) {
        existing.push(bucket.name);
        continue;
      }

      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
      });

      if (error) {
        // Handle race condition where bucket was created between list and create
        if (error.message.includes('already exists')) {
          existing.push(bucket.name);
        } else {
          logger.error(`Create bucket ${bucket.name} error`, { action: 'ensureBucketsExist' }, error);
          hasError = true;
        }
      } else {
        created.push(bucket.name);
        logger.info(`Created storage bucket: ${bucket.name}`, { action: 'ensureBucketsExist' });
      }
    }

    bucketsInitialized = true;

    if (created.length > 0) {
      logger.info(`Storage buckets initialized`, { action: 'ensureBucketsExist', metadata: { created, existing } });
    }

    return { success: !hasError, created, existing };
  } catch (err) {
    logger.error('Unexpected error initializing buckets', { action: 'ensureBucketsExist' }, err);
    return { success: false, created, existing };
  }
};

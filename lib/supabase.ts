import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase/types';
import { supabaseSsrStorage } from './ssrStorage';
import { logger } from './logger';
import { runtimeConfig } from './config';

// The SDK requires non-empty constructor values. These reserved invalid values
// never receive traffic because every query path checks isSupabaseConfigured().
const SUPABASE_URL = runtimeConfig.supabaseUrl || 'https://example.invalid';
const SUPABASE_ANON_KEY = runtimeConfig.supabaseAnonKey || 'public-demo-placeholder';

// Create Supabase client with SSR-safe storage
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: supabaseSsrStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey && !runtimeConfig.demoMode);
};

// Helper to check if a string is a valid UUID format
export const isValidUUID = (id: string | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Helper to check if we can make Supabase queries (configured + valid user)
export const canQuerySupabase = (userId: string | undefined): boolean => {
  return isSupabaseConfigured() && isValidUUID(userId);
};

// Helper for file uploads
export const uploadFile = async (
  bucket: string,
  path: string,
  file: Blob | ArrayBuffer,
  contentType: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    logger.error('Upload error', { action: 'uploadFile', metadata: { bucket, path } }, error);
    return null;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
};

// Helper to get signed URL for private files
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    logger.error('Signed URL error', { action: 'getSignedUrl', metadata: { bucket, path } }, error);
    return null;
  }

  return data.signedUrl;
};

// Export types
export type { Database };

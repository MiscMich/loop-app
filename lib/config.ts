export type PublicEnvironment = Record<string, string | undefined>;

export interface RuntimeConfig {
  demoMode: boolean;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  sentryDsn: string | null;
}

const enabled = new Set(['1', 'true', 'yes', 'on']);
const disabled = new Set(['0', 'false', 'no', 'off']);

function optional(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isHttpsUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveRuntimeConfig(env: PublicEnvironment): RuntimeConfig {
  const supabaseUrl = optional(env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = optional(env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const sentryDsn = optional(env.EXPO_PUBLIC_SENTRY_DSN);
  const demoValue = env.EXPO_PUBLIC_DEMO_MODE?.trim().toLowerCase();
  const backendConfigured = isHttpsUrl(supabaseUrl) && Boolean(supabaseAnonKey);

  let demoMode = !backendConfigured;
  if (demoValue && enabled.has(demoValue)) demoMode = true;
  if (demoValue && disabled.has(demoValue)) demoMode = false;

  return {
    demoMode,
    supabaseUrl: backendConfigured ? supabaseUrl : null,
    supabaseAnonKey: backendConfigured ? supabaseAnonKey : null,
    sentryDsn: isHttpsUrl(sentryDsn) ? sentryDsn : null,
  };
}

export const runtimeConfig = resolveRuntimeConfig(process.env);

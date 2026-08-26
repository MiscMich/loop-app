import { resolveRuntimeConfig } from '@/lib/config';

describe('public runtime configuration', () => {
  it('defaults to credential-free demo mode', () => {
    expect(resolveRuntimeConfig({})).toEqual({
      demoMode: true,
      supabaseUrl: null,
      supabaseAnonKey: null,
      sentryDsn: null,
    });
  });

  it('never treats a partial or invalid backend configuration as usable', () => {
    expect(resolveRuntimeConfig({ EXPO_PUBLIC_SUPABASE_URL: 'not-a-url' }).supabaseUrl).toBeNull();
    expect(resolveRuntimeConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://example.invalid' }).demoMode).toBe(true);
  });

  it('allows an explicitly configured backend outside demo mode', () => {
    const config = resolveRuntimeConfig({
      EXPO_PUBLIC_DEMO_MODE: 'false',
      EXPO_PUBLIC_SUPABASE_URL: 'https://project.example.invalid',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-public-key',
    });

    expect(config.demoMode).toBe(false);
    expect(config.supabaseUrl).toBe('https://project.example.invalid');
    expect(config.supabaseAnonKey).toBe('placeholder-public-key');
  });

  it('lets demo mode override supplied backend credentials', () => {
    expect(resolveRuntimeConfig({
      EXPO_PUBLIC_DEMO_MODE: 'true',
      EXPO_PUBLIC_SUPABASE_URL: 'https://project.example.invalid',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-public-key',
    }).demoMode).toBe(true);
  });
});

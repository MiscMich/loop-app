# Security Policy

## Supported version

Security fixes are applied to the latest commit on the default branch.

## Reporting a vulnerability

Please use the repository host's private security-advisory feature. Do not open a public issue for an unpatched vulnerability.

Include the affected route or module, reproduction steps, impact, and any suggested mitigation. Avoid sending live credentials or personal data.

## Deployment notes

- Demo mode is local and credential-free.
- Browser-visible `EXPO_PUBLIC_*` values are not secrets.
- A connected Supabase deployment must enforce Row Level Security and least-privilege storage policies.
- Never expose a service-role key to an Expo client.

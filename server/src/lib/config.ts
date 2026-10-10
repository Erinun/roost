// Central environment configuration with production fail-fast.
// A production server that silently falls back to localhost URLs produces
// broken emails, redirects and CORS rules that are hard to trace — better to
// refuse to start.

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function requireInProduction(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (IS_PRODUCTION) {
    throw new Error(`Environment variable ${name} must be set when NODE_ENV=production`);
  }
  return devFallback;
}

// Public URL of the frontend — used in emails, Stripe redirects and notifications
export const FRONTEND_URL = requireInProduction('FRONTEND_URL', 'http://localhost:5000');

// CORS allowlist — defaults to the frontend origin when not explicitly set
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || FRONTEND_URL)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

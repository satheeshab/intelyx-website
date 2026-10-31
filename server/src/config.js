/**
 * Server configuration, read from environment variables (see /.env.example).
 *
 * Local development needs no configuration at all: emails are printed to the
 * console instead of being sent. Production (Lightsail) must set SMTP_* values.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '../..');

/** Loads /.env into process.env when the file exists (never overrides real env vars). */
export function loadEnvFile(file = path.join(REPO_ROOT, '.env')) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* No .env file: that is fine. */
  }
}

const flag = (value, fallback = false) =>
  value === undefined || value === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

const int = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  const smtpHost = (env.SMTP_HOST || '').trim();
  // "smtp" sends real email. "log" prints it to the console (default when no SMTP host is set).
  const transport = (env.EMAIL_TRANSPORT || (smtpHost ? 'smtp' : 'log')).toLowerCase();
  const smtpPort = int(env.SMTP_PORT, 587);

  return {
    nodeEnv,
    isProd,
    port: int(env.PORT, 3001),
    // Behind the Lightsail load balancer there is one proxy hop. Locally, trust loopback
    // so the Vite dev proxy works without rate-limit warnings.
    trustProxy: env.TRUST_PROXY !== undefined && env.TRUST_PROXY !== '' ? int(env.TRUST_PROXY, 1) : isProd ? 1 : 'loopback',
    clientDist: env.CLIENT_DIST ? path.resolve(env.CLIENT_DIST) : path.join(REPO_ROOT, 'client', 'dist'),

    // Redirects (production): send plain-HTTP requests to HTTPS and the bare domain to www.
    forceHttps: flag(env.FORCE_HTTPS, false),
    apexHost: (env.APEX_HOST || '').trim().toLowerCase(), // e.g. intelyx.co.in
    canonicalHost: (env.CANONICAL_HOST || 'www.intelyx.co.in').trim().toLowerCase(),

    rateLimit: {
      windowMs: int(env.RATE_LIMIT_WINDOW_MS, 60_000),
      max: int(env.RATE_LIMIT_MAX, 5), // enquiry submissions per IP per window
    },
    minFillMs: int(env.MIN_FILL_MS, 1500), // faster than this = bot

    mail: {
      transport,
      host: smtpHost,
      port: smtpPort,
      secure: flag(env.SMTP_SECURE, smtpPort === 465),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      toEmail: env.TO_EMAIL || 'office@intelyx.co.in',
      fromEmail: env.FROM_EMAIL || 'no-reply@intelyx.co.in',
      fromName: env.FROM_NAME || 'Intelyx Website',
      sendAck: flag(env.SEND_ACK, false),
      allowLogInProduction: flag(env.ALLOW_LOG_EMAIL, false),
    },
  };
}

/** Throws a readable error when the configuration cannot work. Called once at startup. */
export function assertConfig(config) {
  const { mail } = config;
  if (!['smtp', 'log'].includes(mail.transport)) {
    throw new Error(`EMAIL_TRANSPORT must be "smtp" or "log" (got "${mail.transport}").`);
  }
  if (mail.transport === 'smtp') {
    const missing = ['host', 'user', 'pass'].filter((k) => !mail[k]);
    if (missing.length) {
      const names = missing.map((k) => `SMTP_${k.toUpperCase()}`).join(', ');
      throw new Error(`Email is set to "smtp" but ${names} ${missing.length > 1 ? 'are' : 'is'} missing.`);
    }
  }
  if (config.isProd && mail.transport === 'log' && !mail.allowLogInProduction) {
    throw new Error(
      'Refusing to start in production without email settings: enquiries would be lost. ' +
        'Set SMTP_HOST, SMTP_USER and SMTP_PASS (or ALLOW_LOG_EMAIL=true to run without sending email).',
    );
  }
}

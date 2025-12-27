import crypto from 'crypto';

export function normalizeLicenseKey(rawKey: string): string {
  return rawKey.trim().toUpperCase();
}

export function hashLicenseKey(normalizedKey: string): string {
  const salt = process.env.SESSION_SECRET;
  const input = salt ? `${normalizedKey}:${salt}` : normalizedKey;

  // TODO: Add a dedicated license key salt if SESSION_SECRET is not available.
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateLicenseKey(prefix = 'AUTO'): string {
  const segments = Array.from({ length: 3 }, () =>
    crypto.randomBytes(2).toString('hex').toUpperCase()
  );

  return `${prefix}-${segments.join('-')}`;
}

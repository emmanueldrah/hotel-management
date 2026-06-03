import crypto from 'crypto';

/** Human-friendly unique-ish reference, e.g. RSV-LQ8F3K2A. */
export function generateReference(prefix: string): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${time}${random}`;
}

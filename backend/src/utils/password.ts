import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Returns a cryptographically-random opaque token (used for refresh/reset). */
export function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Deterministic SHA-256 hash for storing tokens at rest. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Basic password strength rule used during validation. */
export function isStrongPassword(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

import { hashPassword, isStrongPassword, sha256, verifyPassword } from './password';
import { signAccessToken, verifyAccessToken } from './jwt';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(await verifyPassword('Password123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('validates password strength', () => {
    expect(isStrongPassword('Password123')).toBe(true);
    expect(isStrongPassword('weak')).toBe(false);
    expect(isStrongPassword('alllowercase1')).toBe(false);
  });

  it('produces a stable sha256 hash', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });
});

describe('jwt utils', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({
      sub: 'user-1',
      email: 'a@b.com',
      role: 'RECEPTIONIST',
      branchId: 'branch-1',
    });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('RECEPTIONIST');
  });

  it('rejects a tampered token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });
});

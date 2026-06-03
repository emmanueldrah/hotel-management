import { RoleName, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import {
  generateOpaqueToken,
  hashPassword,
  sha256,
  verifyPassword,
} from '../../utils/password';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';

interface DeviceInfo {
  ip?: string;
  userAgent?: string;
}

function expiryFromNow(spec: string): Date {
  // supports "7d", "15m", "24h", "3600s"
  const match = /^(\d+)([smhd])$/.exec(spec);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(now + value * multipliers[unit]);
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    hotelId: user.hotelId,
    branchId: user.branchId,
  };
}

async function issueTokens(user: User & { role: { name: RoleName } }, device: DeviceInfo) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
    hotelId: user.hotelId,
    branchId: user.branchId,
  });

  const opaque = generateOpaqueToken();
  const record = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(opaque),
      ipAddress: device.ip,
      userAgent: device.userAgent,
      expiresAt: expiryFromNow(env.JWT_REFRESH_EXPIRES_IN),
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, jti: record.id }) + '.' + opaque;
  return { accessToken, refreshToken };
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: RoleName;
  hotelId?: string;
  branchId?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already registered');

  const roleName: RoleName = input.role ?? 'RECEPTIONIST';
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw ApiError.badRequest('Role not configured. Run database seed.');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      roleId: role.id,
      hotelId: input.hotelId,
      branchId: input.branchId,
    },
    include: { role: true },
  });

  const tokens = await issueTokens(user, {});
  return { user: { ...publicUser(user), role: user.role.name }, ...tokens };
}

export async function loginUser(email: string, password: string, device: DeviceInfo) {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status !== 'ACTIVE') throw ApiError.forbidden('Account is not active');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const tokens = await issueTokens(user, device);
  return { user: { ...publicUser(user), role: user.role.name }, ...tokens };
}

export async function refreshTokens(rawToken: string, device: DeviceInfo) {
  const parts = rawToken.split('.');
  const opaque = parts[parts.length - 1];
  if (!opaque) throw ApiError.unauthorized('Invalid refresh token');

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(opaque) },
    include: { user: { include: { role: true } } },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired or revoked');
  }

  // rotate: revoke old token, issue new pair
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(record.user, device);
  return tokens;
}

export async function logoutUser(rawToken: string) {
  const parts = rawToken.split('.');
  const opaque = parts[parts.length - 1];
  if (!opaque) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(opaque), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function forgotPassword(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // do not leak which emails exist
  const token = generateOpaqueToken(24);
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  // In production this token is emailed; returned here so dev/tests can use it.
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  const valid = await verifyPassword(current, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(next) },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, hotel: true, branch: true },
  });
  if (!user) throw ApiError.notFound('User not found');
  return {
    ...publicUser(user),
    role: user.role.name,
    hotel: user.hotel,
    branch: user.branch,
  };
}

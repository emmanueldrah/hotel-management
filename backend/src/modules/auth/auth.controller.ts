import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/http';
import { writeAudit } from '../../utils/audit';
import * as authService from './auth.service';
import { isProd } from '../../config/env';

const device = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  return sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, device(req));
  return sendSuccess(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshTokens(req.body.refreshToken, device(req));
  return sendSuccess(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.body?.refreshToken) await authService.logoutUser(req.body.refreshToken);
  return sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.sub);
  return sendSuccess(res, result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = await authService.forgotPassword(req.body.email);
  // Never reveal whether the email exists. In non-prod we surface the token to
  // ease testing without an email server.
  return sendSuccess(res, {
    message: 'If the email exists, a reset link has been sent',
    ...(isProd ? {} : { devResetToken: token }),
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return sendSuccess(res, { message: 'Password reset successful' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!.sub, req.body.currentPassword, req.body.newPassword);
  await writeAudit(req, { action: 'PASSWORD_CHANGE', entity: 'User', entityId: req.user!.sub });
  return sendSuccess(res, { message: 'Password changed' });
});

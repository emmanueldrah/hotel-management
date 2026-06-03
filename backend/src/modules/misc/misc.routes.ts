import { Request, Response, Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPagination, sendSuccess } from '../../utils/http';
import { ApiError } from '../../utils/ApiError';

/** Read-only: audit logs. */
export const auditRouter = Router();
auditRouter.use(authenticate);
auditRouter.get(
  '/',
  authorize('audit:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...(req.query.entity ? { entity: req.query.entity as string } : {}),
      ...(req.query.userId ? { userId: req.query.userId as string } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

/** Notifications: list own + mark read. */
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = { userId: req.user!.sub };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.notification.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);
notificationsRouter.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const notif = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.sub },
      data: { status: 'READ', readAt: new Date() },
    });
    if (notif.count === 0) throw ApiError.notFound('Notification not found');
    return sendSuccess(res, { id: req.params.id, read: true });
  }),
);

/** Users management (admin/owner). */
export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get(
  '/',
  authorize('users:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...(req.user?.role !== 'SUPER_ADMIN' && req.user?.hotelId
        ? { hotelId: req.user.hotelId }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          role: { select: { name: true } },
          branchId: true,
          hotelId: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);
usersRouter.patch(
  '/:id/status',
  authorize('users:write'),
  validate(z.object({ body: z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']) }) })),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      select: { id: true, status: true },
    });
    return sendSuccess(res, user);
  }),
);

/** Loyalty: list transactions and award points. */
export const loyaltyRouter = Router();
loyaltyRouter.use(authenticate);
loyaltyRouter.get(
  '/:guestId',
  authorize('loyalty:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const guest = await prisma.guest.findUnique({
      where: { id: req.params.guestId },
      include: { loyaltyEntries: { orderBy: { createdAt: 'desc' } } },
    });
    if (!guest) throw ApiError.notFound('Guest not found');
    return sendSuccess(res, {
      tier: guest.loyaltyTier,
      points: guest.loyaltyPoints,
      transactions: guest.loyaltyEntries,
    });
  }),
);
loyaltyRouter.post(
  '/:guestId/award',
  authorize('loyalty:write'),
  validate(
    z.object({ body: z.object({ points: z.number().int(), reason: z.string().optional() }) }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const guest = await prisma.guest.findUnique({ where: { id: req.params.guestId } });
    if (!guest) throw ApiError.notFound('Guest not found');
    const newPoints = guest.loyaltyPoints + req.body.points;
    const tier =
      newPoints >= 5000
        ? 'PLATINUM'
        : newPoints >= 2000
          ? 'GOLD'
          : newPoints >= 500
            ? 'SILVER'
            : 'BRONZE';
    const [, updated] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: { guestId: guest.id, points: req.body.points, reason: req.body.reason },
      }),
      prisma.guest.update({
        where: { id: guest.id },
        data: { loyaltyPoints: newPoints, loyaltyTier: tier },
      }),
    ]);
    return sendSuccess(res, { tier: updated.loyaltyTier, points: updated.loyaltyPoints });
  }),
);

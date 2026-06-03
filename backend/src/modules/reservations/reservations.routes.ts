import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPagination, sendSuccess } from '../../utils/http';
import { ApiError } from '../../utils/ApiError';
import { writeAudit } from '../../utils/audit';
import * as service from './reservations.service';

const router = Router();
router.use(authenticate);

const reservationStatus = z.enum([
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
]);

const createSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    guestId: z.string().uuid(),
    roomIds: z.array(z.string().uuid()).min(1),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    numGuests: z.number().int().positive().optional(),
    source: z.enum(['ONLINE', 'WALK_IN', 'PHONE', 'OTA']).optional(),
    specialRequests: z.string().optional(),
    promoCode: z.string().optional(),
  }),
});

const availabilitySchema = z.object({
  query: z.object({
    branchId: z.string().uuid().optional(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    roomTypeId: z.string().uuid().optional(),
  }),
});

function resolveBranch(req: Request, provided?: string): string {
  const branchId = provided || req.user?.branchId;
  if (!branchId) throw ApiError.badRequest('branchId is required');
  return branchId;
}

router.get(
  '/availability',
  authorize('reservations:read'),
  validate(availabilitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = resolveBranch(req, req.query.branchId as string | undefined);
    const rooms = await service.findAvailableRooms({
      branchId,
      checkIn: new Date(req.query.checkIn as string),
      checkOut: new Date(req.query.checkOut as string),
      roomTypeId: req.query.roomTypeId as string | undefined,
    });
    return sendSuccess(res, rooms);
  }),
);

router.get(
  '/',
  authorize('reservations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const branchId =
      req.user?.role === 'SUPER_ADMIN'
        ? (req.query.branchId as string | undefined)
        : (req.user?.branchId ?? undefined);
    const { items, total } = await service.listReservations({
      branchId,
      status: req.query.status as never,
      guestId: req.query.guestId as string | undefined,
      skip,
      take: limit,
    });
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.get(
  '/:id',
  authorize('reservations:read'),
  asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await service.getReservation(req.params.id));
  }),
);

router.post(
  '/',
  authorize('reservations:write'),
  validate(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = resolveBranch(req, req.body.branchId);
    const reservation = await service.createReservation({
      ...req.body,
      branchId,
      createdById: req.user?.sub,
    });
    await writeAudit(req, {
      action: 'CREATE',
      entity: 'Reservation',
      entityId: reservation.id,
    });
    return sendSuccess(res, reservation, 201);
  }),
);

router.patch(
  '/:id/status',
  authorize('reservations:write'),
  validate(z.object({ body: z.object({ status: reservationStatus }) })),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = await service.updateStatus(req.params.id, req.body.status);
    await writeAudit(req, {
      action: 'STATUS_CHANGE',
      entity: 'Reservation',
      entityId: req.params.id,
      metadata: { status: req.body.status },
    });
    return sendSuccess(res, updated);
  }),
);

router.post(
  '/:id/check-in',
  authorize('checkin:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = await service.checkIn(req.params.id);
    await writeAudit(req, { action: 'CHECK_IN', entity: 'Reservation', entityId: req.params.id });
    return sendSuccess(res, updated);
  }),
);

router.post(
  '/:id/check-out',
  authorize('checkout:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await service.checkOut(req.params.id);
    await writeAudit(req, { action: 'CHECK_OUT', entity: 'Reservation', entityId: req.params.id });
    return sendSuccess(res, result);
  }),
);

export default router;

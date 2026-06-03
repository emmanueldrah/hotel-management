import { Request, Response, Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPagination, sendSuccess } from '../../utils/http';
import { ApiError } from '../../utils/ApiError';
import { writeAudit } from '../../utils/audit';

const router = Router();
router.use(authenticate);

const status = z.enum(['CLEAN', 'DIRTY', 'IN_PROGRESS', 'INSPECTED']);

const include = {
  room: { select: { id: true, number: true, status: true } },
  assignedTo: { select: { id: true, name: true } },
};

function branchFilter(req: Request) {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId) return { branchId: req.user.branchId };
  if (req.query.branchId) return { branchId: req.query.branchId as string };
  return {};
}

router.get(
  '/',
  authorize('housekeeping:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...branchFilter(req),
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.assignedToId ? { assignedToId: req.query.assignedToId as string } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.housekeeping.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.housekeeping.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.post(
  '/',
  authorize('housekeeping:write'),
  validate(
    z.object({
      body: z.object({
        roomId: z.string().uuid(),
        branchId: z.string().uuid().optional(),
        assignedToId: z.string().uuid().optional(),
        status: status.optional(),
        scheduledFor: z.coerce.date().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const room = await prisma.room.findUnique({ where: { id: req.body.roomId } });
    if (!room) throw ApiError.notFound('Room not found');
    const task = await prisma.housekeeping.create({
      data: { ...req.body, branchId: req.body.branchId ?? room.branchId },
      include,
    });
    await writeAudit(req, { action: 'CREATE', entity: 'Housekeeping', entityId: task.id });
    return sendSuccess(res, task, 201);
  }),
);

router.patch(
  '/:id',
  authorize('housekeeping:write'),
  validate(
    z.object({
      body: z.object({
        status: status.optional(),
        assignedToId: z.string().uuid().nullable().optional(),
        notes: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.housekeeping.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Housekeeping task not found');

    const task = await prisma.housekeeping.update({
      where: { id: req.params.id },
      data: req.body,
      include,
    });

    // When a room is cleaned/inspected, free it up if not occupied.
    if (req.body.status === 'CLEAN' || req.body.status === 'INSPECTED') {
      const room = await prisma.room.findUnique({ where: { id: existing.roomId } });
      if (room && room.status === 'CLEANING') {
        await prisma.room.update({ where: { id: room.id }, data: { status: 'AVAILABLE' } });
      }
    }
    await writeAudit(req, {
      action: 'UPDATE',
      entity: 'Housekeeping',
      entityId: req.params.id,
      metadata: { status: req.body.status },
    });
    return sendSuccess(res, task);
  }),
);

export default router;

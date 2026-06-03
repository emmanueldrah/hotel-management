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

const status = z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']);
const priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const include = {
  room: { select: { id: true, number: true } },
  assignedTo: { select: { id: true, name: true } },
};

function branchFilter(req: Request) {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId) return { branchId: req.user.branchId };
  if (req.query.branchId) return { branchId: req.query.branchId as string };
  return {};
}

router.get(
  '/',
  authorize('maintenance:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...branchFilter(req),
      ...(req.query.status ? { status: req.query.status as never } : {}),
      ...(req.query.priority ? { priority: req.query.priority as never } : {}),
      ...(req.query.assignedToId ? { assignedToId: req.query.assignedToId as string } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.maintenance.findMany({ where, include, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip, take: limit }),
      prisma.maintenance.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.post(
  '/',
  authorize('maintenance:write'),
  validate(
    z.object({
      body: z.object({
        title: z.string().min(1),
        issue: z.string().min(1),
        roomId: z.string().uuid().optional(),
        branchId: z.string().uuid().optional(),
        priority: priority.optional(),
        assignedToId: z.string().uuid().optional(),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    let branchId = req.body.branchId ?? req.user?.branchId;
    if (req.body.roomId) {
      const room = await prisma.room.findUnique({ where: { id: req.body.roomId } });
      if (!room) throw ApiError.notFound('Room not found');
      branchId = branchId ?? room.branchId;
    }
    if (!branchId) throw ApiError.badRequest('branchId is required');

    const ticket = await prisma.maintenance.create({
      data: {
        ...req.body,
        branchId,
        reportedById: req.user?.sub,
        status: req.body.assignedToId ? 'ASSIGNED' : 'OPEN',
      },
      include,
    });
    await writeAudit(req, { action: 'CREATE', entity: 'Maintenance', entityId: ticket.id });
    return sendSuccess(res, ticket, 201);
  }),
);

router.patch(
  '/:id',
  authorize('maintenance:write'),
  validate(
    z.object({
      body: z.object({
        status: status.optional(),
        priority: priority.optional(),
        assignedToId: z.string().uuid().nullable().optional(),
        issue: z.string().optional(),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.maintenance.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Maintenance ticket not found');

    const ticket = await prisma.maintenance.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        ...(req.body.status === 'COMPLETED' ? { resolvedAt: new Date() } : {}),
      },
      include,
    });
    await writeAudit(req, {
      action: 'UPDATE',
      entity: 'Maintenance',
      entityId: req.params.id,
      metadata: { status: req.body.status },
    });
    return sendSuccess(res, ticket);
  }),
);

export default router;

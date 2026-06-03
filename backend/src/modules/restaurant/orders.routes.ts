import { Request, Response, Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPagination, sendSuccess } from '../../utils/http';
import { ApiError } from '../../utils/ApiError';
import { writeAudit } from '../../utils/audit';
import { generateReference } from '../../utils/reference';
import { round2 } from '../../utils/billing';
import { addItem as addInvoiceItem } from '../invoices/invoices.service';

const router = Router();
router.use(authenticate);

const include = {
  items: { include: { menuItem: { select: { id: true, name: true } } } },
  table: { select: { id: true, name: true } },
};

function resolveBranch(req: Request, provided?: string): string {
  const branchId = provided || req.user?.branchId;
  if (!branchId) throw ApiError.badRequest('branchId is required');
  return branchId;
}

router.get(
  '/',
  authorize('restaurant:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...(req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId
        ? { branchId: req.user.branchId }
        : req.query.branchId
          ? { branchId: req.query.branchId as string }
          : {}),
      ...(req.query.status ? { status: req.query.status as never } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.restaurantOrder.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.restaurantOrder.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.post(
  '/',
  authorize('restaurant:write'),
  validate(
    z.object({
      body: z.object({
        branchId: z.string().uuid().optional(),
        tableId: z.string().uuid().optional(),
        reservationId: z.string().uuid().optional(),
        postToRoom: z.boolean().optional(),
        items: z
          .array(
            z.object({
              menuItemId: z.string().uuid(),
              quantity: z.number().int().positive(),
              notes: z.string().optional(),
            }),
          )
          .min(1),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = resolveBranch(req, req.body.branchId);
    const menuIds = req.body.items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuIds } } });
    const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]));
    if (menuItems.length !== new Set(menuIds).size) {
      throw ApiError.badRequest('Some menu items do not exist');
    }

    const orderItems = req.body.items.map(
      (i: { menuItemId: string; quantity: number; notes?: string }) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        unitPrice: priceMap.get(i.menuItemId) ?? 0,
        notes: i.notes,
      }),
    );
    const total = round2(
      orderItems.reduce(
        (s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity,
        0,
      ),
    );

    const order = await prisma.restaurantOrder.create({
      data: {
        reference: generateReference('ORD'),
        branchId,
        tableId: req.body.tableId,
        reservationId: req.body.reservationId,
        postToRoom: req.body.postToRoom ?? false,
        total,
        items: { create: orderItems },
      },
      include,
    });
    await writeAudit(req, { action: 'CREATE', entity: 'RestaurantOrder', entityId: order.id });
    return sendSuccess(res, order, 201);
  }),
);

router.patch(
  '/:id/status',
  authorize('restaurant:write'),
  validate(
    z.object({
      body: z.object({
        status: z.enum(['OPEN', 'PREPARING', 'SERVED', 'BILLED', 'CANCELLED']),
      }),
    }),
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await prisma.restaurantOrder.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include,
    });
    return sendSuccess(res, order);
  }),
);

// Post the order's charges onto a reservation's invoice (room billing).
router.post(
  '/:id/post-to-room',
  authorize('restaurant:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const order = await prisma.restaurantOrder.findUnique({
      where: { id: req.params.id },
      include,
    });
    if (!order) throw ApiError.notFound('Order not found');
    if (!order.reservationId) throw ApiError.badRequest('Order is not linked to a reservation');

    const reservation = await prisma.reservation.findUnique({
      where: { id: order.reservationId },
      include: { invoice: true },
    });
    if (!reservation?.invoice) {
      throw ApiError.badRequest('Reservation has no invoice yet');
    }

    const invoice = await addInvoiceItem(reservation.invoice.id, {
      type: 'RESTAURANT',
      description: `Restaurant order ${order.reference}`,
      quantity: 1,
      unitPrice: Number(order.total),
    });
    await prisma.restaurantOrder.update({ where: { id: order.id }, data: { status: 'BILLED' } });
    await writeAudit(req, { action: 'POST_TO_ROOM', entity: 'RestaurantOrder', entityId: order.id });
    return sendSuccess(res, invoice);
  }),
);

export default router;

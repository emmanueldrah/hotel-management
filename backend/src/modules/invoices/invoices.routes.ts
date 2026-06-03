import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPagination, sendSuccess } from '../../utils/http';
import { ApiError } from '../../utils/ApiError';
import { writeAudit } from '../../utils/audit';
import * as service from './invoices.service';

const router = Router();
router.use(authenticate);

const chargeType = z.enum([
  'ROOM',
  'RESTAURANT',
  'LAUNDRY',
  'MINI_BAR',
  'SERVICE',
  'EVENT',
  'TAX',
  'DISCOUNT',
  'OTHER',
]);

const itemSchema = z.object({
  type: chargeType.optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  taxRate: z.number().min(0).max(100).optional(),
});

const createSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    guestId: z.string().uuid().optional(),
    reservationId: z.string().uuid().optional(),
    notes: z.string().optional(),
    items: z.array(itemSchema).optional(),
  }),
});

function resolveBranch(req: Request, provided?: string): string {
  const branchId = provided || req.user?.branchId;
  if (!branchId) throw ApiError.badRequest('branchId is required');
  return branchId;
}

router.get(
  '/',
  authorize('invoices:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const branchId =
      req.user?.role === 'SUPER_ADMIN'
        ? (req.query.branchId as string | undefined)
        : (req.user?.branchId ?? undefined);
    const { items, total } = await service.listInvoices({
      branchId,
      status: req.query.status as string | undefined,
      guestId: req.query.guestId as string | undefined,
      skip,
      take: limit,
    });
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.get(
  '/:id',
  authorize('invoices:read'),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, await service.getInvoice(req.params.id)),
  ),
);

router.post(
  '/',
  authorize('invoices:write'),
  validate(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = resolveBranch(req, req.body.branchId);
    const invoice = await service.createInvoice({ ...req.body, branchId });
    await writeAudit(req, { action: 'CREATE', entity: 'Invoice', entityId: invoice.id });
    return sendSuccess(res, invoice, 201);
  }),
);

router.post(
  '/:id/items',
  authorize('invoices:write'),
  validate(z.object({ body: itemSchema })),
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await service.addItem(req.params.id, req.body);
    await writeAudit(req, { action: 'ADD_ITEM', entity: 'Invoice', entityId: req.params.id });
    return sendSuccess(res, invoice, 201);
  }),
);

router.delete(
  '/:id/items/:itemId',
  authorize('invoices:write'),
  asyncHandler(async (req: Request, res: Response) =>
    sendSuccess(res, await service.removeItem(req.params.id, req.params.itemId)),
  ),
);

router.post(
  '/:id/issue',
  authorize('invoices:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const invoice = await service.issueInvoice(req.params.id);
    await writeAudit(req, { action: 'ISSUE', entity: 'Invoice', entityId: req.params.id });
    return sendSuccess(res, invoice);
  }),
);

export default router;

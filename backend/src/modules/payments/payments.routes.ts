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
import { recomputeInvoice } from '../invoices/invoices.service';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  body: z.object({
    branchId: z.string().uuid().optional(),
    invoiceId: z.string().uuid().optional(),
    amount: z.number().positive(),
    method: z
      .enum([
        'CASH',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'MOBILE_MONEY',
        'BANK_TRANSFER',
        'STRIPE',
        'PAYPAL',
      ])
      .optional(),
    gateway: z.string().optional(),
    gatewayRef: z.string().optional(),
  }),
});

function resolveBranch(req: Request, provided?: string): string {
  const branchId = provided || req.user?.branchId;
  if (!branchId) throw ApiError.badRequest('branchId is required');
  return branchId;
}

router.get(
  '/',
  authorize('payments:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      ...(req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId
        ? { branchId: req.user.branchId }
        : req.query.branchId
          ? { branchId: req.query.branchId as string }
          : {}),
      ...(req.query.invoiceId ? { invoiceId: req.query.invoiceId as string } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip,
        take: limit,
        include: { invoice: { select: { id: true, number: true } } },
      }),
      prisma.payment.count({ where }),
    ]);
    return sendSuccess(res, items, 200, buildMeta(page, limit, total));
  }),
);

router.post(
  '/',
  authorize('payments:write'),
  validate(createSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const branchId = resolveBranch(req, req.body.invoiceId ? undefined : req.body.branchId);
    let resolvedBranch = branchId;

    if (req.body.invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: req.body.invoiceId } });
      if (!invoice) throw ApiError.notFound('Invoice not found');
      resolvedBranch = invoice.branchId;
    }

    const payment = await prisma.payment.create({
      data: {
        reference: generateReference('PAY'),
        branchId: resolvedBranch,
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        method: req.body.method ?? 'CASH',
        status: 'COMPLETED',
        gateway: req.body.gateway,
        gatewayRef: req.body.gatewayRef,
        receivedById: req.user?.sub,
      },
    });

    let invoice = null;
    if (req.body.invoiceId) invoice = await recomputeInvoice(req.body.invoiceId);

    await writeAudit(req, { action: 'PAYMENT', entity: 'Payment', entityId: payment.id });
    return sendSuccess(res, { payment, invoice }, 201);
  }),
);

router.post(
  '/:id/refund',
  authorize('payments:write'),
  asyncHandler(async (req: Request, res: Response) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) throw ApiError.notFound('Payment not found');
    const refunded = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'REFUNDED' },
    });
    if (payment.invoiceId) await recomputeInvoice(payment.invoiceId);
    await writeAudit(req, { action: 'REFUND', entity: 'Payment', entityId: payment.id });
    return sendSuccess(res, refunded);
  }),
);

export default router;

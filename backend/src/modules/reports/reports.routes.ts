import { Request, Response, Router } from 'express';
import prisma from '../../config/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/http';
import { round2 } from '../../utils/billing';

const router = Router();
router.use(authenticate);

function scope(req: Request): { branchId?: string } {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.branchId) return { branchId: req.user.branchId };
  if (req.query.branchId) return { branchId: req.query.branchId as string };
  return {};
}

function dateRange(req: Request): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (req.query.from) range.gte = new Date(req.query.from as string);
  if (req.query.to) range.lte = new Date(req.query.to as string);
  return range;
}

router.get(
  '/revenue',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const range = dateRange(req);
    const payments = await prisma.payment.aggregate({
      where: { ...where, status: 'COMPLETED', ...(range.gte || range.lte ? { paidAt: range } : {}) },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const byMethod = await prisma.payment.groupBy({
      by: ['method'],
      where: { ...where, status: 'COMPLETED', ...(range.gte || range.lte ? { paidAt: range } : {}) },
      _sum: { amount: true },
    });
    return sendSuccess(res, {
      totalRevenue: round2(Number(payments._sum.amount ?? 0)),
      transactions: payments._count._all,
      byMethod: byMethod.map((m) => ({ method: m.method, amount: round2(Number(m._sum.amount ?? 0)) })),
    });
  }),
);

router.get(
  '/reservations',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const range = dateRange(req);
    const grouped = await prisma.reservation.groupBy({
      by: ['status'],
      where: { ...where, ...(range.gte || range.lte ? { createdAt: range } : {}) },
      _count: { _all: true },
    });
    return sendSuccess(
      res,
      grouped.map((g) => ({ status: g.status, count: g._count._all })),
    );
  }),
);

router.get(
  '/occupancy',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const total = await prisma.room.count({ where });
    const occupied = await prisma.room.count({ where: { ...where, status: 'OCCUPIED' } });
    return sendSuccess(res, {
      totalRooms: total,
      occupiedRooms: occupied,
      occupancyRate: total > 0 ? round2((occupied / total) * 100) : 0,
    });
  }),
);

router.get(
  '/guests',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const hotelFilter = req.user?.hotelId ? { hotelId: req.user.hotelId } : {};
    const [total, vip, byTier] = await Promise.all([
      prisma.guest.count({ where: hotelFilter }),
      prisma.guest.count({ where: { ...hotelFilter, isVip: true } }),
      prisma.guest.groupBy({ by: ['loyaltyTier'], where: hotelFilter, _count: { _all: true } }),
    ]);
    void where;
    return sendSuccess(res, {
      totalGuests: total,
      vipGuests: vip,
      byTier: byTier.map((t) => ({ tier: t.loyaltyTier, count: t._count._all })),
    });
  }),
);

router.get(
  '/inventory',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const items = await prisma.inventoryItem.findMany({ where });
    const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.reorderLevel));
    const expired = items.filter((i) => i.expiryDate && i.expiryDate < new Date());
    return sendSuccess(res, {
      totalItems: items.length,
      lowStock: lowStock.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
      expired: expired.map((i) => ({ id: i.id, name: i.name, expiryDate: i.expiryDate })),
    });
  }),
);

export default router;

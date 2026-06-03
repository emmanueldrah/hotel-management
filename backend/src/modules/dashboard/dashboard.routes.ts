import { Request, Response, Router } from 'express';
import { Prisma } from '@prisma/client';
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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

router.get(
  '/stats',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const monthStart = startOfMonth();

    const [
      totalRooms,
      occupiedRooms,
      availableRooms,
      todayCheckIns,
      todayCheckOuts,
      activeReservations,
      pendingMaintenance,
      housekeepingDirty,
      revenueTodayAgg,
      revenueMonthAgg,
      pendingPaymentsAgg,
    ] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.count({ where: { ...where, status: 'OCCUPIED' } }),
      prisma.room.count({ where: { ...where, status: 'AVAILABLE' } }),
      prisma.reservation.count({
        where: { ...where, checkInDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.reservation.count({
        where: { ...where, checkOutDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.reservation.count({
        where: { ...where, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      }),
      prisma.maintenance.count({ where: { ...where, status: { not: 'COMPLETED' } } }),
      prisma.housekeeping.count({ where: { ...where, status: { in: ['DIRTY', 'IN_PROGRESS'] } } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED', paidAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED', paidAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: { in: ['ISSUED', 'PARTIALLY_PAID'] } },
        _sum: { balanceDue: true },
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? round2((occupiedRooms / totalRooms) * 100) : 0;

    return sendSuccess(res, {
      occupancyRate,
      totalRooms,
      occupiedRooms,
      availableRooms,
      todayCheckIns,
      todayCheckOuts,
      activeReservations,
      pendingMaintenance,
      housekeepingDirty,
      revenueToday: round2(Number(revenueTodayAgg._sum.amount ?? 0)),
      revenueThisMonth: round2(Number(revenueMonthAgg._sum.amount ?? 0)),
      pendingPayments: round2(Number(pendingPaymentsAgg._sum.balanceDue ?? 0)),
    });
  }),
);

router.get(
  '/revenue-trend',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: { ...where, status: 'COMPLETED', paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of payments) {
      const key = p.paidAt.toISOString().slice(0, 10);
      buckets.set(key, round2((buckets.get(key) ?? 0) + Number(p.amount)));
    }

    const trend = Array.from(buckets.entries()).map(([date, amount]) => ({ date, amount }));
    return sendSuccess(res, trend);
  }),
);

router.get(
  '/occupancy-by-type',
  authorize('reports:read'),
  asyncHandler(async (req: Request, res: Response) => {
    const where = scope(req);
    const grouped = await prisma.room.groupBy({
      by: ['status'],
      where: where as Prisma.RoomWhereInput,
      _count: { _all: true },
    });
    return sendSuccess(
      res,
      grouped.map((g) => ({ status: g.status, count: g._count._all })),
    );
  }),
);

export default router;

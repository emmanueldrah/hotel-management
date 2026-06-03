import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import invoiceRoutes from './modules/invoices/invoices.routes';
import paymentRoutes from './modules/payments/payments.routes';
import housekeepingRoutes from './modules/housekeeping/housekeeping.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import reportRoutes from './modules/reports/reports.routes';
import restaurantOrderRoutes from './modules/restaurant/orders.routes';
import { buildResourceRouters } from './modules/resources';
import {
  auditRouter,
  loyaltyRouter,
  notificationsRouter,
  usersRouter,
} from './modules/misc/misc.routes';

export function buildApiRouter(): Router {
  const router = Router();

  router.use('/auth', authRoutes);
  router.use('/dashboard', dashboardRoutes);
  router.use('/reports', reportRoutes);
  router.use('/reservations', reservationRoutes);
  router.use('/invoices', invoiceRoutes);
  router.use('/payments', paymentRoutes);
  router.use('/housekeeping', housekeepingRoutes);
  router.use('/maintenance', maintenanceRoutes);
  router.use('/restaurant-orders', restaurantOrderRoutes);
  router.use('/users', usersRouter);
  router.use('/notifications', notificationsRouter);
  router.use('/audit-logs', auditRouter);
  router.use('/loyalty', loyaltyRouter);

  // Standard CRUD resources.
  const resourceRouters = buildResourceRouters();
  for (const [path, resourceRouter] of Object.entries(resourceRouters)) {
    router.use(`/${path}`, resourceRouter);
  }

  return router;
}

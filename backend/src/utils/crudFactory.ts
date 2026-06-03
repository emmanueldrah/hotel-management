import { Request, Response, Router } from 'express';
import { AnyZodObject } from 'zod';
import { asyncHandler } from './asyncHandler';
import { ApiError } from './ApiError';
import { buildMeta, getPagination, sendSuccess } from './http';
import { writeAudit } from './audit';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import type { Permission } from '../rbac/permissions';

/**
 * Minimal structural view of a Prisma model delegate. Prisma's generated
 * delegates are structurally compatible; we cast once at the call site to keep
 * the factory reusable while preserving a typed surface here.
 */
export interface CrudDelegate {
  findMany(args: {
    skip?: number;
    take?: number;
    where?: Record<string, unknown>;
    orderBy?: unknown;
    include?: unknown;
  }): Promise<unknown[]>;
  findUnique(args: { where: { id: string }; include?: unknown }): Promise<unknown | null>;
  create(args: { data: Record<string, unknown>; include?: unknown }): Promise<unknown>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
    include?: unknown;
  }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
}

export interface CrudOptions {
  resource: string;
  delegate: CrudDelegate;
  /** permission resource prefix; defaults to `resource`. */
  permission?: string;
  createSchema?: AnyZodObject;
  updateSchema?: AnyZodObject;
  searchableFields?: string[];
  filterableFields?: string[];
  defaultInclude?: Record<string, unknown>;
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  /** Inject req.user.branchId into create data and filter lists by it. */
  branchScoped?: boolean;
  /** Inject req.user.hotelId into create data and filter lists by it. */
  hotelScoped?: boolean;
}

function buildWhere(req: Request, opts: CrudOptions): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const q = req.query.q;

  if (typeof q === 'string' && q.trim() && opts.searchableFields?.length) {
    where.OR = opts.searchableFields.map((field) => ({
      [field]: { contains: q.trim(), mode: 'insensitive' },
    }));
  }

  for (const field of opts.filterableFields ?? []) {
    const value = req.query[field];
    if (typeof value === 'string' && value.length) {
      where[field] = value;
    }
  }

  // Multi-tenancy scoping (super admin bypasses scoping).
  const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
  if (opts.branchScoped && !isSuperAdmin && req.user?.branchId) {
    where.branchId = req.user.branchId;
  }
  if (opts.hotelScoped && !isSuperAdmin && req.user?.hotelId) {
    where.hotelId = req.user.hotelId;
  }
  return where;
}

function applyScopeToData(req: Request, opts: CrudOptions, data: Record<string, unknown>) {
  if (opts.branchScoped && !data.branchId && req.user?.branchId) {
    data.branchId = req.user.branchId;
  }
  if (opts.hotelScoped && !data.hotelId && req.user?.hotelId) {
    data.hotelId = req.user.hotelId;
  }
  return data;
}

/**
 * Builds a standard REST router (list/get/create/update/delete) for a resource,
 * wired with authentication, RBAC, validation, pagination, search and audit.
 */
export function createCrudRouter(opts: CrudOptions): Router {
  const router = Router();
  const perm = opts.permission ?? opts.resource;
  const readPerm = `${perm}:read` as Permission;
  const writePerm = `${perm}:write` as Permission;

  router.use(authenticate);

  router.get(
    '/',
    authorize(readPerm),
    asyncHandler(async (req: Request, res: Response) => {
      const { page, limit, skip } = getPagination(req.query);
      const where = buildWhere(req, opts);
      const [items, total] = await Promise.all([
        opts.delegate.findMany({
          skip,
          take: limit,
          where,
          orderBy: opts.defaultOrderBy ?? { createdAt: 'desc' },
          include: opts.defaultInclude,
        }),
        opts.delegate.count({ where }),
      ]);
      return sendSuccess(res, items, 200, buildMeta(page, limit, total));
    }),
  );

  router.get(
    '/:id',
    authorize(readPerm),
    asyncHandler(async (req: Request, res: Response) => {
      const item = await opts.delegate.findUnique({
        where: { id: req.params.id },
        include: opts.defaultInclude,
      });
      if (!item) throw ApiError.notFound(`${opts.resource} not found`);
      return sendSuccess(res, item);
    }),
  );

  router.post(
    '/',
    authorize(writePerm),
    ...(opts.createSchema ? [validate(opts.createSchema)] : []),
    asyncHandler(async (req: Request, res: Response) => {
      const data = applyScopeToData(req, opts, { ...req.body });
      const item = await opts.delegate.create({ data, include: opts.defaultInclude });
      await writeAudit(req, { action: 'CREATE', entity: opts.resource });
      return sendSuccess(res, item, 201);
    }),
  );

  router.put(
    '/:id',
    authorize(writePerm),
    ...(opts.updateSchema ? [validate(opts.updateSchema)] : []),
    asyncHandler(async (req: Request, res: Response) => {
      const item = await opts.delegate.update({
        where: { id: req.params.id },
        data: { ...req.body },
        include: opts.defaultInclude,
      });
      await writeAudit(req, { action: 'UPDATE', entity: opts.resource, entityId: req.params.id });
      return sendSuccess(res, item);
    }),
  );

  router.delete(
    '/:id',
    authorize(writePerm),
    asyncHandler(async (req: Request, res: Response) => {
      await opts.delegate.delete({ where: { id: req.params.id } });
      await writeAudit(req, { action: 'DELETE', entity: opts.resource, entityId: req.params.id });
      return sendSuccess(res, { id: req.params.id, deleted: true });
    }),
  );

  return router;
}

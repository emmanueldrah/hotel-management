import { Request } from 'express';
import prisma from '../config/prisma';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persists an audit log entry. Best-effort: failures are swallowed so auditing
 * never breaks the primary request flow.
 */
export async function writeAudit(req: Request, input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.sub ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? (input.metadata as object) : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch {
    // ignore audit failures
  }
}

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/utils";

export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.userId || undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ipHash: params.ip ? sha256(params.ip) : undefined,
    },
  });
}

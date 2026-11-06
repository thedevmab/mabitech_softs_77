import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function trackEvent(params: {
  name: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  sessionId?: string;
  meta?: Prisma.InputJsonValue;
  eventKey?: string;
}) {
  if (params.eventKey) {
    const existing = await prisma.analyticsEvent.findUnique({
      where: { eventKey: params.eventKey },
    });
    if (existing) return existing;
  }

  try {
    return await prisma.analyticsEvent.create({
      data: {
        name: params.name,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        sessionId: params.sessionId,
        meta: params.meta,
        eventKey: params.eventKey,
      },
    });
  } catch {
    if (params.eventKey) {
      return prisma.analyticsEvent.findUnique({ where: { eventKey: params.eventKey } });
    }
    throw new Error("Failed to track event");
  }
}

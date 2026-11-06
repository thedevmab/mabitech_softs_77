import { z } from "zod";
import {
  handleApiError,
  jsonCreated,
  parseJson,
  privateNoStoreHeaders,
} from "@/lib/api";
import { getBearerUser } from "@/lib/auth/request-user";
import { trackEvent } from "@/lib/analytics";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  entityType: z.string().trim().max(80).optional(),
  entityId: z.string().trim().max(120).optional(),
  sessionId: z.string().trim().max(120).optional(),
  eventKey: z.string().trim().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getBearerUser(request);
    const body = await parseJson(request, schema);
    const event = await trackEvent({
      name: body.name,
      entityType: body.entityType,
      entityId: body.entityId,
      sessionId: body.sessionId,
      eventKey: body.eventKey,
      userId: user?.id,
      meta: body.meta as never,
    });

    const res = jsonCreated({
      id: event?.id ?? null,
      name: body.name,
      accepted: true,
    });
    Object.entries(privateNoStoreHeaders()).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}

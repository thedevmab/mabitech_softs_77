import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, parseJson } from "@/lib/api";
import { getBearerUser } from "@/lib/auth/request-user";

const schema = z.object({
  token: z.string().min(10).max(512),
  platform: z.enum(["android", "ios", "web", "other"]).default("android"),
});

export async function POST(request: Request) {
  try {
    const user = await getBearerUser(request);
    const body = await parseJson(request, schema);

    const platform = body.platform ?? "android";
    const device = await prisma.deviceToken.upsert({
      where: { token: body.token },
      update: {
        platform,
        ...(user ? { userId: user.id } : {}),
      },
      create: {
        token: body.token,
        platform,
        ...(user ? { userId: user.id } : {}),
      },
    });

    return jsonOk({
      id: device.id,
      platform: device.platform,
      linkedUser: Boolean(device.userId),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

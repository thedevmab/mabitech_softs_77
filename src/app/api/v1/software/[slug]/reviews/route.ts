import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ApiError,
  handleApiError,
  jsonCreated,
  jsonError,
  parseJson,
} from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { rateLimit } from "@/lib/redis";
import { getClientIp } from "@/lib/api/request";
import { publicSoftwareWhere } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(5000).optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const ip = getClientIp(request);
    const rl = await rateLimit(`reviews:${user.id}:${ip}`, 20, 3600);
    if (!rl.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many reviews");
    }

    const { slug: idOrSlug } = await params;
    const body = await parseJson(request, schema);

    const software = await prisma.software.findFirst({
      where: {
        ...publicSoftwareWhere,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!software) throw new ApiError(404, "NOT_FOUND", "Software not found");

    const review = await prisma.review.upsert({
      where: {
        userId_softwareId: { userId: user.id, softwareId: software.id },
      },
      update: {
        rating: body.rating,
        title: body.title,
        body: body.body,
      },
      create: {
        userId: user.id,
        softwareId: software.id,
        rating: body.rating,
        title: body.title,
        body: body.body,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return jsonCreated({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

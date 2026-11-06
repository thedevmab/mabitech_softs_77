import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, parseJson } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { getUserRoles } from "@/lib/auth/rbac";
import { serializeUserPublic } from "@/lib/api/serializers";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  image: z.string().url().max(2048).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    const roles = await getUserRoles(user.id);
    return jsonOk({
      ...serializeUserPublic(user),
      roles: roles.map((r) => ({ slug: r.slug, name: r.name })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser(request);
    const body = await parseJson(request, patchSchema);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        bio: body.bio === undefined ? undefined : body.bio,
        image: body.image === undefined ? undefined : body.image,
      },
    });
    return jsonOk(serializeUserPublic(updated));
  } catch (error) {
    return handleApiError(error);
  }
}

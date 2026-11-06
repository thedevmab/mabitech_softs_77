import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import { removePostFile } from "@/lib/storage/files";
import { prisma } from "@/lib/db";
import { handleApiError, jsonOk, ApiError } from "@/lib/api";
import { logActivity } from "@/lib/audit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    if (!(await userIsStaff(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Staff access required");
    }
    await requirePermission(user.id, "posts.edit");

    const { id } = await params;
    const file = await prisma.postFile.findUnique({
      where: { id },
      include: { post: { select: { id: true, status: true } } },
    });
    if (!file) throw new ApiError(404, "NOT_FOUND", "File not found");

    await removePostFile(id);

    await logActivity({
      userId: user.id,
      action: "posts.file.delete",
      entityType: "PostFile",
      entityId: id,
      metadata: { originalName: file.originalName },
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}

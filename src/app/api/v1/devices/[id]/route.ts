import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk, privateNoStoreHeaders } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { id } = await params;

    const device = await prisma.deviceToken.findFirst({
      where: {
        OR: [{ id }, { token: id }],
        userId: user.id,
      },
    });
    if (!device) throw new ApiError(404, "NOT_FOUND", "Device not found");

    await prisma.deviceToken.delete({ where: { id: device.id } });
    return jsonOk(
      { deleted: true, id: device.id },
      { headers: privateNoStoreHeaders() },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

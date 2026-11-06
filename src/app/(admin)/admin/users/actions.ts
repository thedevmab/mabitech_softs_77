"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";

export async function suspendUserAction(formData: FormData) {
  const admin = await getAdminActionUser("users.suspend");
  const userId = String(formData.get("userId") || "");
  if (userId === admin.id) {
    throw new ApiError(400, "SELF_SUSPEND", "You cannot suspend yourself");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });
  await logActivity({
    userId: admin.id,
    action: "users.suspend",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

export async function unsuspendUserAction(formData: FormData) {
  const admin = await getAdminActionUser("users.suspend");
  const userId = String(formData.get("userId") || "");
  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  await logActivity({
    userId: admin.id,
    action: "users.unsuspend",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

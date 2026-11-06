import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/request-user";
import { requirePermission, userIsStaff } from "@/lib/auth/rbac";
import type { PermissionKey } from "@/lib/permissions";
import { ApiError } from "@/lib/api";

export async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  const staff = await userIsStaff(user.id);
  if (!staff) redirect("/login?callbackUrl=/admin");
  return user;
}

export async function requireAdminPermission(permission: PermissionKey) {
  const user = await requireAdminUser();
  await requirePermission(user.id, permission);
  return user;
}

export async function getAdminActionUser(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  const staff = await userIsStaff(user.id);
  if (!staff) throw new ApiError(403, "FORBIDDEN", "Staff access required");
  await requirePermission(user.id, permission);
  return user;
}

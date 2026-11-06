import { prisma } from "@/lib/db";
import { ROLE_SLUGS, type PermissionKey } from "@/lib/permissions";
import { ApiError } from "@/lib/api";

export async function getUserPermissionKeys(userId: string): Promise<Set<string>> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  const keys = new Set<string>();
  for (const ur of userRoles) {
    if (ur.role.slug === ROLE_SLUGS.SUPER_ADMIN) {
      const all = await prisma.permission.findMany({ select: { key: true } });
      all.forEach((p) => keys.add(p.key));
      return keys;
    }
    for (const rp of ur.role.permissions) {
      keys.add(rp.permission.key);
    }
  }
  return keys;
}

export async function getUserRoles(userId: string) {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role);
}

export async function userHasPermission(userId: string, permission: PermissionKey) {
  const keys = await getUserPermissionKeys(userId);
  return keys.has(permission);
}

export async function requirePermission(userId: string, permission: PermissionKey) {
  const allowed = await userHasPermission(userId, permission);
  if (!allowed) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission for this action");
  }
}

export async function userIsStaff(userId: string) {
  const roles = await getUserRoles(userId);
  return roles.some((r) =>
    [
      ROLE_SLUGS.SUPER_ADMIN,
      ROLE_SLUGS.ADMINISTRATOR,
      ROLE_SLUGS.EDITOR,
      ROLE_SLUGS.CONTENT_MANAGER,
      ROLE_SLUGS.MODERATOR,
      ROLE_SLUGS.ANALYST,
    ].includes(r.slug as (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS]),
  );
}

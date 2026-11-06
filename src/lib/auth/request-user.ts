import { auth } from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) return null;
  return user;
}

export async function getBearerUser(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE" || user.deletedAt) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireApiUser(request: Request) {
  const user = (await getBearerUser(request)) || (await getSessionUser());
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  return user;
}

export async function requireActivePremium(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > new Date()) {
    return user;
  }
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endsAt: { gt: new Date() },
    },
  });
  if (!sub) throw new ApiError(403, "PREMIUM_REQUIRED", "Premium subscription required");
  return user;
}

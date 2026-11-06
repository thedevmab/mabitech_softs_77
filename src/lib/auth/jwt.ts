import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

function accessSecret() {
  return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || process.env.AUTH_SECRET!);
}

function refreshSecret() {
  return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || process.env.AUTH_SECRET!);
}

function parseTtl(ttl: string, fallbackSeconds: number): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return fallbackSeconds;
  const value = Number(match[1]);
  const unit = match[2];
  const mult = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return value * mult;
}

export type AccessPayload = {
  sub: string;
  email: string;
  typ: "access";
};

export async function signAccessToken(user: { id: string; email: string }) {
  const seconds = parseTtl(process.env.JWT_ACCESS_TTL || "15m", 900);
  const token = await new SignJWT({ email: user.email, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(accessSecret());
  return { token, expiresIn: seconds };
}

export async function verifyAccessToken(token: string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, accessSecret());
  if (payload.typ !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token");
  }
  return {
    sub: payload.sub,
    email: String(payload.email || ""),
    typ: "access",
  };
}

export async function issueRefreshToken(userId: string) {
  const seconds = parseTtl(process.env.JWT_REFRESH_TTL || "30d", 30 * 86400);
  const raw = randomBytes(48).toString("hex");
  const tokenHash = createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + seconds * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return { token: raw, expiresAt };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) return null;
  const access = await signAccessToken({ id: user.id, email: user.email });
  const refresh = await issueRefreshToken(user.id);
  return { user, access, refresh };
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

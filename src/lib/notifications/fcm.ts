import { prisma } from "@/lib/db";

export function isFcmConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

function getServiceAccount(): { client_email: string; private_key: string; project_id: string } | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    if (raw.trim().startsWith("{")) return JSON.parse(raw);
    // path not loaded here to keep secrets out of accidental logs; require JSON string
    return null;
  } catch {
    return null;
  }
}

async function getAccessToken(sa: { client_email: string; private_key: string }) {
  const { SignJWT, importPKCS8 } = await import("jose");
  const key = await importPKCS8(sa.private_key.replace(/\\n/g, "\n"), "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error("Failed to obtain FCM access token");
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function sendFcmToTokens(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) {
  if (!params.tokens.length) return { sent: 0, skipped: true };
  const sa = getServiceAccount();
  if (!sa) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FCM is not configured");
    }
    console.info("[fcm:dev]", { title: params.title, body: params.body, tokens: params.tokens.length });
    return { sent: 0, skipped: true };
  }

  const accessToken = await getAccessToken(sa);
  let sent = 0;
  for (const token of params.tokens) {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: params.title,
            body: params.body,
            image: params.imageUrl,
          },
          data: params.data,
        },
      }),
    });
    if (res.ok) sent += 1;
  }
  return { sent, skipped: false };
}

export async function dispatchNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new Error("Notification not found");

  let userIds: string[] = [];
  if (notification.target === "ALL") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else if (notification.target === "PREMIUM") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", isPremium: true, deletedAt: null },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else if (notification.target === "ROLE" && notification.targetValue) {
    const rows = await prisma.userRole.findMany({
      where: { role: { slug: notification.targetValue } },
      select: { userId: true },
    });
    userIds = rows.map((r) => r.userId);
  }

  const tokens = await prisma.deviceToken.findMany({
    where: userIds.length ? { userId: { in: userIds } } : undefined,
  });

  await sendFcmToTokens({
    tokens: tokens.map((t) => t.token),
    title: notification.title,
    body: notification.body,
    imageUrl: notification.imageUrl || undefined,
    data: (notification.data as Record<string, string> | null) || undefined,
  });

  if (userIds.length) {
    await prisma.notificationReceipt.createMany({
      data: userIds.map((userId) => ({ notificationId, userId })),
      skipDuplicates: true,
    });
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { status: "SENT", sentAt: new Date() },
  });
}

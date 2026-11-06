"use server";

import { revalidatePath } from "next/cache";
import { NotificationTarget } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications/fcm";
import { ApiError } from "@/lib/api";

export async function composeNotificationAction(formData: FormData) {
  const user = await getAdminActionUser("notifications.manage");
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const targetRaw = String(formData.get("target") || "ALL");
  const targetValue = String(formData.get("targetValue") || "").trim() || null;
  const sendNow = formData.get("sendNow") === "on";

  if (!title || !body) throw new ApiError(400, "VALIDATION", "Title and body are required");

  const target = (Object.values(NotificationTarget) as string[]).includes(targetRaw)
    ? (targetRaw as NotificationTarget)
    : NotificationTarget.ALL;

  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      imageUrl,
      target,
      targetValue,
      status: "DRAFT",
      createdById: user.id,
    },
  });

  await logActivity({
    userId: user.id,
    action: "notifications.compose",
    entityType: "Notification",
    entityId: notification.id,
  });

  if (sendNow) {
    await sendNotificationAction(notification.id);
  }

  revalidatePath("/admin/notifications");
}

export async function sendNotificationAction(notificationId: string) {
  const user = await getAdminActionUser("notifications.manage");
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new ApiError(404, "NOT_FOUND", "Notification not found");

  await dispatchNotification(notificationId);

  await logActivity({
    userId: user.id,
    action: "notifications.send",
    entityType: "Notification",
    entityId: notificationId,
  });

  revalidatePath("/admin/notifications");
}

export async function sendNotificationFormAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  await sendNotificationAction(id);
}

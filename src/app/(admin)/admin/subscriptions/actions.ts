"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";

export async function createPlanAction(formData: FormData) {
  const user = await getAdminActionUser("subscriptions.manage");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const priceCents = Math.round(Number(formData.get("price") || 0) * 100);
  const currency = String(formData.get("currency") || "ETB").trim() || "ETB";
  const intervalDays = Number(formData.get("intervalDays") || 30);
  const features = String(formData.get("features") || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const isFree = formData.get("isFree") === "on";

  if (!name) throw new ApiError(400, "VALIDATION", "Name is required");

  let slug = makeSlug(name);
  if (await prisma.subscriptionPlan.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name,
      slug,
      description,
      priceCents: isFree ? 0 : priceCents,
      currency,
      intervalDays: Number.isFinite(intervalDays) ? intervalDays : 30,
      features,
      isActive: true,
      isFree,
    },
  });

  await logActivity({
    userId: user.id,
    action: "subscriptions.plan.create",
    entityType: "SubscriptionPlan",
    entityId: plan.id,
  });
  revalidatePath("/admin/subscriptions");
}

export async function togglePlanAction(formData: FormData) {
  const user = await getAdminActionUser("subscriptions.manage");
  const id = String(formData.get("id") || "");
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new ApiError(404, "NOT_FOUND", "Plan not found");
  await prisma.subscriptionPlan.update({
    where: { id },
    data: { isActive: !plan.isActive },
  });
  await logActivity({
    userId: user.id,
    action: "subscriptions.plan.toggle",
    entityType: "SubscriptionPlan",
    entityId: id,
  });
  revalidatePath("/admin/subscriptions");
}

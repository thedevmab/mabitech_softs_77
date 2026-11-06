"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { makeSlug } from "@/lib/utils";
import { logActivity } from "@/lib/audit";

export async function createAffiliateAction(formData: FormData) {
  const user = await getAdminActionUser("affiliates.manage");
  const name = String(formData.get("name") || "").trim();
  const destinationUrl = String(formData.get("destinationUrl") || "").trim();
  const disclosure = String(formData.get("disclosure") || "") || null;
  if (!name || !destinationUrl) return;

  const base = makeSlug(name);
  let slug = base;
  let i = 1;
  while (await prisma.affiliateCampaign.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  const campaign = await prisma.affiliateCampaign.create({
    data: { name, slug, destinationUrl, disclosure, isActive: true },
  });
  await logActivity({
    userId: user.id,
    action: "affiliate.create",
    entityType: "AffiliateCampaign",
    entityId: campaign.id,
  });
  revalidatePath("/admin/affiliates");
}

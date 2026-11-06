"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";

export async function createSponsoredAction(formData: FormData) {
  const user = await getAdminActionUser("sponsored.manage");
  const sponsorName = String(formData.get("sponsorName") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "") || null;
  const destinationUrl = String(formData.get("destinationUrl") || "").trim();
  const bannerUrl = String(formData.get("bannerUrl") || "") || null;
  const startAt = new Date(String(formData.get("startAt")));
  const endAt = new Date(String(formData.get("endAt")));
  if (!sponsorName || !title || !destinationUrl || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return;
  }

  const campaign = await prisma.sponsoredCampaign.create({
    data: {
      sponsorName,
      title,
      description,
      destinationUrl,
      bannerUrl,
      startAt,
      endAt,
      isActive: true,
    },
  });
  await logActivity({
    userId: user.id,
    action: "sponsored.create",
    entityType: "SponsoredCampaign",
    entityId: campaign.id,
  });
  revalidatePath("/admin/sponsored");
}

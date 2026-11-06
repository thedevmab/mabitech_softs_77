"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import {
  DEFAULT_HOME_SECTIONS,
  type HomeSectionConfig,
} from "@/lib/branding";

function parseSections(formData: FormData): HomeSectionConfig[] {
  const raw = String(formData.get("sectionsJson") || "").trim();
  if (!raw) return DEFAULT_HOME_SECTIONS;
  try {
    const parsed = JSON.parse(raw) as HomeSectionConfig[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_HOME_SECTIONS;
    return parsed.map((s, index) => ({
      key: s.key || `section_${index}`,
      title: s.title || s.key || `Section ${index + 1}`,
      enabled: Boolean(s.enabled),
      type: s.type === "software" || s.type === "sponsored" ? s.type : "posts",
      limit: Math.max(1, Math.min(50, Number(s.limit) || 8)),
      categorySlugs: Array.isArray(s.categorySlugs) ? s.categorySlugs : undefined,
      featured: s.featured,
      orderByDownloads: s.orderByDownloads,
      osIncludes: s.osIncludes,
      premium: s.premium,
    }));
  } catch {
    return DEFAULT_HOME_SECTIONS;
  }
}

export async function updateHomeSectionsAction(formData: FormData) {
  const user = await getAdminActionUser("settings.manage");
  const sections = parseSections(formData);

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { homeSections: sections as unknown as Prisma.InputJsonValue },
    create: {
      id: "default",
      homeSections: sections as unknown as Prisma.InputJsonValue,
    },
  });

  await logActivity({
    userId: user.id,
    action: "settings.homepage.update",
    entityType: "AppSettings",
    entityId: "default",
    metadata: { sectionCount: sections.length },
  });

  revalidatePath("/admin/homepage");
  revalidatePath("/api/v1/home");
}

export async function resetHomeSectionsAction() {
  const user = await getAdminActionUser("settings.manage");
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      homeSections: DEFAULT_HOME_SECTIONS as unknown as Prisma.InputJsonValue,
    },
    create: {
      id: "default",
      homeSections: DEFAULT_HOME_SECTIONS as unknown as Prisma.InputJsonValue,
    },
  });
  await logActivity({
    userId: user.id,
    action: "settings.homepage.reset",
    entityType: "AppSettings",
    entityId: "default",
  });
  revalidatePath("/admin/homepage");
}

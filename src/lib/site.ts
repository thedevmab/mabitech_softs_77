import { prisma } from "@/lib/db";

export type PublicSiteSettings = {
  platformName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactAddress: string | null;
  socialLinks: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  registrationEnabled: boolean;
  tagline: string;
};

const FALLBACK: PublicSiteSettings = {
  platformName: "Daily Tips",
  logoUrl: null,
  faviconUrl: null,
  description:
    "Daily Tips is your daily destination for technology news, AI discoveries, software downloads, digital skills, technology tutorials, and useful resources.",
  contactEmail: null,
  contactPhone: null,
  contactAddress: null,
  socialLinks: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: [],
  registrationEnabled: true,
  tagline: "Technology • Knowledge • Innovation",
};

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    if (!settings) return FALLBACK;
    return {
      platformName: settings.platformName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      description: settings.description,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactAddress: settings.contactAddress,
      socialLinks: settings.socialLinks,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      seoKeywords: settings.seoKeywords,
      registrationEnabled: settings.registrationEnabled,
      tagline: settings.tagline || FALLBACK.tagline,
    };
  } catch {
    return FALLBACK;
  }
}

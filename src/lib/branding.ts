export const DAILY_TIPS_TAGLINE = "Technology • Knowledge • Innovation";

export const DEFAULT_BRANDING = {
  displayName: "Daily Tips",
  tagline: DAILY_TIPS_TAGLINE,
  light: {
    primary: "#083687",
    secondary: "#FFAE00",
    background: "#F5F7FA",
    surface: "#FFFFFF",
    text: "#172033",
    muted: "#64748B",
    border: "#E2E8F0",
    success: "#16A34A",
    error: "#DC2626",
    warning: "#F59E0B",
  },
  dark: {
    primary: "#3B82F6",
    secondary: "#FFAE00",
    background: "#0B1220",
    surface: "#111C30",
    elevated: "#17243A",
    text: "#F8FAFC",
    muted: "#94A3B8",
    border: "#26364F",
    success: "#16A34A",
    error: "#DC2626",
    warning: "#F59E0B",
  },
} as const;

export type HomeSectionConfig = {
  key: string;
  title: string;
  enabled: boolean;
  type: "posts" | "software" | "sponsored";
  limit: number;
  categorySlugs?: string[];
  featured?: boolean;
  orderByDownloads?: boolean;
  osIncludes?: string;
  premium?: boolean;
};

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  {
    key: "featured_banner",
    title: "Featured",
    enabled: true,
    type: "posts",
    limit: 5,
    featured: true,
  },
  {
    key: "breaking_news",
    title: "Breaking news",
    enabled: true,
    type: "posts",
    limit: 8,
    categorySlugs: ["technology-news"],
  },
  {
    key: "latest_tech",
    title: "Latest tech",
    enabled: true,
    type: "posts",
    limit: 8,
  },
  {
    key: "ai",
    title: "AI & tools",
    enabled: true,
    type: "posts",
    limit: 6,
    categorySlugs: ["artificial-intelligence", "ai-tools"],
  },
  {
    key: "trending_software",
    title: "Trending software",
    enabled: true,
    type: "software",
    limit: 8,
    featured: true,
  },
  {
    key: "latest_apks",
    title: "Latest APKs",
    enabled: true,
    type: "software",
    limit: 8,
    osIncludes: "android",
  },
  {
    key: "daily_learning",
    title: "Daily learning",
    enabled: true,
    type: "posts",
    limit: 6,
    categorySlugs: ["tutorials"],
  },
  {
    key: "sponsored",
    title: "Sponsored",
    enabled: true,
    type: "sponsored",
    limit: 6,
  },
];

import type { AdMobSettings } from "@prisma/client";

export const ADMOB_DEFAULTS = {
  bannerEnabled: false,
  interstitialEnabled: false,
  nativeEnabled: false,
  appOpenEnabled: false,
  bannerOnHome: true,
  bannerOnExplore: true,
  bannerOnArticle: true,
  nativeOnHome: true,
  nativeOnExplore: true,
  interstitialCooldown: 300,
  interstitialSessionLimit: 5,
  nativeAdFrequency: 5,
  appOpenCooldown: 14400,
  childDirected: false,
  consentRequired: true,
} as const;

export function clampInterstitialCooldown(value: number) {
  return Math.max(60, Math.min(86400, Math.floor(value) || ADMOB_DEFAULTS.interstitialCooldown));
}

export function clampInterstitialSessionLimit(value: number) {
  return Math.max(1, Math.min(20, Math.floor(value) || ADMOB_DEFAULTS.interstitialSessionLimit));
}

export function clampNativeAdFrequency(value: number) {
  return Math.max(3, Math.min(50, Math.floor(value) || ADMOB_DEFAULTS.nativeAdFrequency));
}

export function clampAppOpenCooldown(value: number) {
  return Math.max(300, Math.min(604800, Math.floor(value) || ADMOB_DEFAULTS.appOpenCooldown));
}

const APP_ID_RE = /^ca-app-pub-\d{16}~\d{10}$/;
const UNIT_ID_RE = /^ca-app-pub-\d{16}\/\d{10}$/;

export function isValidAdMobAppId(value: string) {
  return APP_ID_RE.test(value);
}

export function isValidAdMobUnitId(value: string) {
  return UNIT_ID_RE.test(value);
}

export function publicAdMobConfig(
  adsEnabled: boolean,
  row: AdMobSettings | null,
) {
  const source = row ?? ADMOB_DEFAULTS;
  return {
    adsEnabled,
    bannerEnabled: adsEnabled && source.bannerEnabled,
    interstitialEnabled: adsEnabled && source.interstitialEnabled,
    nativeEnabled: adsEnabled && source.nativeEnabled,
    appOpenEnabled: adsEnabled && source.appOpenEnabled,
    bannerOnHome: source.bannerOnHome,
    bannerOnExplore: source.bannerOnExplore,
    bannerOnArticle: source.bannerOnArticle,
    nativeOnHome: source.nativeOnHome,
    nativeOnExplore: source.nativeOnExplore,
    interstitialCooldown: source.interstitialCooldown,
    interstitialSessionLimit: source.interstitialSessionLimit,
    nativeAdFrequency: source.nativeAdFrequency,
    appOpenCooldown: source.appOpenCooldown,
    consentRequired: source.consentRequired,
    childDirected: source.childDirected,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export function resolveAdMobEnvironment(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

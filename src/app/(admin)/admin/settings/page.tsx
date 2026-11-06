import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { updateSiteSettingsAction, updateAppSettingsAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings.manage");
  const [site, app] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.appSettings.findUnique({ where: { id: "default" } }),
  ]);

  const maxUploadMb = site ? Number(site.maxUploadBytes) / (1024 * 1024) : 500;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSiteSettingsAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="platformName">Platform name</Label>
              <Input
                id="platformName"
                name="platformName"
                defaultValue={site?.platformName || "Daily Tips"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                defaultValue={site?.tagline || "Technology • Knowledge • Innovation"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={site?.contactEmail || ""}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={site?.description || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input id="logoUrl" name="logoUrl" defaultValue={site?.logoUrl || ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input id="faviconUrl" name="faviconUrl" defaultValue={site?.faviconUrl || ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input id="contactPhone" name="contactPhone" defaultValue={site?.contactPhone || ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactAddress">Address</Label>
              <Input
                id="contactAddress"
                name="contactAddress"
                defaultValue={site?.contactAddress || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultLanguage">Default language</Label>
              <Input
                id="defaultLanguage"
                name="defaultLanguage"
                defaultValue={site?.defaultLanguage || "en"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="theme">Theme</Label>
              <Input id="theme" name="theme" defaultValue={site?.theme || "system"} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adsensePublisherId">AdSense publisher ID</Label>
              <Input
                id="adsensePublisherId"
                name="adsensePublisherId"
                defaultValue={site?.adsensePublisherId || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admobAppId">AdMob app ID</Label>
              <Input id="admobAppId" name="admobAppId" defaultValue={site?.admobAppId || ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxUploadMb">Max upload (MB)</Label>
              <Input
                id="maxUploadMb"
                name="maxUploadMb"
                type="number"
                defaultValue={String(maxUploadMb)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="uploadAllowedTypes">Allowed upload types</Label>
              <Input
                id="uploadAllowedTypes"
                name="uploadAllowedTypes"
                defaultValue={(site?.uploadAllowedTypes || []).join(", ")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" defaultValue={site?.seoTitle || ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seoKeywords">SEO keywords</Label>
              <Input
                id="seoKeywords"
                name="seoKeywords"
                defaultValue={(site?.seoKeywords || []).join(", ")}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="seoDescription">SEO description</Label>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                rows={2}
                defaultValue={site?.seoDescription || ""}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="socialLinks">Social links (JSON)</Label>
              <Textarea
                id="socialLinks"
                name="socialLinks"
                rows={3}
                defaultValue={
                  site?.socialLinks ? JSON.stringify(site.socialLinks, null, 2) : "{}"
                }
                className="font-mono text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="adsEnabled" defaultChecked={site?.adsEnabled} />
              Ads enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="monetizationEnabled"
                defaultChecked={site?.monetizationEnabled ?? true}
              />
              Monetization enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="registrationEnabled"
                defaultChecked={site?.registrationEnabled ?? true}
              />
              Registration enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="maintenanceMode"
                defaultChecked={site?.maintenanceMode}
              />
              Maintenance mode
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Save site settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAppSettingsAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="minAppVersion">Min app version</Label>
              <Input
                id="minAppVersion"
                name="minAppVersion"
                defaultValue={app?.minAppVersion || "1.0.0"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recommendedAppVersion">Recommended app version</Label>
              <Input
                id="recommendedAppVersion"
                name="recommendedAppVersion"
                defaultValue={app?.recommendedAppVersion || "1.0.0"}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="updateUrl">Force-update store / download URL</Label>
              <Input
                id="updateUrl"
                name="updateUrl"
                placeholder="https://play.google.com/store/apps/details?id=..."
                defaultValue={app?.updateUrl || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contentRefreshSeconds">Content refresh interval (seconds)</Label>
              <Input
                id="contentRefreshSeconds"
                name="contentRefreshSeconds"
                type="number"
                min={30}
                defaultValue={String(app?.contentRefreshSeconds ?? 300)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="supportedLanguages">Supported languages</Label>
              <Input
                id="supportedLanguages"
                name="supportedLanguages"
                defaultValue={(app?.supportedLanguages || ["en"]).join(", ")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="privacyPolicyUrl">Privacy policy URL</Label>
              <Input
                id="privacyPolicyUrl"
                name="privacyPolicyUrl"
                defaultValue={app?.privacyPolicyUrl || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="termsOfServiceUrl">Terms of service URL</Label>
              <Input
                id="termsOfServiceUrl"
                name="termsOfServiceUrl"
                defaultValue={app?.termsOfServiceUrl || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="announcementTitle">Announcement title</Label>
              <Input
                id="announcementTitle"
                name="announcementTitle"
                defaultValue={app?.announcementTitle || ""}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="announcementBody">Announcement body</Label>
              <Textarea
                id="announcementBody"
                name="announcementBody"
                rows={2}
                defaultValue={app?.announcementBody || ""}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                name="announcementEnabled"
                defaultChecked={app?.announcementEnabled}
              />
              Show announcement banner in app
            </label>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="maintenanceMessage">Maintenance message</Label>
              <Textarea
                id="maintenanceMessage"
                name="maintenanceMessage"
                rows={2}
                defaultValue={app?.maintenanceMessage || ""}
              />
            </div>
            <p className="sm:col-span-2 text-xs text-muted">
              Prefer{" "}
              <a href="/admin/homepage" className="text-primary hover:underline">
                Homepage Manager
              </a>{" "}
              for section order. JSON below remains an advanced fallback.
            </p>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="featureFlags">Feature flags (JSON)</Label>
              <Textarea
                id="featureFlags"
                name="featureFlags"
                rows={4}
                defaultValue={
                  app?.featureFlags ? JSON.stringify(app.featureFlags, null, 2) : "{}"
                }
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="adPolicy">Ad policy (JSON)</Label>
              <Textarea
                id="adPolicy"
                name="adPolicy"
                rows={4}
                defaultValue={app?.adPolicy ? JSON.stringify(app.adPolicy, null, 2) : "{}"}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="branding">Branding (JSON)</Label>
              <Textarea
                id="branding"
                name="branding"
                rows={6}
                defaultValue={app?.branding ? JSON.stringify(app.branding, null, 2) : "{}"}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="homeSections">Home sections (JSON)</Label>
              <Textarea
                id="homeSections"
                name="homeSections"
                rows={8}
                defaultValue={
                  app?.homeSections ? JSON.stringify(app.homeSections, null, 2) : "[]"
                }
                className="font-mono text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="forceUpdate" defaultChecked={app?.forceUpdate} />
              Force update
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="appMaintenanceMode"
                defaultChecked={app?.maintenanceMode}
              />
              App maintenance mode
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="appRegistrationEnabled"
                defaultChecked={app?.registrationEnabled ?? true}
              />
              App registration enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="requireEmailVerify"
                defaultChecked={app?.requireEmailVerify ?? true}
              />
              Require email verify
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Save app settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

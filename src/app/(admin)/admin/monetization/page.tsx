import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { ADMOB_DEFAULTS } from "@/lib/admob";
import { updateAdMobSettingsAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdMobSettings } from "@prisma/client";

function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

function NumberField({
  id,
  name,
  label,
  defaultValue,
  min,
  max,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="number"
        min={min}
        max={max}
        defaultValue={defaultValue}
        required
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function UnitField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="font-mono text-xs"
      />
    </div>
  );
}

function EnvironmentForm({
  environment,
  settings,
  adsEnabled,
}: {
  environment: "development" | "production";
  settings: AdMobSettings | null;
  adsEnabled: boolean;
}) {
  const s = settings;
  return (
    <form action={updateAdMobSettingsAction} className="space-y-6">
      <input type="hidden" name="environment" value={environment} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Advertisement configuration
            <Badge className="capitalize">{environment}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <CheckboxField name="adsEnabled" label="Enable all advertisements globally" defaultChecked={adsEnabled} />
          <CheckboxField name="bannerEnabled" label="Banner ads" defaultChecked={s?.bannerEnabled} />
          <CheckboxField
            name="interstitialEnabled"
            label="Interstitial ads"
            defaultChecked={s?.interstitialEnabled}
          />
          <CheckboxField name="nativeEnabled" label="Native advanced ads" defaultChecked={s?.nativeEnabled} />
          <CheckboxField name="appOpenEnabled" label="App open ads" defaultChecked={s?.appOpenEnabled} />
          <CheckboxField name="consentRequired" label="Request UMP consent when required" defaultChecked={s?.consentRequired ?? true} />
          <CheckboxField name="childDirected" label="Treat as child-directed" defaultChecked={s?.childDirected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad placement settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField name="bannerOnHome" label="Banner on home" defaultChecked={s?.bannerOnHome ?? true} />
            <CheckboxField
              name="bannerOnExplore"
              label="Banner on explore / categories"
              defaultChecked={s?.bannerOnExplore ?? true}
            />
            <CheckboxField
              name="bannerOnArticle"
              label="Banner on article detail"
              defaultChecked={s?.bannerOnArticle ?? true}
            />
            <CheckboxField name="nativeOnHome" label="Native ads on home feed" defaultChecked={s?.nativeOnHome ?? true} />
            <CheckboxField
              name="nativeOnExplore"
              label="Native ads on explore results"
              defaultChecked={s?.nativeOnExplore ?? true}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              id={`${environment}-nativeAdFrequency`}
              name="nativeAdFrequency"
              label="Native ad every N posts"
              defaultValue={s?.nativeAdFrequency ?? ADMOB_DEFAULTS.nativeAdFrequency}
              min={3}
              max={50}
              hint="Minimum 3"
            />
            <NumberField
              id={`${environment}-interstitialCooldown`}
              name="interstitialCooldown"
              label="Interstitial cooldown (seconds)"
              defaultValue={s?.interstitialCooldown ?? ADMOB_DEFAULTS.interstitialCooldown}
              min={60}
              max={86400}
              hint="Minimum 60 seconds"
            />
            <NumberField
              id={`${environment}-interstitialSessionLimit`}
              name="interstitialSessionLimit"
              label="Interstitial impressions per session"
              defaultValue={s?.interstitialSessionLimit ?? ADMOB_DEFAULTS.interstitialSessionLimit}
              min={1}
              max={20}
            />
            <NumberField
              id={`${environment}-appOpenCooldown`}
              name="appOpenCooldown"
              label="App open cooldown (seconds)"
              defaultValue={s?.appOpenCooldown ?? ADMOB_DEFAULTS.appOpenCooldown}
              min={300}
              max={604800}
              hint="Default 14400 (4 hours)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad unit configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            These identifiers are stored for release builds and documentation. The public mobile API
            never returns them. Changing a unit ID here does not update already installed apps —
            rebuild and redistribute the Flutter client with matching dart-define / local.properties
            values.
          </p>
          <UnitField
            id={`${environment}-appId`}
            name="appId"
            label="Android App ID"
            defaultValue={s?.appId}
            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <UnitField
              id={`${environment}-banner`}
              name="bannerAdUnitId"
              label="Banner ad unit ID"
              defaultValue={s?.bannerAdUnitId}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
            />
            <UnitField
              id={`${environment}-interstitial`}
              name="interstitialAdUnitId"
              label="Interstitial ad unit ID"
              defaultValue={s?.interstitialAdUnitId}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
            />
            <UnitField
              id={`${environment}-native`}
              name="nativeAdUnitId"
              label="Native advanced ad unit ID"
              defaultValue={s?.nativeAdUnitId}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
            />
            <UnitField
              id={`${environment}-appOpen`}
              name="appOpenAdUnitId"
              label="App open ad unit ID"
              defaultValue={s?.appOpenAdUnitId}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit">Save {environment} AdMob settings</Button>
    </form>
  );
}

export default async function AdminMonetizationPage() {
  await requireAdminPermission("ads.manage");

  const [site, development, production, recentErrors] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.adMobSettings.findUnique({
      where: { platform_environment: { platform: "android", environment: "development" } },
    }),
    prisma.adMobSettings.findUnique({
      where: { platform_environment: { platform: "android", environment: "production" } },
    }),
    prisma.adMobClientError.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const adsEnabled = site?.adsEnabled ?? false;
  const active = process.env.NODE_ENV === "production" ? production : development;
  const formats = [
    { key: "Banner", on: active?.bannerEnabled },
    { key: "Interstitial", on: active?.interstitialEnabled },
    { key: "Native", on: active?.nativeEnabled },
    { key: "App open", on: active?.appOpenEnabled },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Monetization status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{adsEnabled ? "Ads globally on" : "Ads globally off"}</Badge>
            {formats.map((f) => (
              <Badge key={f.key} className={f.on && adsEnabled ? undefined : "opacity-60"}>
                {f.key}: {adsEnabled && f.on ? "enabled" : "disabled"}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Last configuration update:{" "}
            {active?.updatedAt ? active.updatedAt.toISOString() : "Never"}
          </p>
          <p className="text-sm text-muted-foreground">
            Revenue, impression, and click totals are available in the Google AdMob console. This
            dashboard does not invent or display earnings metrics.
          </p>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recent client ad load errors</h3>
            {recentErrors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No client-reported load errors yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">Format</th>
                      <th className="px-3 py-2 font-medium">Code</th>
                      <th className="px-3 py-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentErrors.map((error) => (
                      <tr key={error.id} className="border-t border-border">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {error.createdAt.toISOString()}
                        </td>
                        <td className="px-3 py-2">{error.format}</td>
                        <td className="px-3 py-2 font-mono text-xs">{error.code || "—"}</td>
                        <td className="px-3 py-2 max-w-md truncate">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EnvironmentForm environment="development" settings={development} adsEnabled={adsEnabled} />
      <EnvironmentForm environment="production" settings={production} adsEnabled={adsEnabled} />
    </div>
  );
}

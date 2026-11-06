import { AdPlatform, AdType } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  createAdAction,
  createPlacementAction,
  toggleAdAction,
  togglePlacementAction,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function AdminAdsPage() {
  await requireAdminPermission("ads.manage");
  const [ads, placements] = await Promise.all([
    prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.adPlacement.findMany({
      orderBy: { key: "asc" },
      include: { ad: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create ad unit</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAdAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  >
                    {Object.values(AdType).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    name="platform"
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  >
                    {Object.values(AdPlatform).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitId">Unit ID</Label>
                <Input id="unitId" name="unitId" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" type="url" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="destinationUrl">Destination URL</Label>
                <Input id="destinationUrl" name="destinationUrl" type="url" />
              </div>
              <Button type="submit">Create ad</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create placement</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPlacementAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="key">Key</Label>
                <Input id="key" name="key" required placeholder="home_banner" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pname">Name</Label>
                <Input id="pname" name="name" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pplatform">Platform</Label>
                <select
                  id="pplatform"
                  name="platform"
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                >
                  {Object.values(AdPlatform).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="adId">Ad unit</Label>
                <select
                  id="adId"
                  name="adId"
                  className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                >
                  <option value="">None</option>
                  {ads.map((ad) => (
                    <option key={ad.id} value={ad.id}>
                      {ad.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Create placement</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Placements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Ad</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {placements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted">
                    No placements
                  </td>
                </tr>
              ) : (
                placements.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{p.key}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.ad?.name || "—"}</td>
                    <td className="px-4 py-3">{p.isEnabled ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <form action={togglePlacementAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" size="sm" variant="secondary">
                          {p.isEnabled ? "Disable" : "Enable"}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad units</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td className="px-4 py-3">{ad.name}</td>
                  <td className="px-4 py-3 text-xs">{ad.type}</td>
                  <td className="px-4 py-3">{ad.impressions}</td>
                  <td className="px-4 py-3">{ad.clicks}</td>
                  <td className="px-4 py-3">{ad.isEnabled ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <form action={toggleAdAction}>
                      <input type="hidden" name="id" value={ad.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        {ad.isEnabled ? "Disable" : "Enable"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

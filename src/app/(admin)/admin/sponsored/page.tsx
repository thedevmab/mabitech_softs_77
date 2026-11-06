import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSponsoredAction } from "./actions";

export default async function AdminSponsoredPage() {
  await requireAdminPermission("sponsored.manage");
  const campaigns = await prisma.sponsoredCampaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sponsored campaigns</h1>
        <p className="text-sm text-muted">Manage sponsored placements with start and end dates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New sponsored campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSponsoredAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sponsorName">Sponsor name</Label>
              <Input id="sponsorName" name="sponsorName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationUrl">Destination URL</Label>
              <Input id="destinationUrl" name="destinationUrl" type="url" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner URL</Label>
              <Input id="bannerUrl" name="bannerUrl" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startAt">Start</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End</Label>
              <Input id="endAt" name="endAt" type="datetime-local" required />
            </div>
            <div>
              <Button type="submit">Create campaign</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.sponsorName}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.impressions}</TableCell>
                  <TableCell>{c.clicks}</TableCell>
                  <TableCell>{c.isActive ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
              {!campaigns.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted">
                    No sponsored campaigns yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

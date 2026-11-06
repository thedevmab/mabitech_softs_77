import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAffiliateAction } from "./actions";
import { makeSlug } from "@/lib/utils";

export default async function AdminAffiliatesPage() {
  await requireAdminPermission("affiliates.manage");
  const campaigns = await prisma.affiliateCampaign.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Affiliate campaigns</h1>
        <p className="text-sm text-muted">Track outbound affiliate links with disclosure text.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAffiliateAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationUrl">Destination URL</Label>
              <Input id="destinationUrl" name="destinationUrl" type="url" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="disclosure">Disclosure</Label>
              <Input
                id="disclosure"
                name="disclosure"
                defaultValue="This link may earn us a commission at no extra cost to you."
              />
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
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.slug || makeSlug(c.name)}</TableCell>
                  <TableCell>{c.clicks}</TableCell>
                  <TableCell>{c.isActive ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
              {!campaigns.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted">
                    No affiliate campaigns yet.
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

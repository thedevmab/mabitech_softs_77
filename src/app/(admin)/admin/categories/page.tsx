import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminCategoriesPage() {
  await requireAdminPermission("categories.manage");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true, software: true } } },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create category</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCategoryAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="icon">Icon</Label>
              <Input id="icon" name="icon" placeholder="optional" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={1} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit">Add category</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 tabular-nums text-muted">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{cat.name}</div>
                    <div className="text-xs text-muted">
                      /{cat.slug}
                      {cat.isDefault ? " · default" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {cat._count.posts} posts · {cat._count.software} software
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={reorderCategoryAction}>
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button type="submit" size="sm" variant="outline">
                          Up
                        </Button>
                      </form>
                      <form action={reorderCategoryAction}>
                        <input type="hidden" name="id" value={cat.id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button type="submit" size="sm" variant="outline">
                          Down
                        </Button>
                      </form>
                      {!cat.isDefault ? (
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={cat.id} />
                          <Button type="submit" size="sm" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      ) : null}
                    </div>
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

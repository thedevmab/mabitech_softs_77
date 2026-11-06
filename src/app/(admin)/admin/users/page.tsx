import { format } from "date-fns";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { suspendUserAction, unsuspendUserAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPermission("users.view");
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      roles: { include: { role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex gap-2">
            <Input name="q" placeholder="Search email or name" defaultValue={query} className="max-w-sm" />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-2 py-3">User</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Roles</th>
                  <th className="px-2 py-3">Premium</th>
                  <th className="px-2 py-3">Joined</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-2 py-3">
                      <div className="font-medium text-foreground">{user.name || "—"}</div>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td className="px-2 py-3 text-xs">{user.status}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <span className="text-muted">member</span>
                        ) : (
                          user.roles.map((r) => (
                            <span
                              key={r.id}
                              className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-primary"
                            >
                              {r.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs">{user.isPremium ? "Yes" : "No"}</td>
                    <td className="px-2 py-3 text-muted">
                      {format(user.createdAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-2 py-3">
                      {user.status === "SUSPENDED" ? (
                        <form action={unsuspendUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            Unsuspend
                          </Button>
                        </form>
                      ) : (
                        <form action={suspendUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Button type="submit" size="sm" variant="destructive">
                            Suspend
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

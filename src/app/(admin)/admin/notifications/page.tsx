import { format } from "date-fns";
import { NotificationTarget } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { composeNotificationAction, sendNotificationFormAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function AdminNotificationsPage() {
  await requireAdminPermission("notifications.manage");
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compose notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={composeNotificationAction} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" name="body" rows={3} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="target">Target</Label>
              <select
                id="target"
                name="target"
                className="flex h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                {Object.values(NotificationTarget).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="targetValue">Target value (role slug / category)</Label>
              <Input id="targetValue" name="targetValue" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sendNow" defaultChecked />
              Send immediately via FCM stub
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Save & send</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Notification</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Send</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted">
                    No notifications
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{n.title}</div>
                      <div className="line-clamp-1 text-xs text-muted">{n.body}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {n.target}
                      {n.targetValue ? `:${n.targetValue}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{n.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {format(n.createdAt, "MMM d, HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      {n.status !== "SENT" ? (
                        <form action={sendNotificationFormAction}>
                          <input type="hidden" name="id" value={n.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            Send
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted">
                          {n.sentAt ? format(n.sentAt, "MMM d HH:mm") : "Sent"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

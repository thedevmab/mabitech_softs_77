import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export default async function AdminSubscriptionsPage() {
  await requireAdminPermission("subscriptions.manage");
  const [plans, payments, activeSubs] = await Promise.all([
    prisma.subscriptionPlan.findMany({ orderBy: { priceCents: "asc" } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    }),
  ]);

  const revenueCents = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted">
          Active subscriptions: {activeSubs}. Verified revenue shown: {(revenueCents / 100).toFixed(2)}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    {(p.priceCents / 100).toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell>{p.intervalDays} days</TableCell>
                  <TableCell>{p.isActive ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.user.email}</TableCell>
                  <TableCell>{p.provider}</TableCell>
                  <TableCell>
                    {(p.amountCents / 100).toFixed(2)} {p.currency}
                  </TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.verifiedAt ? p.verifiedAt.toISOString() : "—"}</TableCell>
                </TableRow>
              ))}
              {!payments.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted">
                    No payments recorded. Client-claimed payments never activate premium.
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

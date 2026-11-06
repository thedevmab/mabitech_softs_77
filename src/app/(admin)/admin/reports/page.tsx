import { format } from "date-fns";
import { ReportStatus } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateReportStatusAction } from "./actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPermission("reports.manage");
  const params = await searchParams;
  const status =
    params.status && (Object.values(ReportStatus) as string[]).includes(params.status)
      ? (params.status as ReportStatus)
      : undefined;

  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { email: true, name: true } },
      reportedUser: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Reports</h2>
        <p className="text-sm text-muted">User-submitted content and account reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3">
            <select
              name="status"
              defaultValue={status || ""}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">All statuses</option>
              {Object.values(ReportStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {format(report.createdAt, "yyyy-MM-dd HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {report.reporter.email || report.reporter.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {report.entityType}/{report.entityId}
                    {report.reportedUser
                      ? ` · ${report.reportedUser.email || report.reportedUser.name}`
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{report.reason}</div>
                    {report.details ? (
                      <div className="text-xs text-muted line-clamp-2">{report.details}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-xs">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateReportStatusAction} className="flex flex-wrap gap-1">
                      <input type="hidden" name="id" value={report.id} />
                      {(["REVIEWED", "RESOLVED", "DISMISSED"] as const).map((s) => (
                        <Button
                          key={s}
                          type="submit"
                          name="status"
                          value={s}
                          size="sm"
                          variant="outline"
                          disabled={report.status === s}
                        >
                          {s}
                        </Button>
                      ))}
                    </form>
                  </td>
                </tr>
              ))}
              {!reports.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No reports found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Suspense } from "react";
import { format } from "date-fns";
import {
  Users,
  FileText,
  Package,
  Smartphone,
  Download,
  Eye,
  MousePointerClick,
  Crown,
  DollarSign,
  Activity,
} from "lucide-react";
import { requireAdminPermission } from "@/lib/admin/auth";
import {
  getDashboardStats,
  getLatestContent,
  getRecentActivity,
  getRecentDownloads,
  parseDateRange,
} from "@/lib/admin/stats";
import { StatsCard } from "@/components/admin/stats-card";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMoney(cents: number, currency = "ETB") {
  return `${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdminPermission("dashboard.view");
  const params = await searchParams;
  const range = parseDateRange(params);
  const fromStr = format(range.from, "yyyy-MM-dd");
  const toStr = format(range.to, "yyyy-MM-dd");

  const [stats, activity, downloads, content] = await Promise.all([
    getDashboardStats(range),
    getRecentActivity(),
    getRecentDownloads(),
    getLatestContent(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          <p className="text-sm text-muted">Live metrics from the database</p>
        </div>
        <Suspense fallback={null}>
          <DateRangeFilter from={fromStr} to={toStr} />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Users" value={stats.totalUsers} icon={Users} />
        <StatsCard title="Articles" value={stats.totalArticles} icon={FileText} />
        <StatsCard title="Software" value={stats.totalSoftware} icon={Package} />
        <StatsCard title="APKs" value={stats.totalApks} icon={Smartphone} />
        <StatsCard title="Downloads" value={stats.totalDownloads} icon={Download} />
        <StatsCard title="Downloads today" value={stats.downloadsToday} icon={Download} />
        <StatsCard title="MAU" value={stats.mau} subtitle="Last 30 days" icon={Activity} />
        <StatsCard title="Visitors" value={stats.visitors} subtitle="In range" icon={Eye} />
        <StatsCard title="Ad impressions" value={stats.adImpressions} icon={Eye} />
        <StatsCard title="Ad clicks" value={stats.adClicks} icon={MousePointerClick} />
        <StatsCard title="Premium subscribers" value={stats.premiumSubscribers} icon={Crown} />
        <StatsCard
          title="Estimated revenue"
          value={formatMoney(stats.estimatedRevenueCents)}
          subtitle="COMPLETED payments in range"
          icon={DollarSign}
        />
        <StatsCard
          title="Awaiting review"
          value={stats.awaitingReview}
          subtitle="Software pending review"
          icon={Package}
        />
        <StatsCard
          title="Notifications (7d)"
          value={stats.recentNotifications}
          subtitle="Submissions last 7 days"
          icon={Activity}
        />
        <StatsCard title="Open reports" value={stats.openReports} icon={MousePointerClick} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic & downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCharts data={stats.chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Action</th>
                    <th className="pb-2 pr-3 font-medium">User</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activity.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-muted">
                        No activity yet
                      </td>
                    </tr>
                  ) : (
                    activity.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 pr-3 text-foreground">{row.action}</td>
                        <td className="py-2.5 pr-3 text-muted">
                          {row.user?.name || row.user?.email || "—"}
                        </td>
                        <td className="py-2.5 text-muted">
                          {format(row.createdAt, "MMM d, HH:mm")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Software</th>
                    <th className="pb-2 pr-3 font-medium">User</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {downloads.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-muted">
                        No downloads yet
                      </td>
                    </tr>
                  ) : (
                    downloads.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 pr-3 text-foreground">{row.software.name}</td>
                        <td className="py-2.5 pr-3 text-muted">
                          {row.user?.name || row.user?.email || "Guest"}
                        </td>
                        <td className="py-2.5 text-muted">
                          {format(row.createdAt, "MMM d, HH:mm")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {content.posts.length === 0 ? (
                <li className="py-4 text-sm text-muted">No posts yet</li>
              ) : (
                content.posts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <a href={`/admin/posts/${p.id}`} className="truncate text-primary hover:underline">
                      {p.title}
                    </a>
                    <span className="shrink-0 rounded bg-surface-muted px-2 py-0.5 text-xs text-muted">
                      {p.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest software</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {content.software.length === 0 ? (
                <li className="py-4 text-sm text-muted">No software yet</li>
              ) : (
                content.software.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <a
                      href={`/admin/software/${s.id}`}
                      className="truncate text-primary hover:underline"
                    >
                      {s.name}
                    </a>
                    <span className="shrink-0 rounded bg-surface-muted px-2 py-0.5 text-xs text-muted">
                      {s.verificationStatus}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

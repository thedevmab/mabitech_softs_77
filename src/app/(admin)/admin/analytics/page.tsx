import { Suspense } from "react";
import { format } from "date-fns";
import { requireAdminPermission } from "@/lib/admin/auth";
import { getAnalyticsSeries, parseDateRange } from "@/lib/admin/stats";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { StatsCard } from "@/components/admin/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Download, BarChart3 } from "lucide-react";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdminPermission("analytics.view");
  const params = await searchParams;
  const range = parseDateRange(params);
  const series = await getAnalyticsSeries(range);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-muted">Event and download trends from the database</p>
        </div>
        <Suspense fallback={null}>
          <DateRangeFilter
            from={format(range.from, "yyyy-MM-dd")}
            to={format(range.to, "yyyy-MM-dd")}
          />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Events in range" value={series.totalEvents} icon={Activity} />
        <StatsCard title="Downloads in range" value={series.totalDownloads} icon={Download} />
        <StatsCard title="Event types" value={series.byName.length} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsCharts byDay={series.byDay} byName={series.byName} />
        </CardContent>
      </Card>
    </div>
  );
}

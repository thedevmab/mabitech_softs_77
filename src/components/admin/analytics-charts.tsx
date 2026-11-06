"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type DayPoint = { date: string; events: number; downloads: number; pageViews: number };
type NamePoint = { name: string; count: number };

export function AnalyticsCharts({
  byDay,
  byName,
}: {
  byDay: DayPoint[];
  byName: NamePoint[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="pageViews" name="Page views" stroke="#22d3ee" strokeWidth={2} />
            <Line type="monotone" dataKey="downloads" name="Downloads" stroke="#94a3b8" strokeWidth={2} />
            <Line type="monotone" dataKey="events" name="Events" stroke="#67e8f9" strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byName.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="count" name="Count" fill="#083687" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

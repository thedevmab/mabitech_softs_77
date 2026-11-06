import { prisma } from "@/lib/db";
import { startOfDay, subDays, eachDayOfInterval, format } from "date-fns";

export type DateRange = {
  from: Date;
  to: Date;
};

export function parseDateRange(searchParams: {
  from?: string;
  to?: string;
}): DateRange {
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const from = searchParams.from
    ? new Date(searchParams.from)
    : subDays(startOfDay(to), 29);
  return {
    from: startOfDay(from),
    to: new Date(Math.max(to.getTime(), from.getTime())),
  };
}

export async function getDashboardStats(range: DateRange) {
  const todayStart = startOfDay(new Date());
  const mauStart = subDays(todayStart, 30);

  const [
    totalUsers,
    totalArticles,
    totalSoftware,
    totalApks,
    totalDownloads,
    downloadsToday,
    downloadsInRange,
    mau,
    visitors,
    adAgg,
    premiumSubscribers,
    revenueAgg,
    visitorsByDay,
    downloadEvents,
    awaitingReview,
    recentNotifications,
    openReports,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null, status: { not: "DELETED" } } }),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.software.count({ where: { deletedAt: null } }),
    prisma.softwareFile.count({ where: { extension: "apk" } }),
    prisma.downloadEvent.count({ where: { type: "COMPLETED" } }),
    prisma.downloadEvent.count({
      where: { type: "COMPLETED", createdAt: { gte: todayStart } },
    }),
    prisma.downloadEvent.count({
      where: {
        type: "COMPLETED",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        OR: [
          { lastLoginAt: { gte: mauStart } },
          { downloads: { some: { createdAt: { gte: mauStart } } } },
        ],
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        name: { in: ["page_view", "visit", "session_start"] },
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.advertisement.aggregate({
      _sum: { impressions: true, clicks: true },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        OR: [
          {
            isPremium: true,
            premiumExpiresAt: { gt: new Date() },
          },
          {
            subscriptions: {
              some: { status: "ACTIVE", endsAt: { gt: new Date() } },
            },
          },
        ],
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: range.from, lte: range.to },
      },
      _sum: { amountCents: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        name: { in: ["page_view", "visit", "session_start"] },
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { createdAt: true },
    }),
    prisma.downloadEvent.findMany({
      where: {
        type: "COMPLETED",
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { createdAt: true },
    }),
    prisma.software.count({
      where: { deletedAt: null, status: "PENDING_REVIEW" },
    }),
    prisma.notification.count({
      where: { createdAt: { gte: subDays(todayStart, 7) } },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const downloadMap = new Map<string, number>();
  const visitorMap = new Map<string, number>();
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd");
    downloadMap.set(key, 0);
    visitorMap.set(key, 0);
  }
  for (const e of downloadEvents) {
    const key = format(e.createdAt, "yyyy-MM-dd");
    if (downloadMap.has(key)) downloadMap.set(key, (downloadMap.get(key) || 0) + 1);
  }
  for (const e of visitorsByDay) {
    const key = format(e.createdAt, "yyyy-MM-dd");
    if (visitorMap.has(key)) visitorMap.set(key, (visitorMap.get(key) || 0) + 1);
  }

  const chartData = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "MMM d"),
      downloads: downloadMap.get(key) || 0,
      visitors: visitorMap.get(key) || 0,
    };
  });

  return {
    totalUsers,
    totalArticles,
    totalSoftware,
    totalApks,
    totalDownloads,
    downloadsToday,
    downloadsInRange,
    mau,
    visitors,
    adImpressions: adAgg._sum.impressions || 0,
    adClicks: adAgg._sum.clicks || 0,
    premiumSubscribers,
    estimatedRevenueCents: revenueAgg._sum.amountCents || 0,
    awaitingReview,
    recentNotifications,
    openReports,
    chartData,
  };
}

export async function getRecentActivity(limit = 12) {
  return prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getRecentDownloads(limit = 10) {
  return prisma.downloadEvent.findMany({
    take: limit,
    where: { type: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      software: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
      file: { select: { id: true, originalName: true, extension: true } },
    },
  });
}

export async function getLatestContent(limit = 8) {
  const [posts, software] = await Promise.all([
    prisma.post.findMany({
      take: limit,
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        author: { select: { name: true, email: true } },
      },
    }),
    prisma.software.findMany({
      take: limit,
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verificationStatus: true,
        updatedAt: true,
      },
    }),
  ]);
  return { posts, software };
}

export async function getAnalyticsSeries(range: DateRange) {
  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { name: true, createdAt: true },
  });

  const downloads = await prisma.downloadEvent.findMany({
    where: {
      type: "COMPLETED",
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true },
  });

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const byDay = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: format(d, "MMM d"),
      events: events.filter((e) => format(e.createdAt, "yyyy-MM-dd") === key).length,
      downloads: downloads.filter((e) => format(e.createdAt, "yyyy-MM-dd") === key).length,
      pageViews: events.filter(
        (e) =>
          format(e.createdAt, "yyyy-MM-dd") === key &&
          ["page_view", "visit", "session_start"].includes(e.name),
      ).length,
    };
  });

  const byName = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      acc[e.name] = (acc[e.name] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, count]) => ({ name, count }));

  return { byDay, byName, totalEvents: events.length, totalDownloads: downloads.length };
}

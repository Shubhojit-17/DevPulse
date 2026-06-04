import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoIdsParam = searchParams.get("repoIds");
  const days = parseInt(searchParams.get("days") || "30");

  const userRepos = await prisma.userRepository.findMany({
    where: { userId: session.user.id },
    select: { repositoryId: true },
  });

  const allRepoIds = userRepos.map((ur) => ur.repositoryId);
  const repoIds = repoIdsParam ? repoIdsParam.split(",") : allRepoIds;

  if (repoIds.length === 0) {
    return NextResponse.json({
      totalMerged: 0,
      avgPrSize: 0,
      percentMergedWithin24h: 0,
      cycleTimeTrend: [],
      prsOpenedVsMerged: [],
      timeToFirstReviewTrend: [],
    });
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const metrics = await prisma.dailyMetric.findMany({
    where: {
      repoId: { in: repoIds },
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  const totalMerged = metrics.reduce((sum, m) => sum + m.prsMerged, 0);

  const mergedPrs = await prisma.pullRequest.findMany({
    where: {
      repoId: { in: repoIds },
      merged: true,
      mergedAt: { gte: startDate },
    },
    select: { additions: true, deletions: true, cycleTimeSeconds: true },
  });

  const avgPrSize =
    mergedPrs.length > 0
      ? Math.round(
          mergedPrs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0) /
            mergedPrs.length
        )
      : 0;

  const mergedWithin24h = mergedPrs.filter(
    (pr) => pr.cycleTimeSeconds !== null && pr.cycleTimeSeconds < 86400
  ).length;
  const percentMergedWithin24h =
    mergedPrs.length > 0
      ? Math.round((mergedWithin24h / mergedPrs.length) * 100)
      : 0;

  const cycleTimeMap = new Map<string, { total: number; count: number }>();
  const firstReviewMap = new Map<string, { total: number; count: number }>();

  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];

    if (!cycleTimeMap.has(dateKey)) {
      cycleTimeMap.set(dateKey, { total: 0, count: 0 });
    }
    const cycleEntry = cycleTimeMap.get(dateKey)!;
    cycleEntry.total += metric.avgCycleTimeSeconds * metric.prsMerged;
    cycleEntry.count += metric.prsMerged;

    if (!firstReviewMap.has(dateKey)) {
      firstReviewMap.set(dateKey, { total: 0, count: 0 });
    }
    const firstReviewEntry = firstReviewMap.get(dateKey)!;
    firstReviewEntry.total += metric.avgTimeToFirstReviewSeconds * metric.prsOpened;
    firstReviewEntry.count += metric.prsOpened;
  }

  const cycleTimeTrend = Array.from(cycleTimeMap.entries()).map(
    ([date, { total, count }]) => ({
      date,
      value: count > 0 ? Math.round((total / count) / 3600 * 100) / 100 : 0,
    })
  );

  const timeToFirstReviewTrend = Array.from(firstReviewMap.entries()).map(
    ([date, { total, count }]) => ({
      date,
      value: count > 0 ? Math.round((total / count) / 3600 * 100) / 100 : 0,
    })
  );

  const prsOpenedVsMerged = metrics.map((m) => ({
    date: m.date.toISOString().split("T")[0],
    opened: m.prsOpened,
    merged: m.prsMerged,
  }));

  return NextResponse.json({
    totalMerged,
    avgPrSize,
    percentMergedWithin24h,
    cycleTimeTrend,
    prsOpenedVsMerged,
    timeToFirstReviewTrend,
  });
}

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
      deploymentFrequency: 0,
      leadTimeHours: 0,
      changeFailureRate: 0,
      deploymentFrequencyTrend: 0,
      leadTimeTrend: 0,
      changeFailureRateTrend: 0,
      commitsTotal: 0,
      commitsTrend: 0,
      timeSeries: [],
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

  if (metrics.length === 0) {
    return NextResponse.json({
      deploymentFrequency: 0,
      leadTimeHours: 0,
      changeFailureRate: 0,
      deploymentFrequencyTrend: 0,
      leadTimeTrend: 0,
      changeFailureRateTrend: 0,
      commitsTotal: 0,
      commitsTrend: 0,
      timeSeries: [],
    });
  }

  const totalDeployments = metrics.reduce((sum, m) => sum + m.deploymentsTotal, 0);
  const deploymentFrequency = totalDeployments / days;
  const commitsTotal = metrics.reduce((sum, m) => sum + m.commitsTotal, 0);

  const mergedPrs = metrics.reduce((sum, m) => sum + m.prsMerged, 0);
  const totalCycleTime = metrics.reduce(
    (sum, m) => sum + m.avgCycleTimeSeconds * m.prsMerged,
    0
  );
  const leadTimeHours = mergedPrs > 0 ? (totalCycleTime / mergedPrs / 3600) : 0;

  const totalFailures = metrics.reduce((sum, m) => sum + m.deploymentFailures, 0);
  const changeFailureRate = totalDeployments > 0 ? (totalFailures / totalDeployments) * 100 : 0;

  const halfDays = Math.floor(days / 2);
  const midpoint = new Date(startDate);
  midpoint.setUTCDate(midpoint.getUTCDate() + halfDays);

  const firstHalf = metrics.filter((m) => m.date < midpoint);
  const secondHalf = metrics.filter((m) => m.date >= midpoint);

  const calcHalfMetrics = (half: typeof metrics) => {
    if (half.length === 0) return { deployFreq: 0, leadTime: 0, failRate: 0, commits: 0 };
    const deps = half.reduce((sum, m) => sum + m.deploymentsTotal, 0);
    const merged = half.reduce((sum, m) => sum + m.prsMerged, 0);
    const cycle = half.reduce((sum, m) => sum + m.avgCycleTimeSeconds * m.prsMerged, 0);
    const fails = half.reduce((sum, m) => sum + m.deploymentFailures, 0);
    const commits = half.reduce((sum, m) => sum + m.commitsTotal, 0);
    return {
      deployFreq: deps / halfDays,
      leadTime: merged > 0 ? (cycle / merged / 3600) : 0,
      failRate: deps > 0 ? (fails / deps) * 100 : 0,
      commits,
    };
  };

  const firstHalfMetrics = calcHalfMetrics(firstHalf);
  const secondHalfMetrics = calcHalfMetrics(secondHalf);

  const deploymentFrequencyTrend = firstHalfMetrics.deployFreq > 0
    ? ((secondHalfMetrics.deployFreq - firstHalfMetrics.deployFreq) / firstHalfMetrics.deployFreq) * 100
    : 0;

  const leadTimeTrend = firstHalfMetrics.leadTime > 0
    ? ((secondHalfMetrics.leadTime - firstHalfMetrics.leadTime) / firstHalfMetrics.leadTime) * 100
    : 0;

  const changeFailureRateTrend = firstHalfMetrics.failRate > 0
    ? secondHalfMetrics.failRate - firstHalfMetrics.failRate
    : 0;

  const commitsTrend = firstHalfMetrics.commits > 0
    ? ((secondHalfMetrics.commits - firstHalfMetrics.commits) / firstHalfMetrics.commits) * 100
    : 0;

  const timeSeriesMap = new Map<string, { date: string; deploymentFrequency: number; leadTimeHours: number; changeFailureRate: number; commits: number }>();

  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];
    if (!timeSeriesMap.has(dateKey)) {
      timeSeriesMap.set(dateKey, {
        date: dateKey,
        deploymentFrequency: 0,
        leadTimeHours: 0,
        changeFailureRate: 0,
        commits: 0,
      });
    }
    const entry = timeSeriesMap.get(dateKey)!;
    entry.deploymentFrequency += metric.deploymentsTotal;
    entry.commits += metric.commitsTotal;
    if (metric.prsMerged > 0) {
      entry.leadTimeHours += (metric.avgCycleTimeSeconds * metric.prsMerged) / 3600;
    }
    if (metric.deploymentsTotal > 0) {
      entry.changeFailureRate = (metric.deploymentFailures / metric.deploymentsTotal) * 100;
    }
  }

  const timeSeries = Array.from(timeSeriesMap.values()).map((entry) => ({
    date: entry.date,
    deploymentFrequency: entry.deploymentFrequency,
    leadTimeHours: entry.leadTimeHours,
    changeFailureRate: entry.changeFailureRate,
    commits: entry.commits,
  }));

  return NextResponse.json({
    deploymentFrequency: Math.round(deploymentFrequency * 100) / 100,
    leadTimeHours: Math.round(leadTimeHours * 100) / 100,
    changeFailureRate: Math.round(changeFailureRate * 100) / 100,
    commitsTotal,
    deploymentFrequencyTrend: Math.round(deploymentFrequencyTrend),
    leadTimeTrend: Math.round(leadTimeTrend),
    changeFailureRateTrend: Math.round(changeFailureRateTrend),
    commitsTrend: Math.round(commitsTrend),
    timeSeries,
  });
}

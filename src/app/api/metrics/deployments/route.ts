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
      frequencyPerDay: 0,
      successRate: 0,
      totalFailures: 0,
      deploymentsPerDay: [],
      successVsFailure: [],
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

  const totalDeployments = metrics.reduce((sum, m) => sum + m.deploymentsTotal, 0);
  const totalSuccesses = metrics.reduce((sum, m) => sum + m.deploymentSuccesses, 0);
  const totalFailures = metrics.reduce((sum, m) => sum + m.deploymentFailures, 0);

  const frequencyPerDay = Math.round((totalDeployments / days) * 100) / 100;
  const successRate =
    totalDeployments > 0 ? Math.round((totalSuccesses / totalDeployments) * 100) : 0;

  const deploymentsPerDayMap = new Map<string, number>();
  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];
    const current = deploymentsPerDayMap.get(dateKey) || 0;
    deploymentsPerDayMap.set(dateKey, current + metric.deploymentsTotal);
  }

  const deploymentsPerDay = Array.from(deploymentsPerDayMap.entries()).map(
    ([date, value]) => ({ date, value })
  );

  const successVsFailureMap = new Map<string, { success: number; failure: number }>();
  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];
    if (!successVsFailureMap.has(dateKey)) {
      successVsFailureMap.set(dateKey, { success: 0, failure: 0 });
    }
    const entry = successVsFailureMap.get(dateKey)!;
    entry.success += metric.deploymentSuccesses;
    entry.failure += metric.deploymentFailures;
  }

  const successVsFailure = Array.from(successVsFailureMap.entries()).map(
    ([date, { success, failure }]) => ({ date, success, failure })
  );

  return NextResponse.json({
    frequencyPerDay,
    successRate,
    totalFailures,
    deploymentsPerDay,
    successVsFailure,
  });
}

import { prisma } from "@/lib/prisma";

export async function computeDailyMetrics(repoId: string, date: Date) {
  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const prsOpened = await prisma.pullRequest.count({
    where: {
      repoId,
      createdAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  const prsMerged = await prisma.pullRequest.count({
    where: {
      repoId,
      merged: true,
      mergedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  const prsClosed = await prisma.pullRequest.count({
    where: {
      repoId,
      closedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  const mergedPrs = await prisma.pullRequest.findMany({
    where: {
      repoId,
      merged: true,
      mergedAt: {
        gte: targetDate,
        lt: nextDate,
      },
      cycleTimeSeconds: { not: null },
    },
    select: { cycleTimeSeconds: true },
  });

  const avgCycleTimeSeconds =
    mergedPrs.length > 0
      ? Math.round(
          mergedPrs.reduce((sum, pr) => sum + (pr.cycleTimeSeconds ?? 0), 0) /
            mergedPrs.length
        )
      : 0;

  const reviewsSubmitted = await prisma.prReview.count({
    where: {
      pullRequest: { repoId },
      submittedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  const prsWithFirstReview = await prisma.pullRequest.findMany({
    where: {
      repoId,
      firstReviewAt: {
        gte: targetDate,
        lt: nextDate,
      },
      timeToFirstReviewSeconds: { not: null },
    },
    select: { timeToFirstReviewSeconds: true },
  });

  const avgTimeToFirstReviewSeconds =
    prsWithFirstReview.length > 0
      ? Math.round(
          prsWithFirstReview.reduce(
            (sum, pr) => sum + (pr.timeToFirstReviewSeconds ?? 0),
            0
          ) / prsWithFirstReview.length
        )
      : 0;

  const deployments = await prisma.deployment.findMany({
    where: {
      repoId,
      statusUpdatedAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  const deploymentsTotal = deployments.length;
  const deploymentSuccesses = deployments.filter(
    (d) => d.status === "success"
  ).length;
  const deploymentFailures = deployments.filter(
    (d) => d.status === "failure" || d.status === "error"
  ).length;

  const commitsTotal = await prisma.commit.count({
    where: {
      repoId,
      createdAt: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });

  await prisma.dailyMetric.upsert({
    where: {
      repoId_date: {
        repoId,
        date: targetDate,
      },
    },
    update: {
      prsOpened,
      prsMerged,
      prsClosed,
      avgCycleTimeSeconds,
      avgTimeToFirstReviewSeconds,
      reviewsSubmitted,
      deploymentsTotal,
      deploymentSuccesses,
      deploymentFailures,
      commitsTotal,
    },
    create: {
      repoId,
      date: targetDate,
      prsOpened,
      prsMerged,
      prsClosed,
      avgCycleTimeSeconds,
      avgTimeToFirstReviewSeconds,
      reviewsSubmitted,
      deploymentsTotal,
      deploymentSuccesses,
      deploymentFailures,
      commitsTotal,
    },
  });
}

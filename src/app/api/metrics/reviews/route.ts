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
      totalReviews: 0,
      topReviewer: "",
      reviewsPerReviewer: [],
      reviewsPerDay: [],
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

  const totalReviews = metrics.reduce((sum, m) => sum + m.reviewsSubmitted, 0);

  const reviews = await prisma.prReview.findMany({
    where: {
      pullRequest: { repoId: { in: repoIds } },
      submittedAt: { gte: startDate },
    },
    select: { reviewerLogin: true },
  });

  const reviewerCounts = new Map<string, number>();
  for (const review of reviews) {
    const count = reviewerCounts.get(review.reviewerLogin) || 0;
    reviewerCounts.set(review.reviewerLogin, count + 1);
  }

  const reviewsPerReviewer = Array.from(reviewerCounts.entries())
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count);

  const topReviewer = reviewsPerReviewer.length > 0 ? reviewsPerReviewer[0].login : "";

  const reviewsPerDayMap = new Map<string, number>();
  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];
    const current = reviewsPerDayMap.get(dateKey) || 0;
    reviewsPerDayMap.set(dateKey, current + metric.reviewsSubmitted);
  }

  const reviewsPerDay = Array.from(reviewsPerDayMap.entries()).map(
    ([date, value]) => ({ date, value })
  );

  return NextResponse.json({
    totalReviews,
    topReviewer,
    reviewsPerReviewer,
    reviewsPerDay,
  });
}

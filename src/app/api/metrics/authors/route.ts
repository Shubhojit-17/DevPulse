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
    return NextResponse.json([]);
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const prsAggregated = await prisma.pullRequest.groupBy({
    by: ["authorLogin"],
    where: {
      repoId: { in: repoIds },
      merged: true,
      mergedAt: { gte: startDate },
    },
    _count: { id: true },
    _sum: { cycleTimeSeconds: true, additions: true, deletions: true },
  });

  const authorStats = new Map<
    string,
    { prsMerged: number; totalCycleTime: number; totalPrSize: number }
  >();

  for (const stat of prsAggregated) {
    authorStats.set(stat.authorLogin, {
      prsMerged: stat._count.id,
      totalCycleTime: stat._sum.cycleTimeSeconds ?? 0,
      totalPrSize: (stat._sum.additions ?? 0) + (stat._sum.deletions ?? 0),
    });
  }

  const reviewsGiven = await prisma.prReview.groupBy({
    by: ["reviewerLogin"],
    where: {
      pullRequest: { repoId: { in: repoIds } },
      submittedAt: { gte: startDate },
    },
    _count: { id: true },
  });

  const reviewsGivenMap = new Map<string, number>();
  for (const review of reviewsGiven) {
    reviewsGivenMap.set(review.reviewerLogin, review._count.id);
  }

  const allAuthors = new Set([
    ...authorStats.keys(),
    ...reviewsGivenMap.keys(),
  ]);

  const result = Array.from(allAuthors).map((login) => {
    const stats = authorStats.get(login);
    return {
      login,
      prsMerged: stats?.prsMerged ?? 0,
      avgCycleTimeSeconds:
        stats && stats.prsMerged > 0
          ? Math.round(stats.totalCycleTime / stats.prsMerged)
          : 0,
      avgPrSize:
        stats && stats.prsMerged > 0
          ? Math.round(stats.totalPrSize / stats.prsMerged)
          : 0,
      reviewsGiven: reviewsGivenMap.get(login) ?? 0,
      reviewsReceived: 0,
    };
  });

  result.sort((a, b) => b.prsMerged - a.prsMerged);

  return NextResponse.json(result);
}

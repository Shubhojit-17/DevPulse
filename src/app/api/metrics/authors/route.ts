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

  // Fetch merged PRs with their reviews in a single query — no N+1
  const mergedPrs = await prisma.pullRequest.findMany({
    where: {
      repoId: { in: repoIds },
      merged: true,
      mergedAt: { gte: startDate },
    },
    select: {
      id: true,
      authorLogin: true,
      additions: true,
      deletions: true,
      cycleTimeSeconds: true,
      reviews: {
        select: { id: true },
      },
    },
  });

  // Aggregate per-author stats from merged PRs
  const authorStats = new Map<
    string,
    { prsMerged: number; totalCycleTime: number; totalPrSize: number; reviewsReceived: number }
  >();

  for (const pr of mergedPrs) {
    const author = pr.authorLogin;
    if (!authorStats.has(author)) {
      authorStats.set(author, {
        prsMerged: 0,
        totalCycleTime: 0,
        totalPrSize: 0,
        reviewsReceived: 0,
      });
    }
    const stats = authorStats.get(author)!;
    stats.prsMerged++;
    stats.totalCycleTime += pr.cycleTimeSeconds ?? 0;
    stats.totalPrSize += pr.additions + pr.deletions;
    stats.reviewsReceived += pr.reviews.length;
  }

  // Single grouped query for reviews given per reviewer
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

  // Merge all authors (some may only give reviews, not have merged PRs)
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
      reviewsReceived: stats?.reviewsReceived ?? 0,
    };
  });

  result.sort((a, b) => b.prsMerged - a.prsMerged);

  return NextResponse.json(result);
}

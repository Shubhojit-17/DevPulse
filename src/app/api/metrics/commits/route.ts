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
      totalCommits: 0,
      avgPerDay: 0,
      topAuthors: [],
      commitsPerDay: [],
      recentCommits: [],
      perRepo: [],
    });
  }

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  // --- Aggregate daily metrics ---
  const metrics = await prisma.dailyMetric.findMany({
    where: {
      repoId: { in: repoIds },
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  const totalCommits = metrics.reduce((sum, m) => sum + m.commitsTotal, 0);
  const avgPerDay = Math.round((totalCommits / days) * 100) / 100;

  // Commits per day (aggregated across repos)
  const commitsPerDayMap = new Map<string, number>();
  for (const metric of metrics) {
    const dateKey = metric.date.toISOString().split("T")[0];
    const current = commitsPerDayMap.get(dateKey) || 0;
    commitsPerDayMap.set(dateKey, current + metric.commitsTotal);
  }
  const commitsPerDay = Array.from(commitsPerDayMap.entries()).map(
    ([date, value]) => ({ date, value })
  );

  // --- Per-repo breakdown ---
  const repoMap = new Map<string, number>();
  for (const metric of metrics) {
    const current = repoMap.get(metric.repoId) || 0;
    repoMap.set(metric.repoId, current + metric.commitsTotal);
  }
  const repos = await prisma.repository.findMany({
    where: { id: { in: repoIds } },
    select: { id: true, fullName: true },
  });
  const repoNameMap = new Map(repos.map((r) => [r.id, r.fullName]));
  const perRepo = Array.from(repoMap.entries())
    .map(([repoId, commits]) => ({
      label: repoNameMap.get(repoId) || repoId,
      value: commits,
    }))
    .sort((a, b) => b.value - a.value);

  // --- Top authors ---
  const commits = await prisma.commit.findMany({
    where: {
      repoId: { in: repoIds },
      createdAt: { gte: startDate },
    },
    select: { authorLogin: true },
  });

  const authorMap = new Map<string, number>();
  for (const c of commits) {
    const author = c.authorLogin || "Unknown";
    authorMap.set(author, (authorMap.get(author) || 0) + 1);
  }
  const topAuthors = Array.from(authorMap.entries())
    .map(([author, count]) => ({ label: author, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // --- Recent commits ---
  const recentCommits = await prisma.commit.findMany({
    where: {
      repoId: { in: repoIds },
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { repository: { select: { fullName: true } } },
  });

  const recentCommitsList = recentCommits.map((c) => ({
    sha: c.githubSha.substring(0, 7),
    message: c.message.split("\n")[0],
    author: c.authorLogin || "Unknown",
    repo: c.repository.fullName,
    date: c.createdAt.toISOString(),
  }));

  return NextResponse.json({
    totalCommits,
    avgPerDay,
    topAuthors,
    commitsPerDay,
    recentCommits: recentCommitsList,
    perRepo,
  });
}

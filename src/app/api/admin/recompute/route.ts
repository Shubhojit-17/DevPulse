import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeDailyMetrics } from "@/lib/metrics/compute";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { repoIds, startDate, endDate } = body;

  const repos = repoIds
    ? await prisma.repository.findMany({ where: { id: { in: repoIds } } })
    : await prisma.repository.findMany();

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(0, 0, 0, 0);

  const results = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    for (const repo of repos) {
      try {
        await computeDailyMetrics(repo.id, currentDate);
        results.push({
          repoId: repo.id,
          date: currentDate.toISOString().split("T")[0],
          status: "success",
        });
      } catch (error) {
        results.push({
          repoId: repo.id,
          date: currentDate.toISOString().split("T")[0],
          status: "error",
          error: String(error),
        });
      }
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return NextResponse.json({ results });
}

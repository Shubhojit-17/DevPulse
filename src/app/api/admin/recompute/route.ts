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
  const { repoId, fromDate, toDate } = body;

  if (!repoId || !fromDate || !toDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const start = new Date(fromDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setUTCHours(0, 0, 0, 0);

  let daysRecomputed = 0;
  const currentDate = new Date(start);

  while (currentDate <= end) {
    await computeDailyMetrics(repo.id, currentDate);
    daysRecomputed++;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return NextResponse.json({ success: true, daysRecomputed });
}

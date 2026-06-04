import { NextRequest, NextResponse } from "next/server";

import { verifyGitHubSignature } from "@/lib/github/webhook";
import { prisma } from "@/lib/prisma";
import { githubQueue } from "@/lib/queue";

export async function POST(request: NextRequest) {
  const repoId = request.nextUrl.searchParams.get("repoId");
  if (!repoId) {
    return NextResponse.json(
      { error: "Missing repoId parameter" },
      { status: 400 }
    );
  }

  const deliveryId = request.headers.get("x-github-delivery");
  if (!deliveryId) {
    return NextResponse.json(
      { error: "Missing X-GitHub-Delivery header" },
      { status: 400 }
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!event) {
    return NextResponse.json(
      { error: "Missing X-GitHub-Event header" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  const repository = await prisma.repository.findUnique({
    where: { id: repoId },
  });

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const isValid = verifyGitHubSignature(
    Buffer.from(rawBody),
    signature,
    repository.webhookSecret
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    await prisma.webhookDelivery.create({
      data: {
        id: deliveryId,
        repositoryId: repoId,
        event,
      },
    });
  } catch (error) {
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ status: "already_processed" });
    }
    throw error;
  }

  const payload = JSON.parse(rawBody);

  await githubQueue.add("github-event", {
    event,
    payload,
    repoId,
  });

  return NextResponse.json({ status: "queued" });
}

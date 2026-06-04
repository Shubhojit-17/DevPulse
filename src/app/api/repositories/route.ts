import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.userRepository.findMany({
    where: { userId: session.user.id },
    include: { repository: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    repos.map((ur) => ({
      id: ur.repository.id,
      fullName: ur.repository.fullName,
      owner: ur.repository.owner,
      name: ur.repository.name,
      defaultBranch: ur.repository.defaultBranch,
      isPrivate: ur.repository.isPrivate,
      backfillStatus: ur.repository.backfillStatus,
      lastBackfillAt: ur.repository.lastBackfillAt,
      connectedAt: ur.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.accessToken) {
    return NextResponse.json(
      { error: "GitHub access token not found" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { githubId } = body;

  if (!githubId) {
    return NextResponse.json(
      { error: "githubId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.repository.findUnique({
    where: { githubId },
  });

  if (existing) {
    await prisma.userRepository.upsert({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId: existing.id,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        repositoryId: existing.id,
      },
    });

    return NextResponse.json({ repository: existing, alreadyConnected: true });
  }

  const ghRepo = await fetchRepoFromGitHub(
    user.accessToken,
    githubId
  );

  if (!ghRepo) {
    return NextResponse.json(
      { error: "Repository not found on GitHub" },
      { status: 404 }
    );
  }

  const webhookSecret = crypto.randomBytes(32).toString("hex");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const repository = await prisma.repository.create({
    data: {
      githubId: ghRepo.id,
      fullName: ghRepo.full_name,
      owner: ghRepo.owner.login,
      name: ghRepo.name,
      defaultBranch: ghRepo.default_branch,
      isPrivate: ghRepo.private,
      webhookSecret,
      backfillStatus: "pending",
    },
  });

  const webhook = await registerGitHubWebhook(
    user.accessToken,
    ghRepo.owner.login,
    ghRepo.name,
    `${appUrl}/api/webhooks/github?repoId=${repository.id}`,
    webhookSecret
  );

  await prisma.repository.update({
    where: { id: repository.id },
    data: { webhookId: webhook.id },
  });

  await prisma.userRepository.create({
    data: {
      userId: session.user.id,
      repositoryId: repository.id,
    },
  });

  const { backfillQueue } = await import("@/lib/queue");
  await backfillQueue.add("backfill", {
    repoId: repository.id,
    accessToken: user.accessToken,
    owner: ghRepo.owner.login,
    name: ghRepo.name,
  });

  return NextResponse.json({ repository }, { status: 201 });
}

async function fetchRepoFromGitHub(accessToken: string, githubId: number) {
  try {
    const response = await fetch(
      `https://api.github.com/repositories/${githubId}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) return null;
    return (await response.json()) as {
      id: number;
      full_name: string;
      name: string;
      owner: { login: string };
      default_branch: string;
      private: boolean;
    };
  } catch {
    return null;
  }
}

async function registerGitHubWebhook(
  accessToken: string,
  owner: string,
  name: string,
  url: string,
  secret: string
) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/hooks`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: [
          "pull_request",
          "pull_request_review",
          "push",
          "deployment",
          "deployment_status",
        ],
        config: {
          url,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      }),
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to register webhook: ${response.status} ${message}`);
  }

  return (await response.json()) as { id: number };
}



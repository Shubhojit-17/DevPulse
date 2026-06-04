import { prisma } from "@/lib/prisma";
import { GitHubEventJob } from "@/lib/queue";

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    user: { login: string };
    state: string;
    merged: boolean;
    draft: boolean;
    additions: number;
    deletions: number;
    changed_files: number;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
  };
}

export async function processPullRequest(job: GitHubEventJob) {
  const { payload, repoId } = job;
  const data = payload as PullRequestPayload;
  const { action, pull_request: pr } = data;

  const baseData = {
    repoId,
    number: pr.number,
    title: pr.title,
    authorLogin: pr.user.login,
    state: pr.state,
    merged: pr.merged,
    draft: pr.draft,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    createdAt: new Date(pr.created_at),
    updatedAt: new Date(pr.updated_at),
    closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
    mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
  };

  if (action === "opened" || action === "reopened") {
    await prisma.pullRequest.upsert({
      where: { githubPrId: pr.id },
      update: baseData,
      create: {
        githubPrId: pr.id,
        ...baseData,
      },
    });
  }

  if (action === "closed") {
    const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
    const createdAt = new Date(pr.created_at);
    const cycleTimeSeconds =
      mergedAt && createdAt
        ? Math.floor((mergedAt.getTime() - createdAt.getTime()) / 1000)
        : null;

    await prisma.pullRequest.upsert({
      where: { githubPrId: pr.id },
      update: {
        ...baseData,
        mergedAt,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        cycleTimeSeconds,
      },
      create: {
        githubPrId: pr.id,
        ...baseData,
        mergedAt,
        closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
        cycleTimeSeconds,
      },
    });
  }

  if (action === "synchronize") {
    await prisma.pullRequest.upsert({
      where: { githubPrId: pr.id },
      update: {
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        updatedAt: new Date(pr.updated_at),
      },
      create: {
        githubPrId: pr.id,
        ...baseData,
      },
    });
  }

  if (action === "converted_to_draft" || action === "ready_for_review") {
    await prisma.pullRequest.upsert({
      where: { githubPrId: pr.id },
      update: { draft: pr.draft },
      create: {
        githubPrId: pr.id,
        ...baseData,
      },
    });
  }

  if (action === "edited") {
    await prisma.pullRequest.upsert({
      where: { githubPrId: pr.id },
      update: { title: pr.title, updatedAt: new Date(pr.updated_at) },
      create: {
        githubPrId: pr.id,
        ...baseData,
      },
    });
  }

  return job;
}

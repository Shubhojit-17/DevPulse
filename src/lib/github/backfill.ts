import { prisma } from "@/lib/prisma";
import { githubRequest } from "@/lib/github/client";
import type {
  GitHubPullRequest,
  GitHubReview,
  GitHubDeployment,
} from "@/types/github";

interface BackfillParams {
  repoId: string;
  accessToken: string;
  owner: string;
  name: string;
}

export async function backfillRepository(params: BackfillParams) {
  const { repoId, accessToken, owner, name } = params;
  const since = new Date();
  since.setDate(since.getDate() - 90);

  await prisma.repository.update({
    where: { id: repoId },
    data: { backfillStatus: "in_progress" },
  });

  try {
    await backfillPullRequests(repoId, accessToken, owner, name, since);
    await backfillDeployments(repoId, accessToken, owner, name, since);
    await backfillCommits(repoId, accessToken, owner, name, since);

    await prisma.repository.update({
      where: { id: repoId },
      data: {
        backfillStatus: "completed",
        lastBackfillAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.repository.update({
      where: { id: repoId },
      data: { backfillStatus: "failed" },
    });
    throw error;
  }
}

async function backfillPullRequests(
  repoId: string,
  accessToken: string,
  owner: string,
  name: string,
  since: Date
) {
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const prs = await githubRequest<GitHubPullRequest[]>(
      accessToken,
      `/repos/${owner}/${name}/pulls?state=all&sort=updated&direction=desc&per_page=${perPage}&page=${page}&since=${since.toISOString()}`
    );

    if (prs.length === 0) {
      hasMore = false;
      break;
    }

    for (const pr of prs) {
      const prCreatedAt = new Date(pr.created_at);
      if (prCreatedAt < since) {
        hasMore = false;
        break;
      }

      const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
      const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;
      const cycleTimeSeconds =
        mergedAt && prCreatedAt
          ? Math.floor((mergedAt.getTime() - prCreatedAt.getTime()) / 1000)
          : null;

      await prisma.pullRequest.upsert({
        where: { githubPrId: pr.id },
        update: {
          title: pr.title,
          authorLogin: pr.user.login,
          state: pr.state,
          merged: pr.merged,
          draft: pr.draft,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          updatedAt: new Date(pr.updated_at),
          closedAt,
          mergedAt,
          cycleTimeSeconds,
        },
        create: {
          githubPrId: pr.id,
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
          createdAt: prCreatedAt,
          updatedAt: new Date(pr.updated_at),
          closedAt,
          mergedAt,
          cycleTimeSeconds,
        },
      });

      await backfillReviewsForPr(accessToken, owner, name, pr.id);
    }

    page++;
    if (prs.length < perPage) {
      hasMore = false;
    }
  }
}

async function backfillReviewsForPr(
  accessToken: string,
  owner: string,
  name: string,
  githubPrId: number
) {
  const pr = await prisma.pullRequest.findUnique({
    where: { githubPrId },
  });

  if (!pr) return;

  const reviews = await githubRequest<GitHubReview[]>(
    accessToken,
    `/repos/${owner}/${name}/pulls/${pr.number}/reviews?per_page=100`
  );

  for (const review of reviews) {
    if (!review.user || !review.submitted_at) continue;

    const reviewState = mapReviewState(review.state);
    if (!reviewState) continue;

    await prisma.prReview.upsert({
      where: { githubReviewId: review.id },
      update: {},
      create: {
        githubReviewId: review.id,
        pullRequestId: pr.id,
        reviewerLogin: review.user.login,
        state: reviewState,
        submittedAt: new Date(review.submitted_at),
      },
    });
  }

  if (!pr.firstReviewAt) {
    const firstReview = await prisma.prReview.findFirst({
      where: { pullRequestId: pr.id },
      orderBy: { submittedAt: "asc" },
    });

    if (firstReview) {
      const timeToFirstReviewSeconds = Math.floor(
        (firstReview.submittedAt.getTime() - pr.createdAt.getTime()) / 1000
      );

      await prisma.pullRequest.update({
        where: { id: pr.id },
        data: {
          firstReviewAt: firstReview.submittedAt,
          timeToFirstReviewSeconds,
        },
      });
    }
  }
}

async function backfillDeployments(
  repoId: string,
  accessToken: string,
  owner: string,
  name: string,
  since: Date
) {
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const deployments = await githubRequest<GitHubDeployment[]>(
      accessToken,
      `/repos/${owner}/${name}/deployments?per_page=${perPage}&page=${page}`
    );

    if (deployments.length === 0) {
      hasMore = false;
      break;
    }

    for (const deployment of deployments) {
      const createdAt = new Date(deployment.created_at);
      if (createdAt < since) {
        hasMore = false;
        break;
      }

      await prisma.deployment.upsert({
        where: { githubDeploymentId: deployment.id },
        update: {},
        create: {
          githubDeploymentId: deployment.id,
          repoId,
          environment: deployment.environment,
          ref: deployment.ref,
          sha: deployment.sha,
          createdAt,
          status: "pending",
        },
      });

      await backfillDeploymentStatuses(
        accessToken,
        owner,
        name,
        deployment.id
      );
    }

    page++;
    if (deployments.length < perPage) {
      hasMore = false;
    }
  }
}

async function backfillDeploymentStatuses(
  accessToken: string,
  owner: string,
  name: string,
  deploymentId: number
) {
  const statuses = await githubRequest<
    { id: number; state: string; created_at: string }[]
  >(
    accessToken,
    `/repos/${owner}/${name}/deployments/${deploymentId}/statuses?per_page=100`
  );

  if (statuses.length === 0) return;

  const latestStatus = statuses[0];
  const mappedStatus = mapDeploymentStatus(latestStatus.state);

  if (mappedStatus) {
    await prisma.deployment.updateMany({
      where: { githubDeploymentId: deploymentId },
      data: {
        status: mappedStatus,
        statusUpdatedAt: new Date(latestStatus.created_at),
      },
    });
  }
}

async function backfillCommits(
  repoId: string,
  accessToken: string,
  owner: string,
  name: string,
  since: Date
) {
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const commits = await githubRequest<any[]>(
      accessToken,
      `/repos/${owner}/${name}/commits?since=${since.toISOString()}&per_page=${perPage}&page=${page}`
    );

    if (commits.length === 0) {
      hasMore = false;
      break;
    }

    for (const commit of commits) {
      const createdAt = new Date(commit.commit.author.date);

      await prisma.commit.upsert({
        where: { githubSha: commit.sha },
        update: {},
        create: {
          githubSha: commit.sha,
          repoId,
          message: commit.commit.message,
          authorLogin: commit.author?.login || commit.commit.author?.name,
          authorEmail: commit.commit.author?.email,
          createdAt,
        },
      });
    }

    page++;
    if (commits.length < perPage) {
      hasMore = false;
    }
  }
}

function mapReviewState(
  state: string
): "approved" | "changes_requested" | "commented" | null {
  switch (state.toLowerCase()) {
    case "approved":
      return "approved";
    case "changes_requested":
      return "changes_requested";
    case "commented":
      return "commented";
    default:
      return null;
  }
}

function mapDeploymentStatus(
  state: string
): "success" | "failure" | "error" | "pending" | null {
  switch (state.toLowerCase()) {
    case "success":
      return "success";
    case "failure":
      return "failure";
    case "error":
      return "error";
    case "pending":
    case "queued":
    case "in_progress":
      return "pending";
    default:
      return null;
  }
}

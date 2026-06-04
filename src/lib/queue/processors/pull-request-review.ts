import { prisma } from "@/lib/prisma";
import { GitHubEventJob } from "@/lib/queue";

interface ReviewPayload {
  action: string;
  review: {
    id: number;
    user: { login: string } | null;
    state: string;
    submitted_at: string | null;
  };
  pull_request: {
    id: number;
    created_at: string;
  };
}

export async function processPullRequestReview(job: GitHubEventJob) {
  const { payload } = job;
  const data = payload as ReviewPayload;

  if (data.action !== "submitted") {
    return job;
  }

  const { review, pull_request } = data;

  if (!review.user) {
    return job;
  }

  const reviewState = mapReviewState(review.state);
  if (!reviewState) {
    return job;
  }

  const pr = await prisma.pullRequest.findUnique({
    where: { githubPrId: pull_request.id },
  });

  if (!pr) {
    return job;
  }

  await prisma.prReview.upsert({
    where: { githubReviewId: review.id },
    update: {
      state: reviewState,
      submittedAt: new Date(review.submitted_at ?? Date.now()),
    },
    create: {
      githubReviewId: review.id,
      pullRequestId: pr.id,
      reviewerLogin: review.user.login,
      state: reviewState,
      submittedAt: new Date(review.submitted_at ?? Date.now()),
    },
  });

  if (!pr.firstReviewAt) {
    const prCreatedAt = new Date(pull_request.created_at);
    const reviewSubmittedAt = new Date(review.submitted_at ?? Date.now());
    const timeToFirstReviewSeconds = Math.floor(
      (reviewSubmittedAt.getTime() - prCreatedAt.getTime()) / 1000
    );

    await prisma.pullRequest.update({
      where: { id: pr.id },
      data: {
        firstReviewAt: reviewSubmittedAt,
        timeToFirstReviewSeconds,
      },
    });
  }

  return job;
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

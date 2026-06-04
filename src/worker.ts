import { Worker } from "bullmq";
import cron from "node-cron";

import {
  GitHubEventJob,
  BackfillJob,
  QUEUE_NAME,
  BACKFILL_QUEUE_NAME,
  connection,
} from "@/lib/queue";
import { processDeployment } from "@/lib/queue/processors/deployment";
import { processDeploymentStatus } from "@/lib/queue/processors/deployment-status";
import { processPullRequest } from "@/lib/queue/processors/pull-request";
import { processPullRequestReview } from "@/lib/queue/processors/pull-request-review";
import { processPush } from "@/lib/queue/processors/push";
import { backfillRepository } from "@/lib/github/backfill";
import { computeDailyMetrics } from "@/lib/metrics/compute";
import { generateAndSendWeeklyDigest } from "@/lib/digest";
import { prisma } from "@/lib/prisma";

const githubEventsWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const data = job.data as GitHubEventJob;

    switch (data.event) {
      case "pull_request":
        return processPullRequest(data);
      case "pull_request_review":
        return processPullRequestReview(data);
      case "deployment":
        return processDeployment(data);
      case "deployment_status":
        return processDeploymentStatus(data);
      case "push":
        return processPush(data);
      default:
        return data;
    }
  },
  { connection }
);

githubEventsWorker.on("completed", (job) => {
  console.log(`Processed github event job ${job.id}`);
});

githubEventsWorker.on("failed", (job, error) => {
  console.error(`Github event job ${job?.id} failed`, error);
});

const backfillWorker = new Worker(
  BACKFILL_QUEUE_NAME,
  async (job) => {
    const data = job.data as BackfillJob;
    console.log(`Starting backfill for ${data.owner}/${data.name}`);

    await backfillRepository(data);

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date(ninetyDaysAgo);
    while (currentDate <= yesterday) {
      await computeDailyMetrics(data.repoId, currentDate);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`Backfill completed for ${data.owner}/${data.name}`);
    return data;
  },
  { connection }
);

backfillWorker.on("completed", (job) => {
  console.log(`Backfill job ${job.id} completed`);
});

backfillWorker.on("failed", (job, error) => {
  console.error(`Backfill job ${job?.id} failed`, error);
});

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Daily metrics scheduler fired");

    const repos = await prisma.repository.findMany({
      where: { backfillStatus: "completed" },
    });

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    for (const repo of repos) {
      try {
        await computeDailyMetrics(repo.id, yesterday);
        console.log(`Computed daily metrics for ${repo.fullName}`);
      } catch (error) {
        console.error(`Failed to compute metrics for ${repo.fullName}:`, error);
      }
    }
  },
  { timezone: "UTC" }
);

cron.schedule(
  "0 8 * * 1",
  async () => {
    console.log("Weekly digest scheduler fired");
    try {
      await generateAndSendWeeklyDigest();
      console.log("Weekly digest sent successfully");
    } catch (error) {
      console.error("Failed to send weekly digest:", error);
    }
  },
  { timezone: "UTC" }
);

console.log("DevPulse worker started");
console.log("Listening for GitHub events and backfill jobs");
console.log("Daily metrics scheduled at 00:00 UTC");
console.log("Weekly digest scheduled at 08:00 UTC on Mondays");

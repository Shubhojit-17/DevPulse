import { Queue } from "bullmq";

export const QUEUE_NAME = "github-events";
export const BACKFILL_QUEUE_NAME = "github-backfill";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// BullMQ bundles its own ioredis — pass the URL string directly to avoid
// type mismatches between the external ioredis and BullMQ's internal copy.
export const connection = { url: redisUrl };

export const githubQueue = new Queue(QUEUE_NAME, { connection });
export const backfillQueue = new Queue(BACKFILL_QUEUE_NAME, { connection });

export interface GitHubEventJob {
  event: string;
  payload: unknown;
  repoId: string;
}

export interface BackfillJob {
  repoId: string;
  accessToken: string;
  owner: string;
  name: string;
}

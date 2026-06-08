const { Queue } = require('bullmq');
const connection = { host: 'localhost', port: 6379 };
const backfillQueue = new Queue('github-backfill', { connection });

async function check() {
  const failedBackfills = await backfillQueue.getFailed();
  console.log('Failed backfills:', failedBackfills.length);

  for (const job of failedBackfills) {
    console.log(`Job ${job.id} failed:`, job.failedReason);
    console.log(`Stack:`, job.stacktrace);
  }
}
check().finally(() => process.exit(0));

const { Queue } = require('bullmq');
const connection = { host: 'localhost', port: 6379 };
const queue = new Queue('github-events', { connection });
const backfillQueue = new Queue('repository-backfill', { connection });

async function check() {
  const failedEvents = await queue.getFailed();
  const failedBackfills = await backfillQueue.getFailed();
  console.log('Failed events:', failedEvents.length);
  console.log('Failed backfills:', failedBackfills.length);

  if (failedBackfills.length > 0) {
    console.log('Sample failed backfill:', failedBackfills[0].failedReason);
  }
}
check().finally(() => process.exit(0));

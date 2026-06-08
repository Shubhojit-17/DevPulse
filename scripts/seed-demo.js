const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
function randomSha() {
  return crypto.randomBytes(20).toString('hex');
}
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}
function hoursAfter(base, h) {
  return new Date(base.getTime() + h * 3600_000);
}

// ── Demo data pools ─────────────────────────────────────────
const AUTHORS = [
  'Shubhojit-17', 'renoschubert', 'alice-dev', 'bob-coder',
  'carol-ops', 'dave-sr', 'eve-frontend'
];
const REVIEWERS = ['alice-dev', 'bob-coder', 'carol-ops', 'dave-sr', 'eve-frontend'];

const PR_TITLES = [
  'feat: add user authentication flow',
  'fix: resolve race condition in WebSocket handler',
  'refactor: migrate database layer to Prisma ORM',
  'feat: implement dark mode toggle',
  'chore: upgrade dependencies to latest versions',
  'feat: add real-time notification system',
  'fix: correct timezone handling in scheduler',
  'feat: implement file upload with drag-and-drop',
  'fix: memory leak in event listener cleanup',
  'feat: add search with fuzzy matching',
  'refactor: extract shared utilities into lib package',
  'feat: add role-based access control',
  'fix: prevent duplicate form submissions',
  'feat: implement lazy loading for images',
  'chore: configure CI/CD pipeline with GitHub Actions',
  'feat: add CSV export for analytics data',
  'fix: resolve CORS issue on API endpoints',
  'feat: implement pagination with infinite scroll',
  'refactor: simplify state management with Zustand',
  'feat: add email verification on signup',
  'fix: handle edge case in date range picker',
  'feat: implement multi-language support (i18n)',
  'chore: add Prettier and ESLint configuration',
  'feat: add real-time collaborative editing',
  'fix: resolve caching inconsistency in Redis layer',
  'feat: implement Stripe payment integration',
  'fix: correct SSR hydration mismatch',
  'feat: add WebSocket-based live dashboard',
  'refactor: modularize API route handlers',
  'feat: implement OAuth2 social login providers',
];

const COMMIT_MESSAGES = [
  'fix: resolve null pointer in auth middleware',
  'feat: add user profile avatar upload',
  'chore: update package-lock.json',
  'docs: update API documentation',
  'style: fix button alignment on mobile',
  'test: add unit tests for payment service',
  'feat: implement rate limiting on API',
  'fix: correct SQL query for analytics',
  'refactor: clean up unused imports',
  'feat: add webhook retry mechanism',
  'fix: handle timeout in external API calls',
  'chore: configure Docker multi-stage build',
  'feat: add toast notification component',
  'fix: resolve memory leak in chart rendering',
  'feat: implement session management',
  'chore: bump Node.js to v20 LTS',
  'feat: add API key management page',
  'fix: prevent XSS in user-generated content',
  'refactor: extract form validation logic',
  'feat: add bulk import from CSV',
  'fix: correct decimal precision in currency display',
  'feat: implement audit logging',
  'chore: add health check endpoint',
  'feat: add keyboard shortcuts',
  'fix: resolve race condition in job queue',
  'feat: implement progressive web app manifest',
  'docs: add contributing guidelines',
  'feat: add data export to JSON/CSV',
  'fix: handle network errors gracefully',
  'feat: implement custom theme builder',
];

const ENVIRONMENTS = ['production', 'staging', 'preview'];
const DEPLOY_REFS = ['main', 'develop', 'release/v2.1', 'release/v2.2', 'hotfix/auth'];

// ── Seed function ───────────────────────────────────────────
async function seed() {
  const repos = await prisma.repository.findMany();
  if (repos.length === 0) {
    console.log('No repositories found. Please connect repos first.');
    return;
  }

  console.log(`Found ${repos.length} repositories. Seeding demo data...`);

  let prIdCounter = 900_000_000;
  let reviewIdCounter = 800_000_000;
  let deployIdCounter = 700_000_000;

  // ── 1. Seed Pull Requests + Reviews ────────────────────
  console.log('\n📋 Seeding Pull Requests & Reviews...');
  let totalPRs = 0;
  let totalReviews = 0;

  for (const repo of repos) {
    const prCount = randomInt(12, 25);
    for (let i = 0; i < prCount; i++) {
      const dayOffset = randomInt(1, 88);
      const createdAt = daysAgo(dayOffset);
      const author = randomPick(AUTHORS);

      // Decide PR state
      const stateRoll = Math.random();
      let state, merged, mergedAt, closedAt, cycleTimeSeconds;

      if (stateRoll < 0.55) {
        // Merged
        state = 'closed';
        merged = true;
        const mergeHours = randomInt(2, 72);
        mergedAt = hoursAfter(createdAt, mergeHours);
        closedAt = mergedAt;
        cycleTimeSeconds = mergeHours * 3600;
      } else if (stateRoll < 0.75) {
        // Closed without merge
        state = 'closed';
        merged = false;
        mergedAt = null;
        closedAt = hoursAfter(createdAt, randomInt(4, 120));
        cycleTimeSeconds = null;
      } else {
        // Still open
        state = 'open';
        merged = false;
        mergedAt = null;
        closedAt = null;
        cycleTimeSeconds = null;
      }

      const additions = randomInt(5, 800);
      const deletions = randomInt(2, 400);
      const changedFiles = randomInt(1, 20);

      const pr = await prisma.pullRequest.create({
        data: {
          githubPrId: BigInt(prIdCounter++),
          repoId: repo.id,
          number: i + 100,
          title: randomPick(PR_TITLES),
          authorLogin: author,
          state,
          merged,
          draft: Math.random() < 0.1,
          additions,
          deletions,
          changedFiles,
          createdAt,
          updatedAt: closedAt || new Date(),
          closedAt,
          mergedAt,
          cycleTimeSeconds,
        },
      });
      totalPRs++;

      // Add 1-3 reviews per PR
      const reviewCount = randomInt(1, 3);
      let firstReviewAt = null;
      for (let r = 0; r < reviewCount; r++) {
        const reviewer = randomPick(REVIEWERS.filter(rv => rv !== author));
        const reviewHours = randomInt(1, 24);
        const submittedAt = hoursAfter(createdAt, reviewHours);
        if (!firstReviewAt || submittedAt < firstReviewAt) {
          firstReviewAt = submittedAt;
        }

        const reviewStates = ['approved', 'changes_requested', 'commented'];
        const reviewState = r === reviewCount - 1 && merged ? 'approved' : randomPick(reviewStates);

        await prisma.prReview.create({
          data: {
            githubReviewId: BigInt(reviewIdCounter++),
            pullRequestId: pr.id,
            reviewerLogin: reviewer,
            state: reviewState,
            submittedAt,
          },
        });
        totalReviews++;
      }

      // Update PR with first review time
      if (firstReviewAt) {
        const timeToFirstReviewSeconds = Math.floor(
          (firstReviewAt.getTime() - createdAt.getTime()) / 1000
        );
        await prisma.pullRequest.update({
          where: { id: pr.id },
          data: { firstReviewAt, timeToFirstReviewSeconds },
        });
      }
    }
    console.log(`  ✓ ${repo.fullName}: ${prCount} PRs`);
  }

  // ── 2. Seed Deployments ────────────────────────────────
  console.log('\n🚀 Seeding Deployments...');
  let totalDeploys = 0;

  for (const repo of repos) {
    const deployCount = randomInt(15, 40);
    for (let i = 0; i < deployCount; i++) {
      const dayOffset = randomInt(1, 88);
      const createdAt = daysAgo(dayOffset);
      const statusUpdatedAt = hoursAfter(createdAt, randomInt(0, 1));

      const statusRoll = Math.random();
      let status;
      if (statusRoll < 0.75) status = 'success';
      else if (statusRoll < 0.90) status = 'failure';
      else if (statusRoll < 0.95) status = 'error';
      else status = 'pending';

      await prisma.deployment.create({
        data: {
          githubDeploymentId: BigInt(deployIdCounter++),
          repoId: repo.id,
          environment: randomPick(ENVIRONMENTS),
          ref: randomPick(DEPLOY_REFS),
          sha: randomSha(),
          createdAt,
          status,
          statusUpdatedAt,
        },
      });
      totalDeploys++;
    }
    console.log(`  ✓ ${repo.fullName}: ${deployCount} deployments`);
  }

  // ── 3. Seed Additional Commits ─────────────────────────
  console.log('\n📝 Seeding Commits...');
  let totalNewCommits = 0;

  for (const repo of repos) {
    const commitCount = randomInt(30, 80);
    for (let i = 0; i < commitCount; i++) {
      const dayOffset = randomInt(0, 88);
      const createdAt = daysAgo(dayOffset);
      const author = randomPick(AUTHORS);

      await prisma.commit.create({
        data: {
          githubSha: randomSha(),
          repoId: repo.id,
          message: randomPick(COMMIT_MESSAGES),
          authorLogin: author,
          authorEmail: `${author.toLowerCase()}@example.com`,
          createdAt,
        },
      });
      totalNewCommits++;
    }
    console.log(`  ✓ ${repo.fullName}: ${commitCount} commits`);
  }

  // ── 4. Recompute Daily Metrics ─────────────────────────
  console.log('\n📊 Recomputing daily metrics for all repos (last 90 days)...');

  // Delete old metrics first to recompute cleanly
  await prisma.dailyMetric.deleteMany({});

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const repo of repos) {
    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(today);
      targetDate.setUTCDate(targetDate.getUTCDate() - dayOffset);
      const nextDate = new Date(targetDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      const prsOpened = await prisma.pullRequest.count({
        where: { repoId: repo.id, createdAt: { gte: targetDate, lt: nextDate } },
      });
      const prsMerged = await prisma.pullRequest.count({
        where: { repoId: repo.id, merged: true, mergedAt: { gte: targetDate, lt: nextDate } },
      });
      const prsClosed = await prisma.pullRequest.count({
        where: { repoId: repo.id, closedAt: { gte: targetDate, lt: nextDate } },
      });

      const mergedPrs = await prisma.pullRequest.findMany({
        where: {
          repoId: repo.id,
          merged: true,
          mergedAt: { gte: targetDate, lt: nextDate },
          cycleTimeSeconds: { not: null },
        },
        select: { cycleTimeSeconds: true },
      });
      const avgCycleTimeSeconds =
        mergedPrs.length > 0
          ? Math.round(mergedPrs.reduce((s, p) => s + (p.cycleTimeSeconds ?? 0), 0) / mergedPrs.length)
          : 0;

      const reviewsSubmitted = await prisma.prReview.count({
        where: {
          pullRequest: { repoId: repo.id },
          submittedAt: { gte: targetDate, lt: nextDate },
        },
      });

      const prsWithFirstReview = await prisma.pullRequest.findMany({
        where: {
          repoId: repo.id,
          firstReviewAt: { gte: targetDate, lt: nextDate },
          timeToFirstReviewSeconds: { not: null },
        },
        select: { timeToFirstReviewSeconds: true },
      });
      const avgTimeToFirstReviewSeconds =
        prsWithFirstReview.length > 0
          ? Math.round(prsWithFirstReview.reduce((s, p) => s + (p.timeToFirstReviewSeconds ?? 0), 0) / prsWithFirstReview.length)
          : 0;

      const deployments = await prisma.deployment.findMany({
        where: { repoId: repo.id, statusUpdatedAt: { gte: targetDate, lt: nextDate } },
      });
      const deploymentsTotal = deployments.length;
      const deploymentSuccesses = deployments.filter(d => d.status === 'success').length;
      const deploymentFailures = deployments.filter(d => d.status === 'failure' || d.status === 'error').length;

      const commitsTotal = await prisma.commit.count({
        where: { repoId: repo.id, createdAt: { gte: targetDate, lt: nextDate } },
      });

      await prisma.dailyMetric.create({
        data: {
          repoId: repo.id,
          date: targetDate,
          prsOpened,
          prsMerged,
          prsClosed,
          avgCycleTimeSeconds,
          avgTimeToFirstReviewSeconds,
          reviewsSubmitted,
          deploymentsTotal,
          deploymentSuccesses,
          deploymentFailures,
          commitsTotal,
        },
      });
    }
    console.log(`  ✓ ${repo.fullName}: 91 daily metrics computed`);
  }

  // ── Summary ────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log(`   PRs: ${totalPRs}`);
  console.log(`   Reviews: ${totalReviews}`);
  console.log(`   Deployments: ${totalDeploys}`);
  console.log(`   New commits: ${totalNewCommits}`);
  console.log(`   Daily metrics: ${repos.length * 91}`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

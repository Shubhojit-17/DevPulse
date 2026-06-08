const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Database Summary ===');
  console.log('Commits:', await prisma.commit.count());
  console.log('Pull Requests:', await prisma.pullRequest.count());
  console.log('Deployments:', await prisma.deployment.count());
  console.log('DailyMetrics:', await prisma.dailyMetric.count());
  console.log('Repositories:', await prisma.repository.count());

  const repos = await prisma.repository.findMany({
    select: { id: true, fullName: true, backfillStatus: true, lastBackfillAt: true }
  });
  console.log('\n=== Repositories ===');
  for (const r of repos) {
    const commits = await prisma.commit.count({ where: { repoId: r.id } });
    const prs = await prisma.pullRequest.count({ where: { repoId: r.id } });
    const deps = await prisma.deployment.count({ where: { repoId: r.id } });
    console.log(`${r.fullName}: status=${r.backfillStatus}, commits=${commits}, PRs=${prs}, deployments=${deps}, lastBackfill=${r.lastBackfillAt}`);
  }

  // Check metrics with non-zero values
  const nonZeroMetrics = await prisma.dailyMetric.findMany({
    where: {
      OR: [
        { commitsTotal: { gt: 0 } },
        { prsOpened: { gt: 0 } },
        { prsMerged: { gt: 0 } },
        { deploymentsTotal: { gt: 0 } },
      ]
    },
    orderBy: { date: 'desc' },
    take: 10
  });
  console.log('\n=== Non-zero DailyMetrics (last 10) ===');
  for (const m of nonZeroMetrics) {
    const repo = await prisma.repository.findUnique({ where: { id: m.repoId }, select: { fullName: true } });
    console.log(`${repo?.fullName} | ${m.date.toISOString().split('T')[0]} | PRs opened=${m.prsOpened} merged=${m.prsMerged} | commits=${m.commitsTotal} | deploys=${m.deploymentsTotal}`);
  }

  // Check UserRepository links
  const userRepos = await prisma.userRepository.findMany({
    include: { repository: { select: { fullName: true } }, user: { select: { login: true } } }
  });
  console.log('\n=== UserRepository Links ===');
  for (const ur of userRepos) {
    console.log(`User: ${ur.user.login} -> Repo: ${ur.repository.fullName}`);
  }
}

main().finally(() => prisma.$disconnect());

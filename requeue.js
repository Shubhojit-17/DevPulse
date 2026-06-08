const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const prisma = new PrismaClient();
const backfillQueue = new Queue('github-backfill', { connection: { host: 'localhost', port: 6379 } });

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) { console.log('No user found'); return; }

  // 1. Fix: Link DevPulse repo to user if not linked
  const devpulseRepo = await prisma.repository.findFirst({ where: { fullName: 'Shubhojit-17/DevPulse' } });
  if (devpulseRepo) {
    const existing = await prisma.userRepository.findFirst({
      where: { userId: user.id, repositoryId: devpulseRepo.id }
    });
    if (!existing) {
      await prisma.userRepository.create({
        data: { userId: user.id, repositoryId: devpulseRepo.id }
      });
      console.log('Linked DevPulse repo to user');
    } else {
      console.log('DevPulse already linked');
    }
  }

  // 2. Re-backfill all repos to get latest commits
  const repos = await prisma.repository.findMany();
  for (const repo of repos) {
    await prisma.repository.update({
      where: { id: repo.id },
      data: { backfillStatus: 'pending' }
    });
    await backfillQueue.add('backfill', {
      repoId: repo.id,
      accessToken: user.accessToken,
      owner: repo.owner,
      name: repo.name
    });
    console.log(`Enqueued backfill for ${repo.fullName}`);
  }
}

main().finally(() => prisma.$disconnect());

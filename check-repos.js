const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.repository.findMany({ select: { name: true, backfillStatus: true, createdAt: true, lastBackfillAt: true } })
  .then(repos => console.log(repos))
  .finally(() => prisma.$disconnect());

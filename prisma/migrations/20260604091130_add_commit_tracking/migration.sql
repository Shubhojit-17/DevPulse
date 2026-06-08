-- AlterTable
ALTER TABLE "dailyMetrics" ADD COLUMN     "commitsTotal" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "commits" (
    "id" TEXT NOT NULL,
    "githubSha" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorLogin" TEXT,
    "authorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commits_githubSha_key" ON "commits"("githubSha");

-- CreateIndex
CREATE INDEX "commits_repoId_idx" ON "commits"("repoId");

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "commits_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

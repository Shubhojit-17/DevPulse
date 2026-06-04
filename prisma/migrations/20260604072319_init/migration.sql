-- CreateEnum
CREATE TYPE "BackfillStatus" AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('approved', 'changes_requested', 'commented');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('pending', 'success', 'failure', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationTokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL,
    "webhookId" INTEGER,
    "webhookSecret" TEXT NOT NULL,
    "backfillStatus" "BackfillStatus" NOT NULL DEFAULT 'pending',
    "lastBackfillAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userRepositories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userRepositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhookDeliveries" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhookDeliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pullRequests" (
    "id" TEXT NOT NULL,
    "githubPrId" INTEGER NOT NULL,
    "repoId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "authorLogin" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "merged" BOOLEAN NOT NULL,
    "draft" BOOLEAN NOT NULL,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "changedFiles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "mergedAt" TIMESTAMP(3),
    "firstReviewAt" TIMESTAMP(3),
    "cycleTimeSeconds" INTEGER,
    "timeToFirstReviewSeconds" INTEGER,

    CONSTRAINT "pullRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prReviews" (
    "id" TEXT NOT NULL,
    "githubReviewId" INTEGER NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "reviewerLogin" TEXT NOT NULL,
    "state" "ReviewState" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prReviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "githubDeploymentId" INTEGER NOT NULL,
    "repoId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "status" "DeploymentStatus" NOT NULL,
    "statusUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dailyMetrics" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "prsOpened" INTEGER NOT NULL,
    "prsMerged" INTEGER NOT NULL,
    "prsClosed" INTEGER NOT NULL,
    "avgCycleTimeSeconds" INTEGER NOT NULL,
    "avgTimeToFirstReviewSeconds" INTEGER NOT NULL,
    "reviewsSubmitted" INTEGER NOT NULL,
    "deploymentsTotal" INTEGER NOT NULL,
    "deploymentSuccesses" INTEGER NOT NULL,
    "deploymentFailures" INTEGER NOT NULL,

    CONSTRAINT "dailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationTokens_token_key" ON "verificationTokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationTokens_identifier_token_key" ON "verificationTokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_githubId_key" ON "repositories"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "userRepositories_userId_repositoryId_key" ON "userRepositories"("userId", "repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "pullRequests_githubPrId_key" ON "pullRequests"("githubPrId");

-- CreateIndex
CREATE INDEX "pullRequests_repoId_idx" ON "pullRequests"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "pullRequests_repoId_number_key" ON "pullRequests"("repoId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "prReviews_githubReviewId_key" ON "prReviews"("githubReviewId");

-- CreateIndex
CREATE INDEX "prReviews_pullRequestId_idx" ON "prReviews"("pullRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "deployments_githubDeploymentId_key" ON "deployments"("githubDeploymentId");

-- CreateIndex
CREATE INDEX "deployments_repoId_idx" ON "deployments"("repoId");

-- CreateIndex
CREATE INDEX "dailyMetrics_repoId_idx" ON "dailyMetrics"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "dailyMetrics_repoId_date_key" ON "dailyMetrics"("repoId", "date");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userRepositories" ADD CONSTRAINT "userRepositories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userRepositories" ADD CONSTRAINT "userRepositories_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhookDeliveries" ADD CONSTRAINT "webhookDeliveries_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pullRequests" ADD CONSTRAINT "pullRequests_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prReviews" ADD CONSTRAINT "prReviews_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pullRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dailyMetrics" ADD CONSTRAINT "dailyMetrics_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

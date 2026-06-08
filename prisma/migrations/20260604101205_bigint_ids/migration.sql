-- AlterTable
ALTER TABLE "deployments" ALTER COLUMN "githubDeploymentId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "prReviews" ALTER COLUMN "githubReviewId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "pullRequests" ALTER COLUMN "githubPrId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "repositories" ALTER COLUMN "githubId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "githubId" SET DATA TYPE BIGINT;

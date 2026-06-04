import { prisma } from "@/lib/prisma";
import { GitHubEventJob } from "@/lib/queue";

interface DeploymentPayload {
  action: string;
  deployment: {
    id: number;
    environment: string;
    ref: string;
    sha: string;
    created_at: string;
  };
}

export async function processDeployment(job: GitHubEventJob) {
  const { payload, repoId } = job;
  const data = payload as DeploymentPayload;

  if (data.action !== "created") {
    return job;
  }

  const { deployment } = data;

  await prisma.deployment.upsert({
    where: { githubDeploymentId: deployment.id },
    update: {
      environment: deployment.environment,
      ref: deployment.ref,
      sha: deployment.sha,
    },
    create: {
      githubDeploymentId: deployment.id,
      repoId,
      environment: deployment.environment,
      ref: deployment.ref,
      sha: deployment.sha,
      createdAt: new Date(deployment.created_at),
      status: "pending",
    },
  });

  return job;
}

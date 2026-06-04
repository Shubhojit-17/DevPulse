import { prisma } from "@/lib/prisma";
import { GitHubEventJob } from "@/lib/queue";

interface DeploymentStatusPayload {
  action: string;
  deployment_status: {
    id: number;
    state: string;
    created_at: string;
  };
  deployment: {
    id: number;
  };
}

export async function processDeploymentStatus(job: GitHubEventJob) {
  const { payload } = job;
  const data = payload as DeploymentStatusPayload;

  if (data.action !== "created") {
    return job;
  }

  const { deployment_status: status, deployment } = data;

  const mappedStatus = mapDeploymentStatus(status.state);
  if (!mappedStatus) {
    return job;
  }

  await prisma.deployment.updateMany({
    where: { githubDeploymentId: deployment.id },
    data: {
      status: mappedStatus,
      statusUpdatedAt: new Date(status.created_at),
    },
  });

  return job;
}

function mapDeploymentStatus(
  state: string
): "success" | "failure" | "error" | "pending" | null {
  switch (state.toLowerCase()) {
    case "success":
      return "success";
    case "failure":
      return "failure";
    case "error":
      return "error";
    case "pending":
    case "queued":
    case "in_progress":
      return "pending";
    default:
      return null;
  }
}

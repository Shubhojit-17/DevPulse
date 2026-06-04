import { GitHubEventJob } from "@/lib/queue";

interface PushPayload {
  repository: {
    full_name: string;
  };
  commits: unknown[];
  ref: string;
  pusher: {
    name: string;
  };
}

export async function processPush(job: GitHubEventJob) {
  const { payload } = job;
  const data = payload as PushPayload;
  
  const repoName = data.repository?.full_name;
  const commitCount = data.commits?.length || 0;
  const ref = data.ref;
  const pusherName = data.pusher?.name;

  console.log(
    `[PUSH EVENT] Repo: ${repoName}, Branch/Ref: ${ref}, Pusher: ${pusherName}, Commits: ${commitCount}`
  );
  
  return job;
}

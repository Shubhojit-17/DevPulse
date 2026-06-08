import { GitHubEventJob } from "@/lib/queue";
import { prisma } from "@/lib/prisma";

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

  const repository = await prisma.repository.findFirst({
    where: { fullName: repoName },
  });

  if (!repository) {
    console.log(`Repository ${repoName} not found, ignoring push event`);
    return job;
  }

  for (const commit of data.commits as any[]) {
    await prisma.commit.upsert({
      where: { githubSha: commit.id },
      update: {},
      create: {
        githubSha: commit.id,
        repoId: repository.id,
        message: commit.message,
        authorLogin: commit.author?.username || commit.author?.name,
        authorEmail: commit.author?.email,
        createdAt: new Date(commit.timestamp),
      },
    });
  }

  return job;
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.accessToken) {
    return NextResponse.json(
      { error: "GitHub access token not found" },
      { status: 400 }
    );
  }

  try {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${user.accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        return NextResponse.json(
          { error: `GitHub API error: ${message}` },
          { status: response.status }
        );
      }

      const pageRepos = (await response.json()) as GitHubRepo[];
      repos.push(...pageRepos);

      if (pageRepos.length < perPage) {
        break;
      }

      page++;
    }

    const connectedRepos = await prisma.repository.findMany({
      where: {
        githubId: { in: repos.map((r) => r.id) },
      },
      select: { githubId: true },
    });

    const connectedIds = new Set(connectedRepos.map((r) => r.githubId));

    const available = repos
      .filter((r) => !connectedIds.has(r.id))
      .map((r) => ({
        id: r.id,
        fullName: r.full_name,
        name: r.name,
        owner: r.owner.login,
        isPrivate: r.private,
      }));

    return NextResponse.json(available);
  } catch (error) {
    console.error("Error fetching available repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

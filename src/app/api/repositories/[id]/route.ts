import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.accessToken) {
    return NextResponse.json(
      { error: "GitHub access token not found" },
      { status: 400 }
    );
  }

  // Check the user actually has access to this repo
  const userRepo = await prisma.userRepository.findUnique({
    where: {
      userId_repositoryId: {
        userId: session.user.id,
        repositoryId: id,
      },
    },
    include: { repository: true },
  });

  if (!userRepo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const repository = userRepo.repository;

  // Delete the webhook from GitHub first (best-effort)
  if (repository.webhookId) {
    try {
      await fetch(
        `https://api.github.com/repos/${repository.owner}/${repository.name}/hooks/${repository.webhookId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${user.accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );
    } catch (error) {
      console.error("Failed to delete webhook on GitHub:", error);
    }
  }

  // Remove the join record (other users keep their connection)
  await prisma.userRepository.delete({
    where: {
      userId_repositoryId: {
        userId: session.user.id,
        repositoryId: id,
      },
    },
  });

  // If no other users are connected, delete the repo entirely
  const remaining = await prisma.userRepository.count({
    where: { repositoryId: id },
  });

  if (remaining === 0) {
    await prisma.repository.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}

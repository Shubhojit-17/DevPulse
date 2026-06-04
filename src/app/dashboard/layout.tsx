import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { FilterBar } from "@/components/dashboard/filter-bar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const userRepos = await prisma.userRepository.findMany({
    where: { userId: session.user.id },
    include: { repository: true },
  });

  const repositories = userRepos.map((ur) => ({
    id: ur.repository.id,
    fullName: ur.repository.fullName,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-72 shrink-0 p-6 lg:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Suspense fallback={<div className="h-14 animate-pulse rounded-2xl bg-foreground/5" />}>
          <FilterBar repositories={repositories} />
        </Suspense>
        <div className="flex flex-1 flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

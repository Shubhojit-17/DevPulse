import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { PullRequestsPageClient } from "./pull-requests-client";

export const metadata = {
  title: "Pull Requests — DevPulse",
  description: "Cycle time, review velocity, and PR throughput trends",
};

export default async function PullRequestsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Pull Requests"
        subtitle="Cycle time and review readiness across the team"
        user={{ name: session?.user?.name, image: session?.user?.image }}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-3xl bg-foreground/5" />
            <div className="h-64 animate-pulse rounded-3xl bg-foreground/5" />
          </div>
        }
      >
        <PullRequestsPageClient />
      </Suspense>
    </div>
  );
}

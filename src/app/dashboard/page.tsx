import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { OverviewPageClient } from "./overview-client";

export const metadata = {
  title: "Overview — DevPulse",
  description: "DORA metrics and delivery health across connected repositories",
};

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Overview"
        subtitle="Aggregate delivery health across connected repositories"
        user={{ name: session?.user?.name, image: session?.user?.image }}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-3xl bg-foreground/5"
              />
            ))}
          </div>
        }
      >
        <OverviewPageClient />
      </Suspense>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { DeploymentsPageClient } from "./deployments-client";

export const metadata = {
  title: "Deployments — DevPulse",
  description: "Deployment frequency and stability trends",
};

export default async function DeploymentsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Deployments"
        subtitle="Delivery throughput and stability"
        user={{ name: session?.user?.name, image: session?.user?.image }}
      />
      <Suspense
        fallback={
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
            <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
          </div>
        }
      >
        <DeploymentsPageClient />
      </Suspense>
    </div>
  );
}

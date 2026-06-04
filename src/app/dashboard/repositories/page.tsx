import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { RepositoriesPageClient } from "./repositories-client";

export const metadata = {
  title: "Repositories — DevPulse",
  description: "Connect and manage GitHub repositories",
};

export default async function RepositoriesPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Repositories"
        subtitle="Connect GitHub repositories to start tracking metrics"
        user={{ name: session?.user?.name, image: session?.user?.image }}
      />
      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-foreground/5" />
            ))}
          </div>
        }
      >
        <RepositoriesPageClient />
      </Suspense>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { CommitsPageClient } from "./commits-client";

export const metadata = {
  title: "Commits — DevPulse",
  description: "Commit activity, frequency, and change history",
};

export default async function CommitsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Commits"
        subtitle="Commit activity, frequency, and recent changes"
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
        <CommitsPageClient />
      </Suspense>
    </div>
  );
}

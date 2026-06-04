import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { AuthorsPageClient } from "./authors-client";

export const metadata = {
  title: "Authors — DevPulse",
  description: "Per-author contribution context across repositories",
};

export default async function AuthorsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Authors"
        subtitle="Individual contribution context across repositories"
        user={{ name: session?.user?.name, image: session?.user?.image }}
      />
      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-foreground/5"
              />
            ))}
          </div>
        }
      >
        <AuthorsPageClient />
      </Suspense>
    </div>
  );
}

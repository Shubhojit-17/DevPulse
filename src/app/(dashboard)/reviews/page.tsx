import { getServerSession } from "next-auth";
import { Suspense } from "react";

import { Topbar } from "@/components/dashboard/topbar";
import { authOptions } from "@/lib/auth";
import { ReviewsPageClient } from "./reviews-client";

export const metadata = {
  title: "Review Load — DevPulse",
  description: "Review throughput and load distribution across the team",
};

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title="Review Load"
        subtitle="Who is reviewing and how the load shifts across repos"
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
        <ReviewsPageClient />
      </Suspense>
    </div>
  );
}

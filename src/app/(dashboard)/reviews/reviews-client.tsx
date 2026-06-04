"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrendChart } from "@/components/charts/trend-chart";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewsData {
  totalReviews: number;
  topReviewer: string;
  reviewsPerReviewer: { login: string; count: number }[];
  reviewsPerDay: { date: string; value: number }[];
}

export function ReviewsPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevParams, setPrevParams] = useState({ repoIds, days });

  if (prevParams.repoIds !== repoIds || prevParams.days !== days) {
    setPrevParams({ repoIds, days });
    setLoading(true);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (repoIds) params.set("repoIds", repoIds);
    params.set("days", days);

    fetch(`/api/metrics/reviews?${params}`)
      .then((r) => r.json())
      .then((d: ReviewsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoIds, days]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
        </div>
        <div className="h-32 animate-pulse rounded-3xl bg-foreground/5" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load review metrics.
      </p>
    );
  }

  // SimpleBarChart expects { label, value }
  const reviewerBarData = data.reviewsPerReviewer
    .slice(0, 15)
    .map((r) => ({ label: r.login, value: r.count }));

  const topReviewerCount = data.reviewsPerReviewer[0]?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reviews per reviewer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Concentration of review load
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <SimpleBarChart data={reviewerBarData} color="#7c3aed" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviews submitted per day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Daily review throughput
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <TrendChart
                data={data.reviewsPerDay}
                label="Reviews"
                color="#0f766e"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topReviewer ? (
              <>
                <p className="text-2xl font-semibold">@{data.topReviewer}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topReviewerCount} reviews in the last {days} days
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews in period</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totalReviews}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Submitted in the last {days} days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

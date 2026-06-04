"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrendChart } from "@/components/charts/trend-chart";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DeploymentsData {
  frequencyPerDay: number;
  successRate: number;
  totalFailures: number;
  deploymentsPerDay: { date: string; value: number }[];
  successVsFailure: { date: string; success: number; failure: number }[];
}

export function DeploymentsPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<DeploymentsData | null>(null);
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

    fetch(`/api/metrics/deployments?${params}`)
      .then((r) => r.json())
      .then((d: DeploymentsData) => {
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
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-foreground/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load deployment metrics.
      </p>
    );
  }

  const successFailureBars = [
    { key: "success", label: "Success", color: "#16a34a" },
    { key: "failure", label: "Failure", color: "#dc2626" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deployments per day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Delivery throughput over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <TrendChart
                data={data.deploymentsPerDay}
                label="Deployments"
                color="#0f766e"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success vs failure</CardTitle>
            <p className="text-sm text-muted-foreground">
              Deployment stability over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <StackedBarChart data={data.successVsFailure} bars={successFailureBars} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Deployment frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.frequencyPerDay} / day</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average over last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-semibold ${
                data.successRate >= 90
                  ? "text-emerald-600"
                  : data.successRate >= 75
                  ? "text-amber-500"
                  : "text-rose-500"
              }`}
            >
              {data.successRate}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              of deployments succeeded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failures</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totalFailures}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              in the last {days} days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

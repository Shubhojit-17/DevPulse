"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MetricCard } from "@/components/dashboard/metric-card";
import { MultiLineTrendChart } from "@/components/charts/multi-line-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewData {
  deploymentFrequency: number;
  leadTimeHours: number;
  changeFailureRate: number;
  deploymentFrequencyTrend: number;
  leadTimeTrend: number;
  changeFailureRateTrend: number;
  timeSeries: {
    date: string;
    deploymentFrequency: number;
    leadTimeHours: number;
    changeFailureRate: number;
    commits: number;
  }[];
  commitsTotal: number;
  commitsTrend: number;
}

function trendLabel(pct: number, unit = "%"): string {
  if (Math.abs(pct) < 1) return "No change";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${Math.round(pct)}${unit} vs prior period`;
}

function trendDir(pct: number): "up" | "down" | "neutral" {
  if (Math.abs(pct) < 1) return "neutral";
  return pct > 0 ? "up" : "down";
}

export function OverviewPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<OverviewData | null>(null);
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

    fetch(`/api/metrics/overview?${params}`)
      .then((r) => r.json())
      .then((d: OverviewData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoIds, days]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-foreground/5"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load overview metrics.
      </p>
    );
  }

  const chartSeries = [
    { key: "commits", label: "Commits", color: "#eab308" },
    { key: "deploymentFrequency", label: "Deploy freq / day", color: "#0f766e" },
    { key: "leadTimeHours", label: "Lead time (hrs)", color: "#7c3aed" },
    { key: "changeFailureRate", label: "Change failure rate (%)", color: "#dc2626" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Deployment frequency"
          value={`${data.deploymentFrequency} / day`}
          trend={trendLabel(data.deploymentFrequencyTrend)}
          trendDirection={trendDir(data.deploymentFrequencyTrend)}
          positiveDirection="up"
        />
        <MetricCard
          label="Lead time for changes"
          value={`${data.leadTimeHours} hrs`}
          trend={trendLabel(data.leadTimeTrend)}
          trendDirection={trendDir(data.leadTimeTrend)}
          positiveDirection="down"
        />
        <MetricCard
          label="Change failure rate"
          value={`${data.changeFailureRate}%`}
          trend={trendLabel(data.changeFailureRateTrend, "pp")}
          trendDirection={trendDir(data.changeFailureRateTrend)}
          positiveDirection="down"
        />
        <MetricCard
          label="Total commits"
          value={`${data.commitsTotal}`}
          trend={trendLabel(data.commitsTrend)}
          trendDirection={trendDir(data.commitsTrend)}
          positiveDirection="up"
        />
        <MetricCard
          label="MTTR"
          value="Coming soon"
          trend="Incident data required"
          trendDirection="neutral"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery pulse — DORA trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Deployment frequency, lead time, and change failure rate over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <MultiLineTrendChart data={data.timeSeries} series={chartSeries} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

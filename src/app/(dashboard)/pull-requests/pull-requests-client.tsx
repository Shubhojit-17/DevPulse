"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrendChart } from "@/components/charts/trend-chart";
import { StackedBarChart } from "@/components/charts/stacked-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PRsData {
  totalMerged: number;
  avgPrSize: number;
  percentMergedWithin24h: number;
  cycleTimeTrend: { date: string; value: number }[];
  prsOpenedVsMerged: { date: string; opened: number; merged: number }[];
  timeToFirstReviewTrend: { date: string; value: number }[];
}

export function PullRequestsPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<PRsData | null>(null);
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

    fetch(`/api/metrics/prs?${params}`)
      .then((r) => r.json())
      .then((d: PRsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoIds, days]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl bg-foreground/5" />
          <div className="h-64 animate-pulse rounded-3xl bg-foreground/5" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-48 animate-pulse rounded-3xl bg-foreground/5" />
          <div className="h-48 animate-pulse rounded-3xl bg-foreground/5" />
          <div className="h-48 animate-pulse rounded-3xl bg-foreground/5" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load pull request metrics.
      </p>
    );
  }

  const openedVsMergedBars = [
    { key: "opened", label: "Opened", color: "#7c3aed" },
    { key: "merged", label: "Merged", color: "#0f766e" },
  ];

  const cycleTimeHours =
    data.cycleTimeTrend.length > 0
      ? (
          data.cycleTimeTrend.reduce((s, d) => s + d.value, 0) /
          data.cycleTimeTrend.length
        ).toFixed(1)
      : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Avg cycle time trend</CardTitle>
            <p className="text-sm text-muted-foreground">Hours from PR open to merge</p>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <TrendChart
                data={data.cycleTimeTrend}
                label="Cycle time (hrs)"
                color="#7c3aed"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PRs opened vs merged</CardTitle>
            <p className="text-sm text-muted-foreground">WIP buildup indicator</p>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <StackedBarChart data={data.prsOpenedVsMerged} bars={openedVsMergedBars} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Time to first review</CardTitle>
            <p className="text-sm text-muted-foreground">Hours until first review</p>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <TrendChart
                data={data.timeToFirstReviewTrend}
                label="Time to review (hrs)"
                color="#0f766e"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PRs merged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totalMerged}</p>
            <p className="mt-1 text-sm text-muted-foreground">Last {days} days</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Avg size: <span className="font-medium text-foreground">{data.avgPrSize} lines</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Avg cycle: <span className="font-medium text-foreground">{cycleTimeHours} hrs</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Merged within 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.percentMergedWithin24h}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              of PRs merged same day
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

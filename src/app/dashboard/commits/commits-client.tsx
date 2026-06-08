"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrendChart } from "@/components/charts/trend-chart";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommitsData {
  totalCommits: number;
  avgPerDay: number;
  topAuthors: { label: string; value: number }[];
  commitsPerDay: { date: string; value: number }[];
  recentCommits: {
    sha: string;
    message: string;
    author: string;
    repo: string;
    date: string;
  }[];
  perRepo: { label: string; value: number }[];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommitsPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<CommitsData | null>(null);
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

    fetch(`/api/metrics/commits?${params}`)
      .then((r) => r.json())
      .then((d: CommitsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoIds, days]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-foreground/5" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
          <div className="h-72 animate-pulse rounded-3xl bg-foreground/5" />
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-foreground/5" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load commit metrics.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total commits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.totalCommits}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              in the last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commit frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.avgPerDay} / day</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average over period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.topAuthors.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              unique authors with commits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commits per day</CardTitle>
            <p className="text-sm text-muted-foreground">
              Daily commit frequency over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <TrendChart
                data={data.commitsPerDay}
                label="Commits"
                color="#eab308"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Commits by repository</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution across connected repos
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <SimpleBarChart data={data.perRepo} color="#7c3aed" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top authors */}
      {data.topAuthors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top contributors</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most active authors by commit count
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.topAuthors.map((author) => (
                <div
                  key={author.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 p-4 transition-colors hover:bg-foreground/5"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
                    {author.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{author.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {author.value} commit{author.value !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent commits feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent commits</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest changes across all connected repositories
          </p>
        </CardHeader>
        <CardContent>
          {data.recentCommits.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commits found in this time range.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recentCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <code className="shrink-0 rounded-lg bg-foreground/5 px-2 py-0.5 text-xs font-mono text-amber-600">
                    {commit.sha}
                  </code>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {commit.message}
                  </p>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {commit.author}
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="truncate max-w-[140px]">{commit.repo.split("/")[1]}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="tabular-nums">{timeAgo(commit.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthorRow {
  login: string;
  prsMerged: number;
  avgCycleTimeSeconds: number;
  avgPrSize: number;
  reviewsGiven: number;
  reviewsReceived: number;
}

type SortKey = keyof Omit<AuthorRow, "login">;
type SortDir = "asc" | "desc";

function fmtCycleTime(seconds: number): string {
  if (seconds === 0) return "—";
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)}m`;
  return `${hours.toFixed(1)}h`;
}

interface SortIconProps {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}

const SortIcon = ({ col, sortKey, sortDir }: SortIconProps) =>
  col === sortKey ? (
    <span className="ml-1 text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>
  ) : (
    <span className="ml-1 text-xs text-foreground/20">▼</span>
  );

interface ColHeaderProps {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
}

const ColHeader = ({
  col,
  sortKey,
  sortDir,
  onSort,
  children,
}: ColHeaderProps) => (
  <th
    className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
    onClick={() => onSort(col)}
  >
    {children}
    <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
  </th>
);

export function AuthorsPageClient() {
  const searchParams = useSearchParams();
  const repoIds = searchParams.get("repoIds") ?? "";
  const days = searchParams.get("days") ?? "30";

  const [data, setData] = useState<AuthorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("prsMerged");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [prevParams, setPrevParams] = useState({ repoIds, days });

  if (prevParams.repoIds !== repoIds || prevParams.days !== days) {
    setPrevParams({ repoIds, days });
    setLoading(true);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (repoIds) params.set("repoIds", repoIds);
    params.set("days", days);

    fetch(`/api/metrics/authors?${params}`)
      .then((r) => r.json())
      .then((d: AuthorRow[]) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [repoIds, days]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    return sortDir === "asc" ? av - bv : bv - av;
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Author metrics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual metrics are for engineering conversations, not performance reviews.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-xl bg-foreground/5"
                />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No author data for the selected window. Connect a repository and wait for backfill to complete.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background/60 border-b border-foreground/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Author
                    </th>
                    <ColHeader col="prsMerged" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>PRs merged</ColHeader>
                    <ColHeader col="avgCycleTimeSeconds" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Avg cycle time</ColHeader>
                    <ColHeader col="avgPrSize" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Avg PR size</ColHeader>
                    <ColHeader col="reviewsGiven" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Reviews given</ColHeader>
                    <ColHeader col="reviewsReceived" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>Reviews received</ColHeader>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr
                      key={row.login}
                      className={`border-t border-foreground/5 ${
                        i % 2 === 0 ? "" : "bg-foreground/[0.02]"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <a
                          href={`https://github.com/${row.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline"
                        >
                          @{row.login}
                        </a>
                      </td>
                      <td className="px-4 py-3">{row.prsMerged}</td>
                      <td className="px-4 py-3">
                        {fmtCycleTime(row.avgCycleTimeSeconds)}
                      </td>
                      <td className="px-4 py-3">
                        {row.avgPrSize > 0 ? `${row.avgPrSize} lines` : "—"}
                      </td>
                      <td className="px-4 py-3">{row.reviewsGiven || "—"}</td>
                      <td className="px-4 py-3">{row.reviewsReceived || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

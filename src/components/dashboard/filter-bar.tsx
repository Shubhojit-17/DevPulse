"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Repository {
  id: string;
  fullName: string;
}

interface FilterBarProps {
  repositories: Repository[];
}

export function FilterBar({ repositories }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedRepoIds = searchParams.get("repoIds")?.split(",") || [];
  const days = parseInt(searchParams.get("days") || "30");

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleRepo = (repoId: string) => {
    const current = selectedRepoIds.includes(repoId)
      ? selectedRepoIds.filter((id) => id !== repoId)
      : [...selectedRepoIds, repoId];
    updateParams({ repoIds: current.join(",") });
  };

  const selectAll = () => {
    const allIds = repositories.map((r) => r.id);
    updateParams({ repoIds: allIds.join(",") });
  };

  const clearAll = () => {
    updateParams({ repoIds: "" });
  };

  const setDays = (newDays: number) => {
    updateParams({ days: String(newDays) });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-panel/70 p-4 text-sm shadow-soft">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {repositories.map((repo) => (
            <button
              key={repo.id}
              onClick={() => toggleRepo(repo.id)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                selectedRepoIds.includes(repo.id)
                  ? "bg-foreground text-background"
                  : "border border-foreground/20 text-foreground hover:border-foreground/40"
              }`}
            >
              {repo.fullName}
            </button>
          ))}
          {repositories.length > 0 && (
            <>
              <button
                onClick={selectAll}
                className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Select all
              </button>
              <button
                onClick={clearAll}
                className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                days === d
                  ? "bg-foreground text-background"
                  : "border border-foreground/20 text-foreground hover:border-foreground/40"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

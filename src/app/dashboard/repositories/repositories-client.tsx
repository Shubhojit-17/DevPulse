"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConnectedRepo {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  isPrivate: boolean;
  backfillStatus: "pending" | "in_progress" | "completed" | "failed";
  lastBackfillAt: string | null;
  connectedAt: string;
}

interface AvailableRepo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  isPrivate: boolean;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Backfilling…", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Ready", className: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-700" },
};

export function RepositoriesPageClient() {
  const [connected, setConnected] = useState<ConnectedRepo[]>([]);
  const [available, setAvailable] = useState<AvailableRepo[]>([]);
  const [loadingConnected, setLoadingConnected] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConnected = useCallback(async () => {
    const res = await fetch("/api/repositories");
    const data = await res.json();
    setConnected(Array.isArray(data) ? data : []);
    setLoadingConnected(false);
  }, []);

  const fetchAvailable = useCallback(async () => {
    const res = await fetch("/api/repositories/available");
    const data = await res.json();
    setAvailable(Array.isArray(data) ? data : []);
    setLoadingAvailable(false);
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchConnected();
      fetchAvailable();
    });
  }, [fetchConnected, fetchAvailable]);

  async function connectRepo(githubId: number) {
    setConnecting(githubId);
    setError(null);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to connect repository");
      } else {
        await Promise.all([fetchConnected(), fetchAvailable()]);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setConnecting(null);
    }
  }

  async function disconnectRepo(repoId: string) {
    setDisconnecting(repoId);
    setError(null);
    try {
      const res = await fetch(`/api/repositories/${repoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to disconnect repository");
      } else {
        await Promise.all([fetchConnected(), fetchAvailable()]);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Connected repos */}
      <Card>
        <CardHeader>
          <CardTitle>Connected repositories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Repositories sending webhook events and contributing to your metrics.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loadingConnected ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-foreground/5" />
              ))}
            </div>
          ) : connected.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No repositories connected yet. Connect one below.
            </p>
          ) : (
            <div className="divide-y divide-foreground/5">
              {connected.map((repo) => {
                const statusCfg = STATUS_CONFIG[repo.backfillStatus];
                return (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{repo.fullName}</span>
                        {repo.isPrivate && (
                          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                            private
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Default branch: {repo.defaultBranch} ·{" "}
                        {repo.lastBackfillAt
                          ? `Last backfilled ${new Date(repo.lastBackfillAt).toLocaleDateString()}`
                          : "No backfill yet"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectRepo(repo.id)}
                        disabled={disconnecting === repo.id}
                        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        {disconnecting === repo.id ? "Removing…" : "Disconnect"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available repos */}
      <Card>
        <CardHeader>
          <CardTitle>Available repositories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your GitHub repositories not yet connected. Connecting registers a webhook and starts a 90-day backfill.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAvailable ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-foreground/5" />
              ))}
            </div>
          ) : available.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              All your GitHub repositories are already connected, or you have no repos.
            </p>
          ) : (
            <div className="divide-y divide-foreground/5">
              {available.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between gap-4 px-6 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{repo.fullName}</span>
                    {repo.isPrivate && (
                      <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                        private
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => connectRepo(repo.id)}
                    disabled={connecting === repo.id}
                  >
                    {connecting === repo.id ? "Connecting…" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

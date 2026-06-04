const GITHUB_API_BASE = "https://api.github.com";

function getResetDelayMs(resetTimestamp: number) {
  const delay = resetTimestamp * 1000 - Date.now();
  return Math.max(delay, 0);
}

async function enforceRateLimit(response: Response) {
  const remaining = Number(response.headers.get("x-ratelimit-remaining") ?? "0");
  const reset = Number(response.headers.get("x-ratelimit-reset") ?? "0");

  if (Number.isFinite(remaining) && remaining < 50 && reset > 0) {
    const delay = getResetDelayMs(reset);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function githubRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  await enforceRateLimit(response);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${message}`);
  }

  return (await response.json()) as T;
}

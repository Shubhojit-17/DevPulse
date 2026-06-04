# DevPulse

**Developer Productivity Analytics Dashboard** — ingests GitHub activity via webhooks, computes DORA + flow metrics, and delivers a real-time dashboard plus a weekly LLM-generated narrative digest.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                              │
│  Webhooks (PR, review, deployment, deployment_status)       │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTPS POST /api/webhooks/github?repoId=
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js App (Process 1)                   │
│  - Landing page, sign-in, dashboard UI                      │
│  - GitHub OAuth via NextAuth.js                             │
│  - API routes: metrics, repositories, webhook receiver      │
│  - Webhook receiver: verify sig → idempotency → enqueue     │
└───────┬──────────────────────────────────────┬──────────────┘
        │ BullMQ job                            │ Prisma ORM
        ▼                                       ▼
┌───────────────────┐                 ┌─────────────────────┐
│  Redis (Process 2)│                 │  PostgreSQL 16       │
│  Job queue store  │                 │  All persistent data │
└───────┬───────────┘                 └─────────────────────┘
        │ consume
        ▼
┌─────────────────────────────────────────────────────────────┐
│                   BullMQ Worker (Process 3)                  │
│  - pull_request processor (cycle time computation)          │
│  - pull_request_review processor (first review latency)     │
│  - deployment + deployment_status processors                │
│  - Backfill worker: 90-day historical import                │
│  - Cron 00:00 UTC: computeDailyMetrics for all repos        │
│  - Cron Mon 08:00 UTC: Gemini digest → Resend email         │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Setup

### Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- A GitHub OAuth App ([create one](https://github.com/settings/developers))
- ngrok or smee.io for local webhook testing

### 1. Clone and install
```bash
git clone <repo-url>
cd devpulse
npm install
```

### 2. Start infrastructure
```bash
docker compose up -d
```
This starts PostgreSQL 16 on `localhost:5432` and Redis 7 on `localhost:6379`.

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in:

| Variable | How to get it |
|---|---|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer settings → OAuth Apps → New OAuth App |
| `GITHUB_CLIENT_SECRET` | Same OAuth App settings page |
| `APP_URL` | Your ngrok tunnel URL (see step 5) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `RESEND_API_KEY` | [Resend dashboard](https://resend.com/api-keys) |
| `DIGEST_FROM_EMAIL` | A verified sender address in Resend |

> **GitHub OAuth App settings:**
> - Homepage URL: `http://localhost:3000`
> - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 4. Run database migrations
```bash
npm run migrate
```

### 5. Set up local webhook tunnel

GitHub cannot POST to `localhost`. Use ngrok to create a public tunnel:

```bash
# Install ngrok from https://ngrok.com, then:
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and set it as `APP_URL` in `.env`.

Alternatively, use [smee.io](https://smee.io): create a channel, then run the smee client to forward events locally.

### 6. Start the application (two terminals)

**Terminal 1 — Next.js app:**
```bash
npm run dev
```

**Terminal 2 — BullMQ worker:**
```bash
npm run worker
```

Open [http://localhost:3000](http://localhost:3000).

---

## Connecting a GitHub Repository

1. Sign in with GitHub at `/signin`
2. Navigate to **Repositories** in the sidebar
3. Click **Connect** next to any repository
4. DevPulse will:
   - Register a webhook on the repo (pointed at your `APP_URL`)
   - Start a 90-day historical backfill of PRs, reviews, and deployments
   - Begin computing daily metrics once backfill completes
5. Watch backfill status on the Repositories page (`pending → in_progress → ready`)
6. Once ready, all dashboard pages will show real data

---

## Dashboard Pages

| Page | What it shows |
|---|---|
| **Overview** | DORA metric cards (deployment frequency, lead time, change failure rate) + combined trend chart |
| **Pull Requests** | Cycle time trend, PRs opened vs merged (WIP indicator), time to first review |
| **Reviews** | Review load per reviewer, daily review throughput |
| **Deployments** | Daily deployment volume, success vs failure stacked chart, frequency and success rate stats |
| **Authors** | Per-author table — PRs merged, cycle time, PR size, reviews given/received. Sortable columns. |

Every page has a **global filter bar** at the top: multi-select repository filter + time window (7 / 30 / 90 days).

---

## Metrics Glossary

| Metric | Definition |
|---|---|
| **Deployment Frequency** | Total deployments ÷ number of days in the window |
| **Lead Time for Changes** | `mergedAt − createdAt` averaged across PRs merged in the window, converted to hours |
| **Change Failure Rate** | `deploymentFailures ÷ deploymentsTotal` × 100, for the window |
| **Mean Time to Restore** | Not yet implemented — requires incident data |
| **Cycle Time** | `mergedAt − createdAt` per PR. Measures how long a change takes from first commit to merge |
| **Time to First Review** | `firstReviewAt − createdAt` per PR. Measures how quickly the team responds to a new PR |
| **Review Load** | Count of reviews submitted per reviewer. Identifies concentration risk |

All dashboard charts read from the `dailyMetrics` pre-aggregated table, never from raw tables, for performance.

---

## Weekly Digest

Every Monday at 08:00 UTC, the worker:
1. Fetches the last 7 days of `dailyMetrics` vs the prior 7 days for each connected repo
2. Computes which metrics changed by more than 15%
3. Sends the significant changes to **Google Gemini 1.5 Flash** with a coaching prompt
4. Formats the 3-paragraph narrative into an HTML email
5. Delivers via **Resend** to all users connected to that repo

The Gemini prompt asks for: what improved, what regressed, and one concrete recommendation — without mentioning raw numbers.

---

## Tech Stack Rationale

| Technology | Why |
|---|---|
| **Next.js App Router** | Unified full-stack routing — API routes, server components, and static pages in one codebase |
| **TypeScript** | End-to-end type safety from database schema through to UI component props |
| **Tailwind CSS v4** | Design token system with utility classes; no runtime CSS-in-JS overhead |
| **NextAuth.js** | Battle-tested GitHub OAuth with Prisma adapter; handles session + token storage |
| **Prisma** | Type-safe ORM with migration tooling; schema-first approach prevents schema drift |
| **PostgreSQL 16** | Reliable relational store; excellent for time-series aggregation with proper indexing |
| **Redis + BullMQ** | Durable job queue — survives process restarts, supports retries, decouples webhook ingestion from processing |
| **Recharts** | Composable React chart library with responsive containers; no canvas complexity |
| **Google Gemini** | Fast inference for the weekly narrative digest; structured prompting for consistent output |
| **Resend** | Developer-friendly transactional email with reliable deliverability |
| **Docker Compose** | Local infrastructure parity — same PostgreSQL and Redis versions as production |

---

## What This Project Demonstrates

- **Webhook ingestion architecture** — HMAC-SHA256 signature verification, raw body preservation, immediate 200 response
- **Idempotent event processing** — `X-GitHub-Delivery` UUID as primary key prevents duplicate processing on GitHub retries
- **Async job queues** — BullMQ separates the HTTP concern from the processing concern; webhooks never block
- **Rate-limit-aware API client** — reads `X-RateLimit-Remaining` headers and sleeps until `X-RateLimit-Reset`
- **Time-series data aggregation** — raw events → daily pre-aggregated metrics → dashboard reads only aggregates
- **GitHub OAuth with scoped token storage** — `repo` + `admin:repo_hook` scopes, token persisted via NextAuth events
- **LLM integration with structured prompting** — delta computation → JSON → constrained Gemini prompt → narrative
- **Multi-process architecture** — Next.js app, BullMQ worker, and cron scheduler as separate runtime concerns

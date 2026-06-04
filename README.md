# DevPulse

DevPulse is an engineering analytics dashboard that aggregates GitHub pull request, code review, and deployment metrics into an actionable, team-focused view.

## Core Features
- Daily metric snapshots per repository
- Cycle time & PR size analysis
- AI-generated weekly email digests (powered by Groq + Llama 3.3 70B)
- Automated historical backfilling via BullMQ

## Tech Stack
- Next.js (App Router, React 19)
- Prisma (PostgreSQL)
- BullMQ (Redis)
- NextAuth.js (GitHub OAuth)
- Resend (Email)
- Groq + Llama 3.3 70B

## Setup Instructions
1. Clone the repository and install dependencies using `npm install`.
2. Configure `.env` with your PostgreSQL, Redis, NextAuth, GitHub App, Groq + Llama 3.3 70B, and Resend credentials.
3. Run `npm run db:push` to sync the Prisma schema.
4. Start the application:
   - Next.js server: `npm run dev`
   - Background worker: `npm run worker`

## Architecture Overview
The application consists of two main processes:
1. **Next.js Web Server**: Serves the dashboard UI and handles GitHub OAuth, webhooks, and API routes.
2. **Background Worker**: A Node.js script (`src/worker.ts`) that runs BullMQ processors to handle asynchronous tasks like historical backfills, webhook event processing, daily metric aggregation, and sending weekly digests.

## Development Workflow
When making changes to the database schema, run `npm run db:generate` followed by `npm run db:push`. Restart both the web server and the worker process to ensure they pick up the latest schema changes.

## License
MIT

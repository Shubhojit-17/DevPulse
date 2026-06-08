<div align="center">
  <img src="https://img.icons8.com/color/96/000000/pulse.png" alt="DevPulse Logo" width="80" />
  <h1>DevPulse</h1>
  <p><strong>The heartbeat of your engineering organization.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-Ready-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  </p>
</div>

<br/>

A comprehensive engineering analytics dashboard that automatically aggregates GitHub pull requests, code reviews, deployments, and commit metrics into an actionable, team-focused view. Stop guessing about your team's velocity and start measuring the real pulse of your delivery.

## ✨ Overview

DevPulse bridges the gap between raw GitHub data and meaningful engineering metrics. By continuously syncing your repositories via webhooks and background jobs, it calculates essential **DORA metrics** and contributor insights, presenting them in a beautiful, highly dynamic dashboard. 

The UI features rich entrance animations, staggering cards, and Recharts graphs that form smoothly on every page load, delivering a premium "wow" factor right out of the box.

## 📈 What We Measure

DevPulse breaks down your engineering health into actionable dimensions:

| Metric Category | Key Indicators | Impact |
| :--- | :--- | :--- |
| **DORA Metrics** | Deployment Frequency, Lead Time for Changes, Change Failure Rate | Understand overall delivery pipeline efficiency and stability. |
| **Pull Requests** | Avg Cycle Time, Merge Rate, Time-to-First-Review | Identify code review bottlenecks and WIP buildup. |
| **Commits** | Total Commits, Frequency per Day, Recent Activity | Measure raw engineering activity and momentum over time. |
| **Contributors** | Active Authors, Individual Review Counts | Recognize top reviewers and track team participation. |

## 🚀 How It Works

DevPulse is split into two primary architectures working in tandem:

1. **Next.js Web Server**: Handles the sleek React UI, authenticates users via GitHub OAuth, and securely exposes the metrics via dynamic API routes.
2. **Background Worker**: A robust Node.js process using BullMQ & Redis that asynchronously ingests GitHub webhooks, backfills historical repository data, and runs cron jobs to aggregate daily metric snapshots.

Because the data digestion is offloaded to the worker queue, the dashboard remains lightning-fast and never hits GitHub API rate limits during peak usage.

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts
* **Backend:** Node.js, Prisma ORM, PostgreSQL
* **Queues & Background Jobs:** BullMQ, Redis, Node-Cron
* **Auth & Integrations:** NextAuth.js (GitHub OAuth), GitHub Apps API
* **AI & Email:** Groq (Llama 3.3 70B) for weekly digest generation, Resend for email delivery

## 💻 Setup Instructions

Ready to run DevPulse locally? Follow these steps:

**1. Clone & Install**
```bash
git clone https://github.com/Shubhojit-17/DevPulse.git
cd DevPulse
npm install
```

**2. Environment Configuration**
Copy the `.env.example` file to `.env` and fill in the required keys:
* PostgreSQL connection string
* Redis connection string
* GitHub OAuth App credentials (Client ID / Secret)
* Groq API Key & Resend API Key

**3. Database Sync**
Push the Prisma schema to your PostgreSQL database:
```bash
npm run db:push
```

**4. Start the Application**
You need to run both the web server and the background worker concurrently:
```bash
# In terminal 1 (Starts Next.js Dashboard)
npm run dev

# In terminal 2 (Starts BullMQ processor)
npm run worker
```

## 🧪 Demo Data Generation

Want to test the dashboard UI without connecting active repositories? DevPulse comes with a powerful seed script that generates realistic PRs, reviews, deployments, and commit histories.

```bash
node scripts/seed-demo.js
```
*Note: Ensure you have linked at least one repository to your user account before running the seed script.*

<br/>

<div align="center">
  <i>Built with ❤️ for engineering teams.</i>
</div>

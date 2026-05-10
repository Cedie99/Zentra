# Zentra — AI-Powered Production Readiness Analyzer

Zentra analyzes any GitHub repository and tells you whether your code is ready for production. Paste a repo URL, get a health score, security findings, architecture issues, and an AI-written verdict — in under a minute.

![Health Score](https://img.shields.io/badge/Health%20Score-0--100-amber)
![Powered by Claude](https://img.shields.io/badge/AI-Claude%20Haiku-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

---

## What It Does

- **34 automated rules** across 7 categories scan your codebase for production risks
- **Claude AI** reviews the rule findings — removes false positives, discovers missed issues, and writes codebase-specific suggestions
- **Production readiness verdict**: Ready / Needs Work / Not Ready with a confidence score
- **Health score** (0–100) calculated from issue severity and count
- **Evidence-based issues** — every finding links to the exact file and line number
- **AI fix prompts** — each issue generates a ready-to-paste prompt for ChatGPT, Claude, Gemini, or any AI

---

## Analysis Categories

| Category | Rules | What It Checks |
|---|---|---|
| Architecture | 4 | God files, missing service layers, async consistency, structured logging |
| Security | 5 | Hardcoded secrets, open CORS, missing auth middleware, exposed errors, `.env` files |
| Database | 5 | N+1 queries, missing pagination, index analysis, field selection, SQL injection |
| Caching | 4 | Missing cache layer, uncached DB queries in routes, HTTP cache headers, CDN config |
| Error Handling | 4 | Async without try-catch, swallowed errors, global error handler, API timeouts |
| Deployment | 7 | Dockerfile, `.env.example`, health check endpoint, CI/CD, env var validation, hardcoded localhost, dev deps in prod |
| Scalability | 5 | Resource limits, async patterns, queue systems, load handling |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: PostgreSQL via Prisma ORM (hosted on Supabase)
- **Auth**: NextAuth.js (GitHub OAuth + credentials)
- **AI**: Claude Haiku via Vercel AI SDK (`@ai-sdk/anthropic`)
- **Styling**: Tailwind CSS
- **Smooth scroll**: Lenis

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- GitHub OAuth app
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/architecture-analyzer.git
cd architecture-analyzer
npm install
```

### 2. Set up environment variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# GitHub OAuth
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# GitHub token for fetching repo files
GITHUB_TOKEN=ghp_...

# AI
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  (dashboard)/
    dashboard/        # Main dashboard — repo list, usage indicator
    reports/[id]/     # Full analysis report page
  api/
    analysis/         # POST — runs analysis, enforces monthly limit
    user/usage/       # GET — returns { used, limit, plan }
    repos/[id]/       # Repo management
  pricing/            # Standalone pricing page
  page.tsx            # Landing page

components/
  landing/            # Navbar, hero, features, pricing, use cases, CTA
  report/             # Report UI — issue list, detail panel, AI summary
  repos/              # RepoForm with usage indicator and upgrade banner
  pricing/            # SubscribeButton (placeholder)
  dashboard/          # Sidebar, overview chart

lib/
  analysis/
    rules/            # 34 pattern-based rules across 7 categories
    engine.ts         # Runs all rules against fetched files
    ai-enhancer.ts    # Claude AI pass — filters FPs, adds issues, generates verdict
    score-calculator.ts
    tech-detector.ts
  github/
    file-fetcher.ts   # Fetches up to 150 prioritised files from GitHub API
    client.ts
  db/
    client.ts         # Prisma client singleton

prisma/
  schema.prisma       # User, Repository, AnalysisReport, ReportSection, ReportIssue
```

---

## Freemium Model

| Plan | Price | Analyses/month |
|---|---|---|
| Free | $0 | 3 |
| Pro | $9/mo | Unlimited |

- The limit is enforced in `app/api/analysis/route.ts` before any analysis runs
- The dashboard shows a live usage pill: "X / 3 analyses this month"
- The repo form shows a progress bar and upgrade banner when the limit is reached
- Payment integration is not yet live (placeholder Subscribe button)

---

## Key Features

### AI Fix Prompts
Every issue in the report includes a pre-built prompt you can copy and paste directly into any AI (ChatGPT, Claude, Gemini, etc.). The prompt includes the issue title, severity, file path, problem description, evidence, and suggested fix — giving the AI everything it needs to produce a targeted solution.

### Production Readiness Verdict
After automated rules run, Claude AI produces:
- A **verdict**: Ready / Needs Work / Not Ready
- A **confidence score** (0–100)
- A **2–3 sentence summary** of overall production readiness
- Up to 4 **strengths** and 4 **risks** observed in the actual code
- One **recommended next step**

### Evidence-Based Issues
Every rule match includes the exact file path, line number, and a code snippet as evidence — no vague warnings.

---

## Deployment

Designed to deploy on **Vercel** with a **Supabase** PostgreSQL database.

```bash
npm run build
```

Set all environment variables in your Vercel project settings.

---

## License

MIT

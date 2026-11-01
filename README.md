# CodeQuest ⚔️

**Learn to Code. Level Up.** — a gamified programming platform: *Duolingo-style progression + LeetCode-style coding + game-like rewards.*

Instead of a 2,000-problem list, players follow a journey:

```
World → Topic → Level → Coding Challenge → XP → Unlock next level
```

## What's inside

| Area | Details |
|---|---|
| Gameplay | XP, levels (`level × 250` XP per level), coins, daily streaks, 10 badges, weekly + all-time leaderboard, daily challenge, level unlocking |
| Content | 3 worlds · 30 challenges (Foundations → Data Structures → Algorithms), each with 2 sample + 3 hidden tests |
| Screens | Landing, login, signup, 3-step onboarding, dashboard, journey map, challenge list, coding arena (Monaco), leaderboard, achievements, profile (Recharts analytics), settings, admin (dashboard / problems / users / worlds) |
| Stack | Next.js 14 (App Router) · React · TypeScript · Tailwind · Monaco · Prisma · PostgreSQL · Judge0 · Docker Compose · Recharts · Lucide |
| Auth | Email + password (bcrypt) with signed JWT session cookie (`jose`), route protection in `middleware.ts`, USER / ADMIN roles |

## Quick start (Docker — recommended)

```bash
cp .env.example .env            # optional – defaults work for a demo
docker compose up --build       # app on http://localhost:3000
```

The app container runs `prisma db push` and the seed script on start.

**Seeded logins**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@codequest.dev` | `admin12345` |
| Demo players | `rahul@demo.codequest.dev`, `arjun@…`, `neha@…`, `priya@…`, `kabir@…` | `demo12345` |

## Local development (without Docker for the app)

```bash
npm install
cp .env.example .env
docker compose up -d db          # just PostgreSQL
npm run db:setup                 # create tables + seed
npm run dev                      # http://localhost:3000
```

## Code execution (Judge0)

User code is **never run inside the Next.js server**. `src/lib/judge.ts` sends it to a sandboxed Judge0 instance — one request per test case with `stdin`, comparing trimmed `stdout` to the expected output.

**Option A – hosted (easiest).** Subscribe to *Judge0 CE* on RapidAPI and set:

```env
JUDGE0_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="<your key>"
JUDGE0_API_HOST="judge0-ce.p.rapidapi.com"
```

**Option B – self-hosted.** `docker compose --profile judge0 up -d`, then `JUDGE0_URL="http://localhost:2358"` (for the `app` container use `http://judge0:2358`). Judge0 1.13.1 needs `privileged` containers and cgroup v1 on the host; on newer kernels use the hosted option.

**No Judge0?** If `JUDGE0_URL` is empty the app uses a **mock runner**: any code that differs from the starter template "passes". A yellow `MOCK RUNNER` label is shown in the editor. It is only for demoing the game loop — set a real Judge0 URL for real judging.

Language IDs used: Python 71, C++ 54, Java 62.

## Project structure

```
prisma/
  schema.prisma     # User, World, Topic, Problem, TestCase, Submission, UserProblem, Achievement, ...
  problems.ts       # the 30-problem bank (expected outputs come from reference solutions)
  seed.ts
src/
  middleware.ts     # redirects signed-out users to /login
  lib/
    gamification.ts # XP, levels, streaks, badges, unlocking — the "game engine"
    judge.ts        # Judge0 client + mock runner
    queries.ts      # leaderboard, journey map, week activity
    auth.ts · db.ts · admin.ts · utils.ts
  app/
    page.tsx · login · signup · onboarding
    (app)/          # dashboard, journey, challenges, challenge/[id], leaderboard, achievements, profile, settings
    admin/          # overview, problems (+ new / edit), users, worlds
    api/            # auth, onboarding, user/profile, code/run, code/submit, leaderboard, submissions, admin/*
  components/       # app shell, workspace (editor), charts, forms, ...
```

## How the game loop works

1. **Run** → samples only (`POST /api/code/run`). Nothing is stored, no XP.
2. **Submit** → all test cases (`POST /api/code/submit`). A `Submission` row is stored.
3. If **ACCEPTED** and first time solved: XP + coins (Easy 100/10, Medium 150/20, Hard 250/30), +20 XP first solve of the day, +50 XP / +10 coins for the daily challenge, streak update, badge checks, and the next level unlocks.
4. If not accepted: no XP, attempts counter goes up, no punishment.

A level is playable when every level before it is solved (the daily challenge is always playable). Re-solving never grants XP twice.

## Admin tips

- `/admin/problems/new` — add problems with starter code per language, sample + hidden tests, XP/coin rewards.
- Tick **Daily challenge** on one problem to feature it on every dashboard.
- New problems are appended to the end of the journey.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `start` | production build / server |
| `npm run db:push` | sync schema to the database |
| `npm run db:seed` | (re)seed worlds, problems, badges, admin, demo players |
| `npm run db:setup` | push + seed |

## Deployment

Vercel + a hosted PostgreSQL (Neon, Supabase, Railway…): set `DATABASE_URL`, `AUTH_SECRET`, and the Judge0 variables, then run `npx prisma db push && npm run db:seed` once against the production database.

## Intentionally out of scope

Lives, power-ups, PvP, clans, chat, AI tutor, a coin shop, Google login, password reset. The point is a tight, finishable game loop.

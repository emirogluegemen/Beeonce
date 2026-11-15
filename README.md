# AI-Assisted Child Development Platform — release v0.1

**SENG 383 — Software Project III, Fall 2026** · M1–M4 working-scope implementation

A local-first, role-based collaboration application for a fictional child's **weekly schedule, tasks and linked specialists**. Built with **React (Vite) + Node.js/Express + SQLite + JWT**. It uses **synthetic demo data only** and follows the first four mandatory items in the course assignment. It does **not** include v0.2's observation, documents, statistics or AI summary features.

## What is included

| ID | Mandatory functionality | In v0.1 |
|---|---|---|
| M1 | Email/password login; role-specific screens; role from account | ✅ |
| M2 | Parent links/unlinks a registered specialist by email; API access revoked on unlink | ✅ |
| M3 | Parent and linked specialist add events; all authorized roles view weekly schedule | ✅ |
| M4 | Parent and linked specialist assign tasks; child marks tasks done; assigner views status | ✅ |

The [API contract](docs/API.md), [design notes](docs/ARCHITECTURE.md), [test plan](docs/TEST_PLAN.md), and [QA handoff](docs/QA_HANDOFF.md) are included.

## Requirements

- **Node.js 22.13 or later**, npm 10 or later. The backend uses built-in `node:sqlite` and does not need a separate SQLite installation. Node may print an experimental API warning.
- An internet connection **once** for `npm install` (and browser download for Playwright).
- Linux, macOS or Windows with terminal/PowerShell. No Docker, microservices or cloud account.

## Quick start

From this repository root:

```bash
# Linux/macOS
cp .env.example server/.env
npm install
npm run seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example server/.env` instead of `cp`; then run the same three `npm` commands.

Open **http://127.0.0.1:5173**. The frontend runs on port **5173** and the API on **127.0.0.1:3001**. Both are started by `npm run dev`. The JWT secret in `.env.example` is demo-only; use a fresh, random secret for a non-test machine. **Never commit `server/.env`.**

**Important:** `npm run seed` **erases and recreates** the demo SQLite records at `server/data/development.sqlite`. Only run it on the local fictional fixture database. `npm run test:e2e` also resets the fixtures before it starts.

## Demo login accounts

Every account has password **`Demo1234!`**. They are not real people.

| Email | Role | Purpose |
|---|---|---|
| `parent@demo.test` | Parent | Owns Deniz; can link specialists |
| `child@demo.test` | Child | Deniz's own tasks and schedule |
| `teacher@demo.test` | Specialist | Initially linked to Deniz (teacher) |
| `doctor@demo.test` | Specialist | Initially unlinked; use to demonstrate M2 |
| `otherparent@demo.test` | Parent | Owns fictional Ada; cross-family isolation |
| `otherchild@demo.test` | Child | Ada's restricted account |

The login page includes demo-account convenience buttons. The role is retrieved from the account, **not** chosen at login. Seed data includes current-week activities so the interface is not empty after setup.

## Demonstration (M1–M4)

1. **M1:** Sign in as the parent, then teacher, then child. Each has its own workspace and is redirected away from other roles' pages.
2. **M2:** In the parent workspace, link `doctor@demo.test` with type “Doctor”. Sign in as doctor to view Deniz. Sign back in as parent and unlink them, confirming the dialog. The doctor's previously issued token can no longer access `/api/children/1/...`.
3. **M3:** In parent/teacher workspace, add an event within the selected week. Sign in as child to view it. Child cannot create events.
4. **M4:** In parent/teacher workspace, assign a task with title, description, area and due date. Sign in as child and click **Mark done**. Sign back in as the assigner to view **Completed**. The optional **Show only tasks assigned by me** filter makes tracking easier.

## Tests and CI

```bash
npm run test              # Jest/Supertest API + Vitest UI tests
npm run test:coverage     # coverage results (no v0.1 threshold required)
npm run build             # Vite production frontend build
npx playwright install chromium
npm run test:e2e          # 4 critical browser flows (M1–M4)
```

GitHub Actions `.github/workflows/ci.yml` installs Node 22/dependencies, seeds fictional data, runs unit/API/UI tests with coverage, builds the frontend, and runs Playwright E2E tests. Work through reviewed GitHub PRs and track work in Jira, as instructed by the assignment.

## Repository layout

```text
seng383-child-development-v0.1/
  .env.example              server/.env configuration template
  .github/workflows/ci.yml  CI pipeline
  client/                   React screens, Vite config, Vitest
  server/src/               Express API, JWT, authorization, SQLite, seed
  server/tests/             Jest + Supertest integration/unit tests
  e2e/                      Playwright acceptance flows M1–M4
  docs/                     API contract, architecture, test plan
  README.md                 this setup / demo guide
```

## Boundaries and limitations

- This code is scoped to **v0.1**. M5–M8, AI integrations, real records, notifications, invitations, edit history, mobile apps, cloud deployment, microservices and Docker are intentionally not included.
- Weeks are Monday–Sunday in **UTC**; this is a documented design choice where the assignment does not specify a timezone. Task due dates are dates, while event times are timestamped instants displayed in the browser's local timezone.
- The classroom repository uses `localStorage` for a simple single-page app session. This is a teaching prototype, **not a production application for children's personal or medical data**. Use only fictional seed records.
- The assignment says the separate *Term Project – Student Guide* governs repository naming, folder conventions, and standard commands. That guide was not provided, so **confirm those details before submission**. The assignment takes precedence if the documents disagree.
- Automated test files and a CI workflow are supplied. The build environment used to prepare this archive could not access the npm registry; **npm installation and end-to-end execution must be completed in an internet-enabled environment**. Offline validation of backend source syntax, frontend JSX syntax, and SQLite seed/schema has been performed. A lockfile should be generated and committed by the team after the first successful `npm install`.

## Attribution

Produced with AI coding assistance; team members should review, test and understand the modules they own. The course assignment requires declaring AI assistance in the final report and submitting changes via reviewed pull requests.

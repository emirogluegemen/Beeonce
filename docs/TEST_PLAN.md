# v0.1 test plan and requirement traceability

**Source:** SENG 383 Fall 2026 Term Project Assignment, section 3.2 and Appendix A. The instructor's separate *Term Project – Student Guide* was not provided; verify naming/structure and submission commands before handing this repository in.

| Requirement | Main success checks | Negative / security checks | Automated evidence |
|---|---|---|---|
| M1 Login and roles | Parent, specialist, child authenticate; each lands on role page | Invalid password; missing/invalid JWT; child cannot list users' children | `server/tests/api.test.js` M1; `e2e/release-v01.spec.js` M1 |
| M2 Specialist links | Parent links registered specialist by email + type, lists links, unlinks with confirmation | Unregistered email; duplicates; child/specialist cannot link; wrong parent; **old JWT denied after unlink** | API M2; E2E M2 |
| M3 Weekly schedule | Parent and linked specialist create an event; child can view the selected week | Child cannot create; cross-family reads denied; invalid time range/week | API M3; E2E M3 |
| M4 Tasks | Parent and linked specialist assign task; child marks done; assigner sees status | Child cannot assign; parent cannot complete; other child cannot complete; invalid fields | API M4; E2E M4 |

## Repeatable verification

1. `cp .env.example server/.env` (or `Copy-Item .env.example server/.env` on PowerShell).
2. `npm install`
3. `npm run seed` — **overwrites the local demo database**.
4. `npm run test` — Jest + Supertest API/unit checks, then Vitest UI/unit checks.
5. `npm run test:coverage` — write text/LCOV coverage output (v0.1 has no required coverage threshold).
6. `npm run build` — produce the Vite frontend bundle.
7. `npx playwright install chromium` then `npm run test:e2e` — Playwright starts API/client and resets local fixture data.

CI runs all steps on Node 22 and uploads Playwright artifacts on failure. A successful CI run is the acceptance evidence; the project has not been installed from npm inside the file-building environment due to network restrictions.

## Manual acceptance walkthrough (~5 minutes)

1. Sign in as `parent@demo.test` / `Demo1234!`; verify parent dashboard, schedule, tasks and specialist management are visible.
2. Link `doctor@demo.test` as `doctor`. Sign in as doctor and verify Deniz Demo is visible. Sign back in as parent and unlink doctor with the confirmation dialog. Reuse the old doctor token in an API call and confirm HTTP `403`.
3. As parent, create a dated event within the currently selected week. As child, verify it is listed, but event creation is absent.
4. As parent, assign a task with title, description, development area and due date within the current week. As child, mark it done. As parent, verify completed status; as specialist, use “Show only tasks assigned by me”.
5. Sign in as `otherparent@demo.test`; verify Deniz's data is not available (second-family isolation).

## Suggested remaining QA checks

Check keyboard navigation, narrow-screen layout, empty/no-specialist views, wrong-week data, rapidly repeating submissions, API response code consistency, and account role spoofing. Log defects in Jira and review them with the SENG 440 test/quality team weekly per assignment.

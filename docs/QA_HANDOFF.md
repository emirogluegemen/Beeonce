# SENG 440 QA handoff · v0.1

## Scope for test team

Release is limited to M1–M4. See `docs/TEST_PLAN.md` for precise checks and `docs/API.md` for endpoints and status codes.

## Getting started

- Node.js 22.13+, copy `.env.example` to `server/.env`, then run `npm install`, `npm run seed`, `npm run dev`.
- Open `http://127.0.0.1:5173`. Seed accounts and passwords are listed in the root README.
- Run `npm run test`, `npm run build`, and `npm run test:e2e` (after `npx playwright install chromium`).
- **Do not enter real records.** `npm run seed` and the Playwright setup overwrite the fictional database.

## Acceptance checklist

- [ ] M1 parent login; specialist login; child login; invalid credential error; role mismatch denied.
- [ ] M2 parent link by registered email and type; link list; confirmation before unlink; error for unregistered email.
- [ ] M2 direct API request after unlink **with pre-existing JWT** returns 403; other parent or child cannot manage links.
- [ ] M3 parent adds an event; specialist adds an event; weekly list sorted; child sees but cannot add.
- [ ] M4 parent assigns task; specialist assigns task; child can mark only their own task done; assigner sees completed status.
- [ ] Cross-family access denied on all relevant endpoints.
- [ ] Reproducible setup documented; CI has passing build/test/E2E results.

## Planned discussion at weekly meeting

Record date/time, development attendees, QA attendees, outcome of the checklist, defect IDs and priorities, responsible developer, target correction release, and follow-up confirmation. Log actions in Jira and commit the minutes to the team repository as required by the assignment.

## Decisions to confirm with instructor/team

- The project's chosen week boundary is Monday–Sunday in UTC.
- The `developmentArea` vocabulary and date-only `dueAt` are implementation decisions.
- The repository names and commands need checking against the separate Student Guide, which was not included in the supplied assignment.

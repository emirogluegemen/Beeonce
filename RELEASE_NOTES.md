# Release v0.1 — M1–M4

**Scope:** SENG 383 Fall 2026 Term Project Assignment, mandatory items M1–M4, first accepted release scheduled for Week 8.

## Shipped source

- **M1**: Seeded email/password login, salted `scrypt` passwords, eight-hour JWT, account-derived parent/specialist/child navigation, protected API.
- **M2**: Parent-only registered specialist lookup by email and specialist type; link listing; explicit unlink confirmation in the browser; live API denial after removal of the link even with an old token.
- **M3**: Create event and see weekly event list; parent and linked specialist can create; child can only read their own schedule.
- **M4**: Create task with title, description, development area and due date; child can mark own tasks completed; assigner can see status, including a `assignedBy=me` filter.
- **Engineering**: Local SQLite schema and seed; modular Express API; React/Vite responsive UI; Jest/Supertest + Vitest tests; four Playwright flows; GitHub Actions workflow; setup and API/design/test documentation.

## Not in this release

M5 specialist entries, M6 documents, M7 weekly statistics, M8 AI summaries; no bonus features, invitations, Docker, cloud deployment or native apps. Those are later or out of scope in the assignment.

## Known verification limits

The archive's backend JavaScript syntax, frontend JSX syntax and the SQLite schema/fictional fixture insertion were checked in the authoring environment. Network access to the npm registry was unavailable, so dependencies could not be installed and Jest/Vitest/Playwright/CI could not be executed there. **This release is code-complete for M1–M4 but still requires a clean install and test-team sign-off before being represented as a verified submission.**

## Preparation for team submission

1. Copy `.env.example` to `server/.env`, install dependencies, seed and run the app; execute all automated tests (README).
2. Commit the generated `package-lock.json` after the first successful `npm install`, then use `npm ci` in CI for reproducible builds if the test team agrees.
3. Verify the Student Guide's required repository structure, file naming and command conventions; it was not provided with the assignment.
4. Review changes in GitHub PRs and record the weekly meeting with SENG 440 testers, Jira status, test defects and live-demo readiness.
5. After QA acceptance, push release commit and tag **`v0.1`**: `git tag v0.1 && git push origin v0.1`.

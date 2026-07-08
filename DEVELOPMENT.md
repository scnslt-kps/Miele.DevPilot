# Miele.DevPilot Development Guide

This document is for developers who work on Miele.DevPilot without Codex-specific context.

## Overview

Miele.DevPilot is a small Node.js and browser proof of concept for requirements engineering workflows. It imports Excel, XLS, or CSV files, reviews Product Requirements with AI support, derives Software Requirements and E2E Test Cases, and stores users and projects in PostgreSQL through Prisma.

The application deliberately has no frontend build step. The browser app is plain HTML, CSS, and JavaScript served by a small Node.js HTTP server.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Main browser UI markup. |
| `styles.css` | Global UI styling and responsive layout rules. |
| `app.js` | Browser application state, workflow logic, rendering, i18n, and API calls. |
| `server.mjs` | Local HTTP server, static file serving, auth/session handling, OpenAI API routes, project/user APIs. |
| `src/lib/prisma.js` | Prisma client setup and environment loading. |
| `prisma/schema.prisma` | PostgreSQL data model. |
| `prisma/migrations/` | Database migrations. |
| `*.md` prompt files | Prompt templates for PR review, SR derivation, and E2E derivation. |
| `vendor/` | Vendored browser libraries, currently SheetJS/XLSX. |
| `assets/` | Static UI assets and icons. |
| `deploy/` | Server installation, systemd, and nginx examples. |
| `scripts/build-release.sh` | Release package builder. |
| `data/` | Legacy/local runtime data. Do not treat as source of truth after PostgreSQL migration. |
| `outputs/`, `output/`, `tmp/`, `release/` | Generated/runtime artifacts. Do not commit normal generated output. |

## Prerequisites

- Node.js with ES module support and `process.loadEnvFile` support.
- npm.
- PostgreSQL 16 or compatible PostgreSQL.
- Optional: Docker for the local PostgreSQL container.
- Optional: OpenAI API key for real AI calls.

Install dependencies:

```bash
npm install
```

## Local Environment

Create local configuration:

```bash
cp .env.example .env.local
```

Important variables:

```bash
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-5.5
DATABASE_URL="postgresql://miele_devpilot:devpassword@localhost:5432/miele_devpilot?schema=public"
PORT=3000
BASE_PATH=/Miele.DevPilot
ADMIN_NAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin-DevPilot-2026!
OPENAI_MOCK=false
```

Never commit real credentials. `.env.local` is local-only.

## Local Database

The app expects PostgreSQL via `DATABASE_URL`.

One local Docker option:

```bash
docker run -d \
  --name miele-devpilot-db \
  -e POSTGRES_USER=miele_devpilot \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=miele_devpilot \
  -p 5432:5432 \
  postgres:16-alpine
```

Apply migrations:

```bash
npx prisma migrate dev
```

For non-development deployment environments, use:

```bash
npx prisma migrate deploy
```

Regenerate Prisma client after schema changes:

```bash
npx prisma generate
```

## Running the App

Run with real OpenAI calls:

```bash
npm start
```

Open:

```text
http://localhost:3000/Miele.DevPilot/
```

Run with mocked AI responses:

```bash
npm run start:mock
```

Use mock mode for offline UI and Excel workflow testing.

## Validation Commands

There is no full automated test suite yet. At minimum run:

```bash
npm run check
```

This syntax-checks `server.mjs` and `app.js`.

For UI or workflow changes, also run `npm run start:mock` and manually test the affected flow.

## Architecture

### Browser App

`app.js` owns most frontend behavior:

- Global UI state lives in the `state` object near the top of the file.
- UI elements are cached in the `els` object.
- Rendering is handled by functions such as `renderWorkspaceState`, `renderProcessPages`, `renderMetrics`, `renderProductTransferState`, `renderSoftwarePage`, and `renderE2ePage`.
- API calls use relative endpoints built for the configured `BASE_PATH`.
- The browser always calls the Node server. It must never read OpenAI secrets directly.

### Server

`server.mjs` provides:

- Static file serving under `BASE_PATH`.
- Cookie-based in-memory sessions.
- Login, logout, password change, and admin user APIs.
- Project persistence APIs.
- OpenAI-backed analysis, feedback translation, SR derivation, and E2E derivation endpoints.
- Optional mock mode through `OPENAI_MOCK=true`.

The server is intentionally dependency-light and uses Node's built-in HTTP server instead of Express.

### Persistence

Prisma models:

- `User`: login identity, roles, active state, password hash, password-change requirement.
- `Project`: saved project state as JSON, owned by a user.
- `ProjectRevision`: historical project snapshots.
- `ProjectMember`: future collaboration/membership extension point.

Project content is stored as JSON. Keep compatibility in mind when changing the shape of persisted browser `state`.

## Main Workflow

1. User logs in.
2. User creates or opens a project.
3. User imports a Product Requirements file.
4. User configures sheet/header/columns and TechType mapping.
5. PR analysis runs in batches.
6. Product Requirements are reviewed, finalized, scored, and assigned TechTypes.
7. Product Requirement approval is completed by configured approvers.
8. PR Windchill transfer simulation becomes available to Product Requirement Owners or Admins.
9. Software Requirements can be derived after PR transfer simulation.
10. E2E TestCases can be derived after SR acceptance and SR transfer simulation.

## Roles and Permissions

Known roles are defined in `server.mjs` and mirrored in browser logic:

- `admin`
- `productRequirementOwner`
- `softwareRequirementOwner`
- `e2eTestOwner`
- `productRequirementApprover`
- `softwareRequirementApprover`
- `e2eTestApprover`

Important distinction:

- Approvers can approve artifacts in their area.
- Owners or admins perform editing and transfer simulation for their area.
- A Product Requirement Approver alone cannot start PR Windchill transfer simulation.

When changing permissions, update both server-side enforcement and browser-side availability/visibility.

## Internationalization

The default language is German (`de`). English (`en`) translations are kept in `UI_TRANSLATIONS` in `app.js`.

Rules for UI text changes:

- Do not add visible hardcoded UI text without adding translation support.
- Add every new German source string to `UI_TRANSLATIONS.en`.
- For dynamic text, call `translateUiText(...)` before assigning `textContent`, `title`, `placeholder`, or `aria-label`.
- For repeated dynamic patterns, add regex replacements in `translateUiPattern` and `translateDefaultUiPattern`.
- Do not expose raw technical keys or fallback placeholders in the UI.
- Verify both German and English after UI changes.

Common examples:

```js
button.textContent = translateUiText("Benutzer speichern");
input.placeholder = translateUiText("Mindestens 8 Zeichen");
element.title = translateUiText("Nur Product Requirement Owner oder Admins können die Transfer-Simulation starten");
```

## Styling Guidelines

The app currently uses a dark, restrained operational UI. When adding UI:

- Prefer existing CSS variables such as `--panel`, `--panel-elevated`, `--control`, `--text`, `--muted`, `--accent`, and `--hairline`.
- Avoid isolated light-theme components inside dark dialogs.
- Keep cards and controls at small radii, usually `var(--radius)`.
- Make modal dialogs viewport-safe: constrain height and make inner content scroll instead of pushing buttons off-screen.
- Keep action buttons visible and reachable on small viewports.
- Verify contrast for disabled, hover, and focus states.

## OpenAI Integration

OpenAI calls are made server-side only.

Prompt files:

- `requirements-review-prompt.md`
- `software-requirements-prompt.md`
- `e2e-testcases-prompt.md`

Mock mode:

```bash
OPENAI_MOCK=true npm start
```

Use mock mode when testing layout, import, project save/load, admin, and basic workflow behavior without consuming API quota.

Optional cost-estimation settings:

```bash
OPENAI_INPUT_USD_PER_1M_TOKENS=
OPENAI_CACHED_INPUT_USD_PER_1M_TOKENS=
OPENAI_OUTPUT_USD_PER_1M_TOKENS=
```

## File Import and Export

The browser uses the vendored XLSX library in `vendor/xlsx.full.min.js`.

Product Windchill export simulation expects the original workbook to still be available in the project session. The export flow uses:

- `PRODUCT_WINDCHILL_EXPORT_SHEET`
- `PRODUCT_WINDCHILL_EXPORT_NUMBER_HEADER`
- the `Desc` column in the expected export sheet

If the original source workbook is unavailable, users must re-import the PR file before running the simulation.

## Development Workflow

Recommended loop:

```bash
npm run start:mock
```

Then manually verify:

- Login and password-change flow.
- Admin user management.
- Project create/open/save/history.
- File import and sheet/header/column selection.
- PR analysis.
- PR finalization, score gating, TechType assignment.
- PR approval and transfer simulation.
- SR derivation, acceptance, approval, and transfer simulation.
- E2E derivation and review.
- German and English UI.

Before handing off changes:

```bash
npm run check
git diff --check
```

## Release Package

Build release archive:

```bash
npm run build:release
```

Output:

```text
release/Miele.DevPilot-server.tar.gz
```

The installation guide is in `deploy/INSTALLATION.md`.

## Common Troubleshooting

### Unexpected server error on login

Check whether PostgreSQL is reachable:

```bash
pg_isready -h localhost -p 5432
```

If using Docker:

```bash
docker ps
docker logs miele-devpilot-db
```

Then apply migrations:

```bash
npx prisma migrate deploy
```

### Port 3000 already in use

Find the listener:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Stop it or set another `PORT` in `.env.local`.

### Transfer button is disabled although scores are good

Scores are only one gate. PR transfer simulation also requires:

- PR finalization complete.
- PR approval complete.
- Current user has `productRequirementOwner` or `admin`.

Approver-only users cannot start transfer simulation.

### English UI still shows German text

Look for dynamic assignments in `app.js` such as:

```js
element.textContent = "German text";
```

Replace with:

```js
element.textContent = translateUiText("German text");
```

Then add the source text to `UI_TRANSLATIONS.en`.

## Code Change Notes

- Keep changes scoped. This is a small POC with large plain JS files.
- Prefer existing render and helper functions over new frameworks.
- Do not introduce build tooling unless strictly necessary.
- Keep server-only concerns in `server.mjs`.
- Keep browser-only concerns in `app.js`.
- Keep source assets in `assets/`; keep generated files out of source commits.
- When changing persisted project state, consider migration/backward compatibility in `loadProjectState`.


# Repository Guidelines

## Project Structure & Module Organization

Miele.DevPilot is a small Node.js/browser POC for checking requirements from Excel, XLS, or CSV files. The main browser app lives at the repository root: `index.html`, `styles.css`, and `app.js`. The local HTTP/API server is `server.mjs`. Prompt templates are kept as root-level Markdown files such as `software-requirements-prompt.md`, `requirements-review-prompt.md`, and `e2e-testcases-prompt.md`. Third-party browser libraries are vendored in `vendor/`; static assets belong in `assets/` and are included by the release script. Deployment material is under `deploy/`, with `deploy/INSTALLATION.md`, systemd, and nginx examples. Generated files and local runtime data belong in `outputs/`, `output/`, `release/`, or `data/` and should not be treated as source.

## Build, Test, and Development Commands

- `cp .env.example .env.local`: create local configuration before running the server.
- `npm start`: start the app at `http://localhost:3000/Miele.DevPilot`.
- `npm run start:mock`: run the same app with `OPENAI_MOCK=true` for offline Excel workflow testing.
- `npm run check`: syntax-check `server.mjs` and `app.js` with Node.
- `npm run build:release`: create `release/Miele.DevPilot-server.tar.gz` for installation.

## Coding Style & Naming Conventions

Use modern ES modules and plain browser JavaScript. Follow the existing style: two-space indentation, double quotes for strings, `camelCase` for variables/functions, `PascalCase` only for constructor-like values, and uppercase `SCREAMING_SNAKE_CASE` for constants. Keep browser UI logic in `app.js`, server-only concerns in `server.mjs`, and avoid adding build tooling unless it is necessary. Maintain German and English UI copy consistently when touching localized text.

## Internationalisierung / Übersetzungen

Bei jeder Änderung am UI oder an fachlichen Texten müssen Übersetzungen vollständig geprüft und gepflegt werden.

Pflichtregeln:

- Keine neuen sichtbaren UI-Texte hardcodieren, wenn das Projekt ein Übersetzungssystem nutzt.
- Neue Labels, Buttons, Tabellenüberschriften, Dialogtexte, Fehlermeldungen, Toasts, Tooltips, Statuswerte und Hilfetexte müssen über Translation Keys eingebunden werden.
- Für jeden neuen Translation Key müssen alle unterstützten Sprachen gepflegt werden.
- Bestehende Translation Keys dürfen nicht entfernt oder umbenannt werden, ohne alle Verwendungen und alle Sprachdateien anzupassen.
- Bei jeder UI-Änderung muss geprüft werden, ob deutsche und englische Übersetzungen vollständig vorhanden sind.
- Es dürfen keine Platzhalter wie `TODO`, `missing translation`, rohe Keys oder Fallback-Texte im UI sichtbar werden.
- Falls ein Text fachlich geändert wird, müssen alle Sprachvarianten sinngemäß mitgeändert werden.
- Technische Schlüssel sollen stabil, sprechend und konsistent benannt werden.
- Keine Vermischung von Sprachen innerhalb einer UI-Ansicht.
- Nach Änderungen muss gezielt geprüft werden, ob die Anwendung in allen unterstützten Sprachen ohne fehlende Übersetzungen funktioniert.

Akzeptanzkriterien für jede zukünftige Änderung:

- Alle neuen oder geänderten UI-Texte sind internationalisiert.
- Alle unterstützten Sprachdateien oder Translation Maps wurden aktualisiert.
- Keine fehlenden Translation Keys.
- Keine hardcodierten sichtbaren Texte, sofern vermeidbar.
- Keine sichtbaren technischen Keys im UI.
- Deutsch und Englisch sind fachlich konsistent.
- Lint-/Typecheck-/Build-Prüfungen laufen weiterhin erfolgreich.

## Architecture Principles

- Prefer modular architecture over monolithic components.
- Separate UI, business logic and data access.
- Keep components stateless whenever possible.
- Prefer composition over inheritance.
- Design for future multi-tenant support.

## API Guidelines

- Use environment variables for all API endpoints.
- Never hardcode hostnames.
- Keep API clients isolated.
- Prefer async server actions where appropriate.

## Development Philosophy

Always prefer:

- readability over cleverness
- maintainability over shortcuts
- consistency over novelty
- scalability over quick fixes

When uncertain, implement the simpler solution and document extension points.

## Testing Guidelines

There is no dedicated automated test framework yet. Run `npm run check` before every commit. For behavior changes, also run `npm run start:mock` and manually verify the upload, sheet/header selection, analysis, generated SR/E2E flows, login, and admin paths affected by your change. Name any future tests after the feature or endpoint they cover, for example `login-session.test.mjs`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit subjects such as `Add localized feedback and usage cost dialog` or `Fix score color threshold`. Keep commits focused and avoid bundling generated output with source changes. Pull requests should include a concise summary, manual test results, linked issue or ticket when available, and screenshots for visible UI changes.

## Security & Configuration Tips

Never commit real credentials. `.env.local`, `data/users.json`, and release artifacts are local/runtime files. Keep OpenAI keys server-side only; browser code must call server endpoints rather than reading secrets directly.

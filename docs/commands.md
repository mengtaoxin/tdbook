# Commands

Run everything from the repo root with the `npm run` scripts in `package.json`.

When to run these while changing code: [change-code-steps.md](change-code-steps.md).

## Setup

```sh
export NODE_AUTH_TOKEN=<GitHub PAT with read:packages>   # needed for @mengtaoxin/* packages
npm install
npx playwright install chromium                          # needed for verify / e2e
```

`.npmrc` routes `@mengtaoxin/*` (the `tdkit` dependency and `@mengtaoxin/oxc-config`) to GitHub Packages; without the token, `npm install` fails on those packages.

## Develop

```sh
npm run dev       # Vite dev server on http://localhost:3000 (Ctrl+C to stop)
```

The dev server serves `public/` (including the default catalog `/sample/configs.json`) and `/pdfjs/**` from `pdfjs-dist`. The service worker is disabled in dev, so test PWA behavior with `build` + `preview`. If port 3000 is taken (`EADDRINUSE`), stop the other process first; Playwright also expects port 3000.

## Build and preview

```sh
npm run build     # tsc -b + vite build → dist/ (public/ and pdfjs assets copied)
npm run preview   # serve dist/ locally (Vite default port 4173), with the service worker
```

## Test

```sh
npm run test            # Vitest unit tests, once
npm run test:watch      # Vitest in watch mode (host only)
npm run test:coverage   # unit tests + V8 coverage (coverage/)
npm run test:e2e        # Playwright e2e (Chromium)
npm run verify          # check + unit + e2e (read-only)
```

By default those suite scripts run on the host. Set `RUN_TESTS_IN_CONTAINER=1` (exact `1` only; unset/`0` = host) so `test` / `test:unit` / `test:coverage` / `test:e2e` / `verify` run in an ephemeral [`ubuntu-b`](https://github.com/mengtaoxin/dockers/tree/main/ubuntu-b) container (`scripts/run-in-test-env.sh`, pin `docker/UBUNTU_B_VERSION`). Prefer a sibling `../dockers/ubuntu-b` build when present; otherwise pull the pinned GHCR tag. Nested suite calls inside the container do not spawn another container. Leave the var unset on Cursor Cloud. Edit / format / lint / `check` stay on the host for day-to-day work.

Running a single file or test, fixtures, and which layer to use: [testing.md](./testing.md).

## Lint, format, and type-check

```sh
npm run lint          # oxlint
npm run lint:fix      # oxlint with autofix
npm run format        # oxfmt, rewrite files
npm run format:check  # oxfmt, check only
npm run type-check    # tsc -b (read-only)
npm run check         # format:check + lint + type-check (read-only)
```

Rules come from `@mengtaoxin/oxc-config` via `oxlint.config.ts` and `oxfmt.config.ts`.

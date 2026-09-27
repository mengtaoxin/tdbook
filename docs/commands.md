# Commands

Run everything from the repo root with the `npm run` scripts in `package.json`. Do not add `scripts/*.sh` wrappers.

## Setup

```sh
export NODE_AUTH_TOKEN=<GitHub PAT with read:packages>   # needed for @mengtaoxin/* packages
npm install
npx playwright install chromium                          # only if you run e2e tests
```

`.npmrc` routes `@mengtaoxin/*` (the `tdkit` dependency and `@mengtaoxin/oxc-config`) to GitHub Packages; without the token, `npm install` fails on those packages.

## Develop

```sh
npm run dev       # Vite dev server on http://localhost:3000 (Ctrl+C to stop)
```

The dev server serves `public/` (including the default catalog `/sample/configs.json`) and `/pdfjs/**` from `pdfjs-dist`. The service worker is disabled in dev, so test PWA behavior with `build` + `preview`. If port 3000 is taken (`EADDRINUSE`), stop the other process first; Playwright also expects port 3000.

## Build and preview

```sh
npm run build     # tsc -b typecheck + vite build → dist/ (public/ and pdfjs assets copied)
npm run preview   # serve dist/ locally (Vite default port 4173), with the service worker
```

## Test

```sh
npm run test            # Vitest unit tests
npm run test:watch      # Vitest in watch mode
npm run test:coverage   # unit tests + V8 coverage (coverage/)
npm run test:e2e        # Playwright e2e (Chromium)
```

Running a single file or test, fixtures, and which layer to use: [testing.md](./testing.md).

## Lint and format

```sh
npm run lint        # oxlint
npm run lint:fix    # oxlint with autofix
npm run fmt         # oxfmt, rewrite files
npm run fmt:check   # oxfmt, check only
```

Rules come from `@mengtaoxin/oxc-config` via `oxlint.config.ts` and `oxfmt.config.ts`.

## Before committing

```sh
npm run test
npm run lint
npm run fmt:check
npm run build
```

Add `npm run test:e2e` when the change touches the reader, cache, format adapters, or navigation.

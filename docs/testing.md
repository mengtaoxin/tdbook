# Testing

Two layers, both run from the repo root:

| Layer | Tool                  | Location                               | Covers                                             |
| ----- | --------------------- | -------------------------------------- | -------------------------------------------------- |
| Unit  | Vitest (happy-dom)    | `src/**/*.test.ts`, next to the module | `src/lib/` logic: catalog, cache, EPUB/PDF parsing |
| E2E   | Playwright (Chromium) | `e2e/*.spec.ts`                        | User-visible flows: navigation, open book, paging  |

Command reference: [commands.md](./commands.md).

## Unit tests (Vitest)

```sh
npm run test                               # all unit tests, once
npm run test -- src/lib/paths.test.ts      # one file
npm run test -- -t "rejects relative"      # tests whose name matches
npm run test:watch                         # re-run on change
npm run test:coverage                      # + V8 coverage (terminal summary, coverage/index.html)
```

- Config: `vitest.config.ts`. Only `src/**/*.test.ts` is collected, so `e2e/*.spec.ts` never runs under Vitest.
- Environment: happy-dom, with CSS/JS file loading disabled so `DOMParser` does not fetch stylesheets.
- Shared setup: `src/test/setup.ts` loads `fake-indexeddb/auto` and swaps in Node's `Blob` / `File` so Dexie can store blobs. Put new global setup there, not in individual tests.
- Coverage is measured for `src/lib/**` only; routes and components are covered by e2e.
- Name new tests `<module>.test.ts` beside the module and follow the style of neighboring tests.

## E2E tests (Playwright)

```sh
npx playwright install chromium            # once per machine
npm run test:e2e                           # all specs
npm run test:e2e -- e2e/reader.spec.ts     # one spec file
npm run test:e2e -- -g "opens an EPUB"     # tests whose title matches
npm run test:e2e -- --headed               # watch the browser
npm run test:e2e -- --ui                   # Playwright UI mode
```

- Config: `playwright.config.ts`. Playwright starts `npm run dev` on `127.0.0.1:3000`. Locally it reuses a server already on port 3000; in CI (`CI` set) it always starts its own, retries once, and records a trace on the retry.
- Specs run serially (`workers: 1`) because they share one origin's `localStorage` and IndexedDB.
- E2E uses the default catalog, `public/sample/configs.json` (served at `/sample/configs.json`); there is no separate test catalog. Reader specs rely on `Sample EPUB` (2 pages, `#bookmark-target` on page 1) and `Sample PDF` (1 page), so keep those entries and files intact. Add new sample books to the same catalog.
- Reader specs reset state in `beforeEach` (clear `localStorage`, delete the `tdbook-cache` IndexedDB). Do the same in new specs that touch books or cache.
- Prefer `getByRole` / `getByText`, and `getByTestId` for elements without an accessible name.
- Failure output lands in `test-results/` (gitignored).

## Choosing a layer

- Pure functions, normalization, cache contracts, format parsing → unit test in `src/lib/`.
- Opening a book, paging, clearing cache, navigation, i18n toggles → e2e smoke on top of unit coverage.
- Do not repeat in e2e what a unit test already pins down, unless you need an integration smoke.

## What to run before finishing

- Any code change: `npm run test`.
- Reader, cache, format adapters, routes, or navigation: also `npm run test:e2e`.
- TypeScript / React changes: also `npm run lint`, `npm run fmt:check`, and `npm run build` (see [commands.md](./commands.md)).

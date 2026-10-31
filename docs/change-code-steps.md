# Change code steps

Ordered workflow for every code change. Domain details stay in the linked docs — do not copy them here.

| Need                   | Doc                                    |
| ---------------------- | -------------------------------------- |
| Commands               | [commands.md](commands.md)             |
| Test layers and naming | [testing.md](testing.md)               |
| Where files go         | [file-structure.md](file-structure.md) |
| Style, i18n, books     | [conventions.md](conventions.md)       |
| Cache, reader, catalog | [data-model.md](data-model.md)         |

## 1. Inspect structure

Before writing or moving files, match [file-structure.md](file-structure.md): keep book I/O and parsing in `src/lib/`; colocate unit specs as `<module>.test.ts` next to the module; use `@/` imports.

## 2. TDD (behavior changes)

Follow the `test-driven-development` skill:

1. State the observable behavior in one sentence.
2. **Red** — add or extend a test at the lowest layer that locks it ([testing.md](testing.md)). Run it; it must fail for the missing behavior.
3. **Green** — change production code only enough to pass.
4. **Refactor** — clean up with tests still green.

No new test required for docs, comments, formatting, or mechanical moves (still run the full unit suite for moves).

## 3. Cross-cutting while implementing

- **i18n:** add user-facing strings in both `src/i18n/locales/en.ts` and `zh.ts`.
- **Docs:** update the matching `docs/` file when a documented contract or workflow changes.

## 4. Tests

Run the focused spec during Red/Green (`npm run test -- path/to/file.test.ts` or `npm run test:watch`). Before finishing a behavior change, run the full unit suite (`npm run test`). Add or run e2e only for user-visible integration smoke — see [testing.md](testing.md).

## 5. Format and verify

Run `npm run format` (and `npm run lint:fix` when lint autofix is needed) when the tree needs it, then `npm run verify` once at the end. Commands: [commands.md](commands.md).

## Done when

- Structure matches [file-structure.md](file-structure.md).
- Behavior changes went through Red → Green.
- `npm run verify` passes; e2e when that layer is required.
- i18n and docs are updated when they apply.

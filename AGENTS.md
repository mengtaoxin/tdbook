# tdbook

Personal ebook browser SPA: list remote EPUB/PDF titles from `configs.json`, download once into IndexedDB, then read offline in the browser. Static deploy only — no backend.

## Stack

See [docs/tech-stacks.md](docs/tech-stacks.md).

## Commands

Run from the repo root (this app is not under `web/`). Use `package.json` scripts for day-to-day work. Do not add `scripts/*.sh` wrappers.

See [docs/commands.md](docs/commands.md) for all commands and [docs/testing.md](docs/testing.md) for how to run and write tests.

## Layout

See [docs/file-structure.md](docs/file-structure.md).

Install notes: `tdkit` comes from GitHub Packages. Set `NODE_AUTH_TOKEN` (PAT with `read:packages`) so `.npmrc` can fetch `@mengtaoxin/tdkit`.

## Data model

- Catalog entry: `{ id, title, author?, type?: "epub"|"pdf", path, hover? }` where `id` is a non-empty string (no `/`, `\`, `..`), `author` may be omitted or `""`, and `path` / optional `hover` are each either `http(s)://…` or a site-absolute path `/…` (e.g. under `public/`). Relative paths, `//…`, and local filesystem paths are rejected. When `hover` is set it overrides EPUB/PDF-extracted covers on the book list.
- Route identity = catalog `id` (param `$id` on `/book/$id`). Display title is separate and may repeat. Runtime records and cache meta use the same `id` field (not `slug` / `bookName`).
- Duplicate `id`s: keep the first entry; later duplicates are ignored. The book list shows an error alert for each duplicated id.
- Cache key = catalog `path` (`sourceUrl`). EPUB files stored by package-relative path; PDF as `__pdf__` plus optional `__cover__` snapshot. Cache meta may include `pageCount` and `coverPath` written at ingest (legacy rows without those fields are backfilled on list).
- Offline: a successful `configs.json` download is kept in `localStorage` (and skipped on fetch when `navigator.onLine === false`); already-ingested books open from IndexedDB without re-downloading.
- `BookRecord`: EPUB keeps spine `pages`; PDF uses `pageCount` + `pdfUrl` (no fake spine). Cross-format page payload is `PageContent`; use `bookPageCount()` for total pages. Format adapters are typed per book/page; `getBookPage()` is the dispatcher.
- Reader: `useBookSession` loads the book; `useBookReader` loads the page. Page is `?page=1`-based search on `/book/$id` (TanStack validated search).
- App logs: durable English diagnostics via `tdkit` (`TdLog`). Open-book and page-load failures call `reportFailure` + `TdLog.error`. Logs UI is `/logs` (list + clear with confirm).

## Conventions

See [docs/conventions.md](docs/conventions.md).

## Skills

See [.cursor/rules/skills-intro.mdc](.cursor/rules/skills-intro.mdc).

# Data model

- Catalog entry: `{ id, title, author?, type?: "epub"|"pdf", path, hover? }` where `id` is a non-empty string (no `/`, `\`, `..`), `author` may be omitted or `""`, and `path` / optional `hover` are each either `http(s)://…` or a site-absolute path `/…` (e.g. under `public/`). Relative paths, `//…`, and local filesystem paths are rejected. When `hover` is set it overrides EPUB/PDF-extracted covers on the book list.
- Route identity = catalog `id` (param `$id` on `/book/$id`). Display title is separate and may repeat. Runtime records and cache meta use the same `id` field (not `slug` / `bookName`).
- Duplicate `id`s: keep the first entry; later duplicates are ignored. The book list shows an error alert for each duplicated id.
- Cache key = catalog `path` (`sourceUrl`). EPUB files stored by package-relative path; PDF as `__pdf__` plus optional `__cover__` snapshot. Cache meta may include `pageCount` and `coverPath` written at ingest (legacy rows without those fields are backfilled on list).
- Offline: a successful `configs.json` download is kept in `localStorage` (and skipped on fetch when `navigator.onLine === false`); already-ingested books open from IndexedDB without re-downloading.
- `BookRecord`: EPUB keeps spine `pages`; PDF uses `pageCount` + `pdfUrl` (no fake spine). Cross-format page payload is `PageContent`; use `bookPageCount()` for total pages. Format adapters are typed per book/page; `getBookPage()` is the dispatcher.
- Reader: `useBookSession` loads the book; `useBookReader` loads the page. Page is `?page=1`-based search on `/book/$id` (TanStack validated search).
- App logs: durable English diagnostics via `tdkit` (`TdLog`). Open-book and page-load failures call `reportFailure` + `TdLog.error`. Logs UI is `/logs` (list + clear with confirm).

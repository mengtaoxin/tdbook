# tdbook

Personal ebook browser SPA: list remote EPUB/PDF titles from `configs.json`, download once into IndexedDB, then read offline in the browser. Static deploy only — no backend.

## Stack

- React 19, Vite 8, TypeScript, TanStack Router, MUI 7, Zustand, react-i18next (en/zh), `@mui/icons-material`.
- EPUB: `jszip` + `fast-xml-parser` (OPF / spine). PDF: `pdfjs-dist` (worker + text layer).
- Config Guide: `marked` renders `public/how-to-write-config-file.md` / `.zh.md`.
- Prefer MUI components; `sx` / theme tokens for local tweaks. No Vue, Vuetify, Pinia, or Tailwind.

## Commands

Run from the repo root (this app is not under `web/`). Use `package.json` scripts for day-to-day work. Do not add `scripts/*.sh` wrappers.

```sh
npm install
npm run dev       # Vite on port 3000; serves /configs.json and /pdfjs/** via vite.config.ts plugin
npm run build     # tsc -b && vite build (copies configs.json + pdfjs assets into dist/)
npm run preview   # preview production build
npm run test      # Vitest unit tests (happy-dom + fake-indexeddb)
npm run testdata  # generate public/testdata sample.epub / sample.pdf / configs.json
npm run test:e2e  # npm run testdata + Playwright (Chromium)
```

Stop the dev server with Ctrl+C.

## Layout

```
configs.json          book catalog (id, title, author?, type, path, hover?) — source of truth
public/how-to-write-config-file.md(.zh.md)  Config Guide content (fetched + marked)
vite.config.ts        React + repoStaticPlugin (/configs.json, /pdfjs/**)
src/
  main.tsx            app bootstrap (router + MUI theme + i18n)
  theme.ts            MUI theme (primary #3D5A80)
  router/             TanStack code route tree
  routes/             page components (Home, Books, Reader, Settings, …)
  components/         AppShell, ReaderPager, FormatReaderPane, formatPanes, Epub/Pdf panes
  stores/             Zustand (locale, settings, books list)
  hooks/              useBookSession (open book) + useBookReader (page view)
  lib/
    catalog.ts        configs.json fetch + normalize (BookConfig); in-memory URL cache
    configGuideMarkdown.ts  locale → guide .md URL + marked render
    navLayout.ts      shouldCollapseNav for compact header
    bookTypes.ts      BookRecord / BookListItem / BookType / bookPageCount
    bookService.ts    listBooks / getBook orchestration
    formats.ts        typed FormatAdapter registry + getBookPage + cache-clear notify
    formatAdapter.ts  adapter + PageContent + FormatSnapshot (ingest / snapshot / open / getPage)
    epubFormat.ts     EPUB adapter
    epubPackage.ts    OPF / spine / cover-href parse
    epubIngest.ts     EPUB zip → cached files
    pdfFormat.ts      PDF adapter (ingest + cover snapshot + pdf.js unload on cache clear)
    bookCache.ts      public clear API (notifies format adapters)
    cacheStore.ts     IndexedDB connection reuse + blob URL lifecycle
    cacheIngest.ts    download-once + format ingest + snapshot meta
    paths.ts          path safety, EPUB path normalize
    rewriteHtml.ts    EPUB page HTML rewrite (assets → blob URLs)
    epubShadow.ts     EPUB shadow-DOM mounting helpers
    pdfReader.ts      pdf.js document load + page/cover render
    settings.ts       configs URL preference (localStorage)
    locale.ts         UI locale preference (en/zh, default en)
  i18n/               i18next setup + en/zh message catalogs
  tests/unit/         Vitest
  e2e/                Playwright
  scripts/generate-testdata.mjs  Node helper for `npm run testdata` (not a shell wrapper)
  public/testdata/    demo + e2e fixtures (Alice EPUB, covers, generated sample.epub / sample.pdf / configs.json)
```

## Data model

- Catalog entry: `{ id, title, author?, type?: "epub"|"pdf", path, hover? }` where `id` is a non-empty string (no `/`, `\`, `..`), `author` may be omitted or `""`, and `path` / optional `hover` are each either `http(s)://…` or a site-absolute path `/…` (e.g. under `public/`). Relative paths, `//…`, and local filesystem paths are rejected. When `hover` is set it overrides EPUB/PDF-extracted covers on the book list.
- Route identity = catalog `id` (param `$id` on `/book/$id`). Display title is separate and may repeat. Runtime records and cache meta use the same `id` field (not `slug` / `bookName`).
- Duplicate `id`s: keep the first entry; later duplicates are ignored. The book list shows an error alert for each duplicated id.
- Cache key = catalog `path` (`sourceUrl`). EPUB files stored by package-relative path; PDF as `__pdf__` plus optional `__cover__` snapshot. Cache meta may include `pageCount` and `coverPath` written at ingest (legacy rows without those fields are backfilled on list).
- `BookRecord`: EPUB keeps spine `pages`; PDF uses `pageCount` + `pdfUrl` (no fake spine). Cross-format page payload is `PageContent`; use `bookPageCount()` for total pages. Format adapters are typed per book/page; `getBookPage()` is the dispatcher.
- Reader: `useBookSession` loads the book; `useBookReader` loads the page. Page is `?page=1`-based search on `/book/$id` (TanStack validated search).

## Conventions

- React function components in `.tsx`; hooks for effects and reader orchestration. Import via `@/`. 2-space indent.
- Keep book I/O and parsing in `src/lib/`; routes/components stay UI + routing. Zustand only for shared preferences and books-list cache; reader page stays in the URL.
- When adding a book, append to `configs.json` with a distinct `id` when possible — do not hardcode titles in the app. Later duplicate ids are ignored at runtime.
- UI copy goes through react-i18next (`src/i18n/locales/{en,zh}.ts`); default locale is English. Add both `en` and `zh` keys for new user-facing strings. Config Guide body lives in `public/how-to-write-config-file*.md`.
- Do not commit `dist/`, `node_modules/`, or secrets.

## Verify

- After TypeScript or React changes: `npm run build` and `npm run test`.
- After reader/cache changes: also `npm run test:e2e` (needs Playwright browsers: `npx playwright install chromium`).
- After catalog edits: open `/books` in `npm run dev` and confirm the new title appears and opens.
- After cache/reader changes: exercise both EPUB and PDF open, page turn, and Settings “Clear all cache”.

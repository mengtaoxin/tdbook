# tdbook

Personal ebook browser SPA: list remote EPUB/PDF titles from `configs.json`, download once into IndexedDB, then read offline in the browser. Static deploy only — no backend.

## Stack

- Vue 3.5, Vite 8, TypeScript, Vue Router 5, Vuetify 4 (`vite-plugin-vuetify` auto-import), vue-i18n (en/zh), MDI icons.
- EPUB: `jszip` + `fast-xml-parser` (OPF / spine). PDF: `pdfjs-dist` (worker + text layer).
- Prefer Vuetify components; scoped CSS for local tweaks. No Nuxt, React, Pinia, or Tailwind.

## Commands

Run from the repo root (this app is not under `web/`):

```sh
npm install
npm run dev       # Vite; serves /configs.json and /pdfjs/** via vite.config.ts plugin
npm run build     # vue-tsc -b && vite build (copies configs.json + pdfjs assets into dist/)
npm run preview   # preview production build
npm run test      # Vitest unit tests (happy-dom + fake-indexeddb)
npm run test:e2e  # generate public/testdata fixtures + Playwright (Chromium)
```

## Layout

```
configs.json          book catalog (id, title, author?, type, path, hover?) — source of truth
vite.config.ts        Vue + Vuetify + repoStaticPlugin (/configs.json, /pdfjs/**)
src/
  main.ts             app bootstrap (router + vuetify)
  router/             /books list, /book/:id reader
  views/              HomeView, BooksView, BookReaderView, SettingsView, AboutView
  plugins/vuetify.ts
  components/         ReaderPager, EpubReaderPane, PdfReaderPane
  lib/
    catalog.ts        configs.json fetch + normalize (BookConfig)
    bookTypes.ts      BookRecord / BookListItem / BookType / bookPageCount
    bookService.ts    listBooks / getBook orchestration
    formats.ts        FormatAdapter registry (epub / pdf)
    formatAdapter.ts  adapter + PageContent types
    epubFormat.ts     EPUB ensure / open / cover / getPage
    pdfFormat.ts      PDF ensure / open / cover / getPage
    bookCache.ts      public cache API (clear hooks pdf.js unload)
    cacheStore.ts     IndexedDB + blob URL lifecycle
    cacheIngest.ts    download + EPUB extract / PDF put
    paths.ts          path safety, EPUB path normalize
    rewriteHtml.ts    EPUB page HTML rewrite (assets → blob URLs)
    epubShadow.ts     EPUB shadow-DOM mounting helpers
    pdfReader.ts      pdf.js document load + page/cover render
    settings.ts       configs URL preference (localStorage)
    locale.ts         UI locale preference (en/zh, default en)
  i18n/               vue-i18n setup + en/zh message catalogs
  tests/unit/         Vitest
  e2e/                Playwright
  public/testdata/    generated sample.epub / sample.pdf / configs.json
```

## Data model

- Catalog entry: `{ id, title, author?, type?: "epub"|"pdf", path, hover? }` where `id` is a non-empty string (no `/`, `\`, `..`), `author` may be omitted or `""`, and `path` / optional `hover` are each either `http(s)://…` or a site-absolute path `/…` (e.g. under `public/`). Relative paths, `//…`, and local filesystem paths are rejected. When `hover` is set it overrides EPUB/PDF-extracted covers on the book list.
- Route identity = catalog `id` (param `:id` on `/book/:id`). Display title is separate and may repeat. Runtime records and cache meta use the same `id` field (not `slug` / `bookName`).
- Duplicate `id`s: keep the first entry; later duplicates are ignored. The book list shows an error alert for each duplicated id.
- Cache key = catalog `path` (`sourceUrl`). EPUB files stored by package-relative path; PDF as a single `__pdf__` blob.
- `BookRecord`: EPUB keeps spine `pages`; PDF uses `pageCount` + `pdfUrl` (no fake spine). Cross-format page payload is `PageContent`; use `bookPageCount()` for total pages.
- Reader page is `?page=1`-based query on `/book/:id`.

## Conventions

- Vue SFCs: `<script setup lang="ts">`, then template, then scoped style. Import via `@/`. 2-space indent.
- Keep book I/O and parsing in `src/lib/`; views stay UI + routing. Extend existing modules before adding new top-level folders.
- When adding a book, append to `configs.json` with a distinct `id` when possible — do not hardcode titles in the app. Later duplicate ids are ignored at runtime.
- UI copy goes through vue-i18n (`src/i18n/locales/{en,zh}.ts`); default locale is English. Add both `en` and `zh` keys for new user-facing strings.
- Do not commit `dist/`, `node_modules/`, or secrets.

## Verify

- After TypeScript or Vue changes: `npm run build` and `npm run test`.
- After reader/cache changes: also `npm run test:e2e` (needs Playwright browsers: `npx playwright install chromium`).
- After catalog edits: open `/books` in `npm run dev` and confirm the new title appears and opens.
- After cache/reader changes: exercise both EPUB and PDF open, page turn, and Settings “Clear all cache”.

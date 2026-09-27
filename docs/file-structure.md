# File structure

```
docs/file-structure.md     this file
docs/conventions.md        coding conventions
docs/commands.md           npm scripts and setup
docs/testing.md            unit (Vitest) + e2e (Playwright) testing
docs/tech-stacks.md        libraries, build/PWA, tooling, deploy
public/sample/        bundled sample books: configs.json (default catalog at /sample/configs.json, also used by e2e), Alice EPUB, sample.epub / sample.pdf, covers
public/how-to-write-config-file.md(.zh.md)  Config Guide content (fetched + marked)
public/icons/         PWA icons (192 / 512 / maskable)
vite.config.ts        React + pdfjsAssetsPlugin (/pdfjs/**) + VitePWA
src/
  main.tsx            app bootstrap (router + MUI theme + i18n + SW register)
  theme.ts            MUI theme (primary #3D5A80)
  router/             TanStack code route tree
  routes/             page components (Home, Books, Reader, Settings, Logs, …)
  components/         AppShell, ReaderPager, FormatReaderPane, formatPanes, Epub/Pdf panes
  stores/             Zustand (locale, settings, books list)
  hooks/              useBookSession (open book) + useBookReader (page view) + useReaderSwipe (touch paging)
  lib/
    catalog.ts        configs.json fetch + normalize (BookConfig); in-memory URL cache + localStorage durable cache (offline short-circuit)
    configGuideMarkdown.ts  locale → guide .md URL + marked render
    navLayout.ts      shouldCollapseNav + toolbarNavAvailableWidth for compact header
    bookTypes.ts      BookRecord / BookListItem / BookType / bookPageCount
    bookService.ts    listBooks / getBook orchestration
    formats.ts        typed FormatAdapter registry + getBookPage + cache-clear notify
    formatAdapter.ts  adapter + PageContent + FormatSnapshot (ingest / snapshot / open / getPage)
    epubFormat.ts     EPUB adapter
    epubPackage.ts    OPF / spine / cover-href parse
    epubIngest.ts     EPUB zip → cached files
    pdfFormat.ts      PDF adapter (ingest + cover snapshot + pdf.js unload on cache clear)
    bookCache.ts      cache lifecycle: ensureBookCached (one shared download per source, progress fan-out) + clear (aborts in-flight downloads, notifies format adapters)
    cacheStore.ts     Dexie DB (meta + files tables) + blob URL lifecycle
    cacheIngest.ts    abortable pipeline: fetch → format ingest → snapshot → ready meta
    paths.ts          path safety, EPUB path normalize
    rewriteHtml.ts    EPUB page HTML rewrite (assets → blob URLs)
    epubShadow.ts     EPUB shadow-DOM mounting helpers
    epubAnchor.ts     content-stable EPUB in-page anchors (#char:N) for bookmarks
    readerSwipe.ts    touch swipe → prev/next page decision (threshold + axis)
    pdfReader.ts      pdf.js document load + page/cover render
    settings.ts       configs URL preference (localStorage)
    bookmarks.ts      all-books bookmark JSON in localStorage (default bookmark per book)
    locale.ts         UI locale preference (en/zh, default en)
    reportFailure.ts  console.error for failures (TdLog is separate)
    pwaManifest.ts    web app manifest fields for vite-plugin-pwa
  i18n/               i18next setup + en/zh message catalogs
  test/setup.ts       Vitest setup (fake-indexeddb / Blob polyfill)
  **/*.test.ts        unit tests colocated next to the module under test
e2e/                  Playwright
```

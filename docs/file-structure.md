# File structure

```
docs/change-code-steps.md  how to change code (TDD, structure, tests, format, check)
docs/file-structure.md     this file
docs/conventions.md        coding conventions
configs.json          book catalog (id, title, author?, type, path, hover?) — source of truth
public/how-to-write-config-file.md(.zh.md)  Config Guide content (fetched + marked)
public/icons/         PWA icons (192 / 512 / maskable)
vite.config.ts        React + repoStaticPlugin (/configs.json, /pdfjs/**) + VitePWA
src/
  main.tsx            app bootstrap (router + MUI theme + i18n + SW register)
  theme.ts            MUI theme (primary #3D5A80)
  router/             TanStack code route tree
  routes/             page components (Home, Books, Reader, Settings, Logs, …)
  components/         AppShell, ReaderPager, FormatReaderPane, formatPanes, Epub/Pdf panes
  stores/             Zustand (locale, settings, books list)
  hooks/              useBookSession (open book) + useBookReader (page view) + useReaderSwipe (touch paging)
  lib/
    catalog.ts        configs.json fetch + normalize (BookConfig); in-memory URL cache + localStorage durable cache
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
    readerSwipe.ts    touch swipe → prev/next page decision (threshold + axis)
    pdfReader.ts      pdf.js document load + page/cover render
    settings.ts       configs URL preference (localStorage)
    locale.ts         UI locale preference (en/zh, default en)
    reportFailure.ts  console.error for failures (TdLog is separate)
    pwaManifest.ts    web app manifest fields for vite-plugin-pwa
  i18n/               i18next setup + en/zh message catalogs
  tests/unit/         Vitest
  e2e/                Playwright
  scripts/generate-testdata.mjs  Node helper for `npm run testdata` (not a shell wrapper)
  public/testdata/    demo + e2e fixtures (Alice EPUB, covers, generated sample.epub / sample.pdf / configs.json)
```

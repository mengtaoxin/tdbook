export default {
  nav: {
    home: 'Home',
    books: 'Books',
    settings: 'Settings',
    configGuide: 'Config Guide',
    about: 'About',
    language: 'Language',
    openMenu: 'Open menu',
  },
  locale: {
    label: 'Language',
    en: 'English',
    zh: '中文',
  },
  home: {
    tagline:
      'A personal ebook reader: browse your catalog, open EPUB or PDF in the browser, download on first open, and keep reading offline.',
    catalogHint:
      'The book list comes from a config file. Change the config URL in Settings if you want a different catalog.',
    browseBooks: 'Browse books',
    features: {
      formats: {
        title: 'Multiple formats',
        description:
          'Open common ebooks and PDFs and read them in the browser.',
      },
      local: {
        title: 'Saved locally',
        description:
          'The first open downloads the book to this device so you do not reload it every time.',
      },
      offline: {
        title: 'Offline reading',
        description:
          'After a book is downloaded, you can keep turning pages without a network.',
      },
    },
  },
  books: {
    title: 'Books',
    count: '{n} books',
    loadFailed: 'Failed to load the book list.',
    duplicateId: 'Config error: duplicate book id. id={id}',
    empty: 'No books yet.',
    cached: 'Cached',
    notDownloaded: 'Not downloaded',
  },
  reader: {
    downloading: 'Downloading book…',
    downloadingPct: 'Downloading book… {pct}%',
    extracting: 'Extracting EPUB…',
    extractingProgress: 'Extracting EPUB… {loaded}/{total}',
    notFound: 'Book not found.',
    invalidPage: 'Invalid page number.',
    pageLoadFailed: 'Could not load this page.',
    loadFailed: 'Failed to load.',
    rendering: 'Rendering page…',
    prevPage: 'Previous page',
    nextPage: 'Next page',
    pageOf: 'Page {page} / {total}',
  },
  settings: {
    title: 'Settings',
    configsUrlLabel: 'Book config URL',
    configsUrlHint:
      'Leave empty to use the default /configs.json; or enter https://…/configs.json',
    viewConfigGuide: 'View config guide',
    save: 'Save',
    restoreDefault: 'Restore default',
    saved: 'Book config URL saved.',
    usingDefault: 'Using default URL ({url}).',
    restoredDefault: 'Restored default URL ({url}).',
    saveFailed: 'Save failed.',
    restoreFailed: 'Restore failed.',
    cacheTitle: 'Cache',
    cacheDescription:
      'Clear all downloaded book files on this device. Opening any book again will require a fresh download.',
    clearCache: 'Clear all cache',
    clearCacheConfirmTitle: 'Clear all cache?',
    clearCacheConfirmBody:
      'This deletes every local book cache on this device. Opening a book again will require a fresh download.',
    cancel: 'Cancel',
    clear: 'Clear',
    cacheCleared:
      'All book caches cleared. Opening a book again will require a download.',
    clearCacheFailed: 'Failed to clear cache.',
  },
  about: {
    title: 'About',
    body: 'tdbook is a personal ebook browser: it reads a catalog from a config file, opens EPUB / PDF in the browser, downloads on first read, and works offline afterward. Static deploy only — no backend.',
    projectUrl: 'Project URL',
  },
  configGuide: {
    title: 'Config Guide',
    introBefore:
      'tdbook loads its catalog from a JSON config file (default',
    introAfter:
      '). Host the file somewhere reachable, then set that URL in Settings to use your own book list.',
    stepsTitle: 'Steps',
    step1Before: 'Write a',
    step1After:
      ' in the format below, and host EPUB / PDF files on a static site, object storage, or any publicly reachable URL.',
    step2Before: 'Open',
    step2Middle: ', change the “Book config URL” to your',
    step2After: ' address (for example',
    step2End: '), then save.',
    step3Before: 'Go back to',
    step3After:
      ' and refresh. The first time you open a book it downloads into IndexedDB; afterward you can read offline.',
    settingsLink: 'Settings',
    booksLink: 'Books',
    structureTitle: 'File structure',
    structureIntroBefore: 'The root object contains a',
    structureIntroAfter: ' array; each item describes one book:',
    colField: 'Field',
    colRequired: 'Required',
    colDescription: 'Description',
    yes: 'Yes',
    no: 'No',
    exampleTitle: 'Example',
    notesTitle: 'Notes',
    noteInvalid:
      'Invalid entries (missing id, illegal path, unknown type, etc.) are silently ignored and do not appear in the list.',
    noteDuplicateBefore: 'If a duplicate',
    noteDuplicateAfter:
      ' appears, the book list shows a warning and only the first occurrence is kept.',
    noteCors:
      'When the config or book files are hosted cross-origin, the server must allow browser CORS reads.',
    noteCacheBefore:
      'Changing the config URL or catalog does not auto-delete old cached books; use',
    noteCacheAfter: 'in Settings.',
    clearCacheQuoted: 'Clear all cache',
    fields: {
      id: 'Unique book id and the /book/:id route param. Must be a non-empty string without /, \\, or ... Prefer lowercase letters and hyphens (e.g. my-book-title). Duplicate ids keep only the first entry.',
      title: 'Display title; may repeat across books.',
      author: 'Author. May be omitted or an empty string.',
      type: 'Format: epub or pdf. Defaults to epub when omitted.',
      path: 'Book file URL. Must be an http(s)://… remote link or a site-absolute path /… (e.g. under public/). Relative paths, //…, and local filesystem paths are rejected.',
      hover:
        'Cover image URL; same rules as path. When set, it overrides covers extracted from EPUB/PDF on the book list.',
    },
  },
  errors: {
    invalidConfigsUrl: 'Invalid config URL',
    localStorageWrite: 'Could not write to local storage',
    downloadFailed: 'Download failed (HTTP {status}).',
    epubExtractFailed:
      'Could not extract EPUB (file may be corrupt or not a valid zip).',
    cacheBookFailed: 'Failed to download or cache the book.',
    canvasCreateFailed: 'Could not create canvas.',
  },
}

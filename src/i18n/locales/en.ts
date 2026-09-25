export default {
  nav: {
    home: 'Home',
    books: 'Books',
    settings: 'Settings',
    configGuide: 'Config Guide',
    about: 'About',
    logs: 'Logs',
    help: 'Help',
    feedback: 'Feedback',
    feedbackConfirmTitle: 'Open GitHub Issues?',
    feedbackConfirmBody:
      'You will leave this app and open the tdbook issues page on GitHub to report a problem or suggestion.',
    language: 'Language',
    openMenu: 'Open menu',
    bookmarks: 'Bookmark management',
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
  bookmarks: {
    jumpDefault: 'Jump to default bookmark',
    saveDefault: 'Save current position as default bookmark',
    saved: 'Default bookmark saved.',
    saveFailed: 'Could not save the default bookmark.',
    defaultName: 'Default bookmark',
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
    catalogCacheDescription:
      'A successful download of configs.json is kept in local storage so the book list can load when the network is unavailable.',
    clearCatalogCache: 'Clear catalog cache',
    clearCatalogCacheConfirmTitle: 'Clear catalog cache?',
    clearCatalogCacheConfirmBody:
      'This deletes the locally stored configs.json. The next book-list load will download it again (or show an empty list if offline).',
    catalogCacheCleared:
      'Catalog cache cleared. The next book-list load will download configs.json again.',
    clearCatalogCacheFailed: 'Failed to clear catalog cache.',
    cacheDescription:
      'Clear all downloaded book files on this device. Opening any book again will require a fresh download.',
    clearCache: 'Clear all cache',
    clearCacheConfirmTitle: 'Clear all cache?',
    clearCacheConfirmBody:
      'This deletes every local book cache on this device. Opening a book again will require a fresh download.',
    cancel: 'Cancel',
    confirm: 'Confirm',
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
    loading: 'Loading…',
    loadError: 'Could not load the config guide.',
  },
  logs: {
    clear: 'Clear logs',
    clearConfirm: 'Clear all logs? This cannot be undone.',
    empty: 'No logs yet.',
  },
  errors: {
    invalidConfigsUrl: 'Invalid config URL',
    localStorageWrite: 'Could not write to local storage',
    invalidBookmark: 'Invalid bookmark',
    downloadFailed: 'Download failed (HTTP {status}).',
    epubExtractFailed:
      'Could not extract EPUB (file may be corrupt or not a valid zip).',
    cacheBookFailed: 'Failed to download or cache the book.',
    canvasCreateFailed: 'Could not create canvas.',
  },
}

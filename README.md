# tdbook

[English](./README.md) | [中文](./docs/README.zh-CN.md)

A personal ebook browser SPA: list remote EPUB/PDF titles from `configs.json`, download once into IndexedDB, then read offline in the browser. Static deploy only — no backend.

## Features

- Book list and in-browser reader (EPUB / PDF)
- Cache whole books by remote URL; clear cache to re-download
- Catalog is driven solely by `configs.json` — add books by editing the config
- Installable PWA (production build): app shell + static assets work offline; book bytes stay in IndexedDB

## Stack

- React 19 + Vite + TypeScript + TanStack Router + MUI 9 + Zustand + react-i18next
- PWA: `vite-plugin-pwa` (production service worker + web app manifest)
- EPUB: `jszip` + `fast-xml-parser`
- PDF: `pdfjs-dist`
- Book cache: `dexie` (IndexedDB)

Details: [docs/tech-stacks.md](./docs/tech-stacks.md).

## Quick start

```sh
npm install
npm run dev      # Dev server: http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000). Stop with Ctrl+C.

All commands: [docs/commands.md](./docs/commands.md). Testing: [docs/testing.md](./docs/testing.md).

## Adding a book

Append an entry to the `books` array in `public/sample/configs.json` (the default catalog), or point Settings at your own `configs.json`:

```json
{
  "id": "unique-book-id",
  "title": "Book title",
  "author": "Author (optional)",
  "type": "epub",
  "path": "https://example.com/book.epub"
}
```

| Field    | Description                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`     | Route identity for `/book/:id`; must not contain `/`, `\`, or `..`. On duplicates, the first entry is kept and the list shows an error |
| `title`  | Display title; may repeat                                                                                                              |
| `author` | Optional                                                                                                                               |
| `type`   | `epub` or `pdf` (optional; inferred from the file extension)                                                                           |
| `path`   | Remote `http(s)://…`, or a same-origin absolute path `/…` (e.g. a file under `public/`)                                                |
| `hover`  | Optional cover image URL with the same rules as `path`; when set, overrides covers extracted from the book                             |

## Layout (brief)

```
public/sample/   Default catalog (configs.json) + sample books
src/views/       List and reader pages
src/lib/         Catalog load, IndexedDB cache, EPUB/PDF parsing
```

See [AGENTS.md](./AGENTS.md) for conventions and the data model.

## License

[MIT](./LICENSE)

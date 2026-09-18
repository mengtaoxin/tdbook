# Guidelines for configs.json

This page explains how to write a `configs.json` catalog file for tdbook.

tdbook loads its catalog from a JSON config file (default `/configs.json`). Host the file somewhere reachable, then set that URL in Settings to use your own book list.

## Steps

1. Write a `configs.json` in the format below, and host EPUB / PDF files on a static site, object storage, or any publicly reachable URL.
2. Open Settings, change the “Book config URL” to your `configs.json` address (for example `https://example.com/configs.json`), then save.
3. Go back to Books and refresh. The first time you open a book it downloads into IndexedDB; afterward you can read offline.

## books

The root object contains a `books` array; each item describes one book.

- `id` — unique book id and the `/book/:id` route param (required). Must be a non-empty string without `/`, `\`, or `..`. Prefer lowercase letters and hyphens (e.g. `my-book-title`). Duplicate ids keep only the first entry.
- `title` — display title; may repeat across books (required)
- `author` — author; may be omitted or an empty string (optional)
- `type` — format: `epub` or `pdf`. Defaults to `epub` when omitted (optional)
- `path` — book file URL (required). Must be an `http(s)://…` remote link or a site-absolute path `/…` (e.g. under `public/`). Relative paths, `//…`, and local filesystem paths are rejected.
- `hover` — cover image URL; same rules as `path` (optional). When set, it overrides covers extracted from EPUB/PDF on the book list.

## Example

```json
{
  "books": [
    {
      "id": "alices-adventures-in-wonderland",
      "title": "Alice's Adventures in Wonderland",
      "author": "Lewis Carroll",
      "type": "epub",
      "path": "/sample.epub",
      "hover": "/sample.jpg"
    },
    {
      "id": "sample-pdf",
      "title": "Sample PDF",
      "type": "pdf",
      "path": "https://example.com/books/sample.pdf"
    }
  ]
}
```

## Notes

- Invalid entries (missing id, illegal path, unknown type, etc.) are silently ignored and do not appear in the list.
- If a duplicate `id` appears, the book list shows a warning and only the first occurrence is kept.
- When the config or book files are hosted cross-origin, the server must allow browser CORS reads.
- Changing the config URL or catalog does not auto-delete old cached books; use “Clear all cache” in Settings.

## Ask an AI to generate configs.json

Paste the prompt below into ChatGPT, Claude, or another model. Replace the book library URL with your own, then use the returned JSON as your `configs.json` (or host it and set the Book config URL in Settings).

```
Follow the requirements on the website (https://tdbook.smt.sh/config-guide) and generate configs.json for my ebook library (http://example.com/ebook-library).
```

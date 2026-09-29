# tdbook

Personal ebook browser SPA: list remote EPUB/PDF titles from `configs.json`, download once into IndexedDB, then read offline in the browser. Static deploy only — no backend.

## Rules

- Run commands from the repo root (this app is not under `web/`) via `package.json` scripts. Do not add `scripts/*.sh` wrappers.
- Route identity is the catalog `id` (`/book/$id`), not the title; cache key is the catalog `path`.
- `tdkit` comes from GitHub Packages: set `NODE_AUTH_TOKEN` (PAT with `read:packages`) so `.npmrc` can fetch `@mengtaoxin/tdkit`.
- Skills: [.cursor/rules/skills-intro.mdc](.cursor/rules/skills-intro.mdc).

## Read when

- Running scripts → [docs/commands.md](docs/commands.md)
- Running or writing tests → [docs/testing.md](docs/testing.md)
- Adding or moving files → [docs/file-structure.md](docs/file-structure.md)
- Style, i18n, adding books → [docs/conventions.md](docs/conventions.md)
- Catalog entries, IndexedDB cache, offline, reader, app logs → [docs/data-model.md](docs/data-model.md)
- Stack and versions → [docs/tech-stacks.md](docs/tech-stacks.md)

# Conventions

- React function components in `.tsx`; hooks for effects and reader orchestration. Import via `@/`. 2-space indent.
- Keep book I/O and parsing in `src/lib/`; routes/components stay UI + routing. Zustand only for shared preferences and books-list cache; reader page stays in the URL.
- When adding a book, append to `configs.json` with a distinct `id` when possible — do not hardcode titles in the app. Later duplicate ids are ignored at runtime.
- UI copy goes through react-i18next (`src/i18n/locales/{en,zh}.ts`); default locale is English. Add both `en` and `zh` keys for new user-facing strings. Config Guide body lives in `public/how-to-write-config-file*.md`.
- Do not commit `dist/`, `node_modules/`, or secrets.

# Tech stacks

Static single-page app, no backend. Versions are the ranges in `package.json`; check there before relying on a specific API.

## Runtime

| Area         | Library                                       | Version | Where / how it is used                                                                    |
| ------------ | --------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| UI framework | React + React DOM                             | 19      | Function components and hooks; `StrictMode` root in `src/main.tsx`                        |
| Routing      | TanStack Router                               | 1       | Code-based route tree in `src/router/index.tsx`; reader page is validated `?page=` search |
| UI kit       | MUI (`@mui/material`, `@mui/icons-material`)  | 9       | Prefer MUI components; `sx` / theme tokens (`src/theme.ts`) for local tweaks              |
| Styling      | Emotion (`@emotion/react`, `@emotion/styled`) | 11      | MUI's styling engine; no Tailwind or CSS frameworks                                       |
| State        | Zustand                                       | 5       | Shared preferences and books-list cache in `src/stores/`                                  |
| i18n         | i18next + react-i18next                       | 26 / 17 | en / zh catalogs in `src/i18n/locales/`; default English                                  |
| Book cache   | Dexie (IndexedDB)                             | 4       | Only in `src/lib/cacheStore.ts` (meta + files tables)                                     |
| EPUB         | JSZip + fast-xml-parser                       | 3 / 5   | Unzip in `src/lib/epubIngest.ts`; OPF / spine parse in `src/lib/epubPackage.ts`           |
| PDF          | pdfjs-dist                                    | 6       | `src/lib/pdfReader.ts`: worker, page render, text layer, cover snapshot                   |
| Markdown     | marked                                        | 18      | Renders the Config Guide (`public/how-to-write-config-file*.md`)                          |
| App logs     | tdkit (`@mengtaoxin/tdkit`, GitHub Packages)  | 0.1     | `TdLog` durable logs from reader hooks; listed / cleared on `/logs`                       |

## Build and PWA

- **Vite 8** with `@vitejs/plugin-react`. Config: `vite.config.ts` (dev port 3000, `@/` → `src/`).
- **Custom `pdfjsAssetsPlugin`** in `vite.config.ts`: serves `cmaps`, `standard_fonts`, `wasm`, `iccs` from `node_modules/pdfjs-dist` at `/pdfjs/**` in dev and preview, and copies them into `dist/` on build.
- **vite-plugin-pwa** (Workbox): web app manifest from `src/lib/pwaManifest.ts`, precaches the app shell (including the pdf.js worker and `configs.json`), `NetworkFirst` for `configs.json`, `CacheFirst` for `/pdfjs/**`. Registered from `src/main.tsx`; inactive in `npm run dev`.

## Language and tooling

- **TypeScript 7** (`tsc -b` in `npm run build`): `strict`, `moduleResolution: bundler`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, target ES2022. Configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`.
- **oxlint** + **oxfmt** with shared presets from `@mengtaoxin/oxc-config` (`oxlint.config.ts`, `oxfmt.config.ts`).
- ES modules throughout (`"type": "module"`).

## Testing

- **Vitest 5** with **happy-dom**, **fake-indexeddb**, and `@vitest/coverage-v8` for unit tests.
- **Playwright** (Chromium) for e2e.

Details: [testing.md](./testing.md). Commands: [commands.md](./commands.md).

## Deploy

- `npm run build` outputs static files to `dist/`.
- `vercel.json` rewrites every path to `/index.html` so client-side routes (e.g. `/book/<id>`) work on reload. Any static host with the same SPA fallback works.

## Not used

Vue, Vuetify, Pinia, Tailwind, a backend or server-side rendering, and raw `indexedDB` calls outside `src/lib/cacheStore.ts`.

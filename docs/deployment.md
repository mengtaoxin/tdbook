# Deployment (Vercel + GitHub Actions)

Production can be published from **GitHub Actions** via the Vercel CLI (`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`). The app is a **static Vite SPA** (PWA); there are no Vercel Functions or server runtime.

| Setting        | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Framework      | Vite (project preset on Vercel)                                                         |
| Node           | 24.x                                                                                    |
| Install        | `npm ci`                                                                                |
| Build          | `npm run build` → `dist/`                                                               |
| Hosting        | Static files; [`vercel.json`](../vercel.json) SPA rewrites + `index.html` cache headers |
| Production URL | `https://tdbook.smt.sh`                                                                 |

Workflow: [`.github/workflows/vercel-production.yml`](../.github/workflows/vercel-production.yml) — triggers on `push` to `main` and `workflow_dispatch`. Concurrency group `vercel-production` with `cancel-in-progress: false` so overlapping production deploys are not aborted.

## GitHub secrets

Add these in the repository **Settings → Secrets and variables → Actions** (never commit values).

| Secret              | Purpose                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel token with deploy access for the linked team/project                           |
| `VERCEL_ORG_ID`     | Team ID (`team_gXNHj6GPQC1wd8fKdO0mWaMT` for this project)                            |
| `VERCEL_PROJECT_ID` | Project ID (`prj_1mYO876yvUeanikQU5i8StzigtF7` for **tdbook**)                        |
| `NODE_AUTH_TOKEN`   | GitHub PAT with `read:packages` for `@mengtaoxin/*` during `npm ci` in `vercel build` |

`NODE_AUTH_TOKEN` is required: [`.npmrc`](../.npmrc) pulls `tdkit` and dev tooling from GitHub Packages.

You can confirm org/project IDs after `npx vercel link` in `.vercel/project.json` (that folder is gitignored).

## Transition from Vercel Git auto-deploy

Until you **disable Git-connected production deploys** in the Vercel project settings (or disconnect the repo), **both** Vercel’s Git integration and this workflow may publish on each `main` push. That can mean two production deployments for one commit. This is expected during migration.

**This repository intentionally does not turn off Git deploys in config yet** — do that in the Vercel dashboard after Actions deploys are verified.

## After secrets are configured

1. Merge the workflow PR (or run **Actions → Vercel production → Run workflow** on `main`).
2. Confirm the run completes and `https://tdbook.smt.sh` serves the new build.
3. In Vercel, disable automatic Git deployments for production so only Actions publishes.

No workflow runs on pull requests, so production secrets are not exposed to untrusted forks.

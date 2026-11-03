import type { AppLocale } from '@/lib/locale';
import { getStoredLocale } from '@/lib/locale';

/** Hosted notice script — stable URL, rarely changes. */
export const SPA_UPDATE_NOTICE_JS = 'https://spa-update-notice.smt.sh/update-required.js';

const APP_NAME = 'tdbook';

export type SpaUpdateNoticeOptions = {
  lang?: AppLocale;
  appName?: string;
  container?: HTMLElement | string;
  onRefresh?: () => void;
};

export type SpaUpdateNoticeApi = {
  show: (options?: SpaUpdateNoticeOptions) => void;
  hide: () => void;
};

declare global {
  interface Window {
    SpaUpdateNotice?: SpaUpdateNoticeApi;
  }
}

/** True when `err` looks like a stale-chunk / dynamic-import load failure after deploy. */
export function isChunkError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|ChunkLoadError/i.test(
    msg,
  );
}

type ShowUpdateNoticeDeps = {
  lang?: AppLocale;
  appName?: string;
  container?: HTMLElement | string;
  confirmFn?: (message: string) => boolean;
  reload?: () => void;
};

async function ensureNoticeScript(): Promise<void> {
  if (window.SpaUpdateNotice) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SPA_UPDATE_NOTICE_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('spa-update-notice script failed to load'));
    document.head.appendChild(script);
  });
}

/** Load the hosted notice (if needed) and show the refresh UI. */
export async function showUpdateNotice(deps: ShowUpdateNoticeDeps = {}): Promise<void> {
  const lang = deps.lang ?? getStoredLocale();
  const appName = deps.appName ?? APP_NAME;
  const container = deps.container ?? '#root';
  const reload = deps.reload ?? (() => location.reload());
  const confirmFn = deps.confirmFn ?? ((message: string) => window.confirm(message));

  try {
    await ensureNoticeScript();
    window.SpaUpdateNotice?.show({ lang, appName, container });
  } catch {
    if (confirmFn('App updated. Refresh now?')) reload();
  }
}

type RegisterDeps = {
  showNotice?: () => void | Promise<void>;
};

/** On Vite preload / chunk failure, show the hosted refresh notice (no auto-reload). */
export function registerSpaUpdateNotice(deps: RegisterDeps = {}): void {
  const showNotice = deps.showNotice ?? (() => showUpdateNotice());

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void showNotice();
  });
}

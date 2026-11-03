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
  autoReload?: boolean;
};

export type SpaUpdateNoticeApi = {
  show: (options?: SpaUpdateNoticeOptions) => void;
  hide: () => void;
  handle: (options?: SpaUpdateNoticeOptions) => void;
  install: (options?: SpaUpdateNoticeOptions) => void;
  isChunkError: (err: unknown) => boolean;
  version?: string;
};

declare global {
  interface Window {
    SpaUpdateNotice?: SpaUpdateNoticeApi;
  }
}

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed|ChunkLoadError|CSS_CHUNK_LOAD_FAILED/i;

/** True when `err` looks like a stale-chunk / dynamic-import load failure after deploy. */
export function isChunkError(err: unknown): boolean {
  if (window.SpaUpdateNotice?.isChunkError) {
    return window.SpaUpdateNotice.isChunkError(err);
  }
  const msg = String(err instanceof Error ? err.message : err);
  return CHUNK_ERROR_RE.test(msg);
}

type NoticeCallDeps = {
  lang?: AppLocale;
  appName?: string;
  container?: HTMLElement | string;
};

function noticeOptions(deps: NoticeCallDeps): SpaUpdateNoticeOptions {
  return {
    lang: deps.lang ?? getStoredLocale(),
    appName: deps.appName ?? APP_NAME,
    container: deps.container ?? '#root',
  };
}

async function ensureNoticeScript(): Promise<void> {
  if (window.SpaUpdateNotice) return;
  await new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = SPA_UPDATE_NOTICE_JS;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

/**
 * Load the hosted notice (if needed) and run its handle() flow:
 * silent reload once, then the refresh UI. Auto-reload lives in the library.
 */
export async function handleUpdateNotice(deps: NoticeCallDeps = {}): Promise<void> {
  await ensureNoticeScript();
  window.SpaUpdateNotice?.handle(noticeOptions(deps));
}

/**
 * Eagerly load the hosted script and call install() so Vite's vite:preloadError
 * is handled inside the library.
 */
export async function registerSpaUpdateNotice(deps: NoticeCallDeps = {}): Promise<void> {
  await ensureNoticeScript();
  window.SpaUpdateNotice?.install(noticeOptions(deps));
}

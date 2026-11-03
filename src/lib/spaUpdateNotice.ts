import type { AppLocale } from '@/lib/locale';
import { getStoredLocale } from '@/lib/locale';

export const SPA_UPDATE_NOTICE_URL = 'https://spa-update-notice.smt.sh/update-required.js';
export const SPA_UPDATE_APP_NAME = 'tdbook';

export type SpaUpdateNoticeOptions = {
  lang?: AppLocale;
  appName?: string;
  container?: HTMLElement | string;
  onRefresh?: () => void;
  autoReload?: boolean;
};

type SpaUpdateNoticeApi = {
  install: (options?: SpaUpdateNoticeOptions) => unknown;
  handle: (options?: SpaUpdateNoticeOptions) => unknown;
  show: (options?: SpaUpdateNoticeOptions) => unknown;
  hide: () => unknown;
  isChunkError: (err: unknown) => boolean;
};

declare global {
  interface Window {
    SpaUpdateNotice?: SpaUpdateNoticeApi;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function resolveOptions(options: SpaUpdateNoticeOptions = {}): SpaUpdateNoticeOptions {
  return {
    appName: SPA_UPDATE_APP_NAME,
    container: '#root',
    lang: getStoredLocale(),
    ...options,
  };
}

function ensureSpaUpdateNotice(): Promise<void> {
  if (window.SpaUpdateNotice) return Promise.resolve();
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = SPA_UPDATE_NOTICE_URL;
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
}

/** Load the hosted script and register Vite preload handling. Reload / notice UI stay in the library. */
export async function installSpaUpdateNotice(options: SpaUpdateNoticeOptions = {}): Promise<void> {
  const resolved = resolveOptions(options);
  await ensureSpaUpdateNotice();
  window.SpaUpdateNotice!.install(resolved);
}

export function handleChunkLoadFailure(options: SpaUpdateNoticeOptions = {}): void {
  window.SpaUpdateNotice?.handle(resolveOptions(options));
}

export function isChunkLoadError(err: unknown): boolean {
  return window.SpaUpdateNotice?.isChunkError(err) ?? false;
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setStoredLocale } from '@/lib/locale';
import {
  SPA_UPDATE_APP_NAME,
  SPA_UPDATE_NOTICE_URL,
  handleChunkLoadFailure,
  installSpaUpdateNotice,
  isChunkLoadError,
} from '@/lib/spaUpdateNotice';

type NoticeApi = {
  install: ReturnType<typeof vi.fn>;
  handle: ReturnType<typeof vi.fn>;
  isChunkError: ReturnType<typeof vi.fn>;
};

function mockNoticeApi(overrides: Partial<NoticeApi> = {}): NoticeApi {
  return {
    install: vi.fn(),
    handle: vi.fn(),
    isChunkError: vi.fn((err: unknown) =>
      /Failed to fetch dynamically imported module|Loading chunk/i.test(String(err)),
    ),
    ...overrides,
  };
}

describe('spaUpdateNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as { SpaUpdateNotice?: unknown }).SpaUpdateNotice;
    document.head.querySelectorAll(`script[src="${SPA_UPDATE_NOTICE_URL}"]`).forEach((node) => {
      node.remove();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { SpaUpdateNotice?: unknown }).SpaUpdateNotice;
  });

  it('installs the hosted notice with app name, root container, and stored locale', async () => {
    setStoredLocale('zh');
    const api = mockNoticeApi();
    (window as { SpaUpdateNotice?: NoticeApi }).SpaUpdateNotice = api;

    await installSpaUpdateNotice();

    expect(api.install).toHaveBeenCalledWith({
      appName: SPA_UPDATE_APP_NAME,
      container: '#root',
      lang: 'zh',
    });
  });

  it('loads the hosted script once when SpaUpdateNotice is missing, then installs', async () => {
    const api = mockNoticeApi();
    const injected: { current: HTMLScriptElement | null } = { current: null };
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      injected.current = node as HTMLScriptElement;
      return node;
    });

    const installPromise = installSpaUpdateNotice({ lang: 'en' });

    expect(injected.current).not.toBeNull();
    expect(injected.current?.src).toContain(SPA_UPDATE_NOTICE_URL);
    expect(injected.current?.async).toBe(true);

    (window as { SpaUpdateNotice?: NoticeApi }).SpaUpdateNotice = api;
    injected.current?.onload?.(new Event('load'));

    await installPromise;

    expect(api.install).toHaveBeenCalledWith({
      appName: SPA_UPDATE_APP_NAME,
      container: '#root',
      lang: 'en',
    });
  });

  it('handleChunkLoadFailure delegates to SpaUpdateNotice.handle', () => {
    const api = mockNoticeApi();
    (window as { SpaUpdateNotice?: NoticeApi }).SpaUpdateNotice = api;

    handleChunkLoadFailure({ lang: 'en' });

    expect(api.handle).toHaveBeenCalledWith({
      appName: SPA_UPDATE_APP_NAME,
      container: '#root',
      lang: 'en',
    });
  });

  it('isChunkLoadError uses the library detector', () => {
    const api = mockNoticeApi({
      isChunkError: vi.fn().mockReturnValue(true),
    });
    (window as { SpaUpdateNotice?: NoticeApi }).SpaUpdateNotice = api;
    const err = new Error('boom');

    expect(isChunkLoadError(err)).toBe(true);
    expect(api.isChunkError).toHaveBeenCalledWith(err);
  });

  it('isChunkLoadError is false when the library is not loaded', () => {
    expect(isChunkLoadError(new Error('Loading chunk 5 failed.'))).toBe(false);
  });
});

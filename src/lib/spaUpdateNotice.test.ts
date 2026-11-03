import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleUpdateNotice, isChunkError, registerSpaUpdateNotice } from '@/lib/spaUpdateNotice';

function mockNoticeApi(api: {
  show?: ReturnType<typeof vi.fn>;
  hide?: ReturnType<typeof vi.fn>;
  handle?: ReturnType<typeof vi.fn>;
  install?: ReturnType<typeof vi.fn>;
  isChunkError?: ReturnType<typeof vi.fn>;
}) {
  Object.defineProperty(window, 'SpaUpdateNotice', {
    configurable: true,
    value: {
      show: api.show ?? vi.fn(),
      hide: api.hide ?? vi.fn(),
      handle: api.handle ?? vi.fn(),
      install: api.install ?? vi.fn(),
      isChunkError: api.isChunkError ?? vi.fn(),
    },
    writable: true,
  });
}

function loadScriptOnAppend(onReady: (script: HTMLScriptElement) => void) {
  return vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    const script = node as HTMLScriptElement;
    onReady(script);
    queueMicrotask(() => script.onload?.(new Event('load')));
    return node;
  });
}

describe('isChunkError', () => {
  it('detects common chunk / dynamic-import failure messages', () => {
    expect(
      isChunkError(new Error('Failed to fetch dynamically imported module: /assets/x.js')),
    ).toBe(true);
    expect(isChunkError(new Error('Loading chunk 5 failed.'))).toBe(true);
    expect(isChunkError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkError(new Error('ChunkLoadError: Loading chunk foo failed'))).toBe(true);
    expect(isChunkError(new Error('CSS_CHUNK_LOAD_FAILED'))).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isChunkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(false);
    expect(isChunkError('boom')).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });
});

describe('handleUpdateNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.replaceChildren();
    delete (window as Window & { SpaUpdateNotice?: unknown }).SpaUpdateNotice;
  });

  it('loads the hosted script once and calls SpaUpdateNotice.handle', async () => {
    const handle = vi.fn();
    Object.defineProperty(window, 'SpaUpdateNotice', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    const appendSpy = loadScriptOnAppend(() => {
      mockNoticeApi({ handle });
    });

    await handleUpdateNotice({ lang: 'zh', appName: 'tdbook' });

    expect(appendSpy).toHaveBeenCalledOnce();
    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement;
    expect(script.src).toBe('https://spa-update-notice.smt.sh/update-required.js');
    expect(handle).toHaveBeenCalledExactlyOnceWith({
      lang: 'zh',
      appName: 'tdbook',
      container: '#root',
    });
  });

  it('falls back to confirm + reload when the script fails to load', async () => {
    const reload = vi.fn();
    const confirmFn = vi.fn(() => true);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const script = node as HTMLScriptElement;
      queueMicrotask(() => script.onerror?.(new Event('error')));
      return node;
    });

    await handleUpdateNotice({
      lang: 'en',
      confirmFn,
      reload,
    });

    expect(confirmFn).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('registerSpaUpdateNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.replaceChildren();
    delete (window as Window & { SpaUpdateNotice?: unknown }).SpaUpdateNotice;
  });

  it('loads the hosted script and calls SpaUpdateNotice.install', async () => {
    const install = vi.fn();
    Object.defineProperty(window, 'SpaUpdateNotice', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    const appendSpy = loadScriptOnAppend(() => {
      mockNoticeApi({ install });
    });

    await registerSpaUpdateNotice({ lang: 'en', appName: 'tdbook' });

    expect(appendSpy).toHaveBeenCalledOnce();
    expect(install).toHaveBeenCalledExactlyOnceWith({
      lang: 'en',
      appName: 'tdbook',
      container: '#root',
    });
  });

  it('registers a confirm+reload fallback on vite:preloadError when the script fails', async () => {
    const reload = vi.fn();
    const confirmFn = vi.fn(() => true);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const script = node as HTMLScriptElement;
      queueMicrotask(() => script.onerror?.(new Event('error')));
      return node;
    });

    await registerSpaUpdateNotice({ confirmFn, reload });

    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(confirmFn).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});

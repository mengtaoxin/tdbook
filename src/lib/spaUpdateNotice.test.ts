import { afterEach, describe, expect, it, vi } from 'vitest';
import { isChunkError, registerSpaUpdateNotice, showUpdateNotice } from '@/lib/spaUpdateNotice';

describe('isChunkError', () => {
  it('detects common chunk / dynamic-import failure messages', () => {
    expect(
      isChunkError(new Error('Failed to fetch dynamically imported module: /assets/x.js')),
    ).toBe(true);
    expect(isChunkError(new Error('Loading chunk 5 failed.'))).toBe(true);
    expect(isChunkError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkError(new Error('ChunkLoadError: Loading chunk foo failed'))).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isChunkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(false);
    expect(isChunkError('boom')).toBe(false);
    expect(isChunkError(null)).toBe(false);
  });
});

describe('showUpdateNotice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.head.replaceChildren();
    delete (window as Window & { SpaUpdateNotice?: unknown }).SpaUpdateNotice;
  });

  it('loads the hosted script once and calls SpaUpdateNotice.show', async () => {
    const show = vi.fn();
    Object.defineProperty(window, 'SpaUpdateNotice', {
      configurable: true,
      value: undefined,
      writable: true,
    });

    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const script = node as HTMLScriptElement;
      Object.defineProperty(window, 'SpaUpdateNotice', {
        configurable: true,
        value: { show, hide: vi.fn() },
        writable: true,
      });
      queueMicrotask(() => script.onload?.(new Event('load')));
      return node;
    });

    await showUpdateNotice({ lang: 'zh', appName: 'tdbook' });

    expect(appendSpy).toHaveBeenCalledOnce();
    const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement;
    expect(script.src).toBe('https://spa-update-notice.smt.sh/update-required.js');
    expect(show).toHaveBeenCalledExactlyOnceWith({
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

    await showUpdateNotice({
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
  });

  it('shows the hosted notice on vite:preloadError', async () => {
    const show = vi.fn(async () => {});
    registerSpaUpdateNotice({ showNotice: show });

    const event = new Event('vite:preloadError', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(show).toHaveBeenCalledOnce());
  });
});

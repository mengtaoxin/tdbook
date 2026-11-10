import 'fake-indexeddb/auto';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { URL as NodeURL } from 'node:url';

// jsdom's Blob is not structured-cloneable into fake-indexeddb reliably.
// Keep Node's Blob for legacy IndexedDB → SQLite migration tests and tdkit logs.
globalThis.Blob = NodeBlob as unknown as typeof globalThis.Blob;
globalThis.File = NodeFile as unknown as typeof globalThis.File;

// Vitest's jsdom URL.createObjectURL converts window.Blob via jsdom internals.
// After swapping in Node's Blob above, use Node's URL helpers instead.
URL.createObjectURL = NodeURL.createObjectURL.bind(NodeURL) as typeof URL.createObjectURL;
URL.revokeObjectURL = NodeURL.revokeObjectURL.bind(NodeURL) as typeof URL.revokeObjectURL;

// jsdom omits Range#getBoundingClientRect; stub so tests can spy on it.
if (typeof Range !== 'undefined' && typeof Range.prototype.getBoundingClientRect !== 'function') {
  Range.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON() {
        return this;
      },
    };
  };
}

// jsdom omits Element#scrollBy; stub a no-op so tests can spy on scroll containers.
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollBy !== 'function') {
  Element.prototype.scrollBy = function scrollBy(): void {
    // Layout/scrolling is not implemented in jsdom.
  };
}

/**
 * jsdom's Storage instance methods live only on the prototype and reject
 * per-instance `defineProperty`, so `vi.spyOn(localStorage, 'setItem')` cannot
 * intercept. Install Map-backed storages with own methods instead.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
  };
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: createMemoryStorage(),
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: createMemoryStorage(),
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: globalThis.localStorage,
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: globalThis.sessionStorage,
  });
}

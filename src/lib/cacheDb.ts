import type { CacheMetaRow } from './cacheSqliteSql';

export type CacheDb = {
  getMeta(sourceUrl: string): Promise<CacheMetaRow | null>;
  putMeta(meta: CacheMetaRow): Promise<void>;
  getFile(sourceUrl: string, relativePath: string): Promise<Blob | null>;
  putFiles(sourceUrl: string, entries: Array<{ relativePath: string; blob: Blob }>): Promise<void>;
  deleteBook(sourceUrl: string): Promise<void>;
  clearAll(): Promise<void>;
};

/** True when a dedicated Worker + OPFS Access Handles are available. */
export function canUseOpfsCache(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function'
  );
}

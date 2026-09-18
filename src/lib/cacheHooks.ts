export type CacheClearHook = (sourceUrl: string | null) => void

const hooks = new Map<string, CacheClearHook>()

/** Register or replace a format-owned reaction to cache deletes. */
export function registerCacheClearHook(id: string, hook: CacheClearHook) {
  hooks.set(id, hook)
}

export function runCacheClearHooks(sourceUrl: string | null) {
  for (const hook of hooks.values()) {
    hook(sourceUrl)
  }
}

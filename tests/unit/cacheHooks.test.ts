import { beforeEach, describe, expect, it } from 'vitest'
import {
  registerCacheClearHook,
  runCacheClearHooks,
} from '@/lib/cacheHooks'

describe('cacheHooks', () => {
  beforeEach(() => {
    registerCacheClearHook('test', () => {})
  })

  it('replaces a hook by id and invokes it with the source url', () => {
    const seen: Array<string | null> = []
    registerCacheClearHook('test', (sourceUrl) => {
      seen.push(sourceUrl)
    })
    runCacheClearHooks('https://example.com/a.pdf')
    runCacheClearHooks(null)
    expect(seen).toEqual(['https://example.com/a.pdf', null])
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  getConfigsUrl,
  getStoredConfigsUrl,
  isValidConfigsUrl,
  setConfigsUrl,
} from '@/lib/settings'

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('validates configs URL shapes', () => {
    expect(isValidConfigsUrl('')).toBe(true)
    expect(isValidConfigsUrl('/testdata/configs.json')).toBe(true)
    expect(isValidConfigsUrl('https://example.com/c.json')).toBe(true)
    expect(isValidConfigsUrl('ftp://x')).toBe(false)
  })

  it('stores and clears the configs URL override', () => {
    expect(getConfigsUrl()).toBe('/configs.json')
    setConfigsUrl('/testdata/configs.json')
    expect(getStoredConfigsUrl()).toBe('/testdata/configs.json')
    expect(getConfigsUrl()).toBe('/testdata/configs.json')
    setConfigsUrl('')
    expect(getConfigsUrl()).toBe('/configs.json')
  })
})

import { describe, expect, it, vi } from 'vitest'
import { reportFailure } from '@/lib/reportFailure'

describe('reportFailure', () => {
  it('prints to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportFailure('boom')
    expect(spy).toHaveBeenCalledExactlyOnceWith('boom')
    spy.mockRestore()
  })
})

import { describe, expect, it } from 'vitest'
import { decideReaderSwipe } from '@/lib/readerSwipe'

describe('decideReaderSwipe', () => {
  it('maps left swipe to next and right swipe to prev', () => {
    expect(decideReaderSwipe({ dx: -60, dy: 5 })).toBe('next')
    expect(decideReaderSwipe({ dx: 60, dy: -5 })).toBe('prev')
  })

  it('returns null when movement is below threshold', () => {
    expect(decideReaderSwipe({ dx: -40, dy: 0 })).toBeNull()
    expect(decideReaderSwipe({ dx: 49, dy: 0 })).toBeNull()
  })

  it('returns null when vertical movement dominates', () => {
    expect(decideReaderSwipe({ dx: -60, dy: 80 })).toBeNull()
    expect(decideReaderSwipe({ dx: 70, dy: -70 })).toBeNull()
  })

  it('respects a custom threshold', () => {
    expect(decideReaderSwipe({ dx: -30, dy: 0, threshold: 20 })).toBe('next')
    expect(decideReaderSwipe({ dx: -30, dy: 0, threshold: 40 })).toBeNull()
  })
})

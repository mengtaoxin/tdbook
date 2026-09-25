import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import {
  decideReaderSwipe,
  type ReaderSwipeDirection,
} from '@/lib/readerSwipe'

const INTERACTIVE_TAGS = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'LABEL',
])

function isInteractiveTarget(event: PointerEvent): boolean {
  for (const node of event.composedPath()) {
    if (!(node instanceof Element)) continue
    if (INTERACTIVE_TAGS.has(node.tagName)) return true
  }
  return false
}

function hasTextSelection(): boolean {
  const selection = window.getSelection()?.toString()
  return Boolean(selection && selection.length > 0)
}

export function useReaderSwipe(options: {
  onSwipe: (direction: ReaderSwipeDirection) => void
}) {
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const onSwipeRef = useRef(options.onSwipe)
  onSwipeRef.current = options.onSwipe

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    if (isInteractiveTarget(event.nativeEvent)) return
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const start = startRef.current
    if (!start || start.id !== event.pointerId) return
    startRef.current = null
    if (event.pointerType !== 'touch') return
    if (hasTextSelection()) return
    const direction = decideReaderSwipe({
      dx: event.clientX - start.x,
      dy: event.clientY - start.y,
    })
    if (direction) onSwipeRef.current(direction)
  }

  function onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
    if (startRef.current?.id === event.pointerId) {
      startRef.current = null
    }
  }

  return {
    swipeBind: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      style: { touchAction: 'pan-y' as const },
      'data-testid': 'reader-swipe-host',
    },
  }
}

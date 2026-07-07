import { useRef } from 'react'
import type { PointerEvent } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onTap: () => void
  thresholdMs?: number
  moveToleranceCssPx?: number
}

interface LongPressHandlers {
  onPointerDown: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  onPointerCancel: () => void
  onPointerMove: (event: PointerEvent) => void
}

const DEFAULT_THRESHOLD_MS = 500
const DEFAULT_MOVE_TOLERANCE_PX = 10

/**
 * SCREEN-FLOW 5-A/5-B — 짧은 탭은 딴생각 포착 모달, 길게 누름(임계값 도달)은 일시정지.
 * 임계값 이전 해제·포인터 취소·과도한 이동은 둘 다 아닌 중립 상태로 되돌린다.
 */
export function useLongPress({
  onLongPress,
  onTap,
  thresholdMs = DEFAULT_THRESHOLD_MS,
  moveToleranceCssPx = DEFAULT_MOVE_TOLERANCE_PX,
}: UseLongPressOptions): LongPressHandlers {
  const timeoutRef = useRef<number | null>(null)
  const firedLongPressRef = useRef(false)
  const startPositionRef = useRef<{ x: number; y: number } | null>(null)

  function clearPendingTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function onPointerDown(event: PointerEvent) {
    firedLongPressRef.current = false
    startPositionRef.current = { x: event.clientX, y: event.clientY }
    timeoutRef.current = window.setTimeout(() => {
      firedLongPressRef.current = true
      onLongPress()
    }, thresholdMs)
  }

  function onPointerUp() {
    const firedLongPress = firedLongPressRef.current
    clearPendingTimeout()
    startPositionRef.current = null
    if (!firedLongPress) {
      onTap()
    }
  }

  function onPointerCancel() {
    clearPendingTimeout()
    startPositionRef.current = null
    firedLongPressRef.current = false
  }

  function onPointerMove(event: PointerEvent) {
    const start = startPositionRef.current
    if (!start) return
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (distance > moveToleranceCssPx) {
      onPointerCancel()
    }
  }

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerMove }
}

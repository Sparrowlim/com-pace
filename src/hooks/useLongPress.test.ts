import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLongPress } from './useLongPress'

function pointerEvent(x = 0, y = 0) {
  return { clientX: x, clientY: y } as unknown as Parameters<
    ReturnType<typeof useLongPress>['onPointerDown']
  >[0]
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useLongPress', () => {
  test('calls onTap when released before the threshold', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onTap, thresholdMs: 500 }))

    result.current.onPointerDown(pointerEvent())
    vi.advanceTimersByTime(300)
    result.current.onPointerUp(pointerEvent())

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  test('calls onLongPress once the threshold elapses while still held', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onTap, thresholdMs: 500 }))

    result.current.onPointerDown(pointerEvent())
    vi.advanceTimersByTime(500)

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onTap).not.toHaveBeenCalled()
  })

  test('does not also fire onTap when the pointer is released after a long press already fired', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onTap, thresholdMs: 500 }))

    result.current.onPointerDown(pointerEvent())
    vi.advanceTimersByTime(500)
    result.current.onPointerUp(pointerEvent())

    expect(onTap).not.toHaveBeenCalled()
  })

  test('pointer cancel neutralizes a pending press (neither tap nor long-press fires)', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress, onTap, thresholdMs: 500 }))

    result.current.onPointerDown(pointerEvent())
    vi.advanceTimersByTime(200)
    result.current.onPointerCancel()
    vi.advanceTimersByTime(500)

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onTap).not.toHaveBeenCalled()
  })

  test('moving beyond the tolerance cancels the pending press', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onTap, thresholdMs: 500, moveToleranceCssPx: 10 }),
    )

    result.current.onPointerDown(pointerEvent(0, 0))
    result.current.onPointerMove(pointerEvent(50, 0))
    vi.advanceTimersByTime(500)

    expect(onLongPress).not.toHaveBeenCalled()
  })

  test('small movement within tolerance does not cancel the pending long-press', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onTap, thresholdMs: 500, moveToleranceCssPx: 10 }),
    )

    result.current.onPointerDown(pointerEvent(0, 0))
    result.current.onPointerMove(pointerEvent(3, 0))
    vi.advanceTimersByTime(500)

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })
})

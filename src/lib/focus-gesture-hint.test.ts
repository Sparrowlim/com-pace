import { beforeEach, describe, expect, test } from 'vitest'
import { isFocusGestureHintShown, markFocusGestureHintShown } from './focus-gesture-hint'

beforeEach(() => {
  localStorage.clear()
})

describe('focus-gesture-hint', () => {
  test('defaults to not shown when no flag has been set', () => {
    expect(isFocusGestureHintShown()).toBe(false)
  })

  test('reports shown after marking it', () => {
    markFocusGestureHintShown()

    expect(isFocusGestureHintShown()).toBe(true)
  })

  test('is idempotent across repeated calls', () => {
    markFocusGestureHintShown()
    markFocusGestureHintShown()

    expect(isFocusGestureHintShown()).toBe(true)
  })
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { nowIso, todayDateString } from './time'

describe('time', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-06T09:15:30.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('nowIso returns the current time as an ISO string', () => {
    expect(nowIso()).toBe('2026-07-06T09:15:30.000Z')
  })

  test('todayDateString returns the YYYY-MM-DD portion of now', () => {
    expect(todayDateString()).toBe('2026-07-06')
  })
})

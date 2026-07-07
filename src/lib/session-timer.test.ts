import { describe, expect, test } from 'vitest'
import { computeElapsedSeconds, judgeSessionReturn } from './session-timer'

describe('computeElapsedSeconds', () => {
  test('computes plain elapsed seconds with no pause', () => {
    const startedAt = '2026-07-07T10:00:00.000Z'
    const now = new Date(startedAt).getTime() + 90_000
    expect(computeElapsedSeconds(startedAt, 0, now)).toBe(90)
  })

  test('excludes accumulated paused duration', () => {
    const startedAt = '2026-07-07T10:00:00.000Z'
    const now = new Date(startedAt).getTime() + 120_000
    expect(computeElapsedSeconds(startedAt, 30_000, now)).toBe(90)
  })

  test('clamps to 0 when paused duration exceeds wall-clock elapsed', () => {
    const startedAt = '2026-07-07T10:00:00.000Z'
    const now = new Date(startedAt).getTime() + 5_000
    expect(computeElapsedSeconds(startedAt, 10_000, now)).toBe(0)
  })
})

describe('judgeSessionReturn', () => {
  const startedAt = '2026-07-07T10:00:00.000Z'

  test('continue: same day, under 900s', () => {
    expect(judgeSessionReturn(startedAt, '2026-07-07T10:14:59.000Z', 899)).toBe('continue')
  })

  test('finish: same day, at or over 900s', () => {
    expect(judgeSessionReturn(startedAt, '2026-07-07T10:15:00.000Z', 900)).toBe('finish')
  })

  test('carryover: different calendar date, regardless of elapsed seconds', () => {
    expect(judgeSessionReturn(startedAt, '2026-07-08T00:00:01.000Z', 200)).toBe('carryover')
  })

  test('carryover takes priority even when elapsed also clears the finish threshold', () => {
    expect(judgeSessionReturn(startedAt, '2026-07-08T10:15:00.000Z', 900)).toBe('carryover')
  })

  // Code-review regression (HIGH): a block started just after local midnight (KST, D-26
  // K=Android locale) has a startedAt whose UTC calendar date is still "the day before" —
  // comparing raw UTC date slices would misjudge this as carryover even though it's the
  // same local day, silently erasing an otherwise-legitimate energy point. Depends on the
  // host running in Asia/Seoul (true for this dev environment and the target device locale).
  test('does not carry over across the UTC date line when the local calendar day is the same (KST)', () => {
    const startedAtJustAfterLocalMidnight = '2026-07-07T15:30:00.000Z' // 2026-07-08T00:30 KST
    const laterSameLocalMorning = '2026-07-08T01:00:00.000Z' // 2026-07-08T10:00 KST
    expect(judgeSessionReturn(startedAtJustAfterLocalMidnight, laterSameLocalMorning, 200)).toBe(
      'continue',
    )
  })
})

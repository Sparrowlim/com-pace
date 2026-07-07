import { describe, expect, test } from 'vitest'
import { VERB_CHIPS } from './verb-chips'

describe('VERB_CHIPS', () => {
  test('is not empty', () => {
    expect(VERB_CHIPS.length).toBeGreaterThan(0)
  })

  test('has no duplicates', () => {
    expect(new Set(VERB_CHIPS).size).toBe(VERB_CHIPS.length)
  })
})

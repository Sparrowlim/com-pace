import { describe, expect, test } from 'vitest'
import { VERB_CHIP_GROUPS, VERB_CHIPS } from './verb-chips'

describe('VERB_CHIPS', () => {
  test('is not empty', () => {
    expect(VERB_CHIPS.length).toBeGreaterThan(0)
  })

  test('has no duplicates', () => {
    expect(new Set(VERB_CHIPS).size).toBe(VERB_CHIPS.length)
  })

  test('is the flattened form of VERB_CHIP_GROUPS', () => {
    expect(VERB_CHIPS).toEqual(VERB_CHIP_GROUPS.flatMap((group) => group.verbs))
  })

  test('includes a catch-all verb so every fragment always has a match', () => {
    expect(VERB_CHIPS).toContain('시작하기')
  })
})

describe('VERB_CHIP_GROUPS', () => {
  test('has no empty groups', () => {
    for (const group of VERB_CHIP_GROUPS) {
      expect(group.verbs.length).toBeGreaterThan(0)
    }
  })

  test('has no duplicate categories', () => {
    const categories = VERB_CHIP_GROUPS.map((group) => group.category)
    expect(new Set(categories).size).toBe(categories.length)
  })
})

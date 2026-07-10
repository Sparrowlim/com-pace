import { describe, expect, test } from 'vitest'
import { hasNorthStar } from './north-star-selectors'

describe('hasNorthStar', () => {
  test('is false when both fields are empty', () => {
    expect(hasNorthStar({ aspiration: '', obligation: '' })).toBe(false)
  })

  test('is false when both fields are whitespace only', () => {
    expect(hasNorthStar({ aspiration: '  ', obligation: '\t' })).toBe(false)
  })

  test('is true when only aspiration is set', () => {
    expect(hasNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '' })).toBe(true)
  })

  test('is true when only obligation is set', () => {
    expect(hasNorthStar({ aspiration: '', obligation: '보고서 마감' })).toBe(true)
  })

  test('is true when both are set', () => {
    expect(hasNorthStar({ aspiration: '작가', obligation: '보고서' })).toBe(true)
  })
})

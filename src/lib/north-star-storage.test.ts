import { beforeEach, describe, expect, test } from 'vitest'
import { getNorthStar, saveNorthStar } from './north-star-storage'

beforeEach(() => {
  localStorage.clear()
})

describe('north-star-storage', () => {
  test('defaults to empty aspiration and obligation when nothing has been saved', () => {
    expect(getNorthStar()).toEqual({ aspiration: '', obligation: '' })
  })

  test('returns the saved values after saving', () => {
    saveNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })

    expect(getNorthStar()).toEqual({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })
  })

  test('is idempotent — repeated saves with the same value read back the same value', () => {
    saveNorthStar({ aspiration: '작가', obligation: '보고서' })
    saveNorthStar({ aspiration: '작가', obligation: '보고서' })

    expect(getNorthStar()).toEqual({ aspiration: '작가', obligation: '보고서' })
  })
})

import { describe, expect, test } from 'vitest'
import { generateId } from './id'

describe('generateId', () => {
  test('returns a valid uuid v4-shaped string', () => {
    const id = generateId()

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  test('returns a unique value on each call', () => {
    const first = generateId()
    const second = generateId()

    expect(first).not.toBe(second)
  })
})

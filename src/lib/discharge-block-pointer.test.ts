import { beforeEach, describe, expect, test } from 'vitest'
import { dischargeBlockPointer } from './discharge-block-pointer'

beforeEach(() => {
  localStorage.clear()
})

describe('dischargeBlockPointer', () => {
  test('is null when nothing has been set', () => {
    expect(dischargeBlockPointer.get()).toBeNull()
  })

  test('set stores the block id, get reads it back', () => {
    dischargeBlockPointer.set('block-1')

    expect(dischargeBlockPointer.get()).toBe('block-1')
  })

  test('clear removes it', () => {
    dischargeBlockPointer.set('block-1')

    dischargeBlockPointer.clear()

    expect(dischargeBlockPointer.get()).toBeNull()
  })

  test('set overwrites a previous value', () => {
    dischargeBlockPointer.set('block-1')

    dischargeBlockPointer.set('block-2')

    expect(dischargeBlockPointer.get()).toBe('block-2')
  })
})

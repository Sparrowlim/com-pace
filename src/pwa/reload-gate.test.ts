import { describe, expect, test } from 'vitest'
import { shouldReloadForUpdate } from './reload-gate'
import type { Block } from '../types/block'

function makeBlock(status: Block['status']): Block {
  return {
    id: 'block-1',
    taskId: 'task-1',
    verbLabel: '적기',
    status,
    date: '2026-07-18',
    startedAt: '2026-07-18T00:00:00.000Z',
    endedAt: null,
  }
}

describe('shouldReloadForUpdate', () => {
  test('reloads when there is no active block', () => {
    expect(shouldReloadForUpdate(null)).toBe(true)
  })

  test('does not reload while a block is in progress', () => {
    expect(shouldReloadForUpdate(makeBlock('in_progress'))).toBe(false)
  })

  test('does not reload while a block is paused', () => {
    expect(shouldReloadForUpdate(makeBlock('paused'))).toBe(false)
  })
})

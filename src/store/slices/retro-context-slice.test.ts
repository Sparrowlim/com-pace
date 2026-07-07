import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createRetroContextSlice, type RetroContextSlice } from './retro-context-slice'
import type { Block } from '../../types/block'

function createStore() {
  return create<RetroContextSlice>()(createRetroContextSlice)
}

const block: Block = {
  id: 'block-1',
  taskId: 'task-1',
  verbLabel: '이메일 확인하기',
  status: 'done',
  startedAt: '2026-07-07T00:00:00.000Z',
  endedAt: '2026-07-07T00:15:00.000Z',
}

describe('retroContextSlice', () => {
  test('starts with no resolved block', () => {
    const store = createStore()
    expect(store.getState().lastResolvedBlock).toBeNull()
  })

  test('setLastResolvedBlock stores the given block', () => {
    const store = createStore()

    store.getState().setLastResolvedBlock(block)

    expect(store.getState().lastResolvedBlock).toEqual(block)
  })

  test('setLastResolvedBlock(null) clears it', () => {
    const store = createStore()
    store.getState().setLastResolvedBlock(block)

    store.getState().setLastResolvedBlock(null)

    expect(store.getState().lastResolvedBlock).toBeNull()
  })
})

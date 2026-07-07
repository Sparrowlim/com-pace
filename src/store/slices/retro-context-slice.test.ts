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

describe('retroContextSlice — capturedThought (SPEC §6 5-A single-slot capture)', () => {
  test('starts with no captured thought', () => {
    const store = createStore()
    expect(store.getState().capturedThought).toBeNull()
  })

  test('setCapturedThought stores the given text', () => {
    const store = createStore()

    store.getState().setCapturedThought('빨래도 널어야 하는데')

    expect(store.getState().capturedThought).toBe('빨래도 널어야 하는데')
  })

  test('a second capture overwrites the first (no persistent list)', () => {
    const store = createStore()
    store.getState().setCapturedThought('첫 번째 딴생각')

    store.getState().setCapturedThought('두 번째 딴생각')

    expect(store.getState().capturedThought).toBe('두 번째 딴생각')
  })

  test('setCapturedThought(null) clears it, independently of lastResolvedBlock', () => {
    const store = createStore()
    store.getState().setLastResolvedBlock(block)
    store.getState().setCapturedThought('딴생각')

    store.getState().setCapturedThought(null)

    expect(store.getState().capturedThought).toBeNull()
    expect(store.getState().lastResolvedBlock).toEqual(block)
  })
})

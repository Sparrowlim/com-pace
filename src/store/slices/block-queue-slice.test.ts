import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createBlockQueueSlice, type BlockQueueSlice } from './block-queue-slice'

function createStore() {
  return create<BlockQueueSlice>()(createBlockQueueSlice)
}

describe('blockQueueSlice.queueBlocks', () => {
  test('appends one queued block per verb label for the given task', () => {
    const store = createStore()

    store.getState().queueBlocks('task-1', ['이메일 확인하기', '책상 정리하기'])

    const { queuedBlocks } = store.getState()
    expect(queuedBlocks).toHaveLength(2)
    expect(queuedBlocks[0]).toMatchObject({ taskId: 'task-1', verbLabel: '이메일 확인하기' })
    expect(queuedBlocks[1]).toMatchObject({ taskId: 'task-1', verbLabel: '책상 정리하기' })
  })

  test('assigns a unique id to each queued block', () => {
    const store = createStore()

    store.getState().queueBlocks('task-1', ['A', 'B'])

    const [first, second] = store.getState().queuedBlocks
    expect(first?.id).toBeTruthy()
    expect(second?.id).toBeTruthy()
    expect(first?.id).not.toBe(second?.id)
  })

  test('does not drop blocks queued for a different task', () => {
    const store = createStore()

    store.getState().queueBlocks('task-1', ['A'])
    store.getState().queueBlocks('task-2', ['B'])

    expect(store.getState().queuedBlocks.map((b) => b.taskId)).toEqual(['task-1', 'task-2'])
  })
})

describe('blockQueueSlice.dequeueBlock', () => {
  test('removes only the block with the matching id', () => {
    const store = createStore()
    store.getState().queueBlocks('task-1', ['A', 'B', 'C'])
    const [first, second, third] = store.getState().queuedBlocks

    store.getState().dequeueBlock(second!.id)

    expect(store.getState().queuedBlocks).toEqual([first, third])
  })

  test('is a no-op when the id is not queued', () => {
    const store = createStore()
    store.getState().queueBlocks('task-1', ['A'])
    const before = store.getState().queuedBlocks

    store.getState().dequeueBlock('does-not-exist')

    expect(store.getState().queuedBlocks).toEqual(before)
  })
})

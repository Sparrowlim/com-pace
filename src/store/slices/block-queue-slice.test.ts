import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createBlockQueueSlice, type BlockQueueSlice } from './block-queue-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { QueuedBlock } from '../../types/queued-block'

function createStore() {
  return create<BlockQueueSlice>()(createBlockQueueSlice)
}

describe('blockQueueSlice.queueBlocks', () => {
  test('appends one queued block per verb label for the given task', async () => {
    const store = createStore()

    await store.getState().queueBlocks('task-1', ['이메일 확인하기', '책상 정리하기'])

    const { queuedBlocks } = store.getState()
    expect(queuedBlocks).toHaveLength(2)
    expect(queuedBlocks[0]).toMatchObject({ taskId: 'task-1', verbLabel: '이메일 확인하기' })
    expect(queuedBlocks[1]).toMatchObject({ taskId: 'task-1', verbLabel: '책상 정리하기' })
  })

  test('assigns a unique id to each queued block', async () => {
    const store = createStore()

    await store.getState().queueBlocks('task-1', ['A', 'B'])

    const [first, second] = store.getState().queuedBlocks
    expect(first?.id).toBeTruthy()
    expect(second?.id).toBeTruthy()
    expect(first?.id).not.toBe(second?.id)
  })

  test('does not drop blocks queued for a different task', async () => {
    const store = createStore()

    await store.getState().queueBlocks('task-1', ['A'])
    await store.getState().queueBlocks('task-2', ['B'])

    expect(store.getState().queuedBlocks.map((b) => b.taskId)).toEqual(['task-1', 'task-2'])
  })

  // 베타 적합도 감사 CRITICAL 수정 — queueBlocks가 IndexedDB에도 실제로 쓰는지 직접 확인한다
  // (task-slice.test.ts의 영속 검증 패턴 미러).
  test('persists each queued block to IndexedDB', async () => {
    const store = createStore()

    await store.getState().queueBlocks('task-1', ['이메일 확인하기'])

    const [queued] = store.getState().queuedBlocks
    const persisted = await idbStorage.findById<QueuedBlock>('queuedBlocks', queued!.id)
    expect(persisted).toMatchObject({ taskId: 'task-1', verbLabel: '이메일 확인하기' })
    expect(persisted?.date).toBeTruthy()
  })
})

describe('blockQueueSlice.dequeueBlock', () => {
  test('removes only the block with the matching id', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A', 'B', 'C'])
    const [first, second, third] = store.getState().queuedBlocks

    await store.getState().dequeueBlock(second!.id)

    expect(store.getState().queuedBlocks).toEqual([first, third])
  })

  test('is a no-op when the id is not queued', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A'])
    const before = store.getState().queuedBlocks

    await store.getState().dequeueBlock('does-not-exist')

    expect(store.getState().queuedBlocks).toEqual(before)
  })

  test('removes the persisted record from IndexedDB', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A'])
    const [queued] = store.getState().queuedBlocks

    await store.getState().dequeueBlock(queued!.id)

    const persisted = await idbStorage.findById<QueuedBlock>('queuedBlocks', queued!.id)
    expect(persisted).toBeNull()
  })
})

describe('blockQueueSlice.promoteQueuedBlock (PH-05.1 — 자기선택 = 큐 재정렬)', () => {
  test('moves a middle item to the front of that task queue', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A', 'B', 'C'])
    const [, second] = store.getState().queuedBlocks

    store.getState().promoteQueuedBlock('task-1', second!.id)

    expect(store.getState().queuedBlocks.map((b) => b.verbLabel)).toEqual(['B', 'A', 'C'])
  })

  test('promoting the item already at the front leaves order unchanged', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A', 'B'])
    const [first] = store.getState().queuedBlocks
    const before = store.getState().queuedBlocks

    store.getState().promoteQueuedBlock('task-1', first!.id)

    expect(store.getState().queuedBlocks).toEqual(before)
  })

  test('ignores an id that is not queued', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A', 'B'])
    const before = store.getState().queuedBlocks

    store.getState().promoteQueuedBlock('task-1', 'does-not-exist')

    expect(store.getState().queuedBlocks).toEqual(before)
  })

  test('does not disturb another task queue or its relative order', async () => {
    const store = createStore()
    await store.getState().queueBlocks('task-1', ['A', 'B'])
    await store.getState().queueBlocks('task-2', ['X', 'Y'])
    const task2Before = store.getState().queuedBlocks.filter((b) => b.taskId === 'task-2')
    const [, second] = store.getState().queuedBlocks.filter((b) => b.taskId === 'task-1')

    store.getState().promoteQueuedBlock('task-1', second!.id)

    expect(store.getState().queuedBlocks.filter((b) => b.taskId === 'task-2')).toEqual(task2Before)
  })
})

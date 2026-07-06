import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createTimerSlice, type TimerSlice } from './timer-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { Block } from '../../types/block'

function createStore() {
  return create<TimerSlice>()(createTimerSlice)
}

describe('timerSlice.startBlock', () => {
  test('creates an in_progress block, persists it, and resets elapsedSeconds', async () => {
    const store = createStore()

    const block = await store.getState().startBlock('task-1', '펼치기')

    expect(store.getState().activeBlock).toEqual(block)
    expect(store.getState().elapsedSeconds).toBe(0)
    expect(block.status).toBe('in_progress')
    expect(block.endedAt).toBeNull()
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted).toEqual(block)
  })
})

describe('timerSlice.pause / resume', () => {
  test('pause sets status to paused and persists it', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-2', '적기')

    await store.getState().pause()

    expect(store.getState().activeBlock).toEqual({ ...block, status: 'paused' })
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('paused')
  })

  test('resume returns status to in_progress after a pause', async () => {
    const store = createStore()
    await store.getState().startBlock('task-3', '적기')
    await store.getState().pause()

    await store.getState().resume()

    expect(store.getState().activeBlock?.status).toBe('in_progress')
  })

  test('pause throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().pause()).rejects.toThrow('No active block')
  })

  test('resume throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().resume()).rejects.toThrow('No active block')
  })
})

describe('timerSlice.complete / markIncomplete', () => {
  test('complete sets status done, endedAt, and clears activeBlock', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-4', '넣기')

    await store.getState().complete()

    expect(store.getState().activeBlock).toBeNull()
    expect(store.getState().elapsedSeconds).toBe(0)
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('done')
    expect(persisted?.endedAt).not.toBeNull()
  })

  test('markIncomplete sets status incomplete, endedAt, and clears activeBlock', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-5', '넣기')

    await store.getState().markIncomplete()

    expect(store.getState().activeBlock).toBeNull()
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('incomplete')
    expect(persisted?.endedAt).not.toBeNull()
  })

  test('complete throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().complete()).rejects.toThrow('No active block')
  })

  test('markIncomplete throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().markIncomplete()).rejects.toThrow('No active block')
  })
})

describe('timerSlice.tick', () => {
  test('increments elapsedSeconds while the block is in_progress', async () => {
    const store = createStore()
    await store.getState().startBlock('task-6', '치우기')

    store.getState().tick()
    store.getState().tick()

    expect(store.getState().elapsedSeconds).toBe(2)
  })

  test('is a no-op while paused', async () => {
    const store = createStore()
    await store.getState().startBlock('task-7', '치우기')
    await store.getState().pause()

    store.getState().tick()

    expect(store.getState().elapsedSeconds).toBe(0)
  })

  test('is a no-op when there is no active block', () => {
    const store = createStore()

    store.getState().tick()

    expect(store.getState().elapsedSeconds).toBe(0)
  })
})

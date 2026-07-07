import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { create } from 'zustand'
import { createTimerSlice, type TimerSlice } from './timer-slice'
import { idbStorage } from '../../storage/idb-storage'
import { activeSessionPointer } from '../../lib/active-session-pointer'
import type { Block } from '../../types/block'

function createStore() {
  return create<TimerSlice>()(createTimerSlice)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

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

  test('records the block id as the active-session pointer (PH-06 boot recovery)', async () => {
    const store = createStore()

    const block = await store.getState().startBlock('task-1b', '펼치기')

    expect(activeSessionPointer.get()).toBe(block.id)
  })
})

describe('timerSlice.pause / resume', () => {
  test('pause sets status to paused and persists it', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-2', '적기')

    await store.getState().pause()

    expect(store.getState().activeBlock).toMatchObject({ ...block, status: 'paused' })
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('paused')
  })

  test('resume returns status to in_progress after a pause', async () => {
    const store = createStore()
    await store.getState().startBlock('task-3', '적기')
    await store.getState().pause()

    await store.getState().resume()

    expect(store.getState().activeBlock?.status).toBe('in_progress')
    expect(store.getState().pausedAt).toBeNull()
  })

  test('pause throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().pause()).rejects.toThrow('No active block')
  })

  test('resume throws when there is no active block', async () => {
    const store = createStore()

    await expect(store.getState().resume()).rejects.toThrow('No active block')
  })

  test('the paused duration is excluded from elapsedSeconds after resume', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const store = createStore()
    await store.getState().startBlock('task-3b', '적기')

    vi.setSystemTime(new Date(now.getTime() + 10_000))
    await store.getState().pause()
    vi.setSystemTime(new Date(now.getTime() + 40_000)) // paused for 30s
    await store.getState().resume()
    vi.setSystemTime(new Date(now.getTime() + 50_000)) // +10s more running time

    store.getState().tick()

    // 50s wall-clock - 30s paused = 20s of real progress.
    expect(store.getState().elapsedSeconds).toBe(20)
  })
})

describe('timerSlice.complete / markIncomplete', () => {
  test('complete sets status done, endedAt, clears activeBlock, and clears the session pointer', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-4', '넣기')

    await store.getState().complete()

    expect(store.getState().activeBlock).toBeNull()
    expect(store.getState().elapsedSeconds).toBe(0)
    expect(activeSessionPointer.get()).toBeNull()
    const persisted = await idbStorage.findById<Block>('blocks', block.id)
    expect(persisted?.status).toBe('done')
    expect(persisted?.endedAt).not.toBeNull()
  })

  test('markIncomplete sets status incomplete, endedAt, clears activeBlock, and clears the session pointer', async () => {
    const store = createStore()
    const block = await store.getState().startBlock('task-5', '넣기')

    await store.getState().markIncomplete()

    expect(store.getState().activeBlock).toBeNull()
    expect(activeSessionPointer.get()).toBeNull()
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
  test('recomputes elapsedSeconds from timestamps while the block is in_progress', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const store = createStore()
    await store.getState().startBlock('task-6', '치우기')

    vi.setSystemTime(new Date(now.getTime() + 2_000))
    store.getState().tick()

    expect(store.getState().elapsedSeconds).toBe(2)
  })

  test('jumps straight to the correct value even if the interval was throttled in the background', async () => {
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const store = createStore()
    await store.getState().startBlock('task-6b', '치우기')

    // Simulate a long background gap with a single tick() call on return to foreground,
    // instead of many missed per-second ticks — this is the whole point of P13.
    vi.setSystemTime(new Date(now.getTime() + 500_000))
    store.getState().tick()

    expect(store.getState().elapsedSeconds).toBe(500)
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

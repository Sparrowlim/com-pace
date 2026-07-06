import { describe, expect, test } from 'vitest'
import { create } from 'zustand'
import { createTaskSlice, type TaskSlice } from './task-slice'
import { idbStorage } from '../../storage/idb-storage'
import type { Task } from '../../types/task'

function createStore() {
  return create<TaskSlice>()(createTaskSlice)
}

describe('taskSlice.addTask', () => {
  test('persists the task and appends it to state', async () => {
    const store = createStore()

    const task = await store.getState().addTask('설거지')

    expect(store.getState().tasks).toEqual([task])
    const persisted = await idbStorage.findById<Task>('tasks', task.id)
    expect(persisted).toEqual(task)
    expect(task.splitDone).toBe(false)
  })

  test('appends multiple tasks without dropping earlier ones', async () => {
    const store = createStore()

    const first = await store.getState().addTask('빨래')
    const second = await store.getState().addTask('분리수거')

    expect(store.getState().tasks).toEqual([first, second])
  })
})

describe('taskSlice.markTaskSplitDone', () => {
  test('flips splitDone in both storage and state', async () => {
    const store = createStore()
    const task = await store.getState().addTask('청소')

    await store.getState().markTaskSplitDone(task.id)

    expect(store.getState().tasks).toEqual([{ ...task, splitDone: true }])
    const persisted = await idbStorage.findById<Task>('tasks', task.id)
    expect(persisted?.splitDone).toBe(true)
  })

  test('does not affect other tasks in state', async () => {
    const store = createStore()
    const first = await store.getState().addTask('설거지2')
    const second = await store.getState().addTask('청소2')

    await store.getState().markTaskSplitDone(second.id)

    expect(store.getState().tasks).toEqual([first, { ...second, splitDone: true }])
  })

  test('propagates the storage error for an id that was never created', async () => {
    const store = createStore()

    await expect(store.getState().markTaskSplitDone('task-does-not-exist')).rejects.toThrow(
      'not found',
    )
  })
})

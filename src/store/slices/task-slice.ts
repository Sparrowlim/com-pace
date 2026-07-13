import type { StateCreator } from 'zustand'
import type { Task } from '../../types/task'
import { idbStorage } from '../../storage/idb-storage'
import { generateId } from '../../lib/id'
import { nowIso, todayDateString } from '../../lib/time'

export interface TaskSlice {
  tasks: Task[]
  addTask: (title: string) => Promise<Task>
  markTaskSplitDone: (id: string) => Promise<void>
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set) => ({
  tasks: [],

  addTask: async (title) => {
    const task: Task = {
      id: generateId(),
      title,
      date: todayDateString(),
      createdAt: nowIso(),
      splitDone: false,
    }
    await idbStorage.create('tasks', task)
    set((state) => ({ tasks: [...state.tasks, task] }))
    return task
  },

  markTaskSplitDone: async (id) => {
    const updated = await idbStorage.update<Task>('tasks', id, { splitDone: true })
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
    }))
  },
})

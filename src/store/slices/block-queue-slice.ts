import type { StateCreator } from 'zustand'
import { generateId } from '../../lib/id'
import { idbStorage } from '../../storage/idb-storage'
import { todayDateString } from '../../lib/time'
import type { QueuedBlock } from '../../types/queued-block'

export interface BlockQueueSlice {
  queuedBlocks: QueuedBlock[]
  queueBlocks: (taskId: string, verbLabels: string[]) => Promise<void>
  dequeueBlock: (id: string) => Promise<void>
  promoteQueuedBlock: (taskId: string, blockId: string) => void
}

export const createBlockQueueSlice: StateCreator<BlockQueueSlice, [], [], BlockQueueSlice> = (
  set,
) => ({
  queuedBlocks: [],

  queueBlocks: async (taskId, verbLabels) => {
    const date = todayDateString()
    const newBlocks: QueuedBlock[] = verbLabels.map((verbLabel) => ({
      id: generateId(),
      taskId,
      verbLabel,
      date,
    }))
    await Promise.all(newBlocks.map((block) => idbStorage.create('queuedBlocks', block)))
    set((state) => ({ queuedBlocks: [...state.queuedBlocks, ...newBlocks] }))
  },

  dequeueBlock: async (id) => {
    await idbStorage.delete('queuedBlocks', id)
    set((state) => ({
      queuedBlocks: state.queuedBlocks.filter((block) => block.id !== id),
    }))
  },

  // PH-05.1 — "만만한 1개 자기선택"(SPEC §3, D-05)은 새 상태가 아니라 큐 재정렬로 구현한다.
  // 지정한 블록을 그 과제의 큐 맨 앞으로 옮기고, 다른 과제의 큐·상대 순서는 그대로 둔다.
  promoteQueuedBlock: (taskId, blockId) => {
    set((state) => {
      const target = state.queuedBlocks.find(
        (block) => block.id === blockId && block.taskId === taskId,
      )
      if (!target) return state

      const taskQueue = state.queuedBlocks.filter((block) => block.taskId === taskId)
      const otherIndex = taskQueue.findIndex((block) => block.id === blockId)
      if (otherIndex === 0) return state

      const reorderedTaskQueue = [target, ...taskQueue.filter((block) => block.id !== blockId)]
      let cursor = 0
      const queuedBlocks = state.queuedBlocks.map((block) =>
        block.taskId === taskId ? reorderedTaskQueue[cursor++]! : block,
      )
      return { queuedBlocks }
    })
  },
})

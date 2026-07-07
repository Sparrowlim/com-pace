import type { StateCreator } from 'zustand'
import { generateId } from '../../lib/id'

export interface QueuedBlock {
  id: string
  taskId: string
  verbLabel: string
}

export interface BlockQueueSlice {
  queuedBlocks: QueuedBlock[]
  queueBlocks: (taskId: string, verbLabels: string[]) => void
  dequeueBlock: (id: string) => void
}

export const createBlockQueueSlice: StateCreator<BlockQueueSlice, [], [], BlockQueueSlice> = (
  set,
) => ({
  queuedBlocks: [],

  queueBlocks: (taskId, verbLabels) => {
    const newBlocks: QueuedBlock[] = verbLabels.map((verbLabel) => ({
      id: generateId(),
      taskId,
      verbLabel,
    }))
    set((state) => ({ queuedBlocks: [...state.queuedBlocks, ...newBlocks] }))
  },

  dequeueBlock: (id) => {
    set((state) => ({
      queuedBlocks: state.queuedBlocks.filter((block) => block.id !== id),
    }))
  },
})

import type { StateCreator } from 'zustand'
import type { Block } from '../../types/block'
import { idbStorage } from '../../storage/idb-storage'
import { generateId } from '../../lib/id'
import { nowIso } from '../../lib/time'

export interface TimerSlice {
  activeBlock: Block | null
  elapsedSeconds: number
  startBlock: (taskId: string, verbLabel: string) => Promise<Block>
  pause: () => Promise<void>
  resume: () => Promise<void>
  complete: () => Promise<void>
  markIncomplete: () => Promise<void>
  tick: () => void
}

function requireActiveBlock(activeBlock: Block | null): Block {
  if (activeBlock === null) {
    throw new Error('No active block')
  }
  return activeBlock
}

export const createTimerSlice: StateCreator<TimerSlice, [], [], TimerSlice> = (set, get) => ({
  activeBlock: null,
  elapsedSeconds: 0,

  startBlock: async (taskId, verbLabel) => {
    const block: Block = {
      id: generateId(),
      taskId,
      verbLabel,
      status: 'in_progress',
      startedAt: nowIso(),
      endedAt: null,
    }
    await idbStorage.create('blocks', block)
    set({ activeBlock: block, elapsedSeconds: 0 })
    return block
  },

  pause: async () => {
    const active = requireActiveBlock(get().activeBlock)
    const updated = await idbStorage.update<Block>('blocks', active.id, { status: 'paused' })
    set({ activeBlock: updated })
  },

  resume: async () => {
    const active = requireActiveBlock(get().activeBlock)
    const updated = await idbStorage.update<Block>('blocks', active.id, { status: 'in_progress' })
    set({ activeBlock: updated })
  },

  complete: async () => {
    const active = requireActiveBlock(get().activeBlock)
    await idbStorage.update<Block>('blocks', active.id, { status: 'done', endedAt: nowIso() })
    set({ activeBlock: null, elapsedSeconds: 0 })
  },

  markIncomplete: async () => {
    const active = requireActiveBlock(get().activeBlock)
    await idbStorage.update<Block>('blocks', active.id, {
      status: 'incomplete',
      endedAt: nowIso(),
    })
    set({ activeBlock: null, elapsedSeconds: 0 })
  },

  tick: () => {
    const active = get().activeBlock
    if (active?.status !== 'in_progress') {
      return
    }
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
  },
})

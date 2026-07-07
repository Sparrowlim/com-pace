import type { StateCreator } from 'zustand'
import type { Block } from '../../types/block'

export interface RetroContextSlice {
  lastResolvedBlock: Block | null
  setLastResolvedBlock: (block: Block | null) => void
}

export const createRetroContextSlice: StateCreator<RetroContextSlice, [], [], RetroContextSlice> = (
  set,
) => ({
  lastResolvedBlock: null,

  setLastResolvedBlock: (block) => set({ lastResolvedBlock: block }),
})

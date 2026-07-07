import type { StateCreator } from 'zustand'
import type { Block } from '../../types/block'

export interface RetroContextSlice {
  lastResolvedBlock: Block | null
  setLastResolvedBlock: (block: Block | null) => void
  // 딴생각 포착(SPEC §6 5-A) — 상주 목록 없이 단일 초안 슬롯만 둔다. 두 번째 포착은 첫 번째를
  // 덮어쓰고, 회고에서 처리(버리기/새 조각화) 안 하고 이탈하면 조용히 사라진다.
  capturedThought: string | null
  setCapturedThought: (text: string | null) => void
}

export const createRetroContextSlice: StateCreator<RetroContextSlice, [], [], RetroContextSlice> = (
  set,
) => ({
  lastResolvedBlock: null,
  capturedThought: null,

  setLastResolvedBlock: (block) => set({ lastResolvedBlock: block }),
  setCapturedThought: (text) => set({ capturedThought: text }),
})

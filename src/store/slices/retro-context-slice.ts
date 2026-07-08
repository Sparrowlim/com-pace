import type { StateCreator } from 'zustand'
import type { Block } from '../../types/block'

export type TimeSenseFeedback = 'fast' | 'on_time' | 'slow'

export interface RetroContextSlice {
  lastResolvedBlock: Block | null
  setLastResolvedBlock: (block: Block | null) => void
  // 딴생각 포착(SPEC §6 5-A) — 상주 목록 없이 단일 초안 슬롯만 둔다. 두 번째 포착은 첫 번째를
  // 덮어쓰고, 회고에서 처리(버리기/새 조각화) 안 하고 이탈하면 조용히 사라진다.
  capturedThought: string | null
  setCapturedThought: (text: string | null) => void
  // 영점조절 체감(SPEC §3, D-11) — completedThought와 동일하게 세션 중 UI 상태로만 존재,
  // 언마운트 시 정리되고 영속·집계되지 않는다(PH-05.1, 텔레메트리는 PH-10 몫).
  timeSenseFeedback: TimeSenseFeedback | null
  setTimeSenseFeedback: (value: TimeSenseFeedback | null) => void
}

export const createRetroContextSlice: StateCreator<RetroContextSlice, [], [], RetroContextSlice> = (
  set,
) => ({
  lastResolvedBlock: null,
  capturedThought: null,
  timeSenseFeedback: null,

  setLastResolvedBlock: (block) => set({ lastResolvedBlock: block }),
  setCapturedThought: (text) => set({ capturedThought: text }),
  setTimeSenseFeedback: (value) => set({ timeSenseFeedback: value }),
})

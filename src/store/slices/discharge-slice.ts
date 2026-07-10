import type { StateCreator } from 'zustand'

/**
 * 방전 모드(SPEC §5) — 세션 범위 인메모리 플래그. Storage 무변경(착수 전 설계 결정 1).
 * 앱 재기동 시 복원하지 않는다 — 방전은 "그 순간"의 상태다(Positive Non-Goals).
 */
export interface DischargeSlice {
  dischargeMode: boolean
  // 회고가 스킵되므로 "따뜻한 한 줄"을 대시보드가 대신 보여준다(착수 전 설계 결정 7).
  // 대시보드가 표시 후 언마운트 시 정리한다(RetroPage의 capturedThought와 동일 패턴).
  dischargeEndMessage: string | null
  enterDischarge: () => void
  exitDischarge: () => void
  setDischargeEndMessage: (message: string | null) => void
}

export const createDischargeSlice: StateCreator<DischargeSlice, [], [], DischargeSlice> = (
  set,
) => ({
  dischargeMode: false,
  dischargeEndMessage: null,

  enterDischarge: () => set({ dischargeMode: true }),
  exitDischarge: () => set({ dischargeMode: false }),
  setDischargeEndMessage: (message) => set({ dischargeEndMessage: message }),
})

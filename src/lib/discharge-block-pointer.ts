const KEY = 'compace:dischargeBlockId'

/**
 * PH-08 방전 모드 — "이 블록이 방전으로 시작됐는가"를 세션 순간의 `dischargeMode` 플래그가
 * 아니라 블록 자신에 붙여 추적한다. `dischargeMode`는 뒤로가기/다른 화면 이탈로 블록을 아예
 * 시작하지 않고도 켜진 채 남을 수 있고, 재기동 시엔 인메모리라 항상 초기화된다 — 그 상태에서
 * 그 플래그만 읽고 분기하면 완전히 무관한 이후의 정상 블록까지 방전으로 오분류돼 에너지
 * 미점등·예측 미해석·회고 미경유가 새는 버그였다(code review CRITICAL 발견).
 * `activeSessionPointer`와 동일한 최소 localStorage 포인터 패턴 — IndexedDB/Block 스키마는
 * 무변경(전역 DO NOT CHANGE).
 */
export const dischargeBlockPointer = {
  set(blockId: string): void {
    localStorage.setItem(KEY, blockId)
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
  get(): string | null {
    return localStorage.getItem(KEY)
  },
}

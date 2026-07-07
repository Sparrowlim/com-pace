export const FOCUS_SECONDS = 900

export function computeElapsedSeconds(
  startedAtIso: string,
  pausedMs: number,
  nowMs: number,
): number {
  const startedMs = new Date(startedAtIso).getTime()
  return Math.max(0, Math.floor((nowMs - startedMs - pausedMs) / 1000))
}

export type SessionReturnJudgment = 'continue' | 'finish' | 'carryover'

// "다른 날짜"는 기기의 로컬 달력일 기준이어야 한다 — UTC ISO 슬라이스로 비교하면 KST(UTC+9,
// D-26 K=Android 기준 로케일)에서 로컬 자정 이전(00:00~08:59 KST)에 시작한 블록이 로컬로는
// 같은 날 아침에 돌아와도 UTC 날짜가 갈라져 있어 잘못 carryover 판정되고, 정당히 번 에너지가
// 조용히 사라진다(착수 전 설계 결정 2가 금지한 "실패 방향 오차" — code review 발견, 수정).
function localDateKey(iso: string): string {
  return new Date(iso).toDateString()
}

/**
 * SPEC §6/P13 — 날짜 경계(다른 날짜)가 곧 "익일·장시간 방치"의 유일한 기계 검증 가능 신호다.
 * 같은 날이면 경과 초로 continue/finish를 가른다.
 */
export function judgeSessionReturn(
  startedAtIso: string,
  nowIso: string,
  elapsedSeconds: number,
): SessionReturnJudgment {
  if (localDateKey(startedAtIso) !== localDateKey(nowIso)) {
    return 'carryover'
  }
  return elapsedSeconds >= FOCUS_SECONDS ? 'finish' : 'continue'
}

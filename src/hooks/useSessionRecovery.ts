import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { idbStorage } from '../storage/idb-storage'
import { activeSessionPointer } from '../lib/active-session-pointer'
import { computeElapsedSeconds, judgeSessionReturn } from '../lib/session-timer'
import { nowIso, todayDateString } from '../lib/time'
import { ROUTES } from '../routes/paths'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'

/**
 * 앱 부팅 1회 — SPEC §6/P13 "이탈"(화면잠금·백그라운드·강제종료·새로고침 전부 동일하게 취급)을
 * 살아남은 블록 하나만 복구한다. `tasks`/`queuedBlocks` 전체 복구는 의도적으로 하지 않는다
 * (Storage에 목록 조회 메서드가 없어 전역 계약 확장 없이는 불가능 — PH-06 착수 전 설계 결정 3).
 *
 * 포인터가 있는 동안(=복구할 세션이 실제로 있는 드문 경우만) `true`를 반환한다 — 호출부
 * (`AppShell`)가 이 창에서 라우트를 렌더하지 않도록 해서, 새로고침 시 URL이 `/focus`였던
 * 경우 "활성 블록 없음 → 대시보드 리다이렉트"가 먼저 커밋되고 그 직후 복구가 다시 `/focus`로
 * 되돌리는 대시보드 깜빡임(code review 발견)을 막는다.
 */
export function useSessionRecovery(): boolean {
  const navigate = useNavigate()
  const ranRef = useRef(false)
  const [isRecovering, setIsRecovering] = useState(() => activeSessionPointer.get() !== null)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    void recoverSession(navigate).finally(() => setIsRecovering(false))
  }, [navigate])

  return isRecovering
}

async function recoverSession(navigate: (path: string) => void): Promise<void> {
  const blockId = activeSessionPointer.get()
  if (!blockId) return

  const block = await idbStorage.findById<Block>('blocks', blockId)
  if (!block || (block.status !== 'in_progress' && block.status !== 'paused')) {
    activeSessionPointer.clear()
    return
  }

  const now = nowIso()
  const elapsedSeconds = computeElapsedSeconds(block.startedAt, 0, new Date(now).getTime())
  const judgment = judgeSessionReturn(block.startedAt, now, elapsedSeconds)

  const store = useAppStore.getState()

  if (judgment === 'continue') {
    useAppStore.setState({ activeBlock: block, elapsedSeconds })
    navigate(ROUTES.focus)
    return
  }

  // finish/carryover 둘 다 기존 complete()/markIncomplete()를 재사용한다 — activeBlock을 먼저
  // 세팅해야 그 액션들이 참조하는 get().activeBlock이 복구 대상 블록이 된다.
  useAppStore.setState({ activeBlock: block, elapsedSeconds })

  if (judgment === 'finish') {
    await store.complete()
    // 인메모리 predictions는 부팅 직후 항상 비어 있으므로(스토어가 재시작됐다) Storage에서
    // 직접 조회한다 — 그렇지 않으면 이 분기는 절대 참이 될 수 없는 죽은 코드가 된다
    // (code review 발견).
    const prediction = await idbStorage.findById<Prediction>('predictions', block.id)
    if (prediction) {
      await store.resolvePrediction(block.id, true)
    }
    await store.loadEnergyCellsForDate(todayDateString())
    await store.lightEnergyCell(block.id, todayDateString())
    store.setLastResolvedBlock({ ...block, status: 'done', endedAt: now })
    navigate(ROUTES.retro)
    return
  }

  // carryover — 침묵: 회고 없음, 에너지 없음, 내비게이션 없음(자동완료 ❌, SPEC §6).
  await store.markIncomplete()
}

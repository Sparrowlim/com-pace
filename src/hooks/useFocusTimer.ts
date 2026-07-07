import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { nowIso, todayDateString } from '../lib/time'

export const FOCUS_SECONDS = 900

export function formatRemaining(elapsedSeconds: number): string {
  const remaining = Math.max(FOCUS_SECONDS - elapsedSeconds, 0)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 15분 집중 타이머 오케스트레이션 — FocusPage에서 분리해 독립적으로 테스트 가능하게 한다.
 * finish()는 렌더 변수가 아니라 호출 시점의 스토어 스냅샷(getState)만 참조한다 — 완료/그만하기
 * 경합 없이 항상 최신 activeBlock/predictions를 보기 위함이다.
 */
export function useFocusTimer(onFinished: () => void) {
  const activeBlock = useAppStore((state) => state.activeBlock)
  const elapsedSeconds = useAppStore((state) => state.elapsedSeconds)
  const tick = useAppStore((state) => state.tick)
  const complete = useAppStore((state) => state.complete)
  const markIncomplete = useAppStore((state) => state.markIncomplete)
  const resolvePrediction = useAppStore((state) => state.resolvePrediction)
  const lightEnergyCell = useAppStore((state) => state.lightEnergyCell)
  const setLastResolvedBlock = useAppStore((state) => state.setLastResolvedBlock)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!activeBlock) return
    const id = window.setInterval(() => {
      tick()
    }, 1000)
    return () => window.clearInterval(id)
  }, [activeBlock, tick])

  const finish = async (completed: boolean) => {
    if (finishedRef.current) return
    const block = useAppStore.getState().activeBlock
    if (!block) return
    finishedRef.current = true

    if (completed) {
      await complete()
    } else {
      await markIncomplete()
    }
    // complete()/markIncomplete() clear activeBlock instead of returning the updated row, so the
    // retro screen's context is rebuilt here to match what they just persisted (SPEC §6 D-09 —
    // energy lights regardless of completed/incomplete).
    setLastResolvedBlock({
      ...block,
      status: completed ? 'done' : 'incomplete',
      endedAt: nowIso(),
    })

    const hasPrediction = useAppStore
      .getState()
      .predictions.some((prediction) => prediction.blockId === block.id)
    if (hasPrediction) {
      await resolvePrediction(block.id, completed)
    }
    await lightEnergyCell(block.id, todayDateString())
    onFinished()
  }

  useEffect(() => {
    if (elapsedSeconds >= FOCUS_SECONDS) {
      void finish(true)
    }
    // finish는 매 렌더 새로 만들어지지만 내부적으로 getState() 스냅샷만 참조하므로 deps에선 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds])

  // finishedRef가 true인 동안은 activeBlock이 이미 null이어도 "그만두는 중"이다 — FocusPage의
  // 가드가 이 창에서 대시보드로 잘못 리다이렉트하지 않도록 노출한다.
  return { activeBlock, elapsedSeconds, finish, isFinishing: finishedRef.current }
}

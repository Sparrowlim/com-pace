import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { nowIso, todayDateString } from '../lib/time'
import { FOCUS_SECONDS } from '../lib/session-timer'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'
import type { Block } from '../types/block'

export { FOCUS_SECONDS }

export function formatRemaining(elapsedSeconds: number): string {
  const remaining = Math.max(FOCUS_SECONDS - elapsedSeconds, 0)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// PH-08 §5 — 회고 전체 스킵의 유일한 사용자 대면 카피(과정 인정, 결과 판단 ❌). 자체 창작
// (DECISIONS 부록A, 원문 차용 금지).
export const DISCHARGE_END_MESSAGE = '오늘 15분, 켠 것만으로 충분해요'

// 정상 루프의 회고 진입 준비 — 방전 분기와 갈라지는 지점(useFocusTimer 본문 길이 억제 겸용).
// 에너지 점등은 여기서 하지 않는다 — ensureEnergyLit로 일원화됐다(PH-12 착수 전 설계 결정 1).
async function finishNormalPath(
  block: Block,
  completed: boolean,
  actions: {
    resolvePrediction: (blockId: string, completed: boolean) => Promise<unknown>
    setLastResolvedBlock: (block: Block) => void
  },
): Promise<void> {
  // complete()/markIncomplete() clear activeBlock instead of returning the updated row, so the
  // retro screen's context is rebuilt here to match what they just persisted (SPEC §6 D-09 —
  // energy lights regardless of completed/incomplete).
  actions.setLastResolvedBlock({
    ...block,
    status: completed ? 'done' : 'incomplete',
    endedAt: nowIso(),
  })

  const hasPrediction = useAppStore
    .getState()
    .predictions.some((prediction) => prediction.blockId === block.id)
  if (hasPrediction) {
    await actions.resolvePrediction(block.id, completed)
  }
}

// 방전 종료 준비(PH-08 §5) — 에너지는 방전 대시보드가 시작 시점에 이미 점등했으므로 재점등하지
// 않고, 예측도 애초에 없으므로 resolvePrediction도 없다(설계 결정 2·4). 딴생각 포착물은 처리할
// 회고 화면이 없으므로 조용히 폐기한다(설계 결정 7 · In-Scope D).
function finishDischargePath(actions: {
  setCapturedThought: (text: string | null) => void
  exitDischarge: () => void
  setDischargeEndMessage: (message: string | null) => void
}): void {
  actions.setCapturedThought(null)
  actions.exitDischarge()
  actions.setDischargeEndMessage(DISCHARGE_END_MESSAGE)
}

function useFocusTimerActions() {
  return {
    tick: useAppStore((state) => state.tick),
    complete: useAppStore((state) => state.complete),
    markIncomplete: useAppStore((state) => state.markIncomplete),
    resolvePrediction: useAppStore((state) => state.resolvePrediction),
    lightEnergyCell: useAppStore((state) => state.lightEnergyCell),
    setLastResolvedBlock: useAppStore((state) => state.setLastResolvedBlock),
    setCapturedThought: useAppStore((state) => state.setCapturedThought),
    exitDischarge: useAppStore((state) => state.exitDischarge),
    setDischargeEndMessage: useAppStore((state) => state.setDischargeEndMessage),
  }
}

// 블록별 1회 점등 가드 — 훅은 라우트 전환(다음 블록)마다 리마운트되므로 컴포넌트 스코프 ref로
// 충분하다(PH-12 착수 전 설계 결정 1). 이미 점등된 블록이면 no-op — 15분 자연 경과 시점과
// finish() 폴백 양쪽에서 안전하게 호출된다.
function useEnsureEnergyLit() {
  const lightEnergyCell = useAppStore((state) => state.lightEnergyCell)
  const energyLitRef = useRef<string | null>(null)
  return async (blockId: string) => {
    if (energyLitRef.current === blockId) return
    energyLitRef.current = blockId
    await lightEnergyCell(blockId, todayDateString())
  }
}

// code review CRITICAL fix — "was this discharge" is answered by tagging the specific block via a
// persisted pointer, not by reading the ambient dischargeMode flag. dischargeMode can outlive the
// discharge screens themselves (back button / away navigation before a block is even started), so
// keying off blockId means a later, unrelated normal block is never misclassified as discharge
// (which would have silently skipped its energy light/prediction resolution and skipped retro).
//
// 조기 이탈("그만하기")은 15분 도달 전이라 아직 점등된 적이 없다 — ensureEnergyLit이 여기서
// 보장한다. 방전은 대시보드가 시작 시점에 이미 점등했으므로 이 경로를 타지 않는다(설계 결정 2).
async function runFinish(
  completed: boolean,
  block: Block,
  ensureEnergyLit: (blockId: string) => Promise<void>,
  actions: ReturnType<typeof useFocusTimerActions>,
  onFinished: (wasDischarge: boolean) => void,
): Promise<void> {
  const wasDischarge = dischargeBlockPointer.get() === block.id
  if (wasDischarge) {
    dischargeBlockPointer.clear()
  } else {
    await ensureEnergyLit(block.id)
  }

  if (completed) {
    await actions.complete()
  } else {
    await actions.markIncomplete()
  }

  if (wasDischarge) {
    finishDischargePath(actions)
    onFinished(true)
    return
  }

  await finishNormalPath(block, completed, actions)
  onFinished(false)
}

// 15분 자연 경과 감지(SPEC §6 신설 행) — 방전 블록은 5-C를 완전히 우회하고 기존과 동일하게 즉시
// 종료한다(설계 결정 2). 그 외엔 에너지만 즉시 점등하고 완료 판정은 미룬다(사용자가 5-C에서
// 고른다).
function detectWrapUp(
  elapsedSeconds: number,
  finish: (completed: boolean) => Promise<void>,
  ensureEnergyLit: (blockId: string) => Promise<void>,
  setAwaitingWrapUp: (value: boolean) => void,
): void {
  if (elapsedSeconds < FOCUS_SECONDS) return
  const block = useAppStore.getState().activeBlock
  if (!block) return
  if (dischargeBlockPointer.get() === block.id) {
    void finish(true)
    return
  }
  void ensureEnergyLit(block.id)
  setAwaitingWrapUp(true)
}

/**
 * 15분 집중 타이머 오케스트레이션 — FocusPage에서 분리해 독립적으로 테스트 가능하게 한다.
 * finish()는 렌더 변수가 아니라 호출 시점의 스토어 스냅샷(getState)만 참조한다 — 완료/그만하기
 * 경합 없이 항상 최신 activeBlock/predictions를 보기 위함이다.
 *
 * onFinished는 방전 종료 여부를 인자로 받는다 — 방전은 /retro를 건너뛰고 대시보드로 직행한다
 * (PH-08 §5, 착수 전 설계 결정 2·6).
 */
export function useFocusTimer(onFinished: (wasDischarge: boolean) => void) {
  const activeBlock = useAppStore((state) => state.activeBlock)
  const elapsedSeconds = useAppStore((state) => state.elapsedSeconds)
  const actions = useFocusTimerActions()
  const { tick } = actions
  const finishedRef = useRef(false)
  const ensureEnergyLit = useEnsureEnergyLit()
  const [awaitingWrapUp, setAwaitingWrapUp] = useState(false)

  useEffect(() => {
    if (!activeBlock) return
    const id = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(id)
  }, [activeBlock, tick])

  const finish = async (completed: boolean) => {
    if (finishedRef.current) return
    const block = useAppStore.getState().activeBlock
    if (!block) return
    finishedRef.current = true
    setAwaitingWrapUp(false)
    await runFinish(completed, block, ensureEnergyLit, actions, onFinished)
  }

  useEffect(() => {
    detectWrapUp(elapsedSeconds, finish, ensureEnergyLit, setAwaitingWrapUp)
    // finish/ensureEnergyLit은 매 렌더 새로 만들어지지만 내부적으로 getState() 스냅샷만 참조하므로
    // deps에선 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds])

  // finishedRef가 true인 동안은 activeBlock이 이미 null이어도 "그만두는 중"이다 — FocusPage의
  // 가드가 이 창에서 대시보드로 잘못 리다이렉트하지 않도록 노출한다.
  return {
    activeBlock,
    elapsedSeconds,
    finish,
    isFinishing: finishedRef.current,
    awaitingWrapUp,
  }
}

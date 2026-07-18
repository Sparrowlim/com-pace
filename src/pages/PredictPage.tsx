import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { OptionRow } from '../components/OptionRow'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { todayDateString } from '../lib/time'
import { isFocusGestureHintShown, markFocusGestureHintShown } from '../lib/focus-gesture-hint'
import { ROUTES } from '../routes/paths'
import styles from './PredictPage.module.css'

export default function PredictPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const dequeueBlock = useAppStore((state) => state.dequeueBlock)
  const startBlock = useAppStore((state) => state.startBlock)
  const setPrediction = useAppStore((state) => state.setPrediction)
  const startSession = useAppStore((state) => state.startSession)
  const navigate = useNavigate()

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined

  // 신규(P0-B) — tap=포착/long=일시정지 제스처는 FocusPage에 힌트를 둘 수 없다(§6 "집중 화면
  // 볼거리 금지"). 기존엔 회고에서만 알려줘 '첫 블록'엔 안내가 없었다(회고는 블록 종료 후에야
  // 뜬다). Predict는 첫 집중 세션 바로 앞 화면이므로, 최초 1회 여기서 조용히 알려주고 마킹한다
  // — 이후 회고 힌트는 자연히 뜨지 않는다(같은 플래그 공유). 훅은 early-return보다 먼저 호출하고
  // (rules-of-hooks), 실제 predict UI를 그리는 경우에만 마킹해 플래그를 헛되이 소모하지 않는다
  // (RetroPage의 block 가드와 동일 취지).
  const willRenderPredict = !activeBlock && !!task && !!next
  const [showGestureHint] = useState(() => !isFocusGestureHintShown())
  useEffect(() => {
    if (showGestureHint && willRenderPredict) {
      markFocusGestureHintShown()
    }
  }, [showGestureHint, willRenderPredict])

  // One Task 불변식(CLAUDE §2) — 브라우저 뒤로가기로 돌아와도 이미 진행 중인 블록이 있으면
  // 그쪽으로 보낸다. 그렇지 않으면 같은 과제의 다음 조각을 또 시작할 수 있어 activeBlock이
  // 조용히 덮어써지고 이전 블록이 in_progress 상태로 고아가 된다.
  if (activeBlock) {
    return <Navigate to={ROUTES.focus} replace />
  }

  if (!task || !next) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const taskId = task.id
  const nextId = next.id
  const nextVerbLabel = next.verbLabel

  async function choose(guess: boolean) {
    dequeueBlock(nextId)
    const block = await startBlock(taskId, nextVerbLabel)
    await setPrediction(block.id, guess)
    await startSession(todayDateString(), false)
    navigate(ROUTES.focus)
  }

  return (
    <div className={styles.page}>
      <p className={styles.prompt}>이번 15분: {nextVerbLabel}</p>
      <p className={styles.question}>이번 15분에 끝날까요?</p>
      {showGestureHint && (
        <p className={styles.gestureHint}>
          곧 집중 화면에서, 톡 누르면 딴생각을 적어두고 길게 누르면 잠시 멈출 수 있어요.
        </p>
      )}
      <div className={styles.options}>
        <OptionRow label="끝날 것 같아요" selected={false} onSelect={() => choose(true)} />
        <OptionRow label="더 걸릴 것 같아요" selected={false} onSelect={() => choose(false)} />
      </div>
    </div>
  )
}

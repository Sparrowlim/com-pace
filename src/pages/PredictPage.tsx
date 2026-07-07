import { Navigate, useNavigate } from 'react-router-dom'
import { OptionRow } from '../components/OptionRow'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { ROUTES } from '../routes/paths'
import styles from './PredictPage.module.css'

export default function PredictPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const dequeueBlock = useAppStore((state) => state.dequeueBlock)
  const startBlock = useAppStore((state) => state.startBlock)
  const setPrediction = useAppStore((state) => state.setPrediction)
  const navigate = useNavigate()

  // One Task 불변식(CLAUDE §2) — 브라우저 뒤로가기로 돌아와도 이미 진행 중인 블록이 있으면
  // 그쪽으로 보낸다. 그렇지 않으면 같은 과제의 다음 조각을 또 시작할 수 있어 activeBlock이
  // 조용히 덮어써지고 이전 블록이 in_progress 상태로 고아가 된다.
  if (activeBlock) {
    return <Navigate to={ROUTES.focus} replace />
  }

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined

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
    navigate(ROUTES.focus)
  }

  return (
    <div className={styles.page}>
      <p className={styles.prompt}>이번 15분: {nextVerbLabel}</p>
      <p className={styles.question}>이번 15분에 끝날까요?</p>
      <div className={styles.options}>
        <OptionRow label="끝날 것 같아요" selected={false} onSelect={() => choose(true)} />
        <OptionRow label="더 걸릴 것 같아요" selected={false} onSelect={() => choose(false)} />
      </div>
    </div>
  )
}

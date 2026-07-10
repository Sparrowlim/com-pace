import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { ROUTES } from '../routes/paths'
import styles from './DischargeEntryPage.module.css'

export default function DischargeEntryPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const enterDischarge = useAppStore((state) => state.enterDischarge)
  const navigate = useNavigate()

  // One Task 불변식(CLAUDE §2) — 이미 진행 중인 블록이 있으면 그쪽으로(PredictPage와 동일 가드).
  if (activeBlock) {
    return <Navigate to={ROUTES.focus} replace />
  }

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined

  // 방전은 실행할 진짜 조각이 있어야 성립한다(SPEC §5 "진짜 과제 보존") — 없으면 대시보드로.
  if (!task || !task.splitDone || !next) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <div className={styles.page}>
      <p className={styles.copy}>무리하지 않아도 괜찮아요. 오늘은 딱 하나만, 가볍게 가볼까요?</p>
      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={() => {
            enterDischarge()
            navigate(ROUTES.dischargeDashboard)
          }}
        >
          딱 하나만 할래요
        </Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.dashboard)}>
          평소 모드로 볼게요
        </Button>
      </div>
    </div>
  )
}

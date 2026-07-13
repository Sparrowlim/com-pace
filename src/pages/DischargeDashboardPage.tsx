import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/Button'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { todayDateString } from '../lib/time'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'
import { ROUTES } from '../routes/paths'
import styles from './DischargeDashboardPage.module.css'

function useDischargeDashboardStoreState() {
  return {
    tasks: useAppStore((state) => state.tasks),
    queuedBlocks: useAppStore((state) => state.queuedBlocks),
    activeBlock: useAppStore((state) => state.activeBlock),
    dischargeMode: useAppStore((state) => state.dischargeMode),
    startBlock: useAppStore((state) => state.startBlock),
    startSession: useAppStore((state) => state.startSession),
    lightEnergyCell: useAppStore((state) => state.lightEnergyCell),
    exitDischarge: useAppStore((state) => state.exitDischarge),
  }
}

export default function DischargeDashboardPage() {
  const store = useDischargeDashboardStoreState()
  const { tasks, queuedBlocks, activeBlock, dischargeMode } = store
  const { startBlock, startSession, lightEnergyCell, exitDischarge } = store
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)

  // code review 발견 — 뒤로가기/직접 URL 이탈로 이 화면을 떠나면 dischargeMode가 켜진 채
  // 남을 수 있다. 블록을 실제로 시작했는지 여부는 dischargeBlockPointer가 별도로 책임지므로
  // (useFocusTimer.finish/useSessionRecovery의 분기 근거), 이 플래그는 오직 이 화면·진입
  // 화면의 노출만 게이트한다 — 떠날 때 무조건 꺼도 안전하다.
  useEffect(() => {
    return () => exitDischarge()
  }, [exitDischarge])

  // One Task 불변식(CLAUDE §2) — 이미 진행 중인 블록이 있으면 그쪽으로(PredictPage와 동일 가드).
  if (activeBlock) {
    return <Navigate to={ROUTES.focus} replace />
  }

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined

  // dischargeMode가 꺼져 있거나(직접 진입) 실행할 조각이 사라졌으면 평소 대시보드로.
  if (!dischargeMode || !task || !next) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const taskId = task.id
  const verbLabel = next.verbLabel

  // 착수 전 설계 결정 3 — dequeueBlock을 호출하지 않는다. 조각은 큐에 그대로 남아 다음날/평소
  // 모드에서도 재사용된다(진짜 과제 보존, SPEC §5). 설계 결정 4 — 에너지는 예측 없이 곧장
  // 시작하는 이 시점에 즉시 점등한다(정상 루프는 종료 시점). dischargeBlockPointer.set은
  // startBlock 직후 반드시 lightEnergyCell/navigate보다 먼저 — 이 블록이 방전으로 시작됐음을
  // 블록 자신에 붙여, 이후 useFocusTimer.finish()가 세션 상태가 아니라 이 표식으로 분기하게
  // 한다(code review CRITICAL 수정 — dischargeMode만 읽으면 다른 정상 블록까지 오분류됨).
  const handleStart = async () => {
    if (isStarting) return
    setIsStarting(true)
    const block = await startBlock(taskId, verbLabel)
    dischargeBlockPointer.set(block.id)
    await lightEnergyCell(block.id, todayDateString())
    await startSession(todayDateString(), true)
    navigate(ROUTES.focus)
  }

  const handleExit = () => {
    exitDischarge()
    navigate(ROUTES.dashboard)
  }

  return (
    <div className={styles.page} data-mode="discharge">
      <div data-task-card>
        <TaskCard title={task.title}>
          <p className={styles.nextLabel}>다음 조각: {verbLabel}</p>
          <p className={styles.copy}>타이머만 켜면, 오늘의 승리예요</p>
          <Button variant="primary" onClick={handleStart} disabled={isStarting}>
            타이머만 켜면 승리
          </Button>
        </TaskCard>
      </div>
      <Button variant="secondary" onClick={handleExit}>
        평소 모드로 돌아가기
      </Button>
    </div>
  )
}

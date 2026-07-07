import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { EnergyBar } from '../components/EnergyBar'
import { Button } from '../components/Button'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { ROUTES } from '../routes/paths'
import styles from './RetroPage.module.css'

function RecognitionChip({ completed }: { completed: boolean }) {
  return (
    <span className={completed ? styles.doneChip : styles.carryChip}>
      {completed ? '완료' : '이어감'}
    </span>
  )
}

// SCREEN-FLOW §3-2 — 적중일 때만 렌더, 빗나감은 이 카드 자체가 없다(배지·박스 없음).
function BonusCard({ hit }: { hit: boolean }) {
  if (!hit) return null
  return (
    <div className={styles.bonusCard}>
      <p className={styles.bonusText}>예측이 딱 맞았어요.</p>
    </div>
  )
}

function RetroActions({
  completed,
  onNext,
  onContinue,
  onStop,
}: {
  completed: boolean
  onNext: () => void
  onContinue: () => void
  onStop: () => void
}) {
  if (completed) {
    return (
      <Button variant="primary" onClick={onNext}>
        바로 다음 블록
      </Button>
    )
  }
  return (
    <div className={styles.actions}>
      <Button variant="primary" onClick={onContinue}>
        이어서 15분 더
      </Button>
      <Button variant="secondary" onClick={onStop}>
        오늘은 여기까지
      </Button>
    </div>
  )
}

export default function RetroPage() {
  const lastResolvedBlock = useAppStore((state) => state.lastResolvedBlock)
  const predictions = useAppStore((state) => state.predictions)
  const energyCells = useAppStore((state) => state.energyCells)
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const startBlock = useAppStore((state) => state.startBlock)
  const setLastResolvedBlock = useAppStore((state) => state.setLastResolvedBlock)
  const navigate = useNavigate()

  // 컨텍스트 정리는 언마운트 시 한 번만 — 핸들러 안에서 지우면 그 즉시 이 컴포넌트가
  // lastResolvedBlock=null로 리렌더되어 위 가드가 먼저 대시보드로 리다이렉트해버리고
  // 뒤이은 navigate() 호출과 경합한다.
  useEffect(() => {
    return () => setLastResolvedBlock(null)
  }, [setLastResolvedBlock])

  if (!lastResolvedBlock) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const block = lastResolvedBlock
  const completed = block.status === 'done'
  const prediction = predictions.find((p) => p.blockId === block.id)
  const hit = prediction ? prediction.guess === prediction.actual : false

  const handleNext = () => {
    const task = selectActiveTask(tasks, queuedBlocks)
    const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined
    navigate(next ? ROUTES.predict : ROUTES.dashboard)
  }

  const handleContinue = async () => {
    await startBlock(block.taskId, block.verbLabel)
    navigate(ROUTES.focus)
  }

  const handleStop = () => {
    navigate(ROUTES.dashboard)
  }

  return (
    <div className={styles.page}>
      <p className={styles.headline}>
        {completed ? '15분, 오늘도 해냈어요.' : '오늘은 여기까지, 15분만큼의 증거는 남았어요.'}
      </p>
      <RecognitionChip completed={completed} />
      <BonusCard hit={hit} />
      <EnergyBar filledCount={energyCells.length} justFilledIndex={energyCells.length - 1} />
      <RetroActions
        completed={completed}
        onNext={handleNext}
        onContinue={handleContinue}
        onStop={handleStop}
      />
    </div>
  )
}

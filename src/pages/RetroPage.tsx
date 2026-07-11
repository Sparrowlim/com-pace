import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { EnergyBar } from '../components/EnergyBar'
import { Button } from '../components/Button'
import { OptionRow } from '../components/OptionRow'
import { BonusCard } from '../components/BonusCard'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import type { TimeSenseFeedback } from '../store/slices/retro-context-slice'
import { ROUTES } from '../routes/paths'
import styles from './RetroPage.module.css'

// PH-04.4 1-3 — 회고 화면 로컬 전용, export하지 않는다(카탈로그·다른 화면으로 새면 성적표가
// 된다). 파일 위치+ESLint no-restricted-imports 이중 격리(DESIGN-TOKENS §5-5).
function StateChip({ completed }: { completed: boolean }) {
  return (
    <span className={completed ? styles.doneChip : styles.carryChip}>
      {completed ? '완료' : '이어감'}
    </span>
  )
}

// PH-05.1 — 영점조절 체감(SPEC §3, D-11). 완료/미완료 무관하게 항상 렌더하고(성공/실패
// 양쪽 모두 존재하는 별개 축), 응답을 강제하지 않는다 — 미선택 상태로 진행 버튼을 눌러도 된다.
function TimeSenseCalibration({
  value,
  onSelect,
}: {
  value: TimeSenseFeedback | null
  onSelect: (value: TimeSenseFeedback) => void
}) {
  return (
    <div className={styles.timeSenseOptions}>
      <OptionRow
        label="순식간이었어요"
        selected={value === 'fast'}
        onSelect={() => onSelect('fast')}
      />
      <OptionRow
        label="딱 15분이었어요"
        selected={value === 'on_time'}
        onSelect={() => onSelect('on_time')}
      />
      <OptionRow
        label="너무 길게 느껴졌어요"
        selected={value === 'slow'}
        onSelect={() => onSelect('slow')}
      />
    </div>
  )
}

// SPEC §6 5-A — 블록 종료 직후 1회성 표시, 상주 목록 없음. 처리 안 하고 이탈하면 조용히 사라진다
// (RetroPage 언마운트 클린업에서 capturedThought도 함께 지움).
function CapturedThoughtCard({
  text,
  onDiscard,
  onRefragment,
}: {
  text: string
  onDiscard: () => void
  onRefragment: () => void
}) {
  return (
    <div className={styles.captureCard}>
      <p className={styles.captureText}>아까 스친 생각: “{text}”</p>
      <div className={styles.captureActions}>
        <Button variant="secondary" onClick={onDiscard}>
          버리기
        </Button>
        <Button variant="secondary" onClick={onRefragment}>
          새 조각화
        </Button>
      </div>
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

function resolveNextRoute(
  tasks: Parameters<typeof selectActiveTask>[0],
  queuedBlocks: Parameters<typeof selectActiveTask>[1],
): string {
  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined
  return next ? ROUTES.predict : ROUTES.dashboard
}

function makeThoughtActions(
  capturedThought: string | null,
  setCapturedThought: (text: string | null) => void,
  queueBlocks: (taskId: string, verbLabels: string[]) => void,
  taskId: string,
) {
  return {
    onDiscard: () => setCapturedThought(null),
    onRefragment: () => {
      if (capturedThought) {
        queueBlocks(taskId, [capturedThought])
      }
      setCapturedThought(null)
    },
  }
}

// 컨텍스트 정리는 언마운트 시 한 번만 — 핸들러 안에서 지우면 그 즉시 이 컴포넌트가
// lastResolvedBlock=null로 리렌더되어 위 가드가 먼저 대시보드로 리다이렉트해버리고
// 뒤이은 navigate() 호출과 경합한다. capturedThought도 같은 타이밍에 정리 — 처리 안 하고
// 이탈하면 조용히 사라진다(SPEC §6 5-A, 상주 목록 없음).
function useClearRetroContextOnUnmount(
  setLastResolvedBlock: (block: null) => void,
  setCapturedThought: (text: null) => void,
  setTimeSenseFeedback: (value: null) => void,
) {
  useEffect(() => {
    return () => {
      setLastResolvedBlock(null)
      setCapturedThought(null)
      setTimeSenseFeedback(null)
    }
  }, [setLastResolvedBlock, setCapturedThought, setTimeSenseFeedback])
}

function useRetroStoreState() {
  return {
    lastResolvedBlock: useAppStore((state) => state.lastResolvedBlock),
    predictions: useAppStore((state) => state.predictions),
    energyCells: useAppStore((state) => state.energyCells),
    tasks: useAppStore((state) => state.tasks),
    queuedBlocks: useAppStore((state) => state.queuedBlocks),
    startBlock: useAppStore((state) => state.startBlock),
    setLastResolvedBlock: useAppStore((state) => state.setLastResolvedBlock),
    capturedThought: useAppStore((state) => state.capturedThought),
    setCapturedThought: useAppStore((state) => state.setCapturedThought),
    queueBlocks: useAppStore((state) => state.queueBlocks),
    timeSenseFeedback: useAppStore((state) => state.timeSenseFeedback),
    setTimeSenseFeedback: useAppStore((state) => state.setTimeSenseFeedback),
  }
}

export default function RetroPage() {
  const store = useRetroStoreState()
  const { lastResolvedBlock, predictions, energyCells, tasks, queuedBlocks } = store
  const { startBlock, setLastResolvedBlock, capturedThought, setCapturedThought, queueBlocks } =
    store
  const { timeSenseFeedback, setTimeSenseFeedback } = store
  const navigate = useNavigate()
  useClearRetroContextOnUnmount(setLastResolvedBlock, setCapturedThought, setTimeSenseFeedback)

  if (!lastResolvedBlock) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const block = lastResolvedBlock
  const completed = block.status === 'done'
  const prediction = predictions.find((p) => p.blockId === block.id)
  const hit = prediction ? prediction.guess === prediction.actual : false

  const handleNext = () => navigate(resolveNextRoute(tasks, queuedBlocks))

  const handleContinue = async () => {
    await startBlock(block.taskId, block.verbLabel)
    navigate(ROUTES.focus)
  }

  // PH-06.1 — "오늘은 여기까지"는 조각을 버리지 않고 같은 과제 큐 후미로 되돌린다(세션 내 이월,
  // SPEC §6 경계 주). queueBlocks가 이미 후미 append + 신규 id 발급을 하므로 그대로 재사용한다.
  // "이어서 15분 더"는 같은 조각을 즉시 재시작해 소멸이 없으므로 재큐잉하지 않는다.
  const handleStop = () => {
    queueBlocks(block.taskId, [block.verbLabel])
    navigate(ROUTES.dashboard)
  }

  const thoughtActions = makeThoughtActions(
    capturedThought,
    setCapturedThought,
    queueBlocks,
    block.taskId,
  )

  return (
    <div className={styles.page}>
      <p className={styles.headline}>
        {completed ? '15분, 오늘도 해냈어요.' : '오늘은 여기까지, 15분만큼의 증거는 남았어요.'}
      </p>
      <StateChip completed={completed} />
      <TimeSenseCalibration value={timeSenseFeedback} onSelect={setTimeSenseFeedback} />
      <BonusCard hit={hit} />
      {capturedThought && <CapturedThoughtCard text={capturedThought} {...thoughtActions} />}
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

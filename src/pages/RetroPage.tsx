import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { EnergyBar } from '../components/EnergyBar'
import { Button } from '../components/Button'
import { OptionRow } from '../components/OptionRow'
import { BonusCard } from '../components/BonusCard'
import { useAppStore } from '../store'
import { resolveNextRoute } from '../lib/core-loop-selectors'
import { todayDateString } from '../lib/time'
import { isFocusGestureHintShown, markFocusGestureHintShown } from '../lib/focus-gesture-hint'
import type { TimeSenseFeedback } from '../store/slices/retro-context-slice'
import type { Block } from '../types/block'
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

// 신규 — 집중 화면(FocusPage)은 탭/롱프레스 제스처에 대한 어떤 힌트도 화면에 두지 않는다
// (TimerDisplay는 라벨+숫자만, CLAUDE §6 "집중 화면 볼거리 금지" 보호). 대신 그 제스처를 처음
// 쓸 기회가 생기는 다음 블록을 위해, 이 전환 화면(회고)에서 딱 한 번만 조용히 알려준다
// (focus-gesture-hint.ts로 최초 1회 여부 판정, 보여준 뒤엔 다시 뜨지 않음).
function GestureHintCard() {
  return (
    <p className={styles.gestureHint}>
      참고로, 다음 집중 화면에서는 톡 누르면 딴생각을 적어두고 길게 누르면 잠시 멈출 수 있어요.
    </p>
  )
}

function RetroActions({
  completed,
  onNext,
  onRest,
  onContinue,
  onStop,
}: {
  completed: boolean
  onNext: () => void
  onRest: () => void
  onContinue: () => void
  onStop: () => void
}) {
  if (completed) {
    return (
      <div className={styles.actions}>
        <Button variant="primary" onClick={onNext}>
          바로 다음 블록
        </Button>
        <Button variant="secondary" onClick={onRest}>
          잠시 쉬기
        </Button>
      </div>
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

// RetroPage 본체를 50줄 제한 아래로 유지하려는 팩토리 추출 — makeThoughtActions와 동일 패턴
// (PH-09 DashboardPage.handleAddTask 선례).
function makeRetroActions(
  navigate: (path: string) => void,
  tasks: Parameters<typeof resolveNextRoute>[0],
  queuedBlocks: Parameters<typeof resolveNextRoute>[1],
  block: Block,
  startBlock: (taskId: string, verbLabel: string) => Promise<unknown>,
  queueBlocks: (taskId: string, verbLabels: string[]) => void,
  startSession: (date: string, dischargeMode: boolean) => Promise<unknown>,
) {
  return {
    handleNext: () => navigate(resolveNextRoute(tasks, queuedBlocks)),
    handleRest: () => navigate(ROUTES.rest),
    handleContinue: async () => {
      await startBlock(block.taskId, block.verbLabel)
      await startSession(todayDateString(), false)
      navigate(ROUTES.focus)
    },
    // PH-06.1 — "오늘은 여기까지"는 조각을 버리지 않고 같은 과제 큐 후미로 되돌린다(세션 내 이월,
    // SPEC §6 경계 주). queueBlocks가 이미 후미 append + 신규 id 발급을 하므로 그대로 재사용한다.
    // "이어서 15분 더"는 같은 조각을 즉시 재시작해 소멸이 없으므로 재큐잉하지 않는다.
    handleStop: () => {
      queueBlocks(block.taskId, [block.verbLabel])
      navigate(ROUTES.dashboard)
    },
  }
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
    predictions: useAppStore((state) => state.predictions),
    energyCells: useAppStore((state) => state.energyCells),
    tasks: useAppStore((state) => state.tasks),
    queuedBlocks: useAppStore((state) => state.queuedBlocks),
    startBlock: useAppStore((state) => state.startBlock),
    startSession: useAppStore((state) => state.startSession),
    setLastResolvedBlock: useAppStore((state) => state.setLastResolvedBlock),
    capturedThought: useAppStore((state) => state.capturedThought),
    setCapturedThought: useAppStore((state) => state.setCapturedThought),
    queueBlocks: useAppStore((state) => state.queueBlocks),
    timeSenseFeedback: useAppStore((state) => state.timeSenseFeedback),
    setTimeSenseFeedback: useAppStore((state) => state.setTimeSenseFeedback),
  }
}

export default function RetroPage() {
  // React 18 StrictMode(dev)는 마운트 직후 effect를 클린업→재실행 한 번 더 시뮬레이션한다.
  // useClearRetroContextOnUnmount의 클린업이 그 순간 스토어의 lastResolvedBlock을 null로 되돌리면서
  // (실제 언마운트가 아님) 아래 가드가 오작동해 회고 화면이 뜨자마자 대시보드로 튕겨나갔다(PH-05.2
  // 리포트). 라이브 구독 대신 마운트 시점 스냅샷을 렌더 기준으로 삼아 그 순간적 null에 반응하지 않게 한다.
  const [block] = useState(() => useAppStore.getState().lastResolvedBlock)
  const store = useRetroStoreState()
  const { predictions, energyCells, tasks, queuedBlocks } = store
  const { startBlock, setLastResolvedBlock, capturedThought, setCapturedThought, queueBlocks } =
    store
  const { timeSenseFeedback, setTimeSenseFeedback } = store
  const navigate = useNavigate()
  useClearRetroContextOnUnmount(setLastResolvedBlock, setCapturedThought, setTimeSenseFeedback)

  // 최초 1회 판정은 마운트 시점 스냅샷으로 고정(block과 동일한 이유) — 렌더 중간에 값이 바뀌어
  // 카드가 깜빡이며 사라지지 않게 한다. 실제 "봤다" 기록은 effect에서 한 번만 남긴다.
  // code review 발견 — block이 없어 카드가 실제로 그려지지 않는 렌더(예: /retro 직접 진입)에서도
  // 훅은 이 return보다 먼저 실행되므로, block도 함께 확인하지 않으면 아무것도 보여주지 못한 채
  // 최초 1회 플래그만 소모돼버린다.
  const [showGestureHint] = useState(() => !isFocusGestureHintShown())
  useEffect(() => {
    if (showGestureHint && block) {
      markFocusGestureHintShown()
    }
  }, [showGestureHint, block])

  if (!block) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const completed = block.status === 'done'
  const prediction = predictions.find((p) => p.blockId === block.id)
  const hit = prediction ? prediction.guess === prediction.actual : false

  const { handleNext, handleRest, handleContinue, handleStop } = makeRetroActions(
    navigate,
    tasks,
    queuedBlocks,
    block,
    startBlock,
    queueBlocks,
    store.startSession,
  )

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
      {showGestureHint && <GestureHintCard />}
      {capturedThought && <CapturedThoughtCard text={capturedThought} {...thoughtActions} />}
      {/* 앵커존 — EnergyBar가 액션 자신이 아니라 이 그룹에 함께 담겨야 뷰포트 하단에 같이
          고정된다. margin-top:auto가 .actions 하나에만 걸려 있으면 EnergyBar는 상단 콘텐츠
          흐름에 남고 버튼만 바닥으로 밀려나 큰 공백이 생긴다(2026-07-18 실측 스크린샷으로 발견
          — DashboardPage.bottomGroup과 실제로는 다른 배치였다). */}
      <div className={styles.bottomGroup}>
        <EnergyBar filledCount={energyCells.length} justFilledIndex={energyCells.length - 1} />
        <RetroActions
          completed={completed}
          onNext={handleNext}
          onRest={handleRest}
          onContinue={handleContinue}
          onStop={handleStop}
        />
      </div>
    </div>
  )
}

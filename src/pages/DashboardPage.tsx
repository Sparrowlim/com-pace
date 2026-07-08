import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/Button'
import { EnergyBar } from '../components/EnergyBar'
import { OptionRow } from '../components/OptionRow'
import { useAppStore } from '../store'
import {
  selectActiveTask,
  selectNextQueuedBlock,
  selectQueuedBlocksForTask,
} from '../lib/core-loop-selectors'
import type { QueuedBlock } from '../store/slices/block-queue-slice'
import type { Task } from '../types/task'
import { todayDateString } from '../lib/time'
import { isOnboardingComplete } from '../lib/onboarding-status'
import { ROUTES } from '../routes/paths'
import styles from './DashboardPage.module.css'

function TimerInProgressCard({ onReturn }: { onReturn: () => void }) {
  return (
    <div data-task-card>
      <TaskCard title="타이머가 진행 중이에요">
        <Button variant="primary" onClick={onReturn}>
          돌아가기
        </Button>
      </TaskCard>
    </div>
  )
}

type AddTaskPromptProps = {
  draftTitle: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
}

function AddTaskPrompt({ draftTitle, onDraftChange, onSubmit }: AddTaskPromptProps) {
  return (
    <>
      <p className={styles.prompt}>지금 눈에 걸리는 아무거나, 사소해도 괜찮아요</p>
      <input
        className={styles.input}
        type="text"
        value={draftTitle}
        onChange={(e) => onDraftChange(e.target.value)}
      />
      <Button variant="primary" disabled={!draftTitle.trim()} onClick={onSubmit}>
        다음
      </Button>
    </>
  )
}

type TaskCtaProps = {
  title: string
  nextLabel?: string
  ctaLabel: string
  onClick: () => void
}

function TaskCta({ title, nextLabel, ctaLabel, onClick }: TaskCtaProps) {
  return (
    <div data-task-card>
      <TaskCard title={title}>
        {nextLabel && <p className={styles.nextLabel}>다음 조각: {nextLabel}</p>}
        <Button variant="primary" onClick={onClick}>
          {ctaLabel}
        </Button>
      </TaskCard>
    </div>
  )
}

// PH-05.1 — "만만한 1개 자기선택"(SPEC §3, D-05). 큐가 2개 이상일 때만 나타난다(1개면 기존
// TaskCta로 자동 진행, 마찰 0). 목록은 쪼갠 순서 그대로 — 정렬·중요도 힌트 없음(우선순위
// 판단 재도입 금지). 탭이 곧 확정이라 별도 확인 버튼이 없다.
type FragmentChoiceProps = {
  title: string
  options: QueuedBlock[]
  onChoose: (blockId: string) => void
}

function FragmentChoice({ title, options, onChoose }: FragmentChoiceProps) {
  return (
    <div data-task-card>
      <TaskCard title={title}>
        <p className={styles.nextLabel}>어떤 조각부터 해볼까요? 만만한 걸로 골라봐요</p>
        <div className={styles.options}>
          {options.map((option) => (
            <OptionRow
              key={option.id}
              label={option.verbLabel}
              selected={false}
              onSelect={() => onChoose(option.id)}
            />
          ))}
        </div>
      </TaskCard>
    </div>
  )
}

type ActiveTaskSectionProps = {
  hasActiveBlock: boolean
  task: Task | undefined
  next: QueuedBlock | undefined
  fragmentOptions: QueuedBlock[]
  draftTitle: string
  onDraftChange: (value: string) => void
  onSubmitDraft: () => void
  onReturnToFocus: () => void
  onGoSplit: () => void
  onGoPredict: () => void
  onChooseFragment: (blockId: string) => void
}

// 대시보드가 매번 보여줄 "지금 할 일" 한 조각을 고르는 분기 — One Task 불변식(CLAUDE §2)의
// 핵심 렌더 로직이라 DashboardPage 본체에서 분리해 각 상태를 개별적으로 읽기 쉽게 둔다.
function ActiveTaskSection({
  hasActiveBlock,
  task,
  next,
  fragmentOptions,
  draftTitle,
  onDraftChange,
  onSubmitDraft,
  onReturnToFocus,
  onGoSplit,
  onGoPredict,
  onChooseFragment,
}: ActiveTaskSectionProps) {
  if (hasActiveBlock) {
    return <TimerInProgressCard onReturn={onReturnToFocus} />
  }
  if (!task) {
    return (
      <AddTaskPrompt
        draftTitle={draftTitle}
        onDraftChange={onDraftChange}
        onSubmit={onSubmitDraft}
      />
    )
  }
  if (!task.splitDone) {
    return <TaskCta title={task.title} ctaLabel="쪼개러 가기" onClick={onGoSplit} />
  }
  if (fragmentOptions.length >= 2) {
    return (
      <FragmentChoice title={task.title} options={fragmentOptions} onChoose={onChooseFragment} />
    )
  }
  return (
    <TaskCta
      title={task.title}
      nextLabel={next?.verbLabel}
      ctaLabel="이 블록 시작하기"
      onClick={onGoPredict}
    />
  )
}

export default function DashboardPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const energyCells = useAppStore((state) => state.energyCells)
  const loadEnergyCellsForDate = useAppStore((state) => state.loadEnergyCellsForDate)
  const addTask = useAppStore((state) => state.addTask)
  const promoteQueuedBlock = useAppStore((state) => state.promoteQueuedBlock)
  const navigate = useNavigate()
  const [draftTitle, setDraftTitle] = useState('')

  useEffect(() => {
    loadEnergyCellsForDate(todayDateString())
  }, [loadEnergyCellsForDate])

  // 최초 실행 라우팅 게이트(PH-07) — 온보딩을 마치지 않은 사용자는 항상 온보딩으로 우회된다
  // (SplitPage/PredictPage가 이미 쓰는 국소 <Navigate replace> 가드와 동일 스타일 — 훅 호출 이후에
  // 조건부로 반환해야 rules-of-hooks를 지킨다).
  if (!isOnboardingComplete()) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  const handleAddTask = async () => {
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    await addTask(trimmed)
    navigate(ROUTES.split)
  }

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined
  const fragmentOptions = task ? selectQueuedBlocksForTask(queuedBlocks, task.id) : []

  return (
    <div className={styles.page}>
      <ActiveTaskSection
        hasActiveBlock={!!activeBlock}
        task={task}
        next={next}
        fragmentOptions={fragmentOptions}
        draftTitle={draftTitle}
        onDraftChange={setDraftTitle}
        onSubmitDraft={handleAddTask}
        onReturnToFocus={() => navigate(ROUTES.focus)}
        onGoSplit={() => navigate(ROUTES.split)}
        onGoPredict={() => navigate(ROUTES.predict)}
        onChooseFragment={(blockId) => {
          if (!task) return
          promoteQueuedBlock(task.id, blockId)
          navigate(ROUTES.predict)
        }}
      />
      <EnergyBar filledCount={energyCells.length} />
    </div>
  )
}

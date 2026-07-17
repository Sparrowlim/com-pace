import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, type NavigateFunction } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/Button'
import { EnergyBar } from '../components/EnergyBar'
import { OptionRow } from '../components/OptionRow'
import { TextInput } from '../components/TextInput'
import { NorthStarBadge } from '../components/NorthStarBadge'
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
import { getNorthStar } from '../lib/north-star-storage'
import { hasNorthStar } from '../lib/north-star-selectors'
import type { NorthStar } from '../types/north-star'
import { ROUTES } from '../routes/paths'
import styles from './DashboardPage.module.css'

// ADHD 공간 일관성 통합(composition.md CMP-2) — 카드는 콘텐츠만, "돌아가기"는 다른 상태의
// 주 CTA와 함께 앵커존에서 렌더한다(resolveActiveTaskView가 함께 계산).
function TimerInProgressCard() {
  return (
    <div data-task-card>
      <TaskCard title="타이머가 진행 중이에요" />
    </div>
  )
}

type AddTaskPromptProps = {
  draftTitle: string
  onDraftChange: (value: string) => void
}

// RetroPage의 makeThoughtActions와 동일한 팩토리 패턴 — 컴포넌트 밖으로 빼 본체를 얇게 유지한다.
function createAddTaskHandler(
  draftTitle: string,
  addTask: (title: string) => Promise<Task>,
  navigate: NavigateFunction,
): () => Promise<void> {
  return async () => {
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    await addTask(trimmed)
    navigate(ROUTES.split)
  }
}

// CMP-2/CMP-5 — 주 행동 버튼(다음)은 이 초점 콘텐츠가 아니라 앵커존(DashboardPage 하단)에
// 렌더한다. 여기 두면 입력창 바로 밑에 붙어 화면 하단이 텅 비는 바벨 공허가 된다(구 배치).
function AddTaskPrompt({ draftTitle, onDraftChange }: AddTaskPromptProps) {
  return (
    <>
      <p className={styles.prompt}>지금 눈에 걸리는 아무거나, 사소해도 괜찮아요</p>
      {/* Phase 1(B4) — 이 입력창은 label을 아예 안 넘겨 접근 가능한 이름이 없었다(SplitPage의
          FragmentEntry가 이미 쓰는 hideLabel 패턴과 동일하게 맞춘다, 2026-07-14 디자인 개편). */}
      <TextInput value={draftTitle} onChange={onDraftChange} label="오늘 할 일" hideLabel />
    </>
  )
}

type TaskCtaProps = {
  title: string
  nextLabel?: string
}

// ADHD 공간 일관성 통합 — 이전엔 여기서 주 CTA 버튼까지 그렸으나(카드 내부 상단),
// resolveActiveTaskView가 카드와 CTA를 함께 계산해 CTA는 항상 앵커존(화면 하단)에서만 렌더한다.
function TaskCta({ title, nextLabel }: TaskCtaProps) {
  return (
    <div data-task-card>
      <TaskCard title={title}>
        {nextLabel && <p className={styles.nextLabel}>다음 조각: {nextLabel}</p>}
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

// PH-08 §5 — 상시 노출 저마찰 링크. 실행할 진짜 조각이 있고 지금 진행 중인 타이머가 없을 때만
// 노출한다(과제 소진/타이머 진행 중엔 방전으로 갈 대상이 없음). '고장' 라벨 없이 초대 톤만.
function DischargeLink({ onEnter }: { onEnter: () => void }) {
  return (
    <Button variant="secondary" onClick={onEnter}>
      오늘은 가볍게 갈까요
    </Button>
  )
}

// PH-08 §5 — 회고가 스킵되므로 방전 종료 후 대시보드가 대신 보여주는 한 줄. 이 페이지에 머무는
// 동안만 보이고, 언마운트 시 정리된다(RetroPage의 capturedThought와 동일 패턴).
function DischargeEndBanner({ message }: { message: string }) {
  return <p className={styles.dischargeEndBanner}>{message}</p>
}

// PH-09 — 북극성 배지/초대 링크 + 설정 진입점. 설정 링크는 방전 링크와 달리 활성 블록 여부와
// 무관하게 항상 노출한다(설계 결정 4).
function DashboardHeader({
  northStar,
  navigate,
}: {
  northStar: NorthStar
  navigate: NavigateFunction
}) {
  return (
    <div className={styles.header}>
      {hasNorthStar(northStar) ? (
        <NorthStarBadge northStar={northStar} />
      ) : (
        <Button variant="secondary" onClick={() => navigate(ROUTES.northStar)}>
          북극성 더하기(선택)
        </Button>
      )}
      <Button variant="secondary" onClick={() => navigate(ROUTES.settings)}>
        설정
      </Button>
    </div>
  )
}

type PrimaryCta = {
  label: string
  onClick: () => void
  disabled?: boolean
} | null

type ActiveTaskView = {
  card: ReactNode
  cta: PrimaryCta
}

type ResolveActiveTaskViewArgs = {
  hasActiveBlock: boolean
  task: Task | undefined
  next: QueuedBlock | undefined
  fragmentOptions: QueuedBlock[]
  draftTitle: string
  onDraftChange: (value: string) => void
  onAddTask: () => void
  onReturnToFocus: () => void
  onGoSplit: () => void
  onGoPredict: () => void
  onChooseFragment: (blockId: string) => void
}

// 대시보드가 매번 보여줄 "지금 할 일" 한 조각을 고르는 분기 — One Task 불변식(CLAUDE §2)의
// 핵심 렌더 로직이라 DashboardPage 본체에서 분리해 각 상태를 개별적으로 읽기 쉽게 둔다.
// ADHD 공간 일관성 통합(composition.md CMP-2) — 카드(초점존)와 주 CTA(앵커존)를 같은 분기에서
// 함께 파생시켜, 둘이 서로 다른 상태를 가리키는 경합을 원천 차단한다. FragmentChoice 상태는
// 탭이 곧 확정이라(PH-05.1) cta가 null — 별도 CTA 버튼을 강제로 만들지 않는다.
function resolveActiveTaskView({
  hasActiveBlock,
  task,
  next,
  fragmentOptions,
  draftTitle,
  onDraftChange,
  onAddTask,
  onReturnToFocus,
  onGoSplit,
  onGoPredict,
  onChooseFragment,
}: ResolveActiveTaskViewArgs): ActiveTaskView {
  if (hasActiveBlock) {
    return {
      card: <TimerInProgressCard />,
      cta: { label: '돌아가기', onClick: onReturnToFocus },
    }
  }
  if (!task) {
    return {
      card: <AddTaskPrompt draftTitle={draftTitle} onDraftChange={onDraftChange} />,
      cta: { label: '다음', onClick: onAddTask, disabled: !draftTitle.trim() },
    }
  }
  if (!task.splitDone) {
    return {
      card: <TaskCta title={task.title} />,
      cta: { label: '쪼개러 가기', onClick: onGoSplit },
    }
  }
  if (fragmentOptions.length >= 2) {
    return {
      card: (
        <FragmentChoice title={task.title} options={fragmentOptions} onChoose={onChooseFragment} />
      ),
      cta: null,
    }
  }
  return {
    card: <TaskCta title={task.title} nextLabel={next?.verbLabel} />,
    cta: { label: '이 블록 시작하기', onClick: onGoPredict },
  }
}

function useDashboardStoreState() {
  return {
    tasks: useAppStore((state) => state.tasks),
    queuedBlocks: useAppStore((state) => state.queuedBlocks),
    activeBlock: useAppStore((state) => state.activeBlock),
    energyCells: useAppStore((state) => state.energyCells),
    loadEnergyCellsForDate: useAppStore((state) => state.loadEnergyCellsForDate),
    addTask: useAppStore((state) => state.addTask),
    promoteQueuedBlock: useAppStore((state) => state.promoteQueuedBlock),
    dischargeEndMessage: useAppStore((state) => state.dischargeEndMessage),
    setDischargeEndMessage: useAppStore((state) => state.setDischargeEndMessage),
  }
}

export default function DashboardPage() {
  const store = useDashboardStoreState()
  const { tasks, queuedBlocks, activeBlock, energyCells, promoteQueuedBlock } = store
  const { loadEnergyCellsForDate, addTask, dischargeEndMessage, setDischargeEndMessage } = store
  const navigate = useNavigate()
  const [draftTitle, setDraftTitle] = useState('')

  useEffect(() => {
    loadEnergyCellsForDate(todayDateString())
  }, [loadEnergyCellsForDate])

  // PH-08 §5 — 방전 종료 한 줄은 이 페이지에 머무는 동안만 보이고 떠날 때 정리한다(RetroPage의
  // capturedThought 언마운트 정리와 동일 패턴).
  useEffect(() => {
    return () => setDischargeEndMessage(null)
  }, [setDischargeEndMessage])

  // 최초 실행 라우팅 게이트(PH-07) — 온보딩을 마치지 않은 사용자는 항상 온보딩으로 우회된다
  // (SplitPage/PredictPage가 이미 쓰는 국소 <Navigate replace> 가드와 동일 스타일 — 훅 호출 이후에
  // 조건부로 반환해야 rules-of-hooks를 지킨다).
  if (!isOnboardingComplete()) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  const handleAddTask = createAddTaskHandler(draftTitle, addTask, navigate)

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined
  const fragmentOptions = task ? selectQueuedBlocksForTask(queuedBlocks, task.id) : []

  // PH-08 §5 In-Scope A — 실행할 진짜 조각이 있고 지금 진행 중인 타이머가 없을 때만 방전 링크를
  // 노출한다(과제 소진·타이머 진행 중엔 방전으로 갈 대상이 없음).
  const canEnterDischarge = !activeBlock && !!task && task.splitDone && !!next

  // ADHD 공간 일관성 통합(composition.md CMP-2) — 카드(초점존)와 주 CTA(앵커존)를 한 함수에서
  // 함께 파생시킨다. 상태별로 따로 계산하면 카드와 버튼이 서로 다른 상태를 가리키는 경합이 생길
  // 수 있다(One Task 불변식 보호).
  const view = resolveActiveTaskView({
    hasActiveBlock: !!activeBlock,
    task,
    next,
    fragmentOptions,
    draftTitle,
    onDraftChange: setDraftTitle,
    onAddTask: handleAddTask,
    onReturnToFocus: () => navigate(ROUTES.focus),
    onGoSplit: () => navigate(ROUTES.split),
    onGoPredict: () => navigate(ROUTES.predict),
    onChooseFragment: (blockId: string) => {
      if (!task) return
      promoteQueuedBlock(task.id, blockId)
      navigate(ROUTES.predict)
    },
  })

  return (
    <div className={styles.page}>
      {dischargeEndMessage && <DischargeEndBanner message={dischargeEndMessage} />}
      <DashboardHeader northStar={getNorthStar()} navigate={navigate} />
      {/* 초점존(CMP-3) — 헤더 바로 밑 밀착 대신 초점 밴드에 놓아 콘텐츠에 presence를 준다. */}
      <div className={styles.focal}>{view.card}</div>
      {/* 앵커존(CMP-2) — 상태와 무관하게 뷰포트 하단 고정. 주 행동(카드 상태 무관 동일 위치)/
          방전 링크/그날의 증거 순서로 쌓는다. */}
      <div className={styles.bottomGroup}>
        {view.cta && (
          <Button variant="primary" disabled={view.cta.disabled} onClick={view.cta.onClick}>
            {view.cta.label}
          </Button>
        )}
        {canEnterDischarge && <DischargeLink onEnter={() => navigate(ROUTES.dischargeEntry)} />}
        <EnergyBar filledCount={energyCells.length} />
      </div>
    </div>
  )
}

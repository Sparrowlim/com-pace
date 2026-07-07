import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/Button'
import { EnergyBar } from '../components/EnergyBar'
import { useAppStore } from '../store'
import { selectActiveTask, selectNextQueuedBlock } from '../lib/core-loop-selectors'
import { todayDateString } from '../lib/time'
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

export default function DashboardPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const energyCells = useAppStore((state) => state.energyCells)
  const loadEnergyCellsForDate = useAppStore((state) => state.loadEnergyCellsForDate)
  const addTask = useAppStore((state) => state.addTask)
  const navigate = useNavigate()
  const [draftTitle, setDraftTitle] = useState('')

  useEffect(() => {
    loadEnergyCellsForDate(todayDateString())
  }, [loadEnergyCellsForDate])

  const handleAddTask = async () => {
    const trimmed = draftTitle.trim()
    if (!trimmed) return
    await addTask(trimmed)
    navigate(ROUTES.split)
  }

  const task = selectActiveTask(tasks, queuedBlocks)
  const next = task ? selectNextQueuedBlock(queuedBlocks, task.id) : undefined

  return (
    <div className={styles.page}>
      {activeBlock ? (
        <TimerInProgressCard onReturn={() => navigate(ROUTES.focus)} />
      ) : !task ? (
        <AddTaskPrompt
          draftTitle={draftTitle}
          onDraftChange={setDraftTitle}
          onSubmit={handleAddTask}
        />
      ) : !task.splitDone ? (
        <TaskCta title={task.title} ctaLabel="쪼개러 가기" onClick={() => navigate(ROUTES.split)} />
      ) : (
        <TaskCta
          title={task.title}
          nextLabel={next?.verbLabel}
          ctaLabel="이 블록 시작하기"
          onClick={() => navigate(ROUTES.predict)}
        />
      )}
      <EnergyBar filledCount={energyCells.length} />
    </div>
  )
}

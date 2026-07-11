import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { TextInput } from '../components/TextInput'
import { useAppStore } from '../store'
import { selectActiveTask } from '../lib/core-loop-selectors'
import { VERB_CHIPS } from '../lib/verb-chips'
import { ROUTES } from '../routes/paths'
import styles from './SplitPage.module.css'

type FragmentEntryProps = {
  fragment: string
  onFragmentChange: (value: string) => void
  onPickVerb: (verb: string) => void
}

function FragmentEntry({ fragment, onFragmentChange, onPickVerb }: FragmentEntryProps) {
  return (
    <>
      <div className={styles.fragmentInput}>
        <TextInput value={fragment} onChange={onFragmentChange} label="과제 조각" hideLabel />
      </div>
      <div className={styles.chips}>
        {VERB_CHIPS.map((verb) => (
          <Chip key={verb} variant="default" onClick={() => onPickVerb(verb)}>
            {verb}
          </Chip>
        ))}
      </div>
    </>
  )
}

function DraftList({ drafts, onRemove }: { drafts: string[]; onRemove: (index: number) => void }) {
  if (drafts.length === 0) return null

  return (
    <ul className={styles.drafts}>
      {drafts.map((draft, index) => (
        <li key={draft + index} className={styles.draftRow}>
          <span>{draft}</span>
          <button
            type="button"
            className={styles.removeButton}
            aria-label={`${draft} 삭제`}
            onClick={() => onRemove(index)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function SplitPage() {
  const tasks = useAppStore((state) => state.tasks)
  const queuedBlocks = useAppStore((state) => state.queuedBlocks)
  const activeBlock = useAppStore((state) => state.activeBlock)
  const queueBlocks = useAppStore((state) => state.queueBlocks)
  const markTaskSplitDone = useAppStore((state) => state.markTaskSplitDone)
  const navigate = useNavigate()

  const [fragment, setFragment] = useState('')
  const [drafts, setDrafts] = useState<string[]>([])

  // One Task 불변식(CLAUDE §2) — 브라우저 뒤로가기로 돌아와도 이미 진행 중인 블록이 있으면
  // 그쪽으로 보낸다(PredictPage와 동일한 가드, 근거도 동일).
  if (activeBlock) {
    return <Navigate to={ROUTES.focus} replace />
  }

  const task = selectActiveTask(tasks, queuedBlocks)

  if (!task) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const taskId = task.id

  function addDraft(verb: string) {
    const trimmed = fragment.trim()
    if (!trimmed) return
    setDrafts((prev) => [...prev, `${trimmed} ${verb}`])
    setFragment('')
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  async function finishSplit() {
    if (drafts.length === 0) return
    queueBlocks(taskId, drafts)
    await markTaskSplitDone(taskId)
    navigate(ROUTES.dashboard)
  }

  return (
    <div className={styles.page} data-task-card>
      <TaskCard title={task.title}>
        <FragmentEntry fragment={fragment} onFragmentChange={setFragment} onPickVerb={addDraft} />
        <DraftList drafts={drafts} onRemove={removeDraft} />
        <Button variant="primary" disabled={drafts.length === 0} onClick={finishSplit}>
          완료
        </Button>
      </TaskCard>
    </div>
  )
}

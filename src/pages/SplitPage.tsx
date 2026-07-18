import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { TextInput } from '../components/TextInput'
import { useAppStore } from '../store'
import { selectActiveTask } from '../lib/core-loop-selectors'
import { VERB_CHIP_GROUPS } from '../lib/verb-chips'
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
      {/* Phase 1(B1) — 쪼개기 메커니즘(입력→동사칩 조합) 자체를 설명하는 카피가 화면에 전혀
          없어 온보딩 직후 첫 실제 UI에서 이게 뭐지 병목이 됐다(2026-07-14 디자인 개편). 새 판단을
          요구하지 않는 순수 설명 한 줄만 추가한다. */}
      <p className={styles.guide}>
        조각을 적고, 어떤 동작인지 칩을 하나 골라 붙이면 15분 조각이 만들어져요
      </p>
      <div className={styles.fragmentInput}>
        <TextInput value={fragment} onChange={onFragmentChange} label="과제 조각" hideLabel />
      </div>
      <div className={styles.chips}>
        {VERB_CHIP_GROUPS.map((group) => (
          <div
            key={group.category}
            className={styles.chipGroup}
            role="group"
            aria-label={group.category}
          >
            {group.verbs.map((verb) => (
              <Chip key={verb} variant="default" onClick={() => onPickVerb(verb)}>
                {verb}
              </Chip>
            ))}
          </div>
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
    <div className={styles.page}>
      {/* 초점존 — 카드는 조립 중인 콘텐츠(입력·칩·초안 목록)만 담당, 흐름을 전진시키는
          "완료" CTA는 앵커존으로 분리한다(ADHD 공간 일관성 통합, composition.md CMP-2). */}
      <div className={styles.focal} data-task-card>
        <TaskCard title={task.title}>
          <FragmentEntry fragment={fragment} onFragmentChange={setFragment} onPickVerb={addDraft} />
          <DraftList drafts={drafts} onRemove={removeDraft} />
        </TaskCard>
      </div>
      <div className={styles.actions}>
        <Button variant="primary" disabled={drafts.length === 0} onClick={finishSplit}>
          완료
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'
import { TextInput } from '../components/TextInput'
import { TimerDisplay } from '../components/TimerDisplay'
import { useFocusTimer, formatRemaining } from '../hooks/useFocusTimer'
import { useLongPress } from '../hooks/useLongPress'
import { useAppStore } from '../store'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'
import { ROUTES } from '../routes/paths'
import styles from './FocusPage.module.css'

function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <BottomSheet isOpen label="일시정지" onClose={onResume}>
      <p className={styles.pauseText}>잠시 멈췄어요</p>
      <div className={styles.pauseActions}>
        <Button variant="primary" onClick={onResume}>
          재개
        </Button>
        <Button variant="secondary" onClick={onQuit}>
          그만하기
        </Button>
      </div>
    </BottomSheet>
  )
}

// 개발 중 흐름 확인용 — 프로덕션 빌드에서는 트리쉐이킹으로 제거된다(CLAUDE §2 "시간 기반
// 완료" 불변 규칙 보호, 실사용자에게는 절대 노출되지 않음).
function DevSkipButton({ onSkip }: { onSkip: () => void }) {
  if (!import.meta.env.DEV) return null
  return (
    <button type="button" className={styles.devSkip} onClick={onSkip}>
      스킵(DEV)
    </button>
  )
}

type CaptureModalProps = {
  isOpen: boolean
  draft: string
  onDraftChange: (value: string) => void
  onDone: () => void
}

function CaptureModal({ isOpen, draft, onDraftChange, onDone }: CaptureModalProps) {
  return (
    <BottomSheet isOpen={isOpen} label="딴생각 포착" onClose={onDone}>
      <div className={styles.captureField}>
        <TextInput
          id="capture-input"
          multiline
          value={draft}
          onChange={onDraftChange}
          label="잠깐 스친 생각, 적어두고 다시 집중하세요"
        />
      </div>
      <Button variant="primary" onClick={onDone}>
        나중에 보기
      </Button>
    </BottomSheet>
  )
}

export default function FocusPage() {
  const navigate = useNavigate()
  const { activeBlock, elapsedSeconds, finish, isFinishing } = useFocusTimer((wasDischarge) =>
    navigate(wasDischarge ? ROUTES.dashboard : ROUTES.retro),
  )
  const pause = useAppStore((state) => state.pause)
  const resume = useAppStore((state) => state.resume)
  const setCapturedThought = useAppStore((state) => state.setCapturedThought)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const isPaused = activeBlock?.status === 'paused'

  const longPressHandlers = useLongPress({
    onLongPress: () => void pause(),
    onTap: () => setIsCaptureOpen(true),
  })

  if (!activeBlock && !isFinishing) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (!activeBlock) {
    // complete()/markIncomplete() already cleared activeBlock but finish() hasn't navigated to
    // /retro yet (still awaiting resolvePrediction/lightEnergyCell) — render nothing rather than
    // redirect to the dashboard for that instant, or crash on activeBlock.verbLabel below.
    return null
  }

  function closeCapture() {
    const trimmed = draft.trim()
    if (trimmed) {
      setCapturedThought(trimmed)
    }
    setDraft('')
    setIsCaptureOpen(false)
  }

  // code review CRITICAL fix — derive the visual mode from the block-scoped pointer, not the
  // ambient dischargeMode flag (see useFocusTimer.finish for the full rationale). This also
  // makes the surface correct after a reload recovers a discharge block mid-flight, since
  // dischargeMode never survives a reload but this pointer does.
  const isDischargeBlock = dischargeBlockPointer.get() === activeBlock.id

  return (
    <div className={styles.page} data-mode={isDischargeBlock ? 'discharge' : 'focus'}>
      <DevSkipButton onSkip={() => finish(true)} />
      <div className={styles.tapArea} {...(isPaused || isCaptureOpen ? {} : longPressHandlers)}>
        <TimerDisplay
          label={activeBlock.verbLabel}
          remainingLabel={formatRemaining(elapsedSeconds)}
          variant={isPaused ? 'paused' : isDischargeBlock ? 'discharge' : 'running'}
        />
      </div>
      {isPaused && <PauseOverlay onResume={() => void resume()} onQuit={() => finish(false)} />}
      <CaptureModal
        isOpen={isCaptureOpen}
        draft={draft}
        onDraftChange={setDraft}
        onDone={closeCapture}
      />
    </div>
  )
}

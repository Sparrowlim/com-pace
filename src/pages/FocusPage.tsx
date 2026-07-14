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
import type { Block } from '../types/block'
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

// SCREEN-FLOW 5-C — 15분 자연 경과 시 완료 여부를 시스템이 추정하지 않고 사용자가 조각의 상태를
// 직접 고른다(SPEC §6 신설 행). PauseOverlay와 동일 조립(BottomSheet + Button 2개), 카탈로그
// 미등재(patch 등급, PH-12 착수 전 설계 결정 3).
function WrapUpOverlay({ onFinished, onNotYet }: { onFinished: () => void; onNotYet: () => void }) {
  return (
    <BottomSheet isOpen label="조각 마무리" onClose={onNotYet}>
      <p className={styles.pauseText}>15분을 채웠어요</p>
      <div className={styles.pauseActions}>
        <Button variant="primary" onClick={onFinished}>
          이 조각 끝났어요
        </Button>
        <Button variant="secondary" onClick={onNotYet}>
          아직 남았어요
        </Button>
      </div>
    </BottomSheet>
  )
}

type OverlaysProps = {
  isPaused: boolean
  awaitingWrapUp: boolean
  onResume: () => void
  onFinish: (completed: boolean) => void
}

// FocusPage 본문 길이 억제 겸용(README §0 함수당 라인 예산) — 일시정지·5-C 시트는 상호 배타적
// 전환 시점 오버레이라 한 컴포넌트로 묶어도 응집도 손실이 없다.
function Overlays({ isPaused, awaitingWrapUp, onResume, onFinish }: OverlaysProps) {
  return (
    <>
      {isPaused && <PauseOverlay onResume={onResume} onQuit={() => onFinish(false)} />}
      {awaitingWrapUp && (
        <WrapUpOverlay onFinished={() => onFinish(true)} onNotYet={() => onFinish(false)} />
      )}
    </>
  )
}

type CountdownAreaProps = {
  activeBlock: Block
  elapsedSeconds: number
  isPaused: boolean
  isDischargeBlock: boolean
  isInteractive: boolean
  longPressHandlers: ReturnType<typeof useLongPress>
}

// FocusPage 본문 길이 억제 겸용 — 탭/롱프레스 영역은 이미 시각적으로 독립된 단위였다.
function CountdownArea({
  activeBlock,
  elapsedSeconds,
  isPaused,
  isDischargeBlock,
  isInteractive,
  longPressHandlers,
}: CountdownAreaProps) {
  return (
    <div className={styles.tapArea} {...(isInteractive ? longPressHandlers : {})}>
      <TimerDisplay
        label={activeBlock.verbLabel}
        remainingLabel={formatRemaining(elapsedSeconds)}
        variant={isPaused ? 'paused' : isDischargeBlock ? 'discharge' : 'running'}
      />
    </div>
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

function closeCapture(
  draft: string,
  setCapturedThought: (text: string | null) => void,
  setDraft: (value: string) => void,
  setIsCaptureOpen: (value: boolean) => void,
): void {
  const trimmed = draft.trim()
  if (trimmed) {
    setCapturedThought(trimmed)
  }
  setDraft('')
  setIsCaptureOpen(false)
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
  const { activeBlock, elapsedSeconds, finish, isFinishing, awaitingWrapUp } = useFocusTimer(
    (wasDischarge) => navigate(wasDischarge ? ROUTES.dashboard : ROUTES.retro),
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

  // code review CRITICAL fix — derive the visual mode from the block-scoped pointer, not the
  // ambient dischargeMode flag (see useFocusTimer.finish for the full rationale). This also
  // makes the surface correct after a reload recovers a discharge block mid-flight, since
  // dischargeMode never survives a reload but this pointer does.
  const isDischargeBlock = dischargeBlockPointer.get() === activeBlock.id
  const isInteractive = !(isPaused || isCaptureOpen || awaitingWrapUp)

  return (
    <div className={styles.page} data-mode={isDischargeBlock ? 'discharge' : 'focus'}>
      <DevSkipButton onSkip={() => finish(true)} />
      <CountdownArea
        activeBlock={activeBlock}
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        isDischargeBlock={isDischargeBlock}
        isInteractive={isInteractive}
        longPressHandlers={longPressHandlers}
      />
      <Overlays
        isPaused={isPaused}
        awaitingWrapUp={awaitingWrapUp}
        onResume={() => void resume()}
        onFinish={(completed) => void finish(completed)}
      />
      <CaptureModal
        isOpen={isCaptureOpen}
        draft={draft}
        onDraftChange={setDraft}
        onDone={() => closeCapture(draft, setCapturedThought, setDraft, setIsCaptureOpen)}
      />
    </div>
  )
}

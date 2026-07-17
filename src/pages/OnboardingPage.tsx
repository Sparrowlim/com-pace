import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/Button'
import { isOnboardingComplete, markOnboardingComplete } from '../lib/onboarding-status'
import { ROUTES } from '../routes/paths'
import styles from './OnboardingPage.module.css'

type Step = {
  title: string
  body: string
  cta: string
}

const STEPS: readonly [Step, Step, Step] = [
  {
    title: '여기까지 온 것만으로도 잘하고 있어요',
    body: '오늘 하루가 어땠든, 지금 이 화면을 열었다는 것 자체가 이미 뭔가를 해보려던 거예요.',
    cta: '다음',
  },
  {
    title: '잘 해내지 않아도 괜찮아요',
    body: '여긴 결과를 채점하는 곳이 아니에요. 얼마나 해냈는지보다, 15분을 같이 보내는 것만으로 충분해요.',
    cta: '다음',
  },
  {
    title: '그럼, 딱 15분만 해볼까요?',
    body: '복잡하게 생각하지 않아도 돼요. 지금 눈에 걸리는 아무거나, 사소한 것부터 시작하면 돼요.',
    cta: '시작해볼까요',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<0 | 1 | 2>(0)

  // 이미 온보딩을 마친 사용자가 뒤로가기/직접 URL 진입으로 화면 1을 다시 보는 것을 막는다
  // (SplitPage/PredictPage의 기존 <Navigate replace> 국소 가드 컨벤션과 동일 스타일).
  if (isOnboardingComplete()) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  const current = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  function handleNext() {
    if (isLastStep) {
      markOnboardingComplete()
      navigate(ROUTES.dashboard, { replace: true })
      return
    }
    setStep((prev) => (prev === 0 ? 1 : 2))
  }

  return (
    <div className={styles.page}>
      {/* 초점존 — 카드는 시각 콘텐츠만 담당, 흐름을 전진시키는 CTA는 앵커존으로 분리한다
          (ADHD 공간 일관성 통합, composition.md CMP-2). */}
      <div className={styles.focal} data-task-card>
        <TaskCard title={current.title}>
          <p className={styles.body}>{current.body}</p>
        </TaskCard>
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={handleNext}>
          {current.cta}
        </Button>
      </div>
    </div>
  )
}

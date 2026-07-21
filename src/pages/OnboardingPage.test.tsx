import { beforeEach, describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import OnboardingPage from './OnboardingPage'
import { ROUTES } from '../routes/paths'
import { isOnboardingComplete, markOnboardingComplete } from '../lib/onboarding-status'

function renderOnboarding() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.onboarding, element: <OnboardingPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
    ],
    { initialEntries: [ROUTES.onboarding] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
})

describe('OnboardingPage — already complete', () => {
  test('redirects straight to the dashboard, skipping the screens', async () => {
    markOnboardingComplete()
    renderOnboarding()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('OnboardingPage — first-run walkthrough', () => {
  test('advances through all three steps in order', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    expect(await screen.findByText('여기까지 온 것만으로도 잘하고 있어요')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByText('잘 해내지 않아도 괜찮아요')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByText('그럼, 딱 15분만 해볼까요?')).toBeInTheDocument()
  })

  test('marks onboarding complete and moves to the dashboard on the last step', async () => {
    const user = userEvent.setup()
    renderOnboarding()

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '시작해볼까요' }))

    expect(isOnboardingComplete()).toBe(true)
    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

// Finding #4 — 화면 1엔 되돌아갈 곳이 없어 "이전" 버튼 자체가 없어야 하고(침묵 규칙과 동일 원칙),
// 화면 2·3에선 눌러서 이전 문구로 돌아갈 수 있어야 한다.
describe('OnboardingPage — back navigation (Finding #4)', () => {
  test('the first screen has no "이전" button', async () => {
    renderOnboarding()

    expect(await screen.findByText('여기까지 온 것만으로도 잘하고 있어요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '이전' })).not.toBeInTheDocument()
  })

  test('"이전" on the second screen returns to the first', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(await screen.findByText('잘 해내지 않아도 괜찮아요')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이전' }))

    expect(await screen.findByText('여기까지 온 것만으로도 잘하고 있어요')).toBeInTheDocument()
  })

  test('"이전" on the third screen returns to the second', async () => {
    const user = userEvent.setup()
    renderOnboarding()
    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: '다음' }))
    expect(await screen.findByText('그럼, 딱 15분만 해볼까요?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이전' }))

    expect(await screen.findByText('잘 해내지 않아도 괜찮아요')).toBeInTheDocument()
  })
})

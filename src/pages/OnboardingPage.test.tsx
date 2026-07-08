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

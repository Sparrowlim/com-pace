import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from './router'
import { ROUTES } from '../routes/paths'
import { useAppStore } from '../store'
import { markOnboardingComplete } from '../lib/onboarding-status'

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    elapsedSeconds: 0,
    predictions: [],
    energyCells: [],
    lastResolvedBlock: null,
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

describe('router — still-placeholder pages', () => {
  it.each([['/no-such-route', '페이지를 찾을 수 없어요']])(
    'renders the placeholder page for %s',
    async (path, expectedText) => {
      const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
      render(<RouterProvider router={router} />)

      expect(await screen.findByText(expectedText)).toBeInTheDocument()
    },
  )
})

describe('router — settings & north star (PH-09)', () => {
  it('renders the real settings screen at /settings, not a placeholder', async () => {
    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.settings] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: '양가 목표' })).toBeInTheDocument()
  })

  it('renders the north star edit screen at /north-star', async () => {
    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.northStar] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('button', { name: '남길게요' })).toBeInTheDocument()
  })
})

describe('router — onboarding gate (PH-07)', () => {
  it('redirects "/" to onboarding when onboarding has not been completed', async () => {
    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.dashboard] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('여기까지 온 것만으로도 잘하고 있어요')).toBeInTheDocument()
  })

  it('redirects "/onboarding" to the dashboard once onboarding is already complete', async () => {
    markOnboardingComplete()
    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.onboarding] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('textbox')).toBeInTheDocument()
  })
})

describe('router — core loop (PH-05)', () => {
  beforeEach(() => {
    markOnboardingComplete()
  })

  it('renders the dashboard add-task prompt at "/" with no seeded task', async () => {
    const router = createMemoryRouter(routeObjects, { initialEntries: [ROUTES.dashboard] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('textbox')).toBeInTheDocument()
  })

  it.each([ROUTES.split, ROUTES.predict, ROUTES.focus, ROUTES.retro])(
    'redirects %s to the dashboard when there is no active task/block (README §0-1④ route guard)',
    async (path) => {
      const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
      render(<RouterProvider router={router} />)

      expect(await screen.findByRole('textbox')).toBeInTheDocument()
    },
  )
})

describe('router — discharge mode (PH-08)', () => {
  beforeEach(() => {
    markOnboardingComplete()
  })

  it.each([ROUTES.dischargeEntry, ROUTES.dischargeDashboard])(
    'redirects %s to the dashboard when there is no runnable fragment',
    async (path) => {
      const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
      render(<RouterProvider router={router} />)

      expect(await screen.findByRole('textbox')).toBeInTheDocument()
    },
  )
})

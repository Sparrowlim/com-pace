import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from './router'
import { ROUTES } from '../routes/paths'
import { useAppStore } from '../store'

beforeEach(() => {
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    elapsedSeconds: 0,
    predictions: [],
    energyCells: [],
    lastResolvedBlock: null,
  })
})

describe('router — still-placeholder pages (out of PH-05 scope)', () => {
  it.each([
    [ROUTES.onboarding, '온보딩'],
    [ROUTES.dischargeEntry, '방전 진입'],
    [ROUTES.dischargeDashboard, '방전 대시보드'],
    [ROUTES.settings, '설정'],
    ['/no-such-route', '페이지를 찾을 수 없어요'],
  ])('renders the placeholder page for %s', async (path, expectedText) => {
    const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
    render(<RouterProvider router={router} />)

    expect(await screen.findByText(expectedText)).toBeInTheDocument()
  })
})

describe('router — core loop (PH-05)', () => {
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

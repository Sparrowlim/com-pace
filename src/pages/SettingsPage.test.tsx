import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import SettingsPage from './SettingsPage'
import { ROUTES } from '../routes/paths'
import { saveNorthStar } from '../lib/north-star-storage'
import { isNotificationOptIn, setNotificationOptIn } from '../lib/notification-pref'
import * as sessionAlarm from '../lib/session-alarm'

function renderSettings() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.settings, element: <SettingsPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.northStar, element: <div>NORTH_STAR_STUB</div> },
    ],
    { initialEntries: [ROUTES.settings] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SettingsPage — north star summary', () => {
  test('shows invite copy when no north star is saved', async () => {
    renderSettings()

    expect(await screen.findByText(/아직 없어요/)).toBeInTheDocument()
  })

  test('shows saved values when a north star is present', async () => {
    saveNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })
    renderSettings()

    expect(await screen.findByText(/작가가 되고 싶어요/)).toBeInTheDocument()
    expect(screen.getByText(/보고서 마감/)).toBeInTheDocument()
  })

  test('navigates to the north star edit screen, not an inline form', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: '양가 목표 수정' }))

    expect(await screen.findByText('NORTH_STAR_STUB')).toBeInTheDocument()
  })

  test('renders no progress or percentage markup (SPEC §9 — 진행 측정기 아님)', async () => {
    saveNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })
    renderSettings()
    const summary = await screen.findByText(/작가가 되고 싶어요/)

    expect(summary.textContent ?? '').not.toMatch(/%/)
    expect(summary.textContent ?? '').not.toMatch(/퍼센트|도달률|진행률/)
    expect(document.querySelector('progress, [role="progressbar"]')).not.toBeInTheDocument()
  })
})

describe('SettingsPage — notification preference', () => {
  test('defaults off, with the off option pressed', async () => {
    renderSettings()

    expect(await screen.findByRole('button', { name: '꺼둘게요' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '켜볼게요' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('reflects a previously saved opt-in on mount', async () => {
    setNotificationOptIn(true)
    renderSettings()

    expect(await screen.findByRole('button', { name: '켜볼게요' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('clicking on persists the opt-in preference', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: '켜볼게요' }))

    expect(isNotificationOptIn()).toBe(true)
    expect(screen.getByRole('button', { name: '켜볼게요' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking off after opting in persists the opt-out', async () => {
    const user = userEvent.setup()
    setNotificationOptIn(true)
    renderSettings()

    await user.click(await screen.findByRole('button', { name: '꺼둘게요' }))

    expect(isNotificationOptIn()).toBe(false)
    expect(screen.getByRole('button', { name: '꺼둘게요' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('renders no nagging or check-in copy anywhere on the page', async () => {
    renderSettings()
    await screen.findByRole('button', { name: '꺼둘게요' })

    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/안 오셨/)
    expect(bodyText).not.toMatch(/째\s*안/)
    expect(bodyText).not.toMatch(/확인해/)
  })
})

describe('SettingsPage — notification permission request', () => {
  test('requests browser notification permission only when turning the option on', async () => {
    const requestPermissionSpy = vi
      .spyOn(sessionAlarm, 'requestNotificationPermission')
      .mockResolvedValue(true)
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: '켜볼게요' }))
    expect(requestPermissionSpy).toHaveBeenCalledTimes(1)

    await user.click(await screen.findByRole('button', { name: '꺼둘게요' }))
    expect(requestPermissionSpy).toHaveBeenCalledTimes(1)
  })
})

describe('SettingsPage — navigation', () => {
  test('back button returns to dashboard', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: '뒤로' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

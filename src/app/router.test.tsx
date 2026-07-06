import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from './router'
import { ROUTES } from '../routes/paths'

describe('router', () => {
  it.each([
    [ROUTES.onboarding, '온보딩'],
    [ROUTES.dashboard, '대시보드'],
    [ROUTES.split, '과제 쪼개기'],
    [ROUTES.predict, '사전 예측'],
    [ROUTES.focus, '집중 화면'],
    [ROUTES.retro, '회고'],
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

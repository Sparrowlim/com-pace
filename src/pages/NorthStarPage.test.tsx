import { beforeEach, describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import NorthStarPage from './NorthStarPage'
import { ROUTES } from '../routes/paths'
import { getNorthStar, saveNorthStar } from '../lib/north-star-storage'

function renderNorthStar() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.northStar, element: <NorthStarPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
    ],
    { initialEntries: [ROUTES.northStar] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
})

describe('NorthStarPage', () => {
  test('prefills inputs with existing saved values', async () => {
    saveNorthStar({ aspiration: '작가가 되고 싶어요', obligation: '보고서 마감' })
    renderNorthStar()

    expect(await screen.findByDisplayValue('작가가 되고 싶어요')).toBeInTheDocument()
    expect(screen.getByDisplayValue('보고서 마감')).toBeInTheDocument()
  })

  test('renders blank inputs when nothing has been saved yet', async () => {
    renderNorthStar()

    expect(await screen.findByLabelText('열망 — 원하는 방향')).toHaveValue('')
    expect(screen.getByLabelText('의무 — 해내야 하는 방향')).toHaveValue('')
  })

  test('saving persists both fields and navigates to dashboard', async () => {
    const user = userEvent.setup()
    renderNorthStar()

    await user.type(await screen.findByLabelText('열망 — 원하는 방향'), '작가')
    await user.type(screen.getByLabelText('의무 — 해내야 하는 방향'), '보고서')
    await user.click(screen.getByRole('button', { name: '남길게요' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(getNorthStar()).toEqual({ aspiration: '작가', obligation: '보고서' })
  })

  test('skipping navigates to dashboard without saving', async () => {
    const user = userEvent.setup()
    renderNorthStar()

    await user.type(await screen.findByLabelText('열망 — 원하는 방향'), '작가')
    await user.click(screen.getByRole('button', { name: '건너뛸게요' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(getNorthStar()).toEqual({ aspiration: '', obligation: '' })
  })

  test('renders no progress or percentage markup (SPEC §9 — 진행 측정기 아님)', async () => {
    renderNorthStar()
    await screen.findByLabelText('열망 — 원하는 방향')

    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/%/)
    expect(bodyText).not.toMatch(/퍼센트|도달률|진행률|진행 중/)
    expect(document.querySelector('progress, [role="progressbar"]')).not.toBeInTheDocument()
  })
})

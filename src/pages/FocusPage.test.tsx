import { beforeEach, describe, expect, test } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import FocusPage from './FocusPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { todayDateString } from '../lib/time'

function renderFocusPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.focus, element: <FocusPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.retro, element: <div>RETRO_STUB</div> },
    ],
    { initialEntries: [ROUTES.focus] },
  )
  render(<RouterProvider router={router} />)
}

async function seedActiveBlockWithPrediction() {
  const task = await useAppStore.getState().addTask('청소')
  const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
  await useAppStore.getState().setPrediction(block.id, true)
  return { task, block }
}

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

describe('FocusPage — no active block', () => {
  test('redirects to the dashboard', async () => {
    renderFocusPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('FocusPage — countdown', () => {
  test('renders 15:00 at the start, in a focus-mode wrapper', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()

    expect(await screen.findByText('15:00')).toBeInTheDocument()
    expect(document.querySelector('[data-mode="focus"]')).toBeInTheDocument()
  })

  test('updates the displayed countdown when the store ticks', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    expect(screen.getByText('15:00')).toBeInTheDocument()

    act(() => {
      useAppStore.getState().tick()
    })

    expect(screen.getByText('14:59')).toBeInTheDocument()
  })

  test('ticks automatically via a real interval while mounted', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()

    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(useAppStore.getState().elapsedSeconds).toBeGreaterThanOrEqual(1)
  })

  test('auto-finishes at 900 seconds: completes, resolves the prediction, lights energy, and goes to retro', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    expect(screen.getByText('15:00')).toBeInTheDocument()

    // Drive elapsedSeconds to the 900s threshold directly (bypassing the real 900s wall-clock
    // wait) — the interval wiring itself is covered separately above.
    act(() => {
      for (let i = 0; i < 900; i += 1) {
        useAppStore.getState().tick()
      }
    })

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(true)
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })
})

describe('FocusPage — give up', () => {
  test('ends the block as incomplete without a prediction and goes to retro', async () => {
    const task = await useAppStore.getState().addTask('청소')
    const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderFocusPage()

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '오늘은 여기까지' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.predictions.find((p) => p.blockId === block.id)).toBeUndefined()
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })
})

describe('FocusPage — energy cell date', () => {
  test('lights the energy cell under today’s date', async () => {
    await seedActiveBlockWithPrediction()
    const user = userEvent.setup()
    renderFocusPage()

    await user.click(await screen.findByRole('button', { name: '오늘은 여기까지' }))

    await screen.findByText('RETRO_STUB')
    const cell = useAppStore.getState().energyCells[0]
    expect(cell?.date).toBe(todayDateString())
  })
})

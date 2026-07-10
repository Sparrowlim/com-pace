import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
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
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    elapsedSeconds: 0,
    pausedAt: null,
    pausedMs: 0,
    predictions: [],
    energyCells: [],
    lastResolvedBlock: null,
    capturedThought: null,
    dischargeMode: false,
    dischargeEndMessage: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
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
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    expect(screen.getByText('15:00')).toBeInTheDocument()

    vi.setSystemTime(new Date(now.getTime() + 1_000))
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
    const now = new Date('2026-07-07T10:00:00.000Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    expect(screen.getByText('15:00')).toBeInTheDocument()

    // Jump straight past the 900s threshold and tick once — timestamp-based recomputation
    // (SPEC §6/P13) means a single tick after the gap is enough, no need to call tick() 900 times.
    vi.setSystemTime(new Date(now.getTime() + 900_000))
    act(() => {
      useAppStore.getState().tick()
    })

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(true)
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })
})

describe('FocusPage — dev-only skip button (흐름 확인용, 프로덕션 미노출)', () => {
  test('completes the block immediately without waiting for 900 seconds', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '스킵(DEV)' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'done' })
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })
})

describe('FocusPage — pause (SPEC §6 5-B, long-press only)', () => {
  test('shows the pause overlay when the active block is paused', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    void block

    expect(await screen.findByText('잠시 멈췄어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재개' })).toBeInTheDocument()
  })

  test('resume returns to the running countdown', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '재개' }))

    expect(screen.queryByText('잠시 멈췄어요')).not.toBeInTheDocument()
    expect(useAppStore.getState().activeBlock?.status).toBe('in_progress')
  })

  test('quitting from the pause overlay ends the block as incomplete and goes to retro', async () => {
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toBeNull()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
  })

  test('there is no direct quit button on the running countdown screen', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    await screen.findByText('15:00')

    expect(screen.queryByRole('button', { name: '오늘은 여기까지' })).not.toBeInTheDocument()
  })
})

describe('FocusPage — distraction capture (SPEC §6 5-A, single-slot)', () => {
  test('tapping the countdown opens the capture modal without pausing the timer', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()

    await user.click(screen.getByText('책상 정리하기'))

    expect(await screen.findByRole('dialog', { name: '딴생각 포착' })).toBeInTheDocument()
    expect(useAppStore.getState().activeBlock?.status).toBe('in_progress')
  })

  test('"나중에 보기" with text saves it as the captured thought and closes the modal', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('책상 정리하기'))

    await user.type(
      await screen.findByLabelText('잠깐 스친 생각, 적어두고 다시 집중하세요'),
      '빨래도 해야지',
    )
    await user.click(screen.getByRole('button', { name: '나중에 보기' }))

    expect(useAppStore.getState().capturedThought).toBe('빨래도 해야지')
    expect(screen.queryByRole('dialog', { name: '딴생각 포착' })).not.toBeInTheDocument()
  })

  test('"나중에 보기" with empty text closes without saving anything', async () => {
    await seedActiveBlockWithPrediction()
    renderFocusPage()
    const user = userEvent.setup()
    await user.click(screen.getByText('책상 정리하기'))

    await user.click(await screen.findByRole('button', { name: '나중에 보기' }))

    expect(useAppStore.getState().capturedThought).toBeNull()
  })
})

describe('FocusPage — give up via pause', () => {
  test('ends the block as incomplete without a prediction and goes to retro', async () => {
    const task = await useAppStore.getState().addTask('청소')
    const block = await useAppStore.getState().startBlock(task.id, '책상 정리하기')
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '그만하기' }))

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
    renderFocusPage()
    await act(async () => {
      await useAppStore.getState().pause()
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    await screen.findByText('RETRO_STUB')
    const cell = useAppStore.getState().energyCells[0]
    expect(cell?.date).toBe(todayDateString())
  })
})

// PH-08 code review CRITICAL regression — a stale ambient `dischargeMode` flag (left on by
// back-button/away-navigation before any block was ever started under discharge) must never
// misclassify a later, unrelated normal block as discharge. The finish branch must key off the
// block-scoped dischargeBlockPointer, not the session-wide flag, so this normal block still
// lights energy, resolves its prediction, and reaches the real retro screen.
describe('FocusPage — stale dischargeMode does not leak into an unrelated normal block', () => {
  test('completes as a normal block: energy lights, prediction resolves, retro is visited (not the dashboard)', async () => {
    useAppStore.setState({ dischargeMode: true })
    const { block } = await seedActiveBlockWithPrediction()
    renderFocusPage()
    // 방전 화면을 거치지 않고 이 블록을 시작했으므로 dischargeBlockPointer는 비어 있다 — 시각
    // 모드도 이 표식으로 결정되므로 stale dischargeMode에도 불구하고 focus여야 한다.
    expect(document.querySelector('[data-mode="focus"]')).toBeInTheDocument()
    expect(document.querySelector('[data-mode="discharge"]')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await act(async () => {
      await useAppStore.getState().pause()
    })

    await user.click(await screen.findByRole('button', { name: '그만하기' }))

    expect(await screen.findByText('RETRO_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.lastResolvedBlock).toMatchObject({ id: block.id, status: 'incomplete' })
    expect(state.predictions.find((p) => p.blockId === block.id)?.actual).toBe(false)
    expect(state.energyCells.some((cell) => cell.blockId === block.id)).toBe(true)
    expect(state.dischargeEndMessage).toBeNull()
  })
})

import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import DischargeDashboardPage from './DischargeDashboardPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { todayDateString } from '../lib/time'
import { dischargeBlockPointer } from '../lib/discharge-block-pointer'

function renderDischargeDashboardPage() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.dischargeDashboard, element: <DischargeDashboardPage /> },
      { path: ROUTES.dashboard, element: <div>DASHBOARD_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
    ],
    { initialEntries: [ROUTES.dischargeDashboard] },
  )
  return render(<RouterProvider router={router} />)
}

async function seedTaskWithQueuedBlock() {
  const task = await useAppStore.getState().addTask('청소')
  useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
  await useAppStore.getState().markTaskSplitDone(task.id)
  return task
}

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    energyCells: [],
    dischargeMode: false,
  })
})

describe('DischargeDashboardPage — dischargeMode is off (direct entry)', () => {
  test('redirects to the dashboard', async () => {
    await seedTaskWithQueuedBlock()
    renderDischargeDashboardPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('DischargeDashboardPage — a block is already in progress', () => {
  test('redirects to focus instead (One Task invariant)', async () => {
    const task = await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    await useAppStore.getState().startBlock(task.id, '책상 정리하기')

    renderDischargeDashboardPage()

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})

describe('DischargeDashboardPage — no runnable fragment left', () => {
  test('redirects to the dashboard even with dischargeMode on', async () => {
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
  })
})

describe('DischargeDashboardPage — a runnable fragment exists, dischargeMode on', () => {
  test('renders the real task and a calm discharge surface', async () => {
    const task = await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()

    expect(await screen.findByText(task.title)).toBeInTheDocument()
    expect(screen.getByText(/책상 정리하기/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '타이머만 켜면 승리' })).toBeInTheDocument()
    expect(document.querySelector('[data-mode="discharge"]')).toBeInTheDocument()
  })

  test('starting goes straight to focus, never through predict, and does not dequeue the fragment', async () => {
    const task = await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '타이머만 켜면 승리' }))

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
    const state = useAppStore.getState()
    expect(state.activeBlock).toMatchObject({ taskId: task.id, verbLabel: '책상 정리하기' })
    // 큐 미소비 — 진짜 과제 보존(설계 결정 3)
    expect(state.queuedBlocks).toHaveLength(1)
  })

  test('starting lights an energy cell immediately (start = victory, not on end)', async () => {
    await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '타이머만 켜면 승리' }))

    await screen.findByText('FOCUS_STUB')
    const cell = useAppStore.getState().energyCells[0]
    expect(cell?.date).toBe(todayDateString())
  })

  test('"평소 모드로 돌아가기" exits discharge mode and returns to the dashboard', async () => {
    await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '평소 모드로 돌아가기' }))

    expect(await screen.findByText('DASHBOARD_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().dischargeMode).toBe(false)
  })
})

describe('DischargeDashboardPage — starting tags the block (code review fixes)', () => {
  // code review CRITICAL fix — the started block is tagged via dischargeBlockPointer so
  // useFocusTimer.finish()/session recovery can key off the specific block, not the ambient flag.
  test('starting tags the new block via dischargeBlockPointer', async () => {
    await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: '타이머만 켜면 승리' }))

    await screen.findByText('FOCUS_STUB')
    expect(dischargeBlockPointer.get()).toBe(useAppStore.getState().activeBlock?.id)
  })

  // code review MEDIUM fix — a fast double-tap before startBlock()'s first promise resolves must
  // not start two blocks or double-light energy for one discharge action.
  test('a double-tap on the start CTA only starts one block and lights energy once', async () => {
    await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    renderDischargeDashboardPage()
    const user = userEvent.setup()
    const button = await screen.findByRole('button', { name: '타이머만 켜면 승리' })

    await Promise.all([user.click(button), user.click(button)])
    await screen.findByText('FOCUS_STUB')

    expect(useAppStore.getState().energyCells).toHaveLength(1)
  })
})

// code review CRITICAL fix — leaving this screen without pressing either button (back button,
// direct URL navigation away) must not leave dischargeMode stuck on for a later, unrelated
// normal session.
describe('DischargeDashboardPage — leaving without choosing (back button / away navigation)', () => {
  test('resets dischargeMode to false on unmount', async () => {
    await seedTaskWithQueuedBlock()
    useAppStore.setState({ dischargeMode: true })
    const { unmount } = renderDischargeDashboardPage()
    await screen.findByRole('button', { name: '타이머만 켜면 승리' })

    unmount()

    expect(useAppStore.getState().dischargeMode).toBe(false)
  })
})

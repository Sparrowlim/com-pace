import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { useAppStore } from '../store'
import { ROUTES } from '../routes/paths'
import { todayDateString } from '../lib/time'

function renderDashboard() {
  const router = createMemoryRouter(
    [
      { path: ROUTES.dashboard, element: <DashboardPage /> },
      { path: ROUTES.split, element: <div>SPLIT_STUB</div> },
      { path: ROUTES.predict, element: <div>PREDICT_STUB</div> },
      { path: ROUTES.focus, element: <div>FOCUS_STUB</div> },
    ],
    { initialEntries: [ROUTES.dashboard] },
  )
  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  useAppStore.setState({
    tasks: [],
    queuedBlocks: [],
    activeBlock: null,
    energyCells: [],
  })
})

describe('DashboardPage — no active task', () => {
  test('renders an inline add-task prompt', async () => {
    renderDashboard()

    expect(await screen.findByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  test('adding a task navigates to split', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.type(screen.getByRole('textbox'), '청소')
    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(await screen.findByText('SPLIT_STUB')).toBeInTheDocument()
    expect(useAppStore.getState().tasks).toHaveLength(1)
  })
})

describe('DashboardPage — unsplit active task', () => {
  test('shows the task card with a split CTA', async () => {
    const user = userEvent.setup()
    await useAppStore.getState().addTask('청소')
    renderDashboard()

    expect(await screen.findByText('청소')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '쪼개러 가기' }))

    expect(await screen.findByText('SPLIT_STUB')).toBeInTheDocument()
  })

  test('renders exactly one task card (One Task invariant)', async () => {
    await useAppStore.getState().addTask('청소')
    renderDashboard()
    await screen.findByText('청소')

    expect(document.querySelectorAll('[data-task-card]')).toHaveLength(1)
  })
})

describe('DashboardPage — split task with a queued block', () => {
  test('shows the next block label and a start CTA to predict', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    renderDashboard()

    expect(await screen.findByText(/책상 정리하기/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '이 블록 시작하기' }))

    expect(await screen.findByText('PREDICT_STUB')).toBeInTheDocument()
  })
})

describe('DashboardPage — timer in progress', () => {
  test('shows a return-to-focus card instead of a start CTA, regardless of queue state', async () => {
    const user = userEvent.setup()
    const task = await useAppStore.getState().addTask('청소')
    useAppStore.getState().queueBlocks(task.id, ['책상 정리하기'])
    await useAppStore.getState().markTaskSplitDone(task.id)
    await useAppStore.getState().startBlock(task.id, '이메일 확인하기')
    renderDashboard()

    expect(screen.queryByRole('button', { name: '이 블록 시작하기' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: '돌아가기' }))

    expect(await screen.findByText('FOCUS_STUB')).toBeInTheDocument()
  })
})

describe('DashboardPage — energy bar', () => {
  test('reflects the number of energy cells lit today, loaded from storage on mount', async () => {
    await useAppStore.getState().lightEnergyCell('block-1', todayDateString())
    await useAppStore.getState().lightEnergyCell('block-2', todayDateString())
    useAppStore.setState({ energyCells: [] })

    renderDashboard()

    expect(await screen.findByRole('group', { name: '오늘 2칸' })).toBeInTheDocument()
  })
})
